/**
 * Hyperlink Horizon - Verify API
 * Re-check a single link or batch of links
 */

import { NextResponse } from 'next/server';
import { verifyLink, verifyLinks, clearCache } from '@/lib/link-verifier';
import { validateUrl } from '@/lib/security';

export async function POST(request) {
    try {
        const body = await request.json();
        const { url, urls, clearCacheFirst } = body;

        // Optionally clear cache before verification
        if (clearCacheFirst) {
            clearCache();
        }

        // Single URL verification
        if (url) {
            // Validate URL
            const validation = validateUrl(url);
            if (!validation.isValid) {
                return NextResponse.json(
                    { error: validation.error },
                    { status: 400 }
                );
            }

            const result = await verifyLink(validation.sanitized);
            return NextResponse.json(result);
        }

        // Batch URL verification
        if (urls && Array.isArray(urls)) {
            // Validate all URLs
            const validatedUrls = [];
            for (const u of urls.slice(0, 100)) { // Limit to 100 URLs per batch
                const validation = validateUrl(u);
                if (validation.isValid) {
                    validatedUrls.push(validation.sanitized);
                }
            }

            const links = validatedUrls.map(u => ({ url: u, context: '' }));
            const results = await verifyLinks(links);
            return NextResponse.json({ results });
        }

        return NextResponse.json(
            { error: 'Please provide a url or urls array' },
            { status: 400 }
        );


    } catch (error) {
        console.error('Verification error:', error);
        return NextResponse.json(
            { error: 'Verification failed' },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'Hyperlink Horizon Verify API',
        endpoints: {
            POST: {
                description: 'Verify one or more URLs',
                body: {
                    url: 'Single URL to verify',
                    urls: 'Array of URLs to verify in batch',
                    clearCacheFirst: 'Optional boolean to clear cache before verification',
                },
            },
        },
    });
}
