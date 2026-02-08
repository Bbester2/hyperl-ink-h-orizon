/**
 * Security utilities for input validation and sanitization
 */

// Maximum file size (4.5MB)
// Vercel Serverless Function Limit is 4.5MB
export const MAX_FILE_SIZE = 4.5 * 1024 * 1024;

// Allowed file types
export const ALLOWED_FILE_TYPES = {
    'application/pdf': ['.pdf'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};

/**
 * Validate and sanitize a URL
 * @param {string} url - URL to validate
 * @returns {{ isValid: boolean, sanitized: string, error?: string }}
 */
export function validateUrl(url) {
    if (!url || typeof url !== 'string') {
        return { isValid: false, sanitized: '', error: 'URL is required' };
    }

    // Trim whitespace
    const trimmed = url.trim();

    // Check length
    if (trimmed.length > 2048) {
        return { isValid: false, sanitized: '', error: 'URL too long (max 2048 chars)' };
    }

    // Check for protocol injection
    const lowerUrl = trimmed.toLowerCase();
    if (lowerUrl.startsWith('javascript:') ||
        lowerUrl.startsWith('data:') ||
        lowerUrl.startsWith('vbscript:')) {
        return { isValid: false, sanitized: '', error: 'Invalid URL protocol' };
    }

    // Validate URL format
    try {
        const parsed = new URL(trimmed);

        // Only allow http and https
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return { isValid: false, sanitized: '', error: 'Only HTTP/HTTPS URLs allowed' };
        }

        // Block localhost and private IPs in production
        if (process.env.NODE_ENV === 'production') {
            const hostname = parsed.hostname.toLowerCase();
            if (hostname === 'localhost' ||
                hostname === '127.0.0.1' ||
                hostname.startsWith('192.168.') ||
                hostname.startsWith('10.') ||
                hostname.startsWith('172.16.')) {
                return { isValid: false, sanitized: '', error: 'Private URLs not allowed' };
            }
        }

        return { isValid: true, sanitized: parsed.href };
    } catch {
        return { isValid: false, sanitized: '', error: 'Invalid URL format' };
    }
}

/**
 * Validate file upload
 * @param {File} file - File to validate
 * @returns {{ isValid: boolean, error?: string }}
 */
export function validateFile(file) {
    if (!file) {
        return { isValid: false, error: 'File is required' };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
        return { isValid: false, error: `File too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)` };
    }

    // Check file type
    const allowedTypes = Object.keys(ALLOWED_FILE_TYPES);
    if (!allowedTypes.includes(file.type)) {
        const allowedExt = Object.values(ALLOWED_FILE_TYPES).flat().join(', ');
        return { isValid: false, error: `Invalid file type. Allowed: ${allowedExt}` };
    }

    return { isValid: true };
}

/**
 * Sanitize string input to prevent XSS
 * @param {string} input - String to sanitize
 * @returns {string}
 */
export function sanitizeString(input) {
    if (!input || typeof input !== 'string') return '';

    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .trim();
}

/**
 * Create a safe error response
 * @param {string} message - Error message
 * @param {number} status - HTTP status code
 */
export function createErrorResponse(message, status = 400) {
    return {
        error: true,
        message: sanitizeString(message),
        status,
    };
}
