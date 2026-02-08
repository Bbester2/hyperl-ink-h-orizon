/**
 * Hyperlink Horizon - AI Recommendation Service
 * Suggests alternative links using Gemini AI and web search
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

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
 * Get AI-powered alternative suggestions for a broken/restricted link
 */
export async function getSuggestions(originalUrl, context, count = 3) {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
        // Return mock suggestions when API key not configured
        return getMockSuggestions(originalUrl, context, count);
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
                    temperature: 0.7,
                    maxOutputTokens: 1024,
                },
            }),
        });

        if (!response.ok) {
            console.error('Gemini API error:', response.status);
            return getMockSuggestions(originalUrl, context, count);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        return parseSuggestions(text, originalUrl);
    } catch (error) {
        console.error('AI suggestion error:', error);
        return getMockSuggestions(originalUrl, context, count, error.message);
    }
}

/**
 * Build the prompt for Gemini
 */
function buildPrompt(originalUrl, context, count) {
    return `You are a helpful research assistant. A user has a broken or inaccessible link in their document and needs alternative resources.

ORIGINAL LINK: ${originalUrl}

CONTEXT (surrounding text from the document):
${context || 'No context available'}

Please suggest ${count} alternative URLs that:
1. Cover similar topic/content as the original
2. Are from reputable sources (prefer .edu, .gov, established news, or industry leaders)
3. Were published or updated recently (within the last 1-2 years if possible)
4. Are freely accessible (avoid paywalled content)

For each suggestion, provide:
- URL: The full URL
- Title: A descriptive title
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

CRITICAL INSTRUCTIONS:
- PRIORITY 1: RECENCY. Content must be from 2024, 2025, or 2026. Avoid outdated links.
- PRIORITY 2: CREDIBILITY. Only suggest high-authority domains (Gov, Edu, Major News, Official Docs).
- PRIORITY 3: RELEVANCE. Use the provided context to match the specific topic deep-semantically.

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

        return parsed.suggestions.map(suggestion => ({
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
        title: '⚡ Upgrade to Tier 1 AI (Setup Required)',
        description: 'The "Poor" suggestions you see are placeholders. real semantic search requires a Gemini API Key. Click here to get one for free.',
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
 * Get suggestions for multiple links in batch
 */
export async function getSuggestionsForLinks(links, maxSuggestionsPerLink = 3) {
    const results = [];

    // Only get suggestions for broken/restricted links
    const linksNeedingSuggestions = links.filter(
        link => link.status === 'broken' || link.status === 'restricted'
    );

    for (const link of linksNeedingSuggestions) {
        const suggestions = await getSuggestions(link.url, link.context, maxSuggestionsPerLink);
        results.push({
            originalUrl: link.url,
            suggestions,
        });

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    return results;
}
