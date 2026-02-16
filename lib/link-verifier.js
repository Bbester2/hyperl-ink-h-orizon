/**
 * Hyperlink Horizon - Link Verifier (v2.0 - High Accuracy)
 * Checks link status with HEAD-first strategy, retry logic,
 * better bot-evasion, and a "timeout" status for uncertain results.
 */

// In-memory cache for link verification results
const linkCache = new Map();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

// Timeouts
const HEAD_TIMEOUT = 3000;  // 3s for HEAD (fast check)
const GET_TIMEOUT = 8000;   // 8s for GET (fallback)
const RETRY_DELAY = 1000;   // 1s before retry

// Paywall/login detection patterns
const PAYWALL_PATTERNS = [
    /paywall/i,
    /subscription required/i,
    /sign[- ]?in to continue/i,
    /login[- ]?required/i,
    /institutional access/i,
    /purchase article/i,
    /buy this article/i,
    /ebscohost/i,
    /jstor\.org.*\/stable/i,
    /sciencedirect/i,
    /wiley\.com.*\/doi/i,
    /springer\.com/i,
    /ieee\.org/i,
];

// Domains known to require authentication
const RESTRICTED_DOMAINS = [
    'jstor.org',
    'ebscohost.com',
    'sciencedirect.com',
    'springerlink.com',
    'ieee.org',
    'acm.org',
    'tandfonline.com',
    'wiley.com',
    'nature.com',
    'proquest.com',
];

// Domains known to block bots aggressively (treat 403 as "restricted" not "broken")
const BOT_BLOCKING_DOMAINS = [
    'linkedin.com',
    'facebook.com',
    'instagram.com',
    'twitter.com',
    'x.com',
    'tiktok.com',
    'pinterest.com',
    'amazon.com',
    'cloudflare.com',
    'medium.com',
];

/**
 * Build realistic browser-like headers
 */
function getBrowserHeaders() {
    return {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0',
    };
}

/**
 * Check if a domain is known to block bots
 */
function isBotBlockingDomain(hostname) {
    return BOT_BLOCKING_DOMAINS.some(d => hostname.includes(d));
}

/**
 * Check if a domain is known to require authentication
 */
function isRestrictedDomain(hostname) {
    return RESTRICTED_DOMAINS.some(d => hostname.includes(d));
}

/**
 * Perform a single fetch attempt with the given method
 */
async function attemptFetch(url, method, timeoutMs) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            method,
            redirect: 'follow',
            signal: controller.signal,
            headers: getBrowserHeaders(),
        });
        clearTimeout(timeout);
        return { response, error: null };
    } catch (error) {
        clearTimeout(timeout);
        return { response: null, error };
    }
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Soft-404 detection — require multiple strong signals to avoid false positives
 */
function isSoft404(bodyText) {
    const lower = bodyText.toLowerCase();
    const bodyLength = bodyText.length;

    // Very short page with "not found" language → likely a real 404 page
    const hasNotFoundText = (
        lower.includes('page not found') ||
        lower.includes('404 not found') ||
        lower.includes('page cannot be found')
    );

    // Only flag as soft-404 if the body is short (real content pages are longer)
    // AND contains unambiguous "not found" language
    if (hasNotFoundText && bodyLength < 5000) {
        return true;
    }

    return false;
}

/**
 * Check a single link's status with HEAD-first + GET fallback + retry
 */
