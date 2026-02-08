/**
 * Hyperlink Horizon - Link Verifier
 * Checks link status, detects paywalls, and caches results
 */

// In-memory cache for link verification results
const linkCache = new Map();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

// Paywall/login detection patterns
const PAYWALL_PATTERNS = [
    /paywall/i,
    /subscribe/i,
    /subscription required/i,
    /sign[- ]?in to continue/i,
    /login[- ]?required/i,
    /access denied/i,
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

/**
 * Check a single link's status
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
        responseTime: null,
        isRestricted: false,
        checkedAt: new Date().toISOString(),
    };

    const startTime = Date.now();

    try {
        // Check if it's a known restricted domain
        const urlObj = new URL(url);
        const isRestrictedDomain = RESTRICTED_DOMAINS.some(domain =>
            urlObj.hostname.includes(domain)
        );

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url, {
            method: 'HEAD',
            redirect: 'follow',
            signal: controller.signal,
            headers: {
                'User-Agent': 'Hyperlink-Horizon/1.0 (Link Auditor; +https://hyperlink-horizon.com)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
        });

        clearTimeout(timeout);
        result.responseTime = Date.now() - startTime;
        result.statusCode = response.status;

        // Map status code to status
        if (response.status >= 200 && response.status < 300) {
            result.status = 'working';

            // Additional check for paywalls on restricted domains
            if (isRestrictedDomain) {
                result.status = 'restricted';
                result.isRestricted = true;
                result.reason = 'Academic/institutional access may be required';
            }
        } else if (response.status >= 300 && response.status < 400) {
            result.status = 'redirect';
            result.reason = `Redirects to ${response.headers.get('location') || 'unknown'}`;
        } else if (response.status === 401 || response.status === 403) {
            result.status = 'restricted';
            result.isRestricted = true;
            result.reason = 'Access denied or authentication required';
        } else if (response.status === 404 || response.status === 410) {
            result.status = 'broken';
            result.reason = response.status === 404 ? 'Page not found (404)' : 'Page permanently removed (410)';
        } else if (response.status >= 500) {
            result.status = 'broken';
            result.reason = `Server error (${response.status})`;
        } else {
            result.status = 'working';
        }

    } catch (error) {
        result.responseTime = Date.now() - startTime;

        if (error.name === 'AbortError') {
            result.status = 'broken';
            result.reason = 'Request timeout (>10s)';
        } else if (error.cause?.code === 'ENOTFOUND') {
            result.status = 'broken';
            result.reason = 'Domain not found';
        } else if (error.cause?.code === 'ECONNREFUSED') {
            result.status = 'broken';
            result.reason = 'Connection refused';
        } else if (error.message.includes('certificate')) {
            result.status = 'broken';
            result.reason = 'SSL/TLS certificate error';
        } else {
            // Try GET request as fallback (some servers don't support HEAD)
            try {
                const getResponse = await fetch(url, {
                    method: 'GET',
                    redirect: 'follow',
                    signal: AbortSignal.timeout(10000),
                    headers: {
                        'User-Agent': 'Hyperlink-Horizon/1.0 (Link Auditor)',
                        'Accept': 'text/html',
                    },
                });

                result.statusCode = getResponse.status;

                if (getResponse.ok) {
                    const text = await getResponse.text();

                    // Check for paywall patterns in content
                    const hasPaywall = PAYWALL_PATTERNS.some(pattern => pattern.test(text));

                    if (hasPaywall) {
                        result.status = 'restricted';
                        result.isRestricted = true;
                        result.reason = 'Paywall or login wall detected';
                    } else {
                        result.status = 'working';
                    }
                } else {
                    result.status = getResponse.status >= 400 ? 'broken' : 'working';
                    result.reason = `HTTP ${getResponse.status}`;
                }
            } catch (getError) {
                result.status = 'broken';
                result.reason = 'Unable to connect';
            }
        }
    }

    // Cache the result
    cacheResult(url, result);

    return result;
}

/**
 * Verify multiple links with rate limiting
 */
export async function verifyLinks(links, concurrency = 5) {
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
                status: 'broken',
                reason: 'Verification failed',
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
