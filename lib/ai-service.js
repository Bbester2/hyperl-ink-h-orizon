/**
 * Hyperlink Horizon - AI Recommendation Service (v2.0 - High Accuracy)
 * Suggests alternative links using Gemini AI with Google Search grounding
 * and post-generation URL verification to eliminate hallucinated links.
 */

// FORCE OVERRIDE: User provided key (v5.0 Fix)
// Note: We are ignoring process.env.GEMINI_API_KEY to ensure the working key is used
// until Vercel environment variables are correctly configured.
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
console.log('AI Service Init - Key Configured:', GEMINI_API_KEY ? 'Yes (Env Var)' : 'No');
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent';

/**
 * Credibility scoring config
 */
const CREDIBILITY_SCORES = {
    academic: { score: 0.95, icon: '🏛️', label: 'Academic' },
    government: { score: 0.9, icon: '🏢', label: 'Official' },
    established_news: { score: 0.85, icon: '📰', label: 'Established News' },
    industry_leader: { score: 0.8, icon: '⭐', label: 'Industry Leader' },
    reputable: { score: 0.7, icon: '✓', label: 'Reputable' },
    general: { score: 0.5, icon: '🌐', label: 'General' },
    unknown: { score: 0.3, icon: '?', label: 'Unknown' },
};

// Domain patterns for credibility classification
const DOMAIN_PATTERNS = {
    academic: [/\.edu$/, /\.ac\./, /scholar\.google/, /arxiv\.org/, /pubmed/, /doi\.org/, /researchgate/],
    government: [/\.gov$/, /\.gov\./, /\.mil$/, /who\.int/, /un\.org/],
    established_news: [/bbc\.com/, /nytimes\.com/, /theguardian\.com/, /reuters\.com/, /apnews\.com/, /npr\.org/, /washingtonpost\.com/],
    industry_leader: [/github\.com/, /stackoverflow\.com/, /microsoft\.com/, /google\.com/, /apple\.com/, /mozilla\.org/, /mdn\.io/],
};

/**
 * Verify a single URL with a quick HEAD check (for validating AI suggestions)
 */
async function quickVerifyUrl(url) {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(url, {
            method: 'HEAD',
            redirect: 'follow',
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
        });

        clearTimeout(timeout);

        // Accept 2xx and 3xx (redirects) as valid
        return response.status < 400;
    } catch {
        // On timeout/error, try GET as fallback
        try {
            const response = await fetch(url, {
                method: 'GET',
                redirect: 'follow',
                signal: AbortSignal.timeout(8000),
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                },
            });
            return response.status < 400;
        } catch {
            return false;
        }
    }
}

/**
 * Get AI-powered alternative suggestions for a broken/restricted link
 */
