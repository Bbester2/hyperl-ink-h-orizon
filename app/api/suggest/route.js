/**
 * Hyperlink Horizon - Suggest API
 * Get AI-powered alternative suggestions for a URL
 */

import { NextResponse } from 'next/server';
import { getSuggestions } from '@/lib/ai-service';

export async function POST(request) {
    try {
        const body = await request.json();
        const { url, context, count } = body;

        if (!url) {
            return NextResponse.json(
                { error: 'URL is required' },
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
                    url: 'Required. The original URL to find alternatives for',
                    context: 'Optional. Surrounding text context from the document',
                    count: 'Optional. Number of suggestions to return (default: 3)',
                },
            },
        },
    });
}
