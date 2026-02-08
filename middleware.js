import { NextResponse } from 'next/server';

// Simple in-memory rate limiting (use Redis in production for multi-instance)
const rateLimit = new Map();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100; // 100 requests per minute

function getRateLimitInfo(ip) {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW;

    if (!rateLimit.has(ip)) {
        rateLimit.set(ip, []);
    }

    const requests = rateLimit.get(ip).filter(time => time > windowStart);
    rateLimit.set(ip, requests);

    return {
        remaining: Math.max(0, MAX_REQUESTS - requests.length),
        isLimited: requests.length >= MAX_REQUESTS,
    };
}

function recordRequest(ip) {
    const requests = rateLimit.get(ip) || [];
    requests.push(Date.now());
    rateLimit.set(ip, requests);
}

// Security headers
const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https:",
        "connect-src 'self' https://generativelanguage.googleapis.com",
    ].join('; '),
};

export function middleware(request) {
    // Get client IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
        request.headers.get('x-real-ip') ||
        'unknown';

    // Check rate limit for API routes
    if (request.nextUrl.pathname.startsWith('/api/')) {
        const { remaining, isLimited } = getRateLimitInfo(ip);

        if (isLimited) {
            return new NextResponse(
                JSON.stringify({
                    error: 'Too many requests',
                    message: 'Please try again later',
                    retryAfter: 60
                }),
                {
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                        'Retry-After': '60',
                        ...securityHeaders
                    }
                }
            );
        }

        recordRequest(ip);
    }

    // Apply security headers to response
    const response = NextResponse.next();

    Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
    });

    // Add rate limit headers for API routes
    if (request.nextUrl.pathname.startsWith('/api/')) {
        const { remaining } = getRateLimitInfo(ip);
        response.headers.set('X-RateLimit-Limit', String(MAX_REQUESTS));
        response.headers.set('X-RateLimit-Remaining', String(remaining));
    }

    return response;
}

export const config = {
    matcher: [
        // Apply to all routes except static files
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