export async function verifyLink(url, context = '') {
    // Check cache first
    const cached = getCachedResult(url);
    if (cached) {
        return cached;
    }

    const result = {
        url,
        status: 'pending',
        statusCode: null,
        reason: null,
        contentType: null,
        isImage: false,
        responseTime: null,
        isRestricted: false,
        checkedAt: new Date().toISOString(),
    };

    const startTime = Date.now();

    let hostname;
    try {
        hostname = new URL(url).hostname;
    } catch {
        result.status = 'broken';
        result.reason = 'Invalid URL format';
        result.responseTime = Date.now() - startTime;
        cacheResult(url, result);
        return result;
    }

    const restricted = isRestrictedDomain(hostname);
    const botBlocking = isBotBlockingDomain(hostname);

    // === STRATEGY: HEAD first, then GET fallback, with 1 retry ===

    let finalResponse = null;
    let lastError = null;

    // --- Attempt 1: HEAD request (fast, low overhead) ---
    const headAttempt = await attemptFetch(url, 'HEAD', HEAD_TIMEOUT);

    if (headAttempt.response) {
        const status = headAttempt.response.status;

        // HEAD succeeded with a clear good status → done
        if (status >= 200 && status < 300) {
            finalResponse = headAttempt.response;
        }
        // HEAD returned 405 (Method Not Allowed) or 403 → try GET
        else if (status === 405 || status === 403 || status === 400) {
            // Some servers don't support HEAD, or block HEAD but allow GET
            const getAttempt = await attemptFetch(url, 'GET', GET_TIMEOUT);
            if (getAttempt.response) {
                finalResponse = getAttempt.response;
            } else {
                lastError = getAttempt.error;
            }
        }
        // HEAD returned some other status → use it
        else {
            finalResponse = headAttempt.response;
        }
    } else {
        lastError = headAttempt.error;

        // HEAD failed entirely → try GET as fallback
        const getAttempt = await attemptFetch(url, 'GET', GET_TIMEOUT);
        if (getAttempt.response) {
            finalResponse = getAttempt.response;
        } else {
            lastError = getAttempt.error;
        }
    }

    // --- Retry once on transient errors ---
    if (!finalResponse && lastError) {
        const isTimeout = lastError.name === 'AbortError';
        const isTransient = isTimeout ||
            lastError.cause?.code === 'ECONNRESET' ||
            lastError.cause?.code === 'ETIMEDOUT';

        if (isTransient) {
            await sleep(RETRY_DELAY);
            const retryAttempt = await attemptFetch(url, 'GET', GET_TIMEOUT);
            if (retryAttempt.response) {
                finalResponse = retryAttempt.response;
                lastError = null;
            } else {
                lastError = retryAttempt.error;
            }
        }
    }

    // --- Also retry on 429 (rate limited) or 503 (service unavailable) ---
    if (finalResponse && (finalResponse.status === 429 || finalResponse.status === 503)) {
        await sleep(RETRY_DELAY);
        const retryAttempt = await attemptFetch(url, 'GET', GET_TIMEOUT);
        if (retryAttempt.response && retryAttempt.response.status !== 429 && retryAttempt.response.status !== 503) {
            finalResponse = retryAttempt.response;
        }
    }

    // === MAP RESULT ===
    result.responseTime = Date.now() - startTime;

    if (finalResponse) {
        const status = finalResponse.status;
        result.statusCode = status;

        if (status >= 200 && status < 300) {
            if (restricted) {
                result.status = 'restricted';
                result.isRestricted = true;
                result.reason = 'Academic/institutional access may be required';
            } else {
                const contentType = finalResponse.headers.get('content-type') || '';
                result.contentType = contentType;

                // check if image
                if (contentType.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico|tiff)$/i.test(url)) {
                    result.isImage = true;
                    // Keep status as 'working' but tag as image for UI separation
                }

                result.status = 'working';
            }
        } else if (status >= 300 && status < 400) {
            result.status = 'redirect';
            result.reason = `Redirects to ${finalResponse.headers.get('location') || 'unknown'}`;
        } else if (status === 401 || status === 403) {
            // 403 on bot-blocking domains → "restricted" not "broken"
            if (botBlocking || restricted) {
                result.status = 'restricted';
                result.isRestricted = true;
                result.reason = 'Access restricted (site blocks automated checks — likely works in a browser)';
            } else {
                result.status = 'restricted';
                result.isRestricted = true;
                result.reason = 'Access denied or authentication required';
            }
        } else if (status === 404 || status === 410) {
            result.status = 'broken';
            result.reason = status === 404 ? 'Page not found (404)' : 'Page permanently removed (410)';
        } else if (status === 429) {
            result.status = 'timeout';
            result.reason = 'Rate limited by server — try again later';
        } else if (status >= 500) {
            // 5xx could be transient — if we already retried, mark as broken
            result.status = 'broken';
            result.reason = `Server error (${status})`;
        } else {
            result.status = 'working';
        }

        // For GET responses with 200 status, do soft-404 check
        if (result.status === 'working' && finalResponse.status === 200) {
            try {
                // Only read body if we did a GET (not HEAD)
                const contentType = finalResponse.headers.get('content-type') || '';
                if (contentType.includes('text/html')) {
                    const text = await finalResponse.text();
                    if (isSoft404(text)) {
                        result.status = 'broken';
                        result.reason = 'Soft 404 (page content indicates not found)';
                    }
                    if (PAYWALL_PATTERNS.some(pattern => pattern.test(text))) {
                        result.status = 'restricted';
                        result.isRestricted = true;
                        result.reason = 'Paywall or login wall detected';
                    }
                }
            } catch {
                // Body already consumed or not available (HEAD request) — that's fine
            }
        }

    } else {
        // No response at all — categorize the error
        if (lastError?.name === 'AbortError') {
            result.status = 'timeout';
            result.reason = 'Request timed out — site may be slow or blocking automated checks';
        } else if (lastError?.cause?.code === 'ENOTFOUND') {
            result.status = 'broken';
            result.reason = 'Domain not found';
        } else if (lastError?.cause?.code === 'ECONNREFUSED') {
            result.status = 'broken';
            result.reason = 'Connection refused';
        } else if (lastError?.message?.includes('certificate')) {
            result.status = 'broken';
            result.reason = 'SSL/TLS certificate error';
        } else {
            result.status = 'timeout';
            result.reason = 'Unable to connect — site may be temporarily down or blocking automated checks';
        }
    }

    // Cache the result
    cacheResult(url, result);

    return result;
}