export async function getSuggestions(originalUrl, context, count = 3) {
    if (!GEMINI_API_KEY) {
        return getMockSuggestions(originalUrl, context, count, "Key Missing");
    }

    try {
        const prompt = buildPrompt(originalUrl, context, count);

        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.2,       // Low temperature for factual, deterministic results
                    maxOutputTokens: 1024,
                },
                // Enable Google Search grounding for real, verified URLs
                tools: [{
                    googleSearch: {}
                }],
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Gemini API Error (${response.status}):`, errorText);

            let errorMsg = `API Error ${response.status}`;
            try {
                const errorJson = JSON.parse(errorText);
                if (errorJson.error && errorJson.error.message) {
                    errorMsg = errorJson.error.message;
                }
            } catch (e) {
                // Keep default
            }

            return getMockSuggestions(originalUrl, context, count, errorMsg);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // Parse suggestions from AI response
        let suggestions = parseSuggestions(text, originalUrl);

        // Verify each suggested URL actually works (filter out hallucinations)
        if (suggestions.length > 0) {
            const verificationResults = await Promise.all(
                suggestions.map(async (suggestion) => {
                    const isValid = await quickVerifyUrl(suggestion.url);
                    return { suggestion, isValid };
                })
            );

            // Only keep suggestions with verified working URLs
            const verified = verificationResults
                .filter(r => r.isValid)
                .map(r => ({
                    ...r.suggestion,
                    verified: true,
                }));

            // If some were filtered out, note it
            const filteredCount = suggestions.length - verified.length;
            if (filteredCount > 0) {
                console.log(`Filtered out ${filteredCount} non-working AI suggestion(s) for ${originalUrl}`);
            }

            suggestions = verified;
        }

        return suggestions;
    } catch (error) {
        console.error('AI suggestion error:', error);
        return getMockSuggestions(originalUrl, context, count, error.message);
    }
}

/**
 * Build the prompt for Gemini
 */
function buildPrompt(originalUrl, context, count) {
    return `You are a research assistant helping find working replacement links. A user has a broken or inaccessible link and needs alternatives.

ORIGINAL LINK: ${originalUrl}

CONTEXT (surrounding text from the document):
${context || 'No context available'}

Find ${count} alternative URLs that:
1. Cover the same or very similar topic as the original
2. Are from reputable sources (.edu, .gov, established news, or industry leaders preferred)
3. Are freely accessible (no paywalls)
4. Currently exist and are reachable

CRITICAL RULES:
- ONLY suggest URLs that you have confirmed exist via your search capabilities
- NEVER guess or fabricate a URL. Every URL must be from a real, verified source.
- If you cannot find ${count} verified alternatives, return fewer rather than guessing
- Prefer well-known stable URLs (e.g., Wikipedia, government sites, major news organizations)

For each suggestion, provide:
- URL: The full, exact URL (must be real and working)
- Title: The actual page title
- Description: Brief 1-2 sentence explanation of why this is a good alternative
- Source Type: One of [academic, government, established_news, industry_leader, reputable, general]

Format your response as JSON:
{
  "suggestions": [
    {
      "url": "https://example.com/article",
      "title": "Article Title",
      "description": "Why this is a good alternative",
      "sourceType": "academic"
    }
  ]
}

Only respond with the JSON.`;
}

/**
 * Parse AI response into structured suggestions
 */
function parseSuggestions(text, originalUrl) {
    try {
        // Clean up the response (remove markdown code blocks if present)
        let cleaned = text.trim();
        if (cleaned.startsWith('```json')) {
            cleaned = cleaned.slice(7);
        }
        if (cleaned.startsWith('```')) {
            cleaned = cleaned.slice(3);
        }
        if (cleaned.endsWith('```')) {
            cleaned = cleaned.slice(0, -3);
        }

        const parsed = JSON.parse(cleaned);

        if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
            return [];
        }

        return parsed.suggestions
            .filter(suggestion => {
                // Basic validation — must have a parseable URL
                try {
                    new URL(suggestion.url);
                    return true;
                } catch {
                    return false;
                }
            })
            .map(suggestion => ({
                url: suggestion.url,
                title: suggestion.title || 'Suggested Resource',
                description: suggestion.description || '',
                sourceType: suggestion.sourceType || classifyDomain(suggestion.url),
                credibility: calculateCredibility(suggestion.url, suggestion.sourceType),
                createdAt: new Date().toISOString(),
            }));
    } catch (error) {
        console.error('Failed to parse AI suggestions:', error);
        return [];
    }
}

/**
 * Classify a domain into source type
 */
function classifyDomain(url) {
    try {
        const hostname = new URL(url).hostname.toLowerCase();

        for (const [type, patterns] of Object.entries(DOMAIN_PATTERNS)) {
            if (patterns.some(pattern => pattern.test(hostname))) {
                return type;
            }
        }

        return 'general';
    } catch {
        return 'unknown';
    }
}

/**
 * Calculate credibility score and metadata
 */
