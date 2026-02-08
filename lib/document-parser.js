/**
 * Hyperlink Horizon - Document Parser
 * Extracts hyperlinks from PDF, DOCX, and web pages
 */

// URL pattern regex - matches http(s)://, www., and common domains
const URL_PATTERN = /(?:https?:\/\/|www\.)[^\s<>"{}|\\^`\[\]]+|(?:[a-zA-Z0-9-]+\.)+(?:com|org|net|edu|gov|io|co|me|info|biz|us|uk|ca|de|fr|au|ru|ch|it|nl|se|no|es|mil|app|dev|xyz|tech|site|online|store|blog|news|live|tv|video|cloud|ai|ml)(?:\/[^\s<>"{}|\\^`\[\]]*)?/gi;

/**
 * Extract links from DOCX file buffer
 * Uses mammoth for content extraction and parses relationships for hyperlinks
 */
export async function extractLinksFromDocx(buffer) {
    const mammoth = await import('mammoth');
    const JSZip = await import('jszip').then(m => m.default);

    const links = new Set();
    const contexts = new Map(); // Store surrounding text for each link

    try {
        // Extract raw text for context
        const result = await mammoth.extractRawText({ buffer });
        const fullText = result.value;

        // Find URLs in text content
        const textMatches = fullText.match(URL_PATTERN) || [];
        for (const url of textMatches) {
            const cleanUrl = normalizeUrl(url);
            if (cleanUrl) {
                links.add(cleanUrl);
                const context = extractContext(fullText, url);
                contexts.set(cleanUrl, context);
            }
        }

        // Also parse the document.xml.rels for <Relationship> hyperlinks
        const zip = await JSZip.loadAsync(buffer);
        const relsFile = zip.file('word/_rels/document.xml.rels');

        if (relsFile) {
            const relsContent = await relsFile.async('string');
            const hrefMatches = relsContent.match(/Target="([^"]+)"/g) || [];

            for (const match of hrefMatches) {
                const url = match.replace('Target="', '').replace('"', '');
                if (url.startsWith('http') || url.startsWith('www.')) {
                    const cleanUrl = normalizeUrl(url);
                    if (cleanUrl) {
                        links.add(cleanUrl);
                    }
                }
            }
        }
    } catch (error) {
        console.error('DOCX parsing error:', error);
        throw new Error('Failed to parse DOCX file');
    }

    return Array.from(links).map(url => ({
        url,
        context: contexts.get(url) || '',
    }));
}

/**
 * Extract links from PDF file buffer
 * Uses pdf-parse for text extraction
 */
export async function extractLinksFromPdf(buffer) {
    const pdfParse = await import('pdf-parse').then(m => m.default);

    const links = new Set();
    const contexts = new Map();

    try {
        const data = await pdfParse(buffer);
        const fullText = data.text;

        // Find URLs in text
        const matches = fullText.match(URL_PATTERN) || [];
        for (const url of matches) {
            const cleanUrl = normalizeUrl(url);
            if (cleanUrl) {
                links.add(cleanUrl);
                const context = extractContext(fullText, url);
                contexts.set(cleanUrl, context);
            }
        }
    } catch (error) {
        console.error('PDF parsing error:', error);
        throw new Error('Failed to parse PDF file');
    }

    return Array.from(links).map(url => ({
        url,
        context: contexts.get(url) || '',
    }));
}

/**
 * Extract links from a web page URL
 * Fetches the page and parses anchor tags
 */
export async function extractLinksFromUrl(pageUrl) {
    const cheerio = await import('cheerio');

    const links = new Set();
    const contexts = new Map();

    try {
        const response = await fetch(pageUrl, {
            headers: {
                'User-Agent': 'Hyperlink-Horizon/1.0 (Link Auditor)',
            },
            signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch page: ${response.status}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Extract all anchor tags
        $('a[href]').each((_, element) => {
            const href = $(element).attr('href');
            const text = $(element).text().trim();

            if (href) {
                let fullUrl = href;

                // Handle relative URLs
                if (href.startsWith('/')) {
                    const base = new URL(pageUrl);
                    fullUrl = `${base.origin}${href}`;
                } else if (!href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('#')) {
                    const base = new URL(pageUrl);
                    fullUrl = `${base.origin}/${href}`;
                }

                // Skip non-http links
                if (!fullUrl.startsWith('http')) return;

                const cleanUrl = normalizeUrl(fullUrl);
                if (cleanUrl) {
                    links.add(cleanUrl);
                    contexts.set(cleanUrl, text || extractSurroundingText($, element));
                }
            }
        });

        // Also find URLs in text content
        const bodyText = $('body').text();
        const textMatches = bodyText.match(URL_PATTERN) || [];
        for (const url of textMatches) {
            const cleanUrl = normalizeUrl(url);
            if (cleanUrl && !links.has(cleanUrl)) {
                links.add(cleanUrl);
            }
        }
    } catch (error) {
        console.error('URL parsing error:', error);
        throw new Error('Failed to fetch and parse URL');
    }

    return Array.from(links).map(url => ({
        url,
        context: contexts.get(url) || '',
    }));
}

/**
 * Normalize and clean URL
 */
function normalizeUrl(url) {
    if (!url) return null;

    let cleaned = url.trim();

    // Remove trailing punctuation
    cleaned = cleaned.replace(/[.,;:!?)>\]]+$/, '');

    // Add protocol if missing
    if (cleaned.startsWith('www.')) {
        cleaned = 'https://' + cleaned;
    }

    // Validate URL
    try {
        const parsed = new URL(cleaned);

        // Skip internal/local URLs
        if (parsed.hostname === 'localhost' || parsed.hostname.includes('127.0.0.1')) {
            return null;
        }

        return parsed.href;
    } catch {
        return null;
    }
}

/**
 * Extract surrounding text context (±150 chars)
 */
function extractContext(fullText, url) {
    const index = fullText.indexOf(url);
    if (index === -1) return '';

    const start = Math.max(0, index - 300);
    const end = Math.min(fullText.length, index + url.length + 300);

    let context = fullText.slice(start, end);

    // Clean up whitespace
    context = context.replace(/\s+/g, ' ').trim();

    if (start > 0) context = '...' + context;
    if (end < fullText.length) context = context + '...';

    return context;
}

/**
 * Extract text from surrounding elements
 */
function extractSurroundingText($, element) {
    const $parent = $(element).parent();
    return $parent.text().slice(0, 200).trim() || '';
}

/**
 * Main function to parse any document type
 */
export async function parseDocument(file, mimeType) {
    const buffer = Buffer.from(await file.arrayBuffer());

    if (mimeType === 'application/pdf') {
        return extractLinksFromPdf(buffer);
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return extractLinksFromDocx(buffer);
    } else {
        throw new Error('Unsupported file type');
    }
}