/**
 * Verify multiple links with rate limiting
 */
export async function verifyLinks(links, concurrency = 20) {
    const results = [];
    const queue = [...links];
    const inProgress = new Set();

    const processNext = async () => {
        if (queue.length === 0) return;

        const link = queue.shift();
        inProgress.add(link.url);

        try {
            const result = await verifyLink(link.url, link.context);
            results.push({
                ...result,
                context: link.context,
            });
        } catch (error) {
            results.push({
                url: link.url,
                status: 'timeout',
                reason: 'Verification failed — try re-checking',
                context: link.context,
                checkedAt: new Date().toISOString(),
            });
        }

        inProgress.delete(link.url);

        // Process next item
        if (queue.length > 0) {
            await processNext();
        }
    };

    // Start concurrent processing
    const workers = [];
    for (let i = 0; i < Math.min(concurrency, links.length); i++) {
        workers.push(processNext());
    }

    await Promise.all(workers);

    return results;
}

/**
 * Cache management functions
 */
function getCachedResult(url) {
    const cached = linkCache.get(url);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > CACHE_TTL) {
        linkCache.delete(url);
        return null;
    }

    return cached.result;
}

function cacheResult(url, result) {
    linkCache.set(url, {
        result,
        timestamp: Date.now(),
    });

    // Cleanup old entries periodically
    if (linkCache.size > 1000) {
        const now = Date.now();
        for (const [key, value] of linkCache.entries()) {
            if (now - value.timestamp > CACHE_TTL) {
                linkCache.delete(key);
            }
        }
    }
}

/**
 * Clear the verification cache
 */
export function clearCache() {
    linkCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
    return {
        size: linkCache.size,
        maxAge: CACHE_TTL,
    };
}