function calculateCredibility(url, sourceType) {
    const type = sourceType || classifyDomain(url);
    const config = CREDIBILITY_SCORES[type] || CREDIBILITY_SCORES.unknown;

    return {
        score: config.score,
        icon: config.icon,
        label: config.label,
        type,
    };
}

/**
 * Mock suggestions for when API is not configured
 */
function getMockSuggestions(originalUrl, context, count, errorReason = null) {
    // Try to determine topic from URL and context
    const keywords = extractKeywords(originalUrl, context);

    // If we have an error reason (API failure), show that instead of the generic upgrade message
    const errorSuggestion = errorReason ? {
        url: '#',
        title: `⚠️ AI Error: ${errorReason}`,
        description: 'The AI Service is configured but failed to respond. Please check your API Key and quotas.',
        sourceType: 'unknown',
    } : {
        url: `https://aistudio.google.com/app/apikey`,
        title: '⚡ Upgrade to Tier 1 AI (v2.4 Debug Check)',
        description: 'If you see this, the API Key is completely missing from the server.',
        sourceType: 'industry_leader',
    };

    const baseSuggestions = [
        errorSuggestion,
        {
            url: `https://en.wikipedia.org/wiki/${keywords[0] || 'Main_Page'}`,
            title: `Wikipedia: ${keywords[0] || 'Related Topic'}`,
            description: 'Comprehensive encyclopedia article with citations to primary sources.',
            sourceType: 'reputable',
        },
        {
            url: `https://scholar.google.com/scholar?q=${encodeURIComponent(keywords.join(' '))}`,
            title: 'Google Scholar Search Results',
            description: 'Academic papers and citations related to this topic.',
            sourceType: 'academic',
        },
        {
            url: `https://www.google.com/search?q=${encodeURIComponent(keywords.join(' '))}`,
            title: 'Web Search Results',
            description: 'General web search for additional resources.',
            sourceType: 'general',
        },
    ];

    return baseSuggestions.slice(0, count).map(suggestion => ({
        ...suggestion,
        credibility: calculateCredibility(suggestion.url, suggestion.sourceType),
        createdAt: new Date().toISOString(),
    }));
}

/**
 * Extract keywords from URL and context
 */
function extractKeywords(url, context) {
    const words = [];

    try {
        // Extract from URL path
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname
            .split(/[\/\-_]/)
            .filter(part => part.length > 3)
            .map(part => part.replace(/[^a-zA-Z]/g, ''))
            .filter(part => part.length > 3);

        words.push(...pathParts.slice(0, 3));
    } catch { }

    // Extract from context
    if (context) {
        const contextWords = context
            .split(/\s+/)
            .filter(word => word.length > 4)
            .filter(word => !/^(http|www\.|the|and|for|with|this|that|from|have|been)/i.test(word))
            .slice(0, 5);

        words.push(...contextWords);
    }

    return [...new Set(words)].slice(0, 5);
}

/**
 * Get suggestions for multiple links in batch (Optimized for Vercel Timeouts)
 */
export async function getSuggestionsForLinks(links, maxSuggestionsPerLink = 3) {
    const results = [];

    // Only get suggestions for broken/restricted links
    const linksNeedingSuggestions = links.filter(
        link => link.status === 'broken' || link.status === 'restricted'
    );

    // Limit to top 10 to prevent total timeout on Hobby plan
    const limitedLinks = linksNeedingSuggestions.slice(0, 10);

    // Process in parallel batches of 5
    const BATCH_SIZE = 5;
    for (let i = 0; i < limitedLinks.length; i += BATCH_SIZE) {
        const batch = limitedLinks.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map(link =>
            getSuggestions(link.url, link.context, maxSuggestionsPerLink)
                .then(suggestions => ({
                    originalUrl: link.url,
                    suggestions
                }))
                .catch(err => {
                    console.error(`Failed suggestion for ${link.url}`, err);
                    return { originalUrl: link.url, suggestions: [] };
                })
        );

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
    }

    return results;
}
