/**
 * Hyperlink Horizon - Suggest API
 * Get AI-powered alternative suggestions for a URL
 */

import { NextResponse } from 'next/server';
import { getSuggestions, getSuggestionsForLinks } from '@/lib/ai-service';

export async function POST(request) {
    try {
        const body = await request.json();
        const { url, context, count, links } = body;

        // BATCH MODE: Handle multiple links (for dashboard "Get AI Suggestions" btn)
        if (links && Array.isArray(links)) {
            console.log(`Processing batch suggestion request for ${links.length} links`);
            const results = await getSuggestionsForLinks(links, count || 3);
            return NextResponse.json({
                batch: true,
                results
            });
        }

        // SINGLE MODE: Handle one link
        if (!url) {
            return NextResponse.json(
                { error: 'URL or links array is required' },
                { status: 400 }
            );
        }

        const suggestions = await getSuggestions(
            url,
            context || '',
            count || 3
        );

        return NextResponse.json({
            originalUrl: url,
            suggestions,
        });

    } catch (error) {
        console.error('Suggestion error:', error);
        return NextResponse.json(
            { error: 'Failed to generate suggestions' },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'Hyperlink Horizon Suggest API',
        endpoints: {
            POST: {
                description: 'Get AI-powered alternative suggestions for a URL',
                body: {
                    url: 'Optional. The original URL to find alternatives for (single mode)',
                    links: 'Optional. Array of {url, context} objects (batch mode)',
                    context: 'Optional. Surrounding text context from the document',
                    count: 'Optional. Number of suggestions to return (default: 3)',
                },
            },
        },
    });
}
