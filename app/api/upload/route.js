/**
 * Hyperlink Horizon - Document Upload API
 * Handles file uploads, URL input, and initiates link extraction
 */

import { NextResponse } from 'next/server';
import { parseDocument, extractLinksFromUrl } from '@/lib/document-parser';
import { verifyLinks } from '@/lib/link-verifier';
import { getSuggestionsForLinks } from '@/lib/ai-service';
import { createAudit, updateAudit, saveLinks, saveSuggestions } from '@/lib/db';
import { validateUrl, validateFile, MAX_FILE_SIZE } from '@/lib/security';

export const maxDuration = 60; // Allow up to 60 seconds for processing

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        const url = formData.get('url');

        if (!file && !url) {
            return NextResponse.json(
                { error: 'Please provide a file or URL to analyze' },
                { status: 400 }
            );
        }

        let links = [];
        let filename = '';
        let fileType = '';
        let sourceUrl = null;


        // Process file upload
        if (file) {
            filename = file.name;
            fileType = file.type;

            // Validate file type
            const validTypes = [
                'application/pdf',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ];

            if (!validTypes.includes(fileType)) {
                return NextResponse.json(
                    { error: 'Invalid file type. Please upload a PDF or DOCX file.' },
                    { status: 400 }
                );
            }

            // Extract links from document
            links = await parseDocument(file, fileType);
        }
        // Process URL input
        else if (url) {
            // Validate URL
            try {
                new URL(url);
            } catch {
                return NextResponse.json(
                    { error: 'Invalid URL provided' },
                    { status: 400 }
                );
            }

            filename = new URL(url).hostname;
            fileType = 'url';
            sourceUrl = url;

            // Extract links from web page
            links = await extractLinksFromUrl(url);
        }

        if (links.length === 0) {
            return NextResponse.json({
                message: 'No links found in the document',
                links: [],
                summary: {
                    total: 0,
                    working: 0,
                    broken: 0,
                    review: 0,
                },
            });
        }

        // Create audit record
        const auditId = createAudit(filename, fileType, sourceUrl);

        // Verify all links
        const verifiedLinks = await verifyLinks(links);

        // Calculate summary
        const summary = {
            total: verifiedLinks.length,
            working: verifiedLinks.filter(l => l.status === 'working').length,
            broken: verifiedLinks.filter(l => l.status === 'broken').length,
            review: verifiedLinks.filter(l => ['redirect', 'restricted'].includes(l.status)).length,
        };

        // Save links to database
        const savedLinks = saveLinks(auditId, verifiedLinks);

        // Get AI suggestions for broken/restricted links
        const suggestionsData = await getSuggestionsForLinks(verifiedLinks);

        // Merge suggestions with links
        const linksWithSuggestions = savedLinks.map(link => {
            const suggestionEntry = suggestionsData.find(s => s.originalUrl === link.url);
            const suggestions = suggestionEntry?.suggestions || [];

            // Save suggestions to database
            if (suggestions.length > 0 && link.id) {
                saveSuggestions(link.id, suggestions);
            }

            return {
                ...link,
                alternatives: suggestions,
            };
        });

        // Update audit with results
        updateAudit(auditId, {
            total: summary.total,
            working: summary.working,
            broken: summary.broken,
            restricted: summary.review,
        });

        return NextResponse.json({
            auditId,
            filename,
            links: linksWithSuggestions,
            summary,
        });

    } catch (error) {
        console.error('Upload processing error:', error);
        return NextResponse.json(
            { error: `Processing Failed: ${error.message}` },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'Hyperlink Horizon Upload API',
        supportedFormats: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'url'],
        maxFileSize: '10MB',
    });
}
