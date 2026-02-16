
import { verifyLink } from './lib/link-verifier.js';

// Mock audit data for testing exports
const mockAudit = {
    id: 'test-audit-id',
    filename: 'test-report.pdf',
    created_at: new Date().toISOString(),
    total_links: 5,
    working_count: 2,
    broken_count: 1,
    restricted_count: 1,
    images_count: 1,
    links: [
        {
            original_url: 'https://example.com/working',
            status: 'working',
            statusCode: 200,
            isImage: false,
            context: 'Click here for the working link example.'
        },
        {
            original_url: 'https://example.com/image.png',
            status: 'working',
            statusCode: 200,
            isImage: true,
            contentType: 'image/png'
        },
        {
            original_url: 'https://example.com/broken',
            status: 'broken',
            statusCode: 404,
            reason: 'Not Found',
            context: 'This link is broken and should be reported.',
            alternatives: [
                { url: 'https://archive.org/wayback', title: 'Wayback Machine', description: 'Archived version' }
            ]
        },
        {
            original_url: 'https://example.com/restricted',
            status: 'restricted',
            statusCode: 403,
            reason: 'Access Denied',
            context: 'This content requires a login.'
        }
    ]
};

// Implement the generateCSV function from dashboard/page.js (adapted for node)
function generateCSV(audit) {
    const headers = [
        'URL', 'Type', 'Status', 'Status Code', 'Reason', 'Context', 'Suggestion 1', 'Suggestion 2'
    ];

    const rows = (audit.links || []).map(link => {
        const suggestions = link.alternatives || [];
        const esc = (field) => {
            if (field === null || field === undefined) return '';
            const str = String(field);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        return [
            esc(link.original_url || link.url),
            link.isImage ? 'Image' : 'Link',
            link.status,
            link.statusCode || link.status_code || '',
            esc(link.reason || ''),
            esc(link.context || ''),
            esc(suggestions[0]?.url || ''),
            esc(suggestions[1]?.url || '')
        ].join(',');
    });

    return [
        `# Hyperlink Horizon Audit Report`,
        `# File: ${audit.filename}`,
        `# Date: ${audit.created_at}`,
        `# Total Links: ${audit.total_links}`,
        '',
        headers.join(','),
        ...rows
    ].join('\n');
}

// Resemble generateMarkdown from dashboard/page.js
function generateMarkdown(audit) {
    let md = `# Audit Report: ${audit.filename}\n\n`;
    md += `**Date:** ${new Date(audit.created_at).toLocaleDateString()}\n`;
    md += `**Total Links:** ${audit.total_links}\n\n`;

    md += `## Table of Contents\n`;
    md += `- [Summary](#summary)\n`;
    if (audit.working_count > 0) md += `- [Working Links](#working-links)\n`;
    if (audit.broken_count > 0) md += `- [Broken Links](#broken-links)\n`;
    if (audit.restricted_count > 0) md += `- [Restricted Links](#restricted-links)\n`;
    if ((audit.images_count || 0) > 0) md += `- [Images](#images)\n`;
    md += `\n`;

    md += `## Summary\n`;
    md += `| Status | Count |\n|---|---|\n`;
    md += `| ✅ Working | ${audit.working_count} |\n`;
    md += `| ❌ Broken | ${audit.broken_count} |\n`;
    md += `| 🔐 Restricted | ${audit.restricted_count} |\n`;
    md += `| 🖼️ Images | ${audit.images_count || 0} |\n\n`;

    md += `## Link Details\n\n`;

    const links = audit.links || [];
    ['broken', 'restricted', 'timeout', 'redirect', 'working'].forEach(status => {
        const group = links.filter(l => {
            if (status === 'working') return l.status === 'working' && !l.isImage;
            return l.status === status && !l.isImage;
        });

        if (group.length === 0) return;

        const emoji = { broken: '❌', restricted: '🔐', timeout: '⏱️', redirect: '↪️', working: '✅' };
        const sectionId = `${status}-links`;
        md += `### ${emoji[status] || ''} <a id="${sectionId}"></a>${status.toUpperCase()} (${group.length})\n`;

        group.forEach(link => {
            md += `- **${link.original_url || link.url}**\n`;
            if (link.reason) md += `  - Reason: ${link.reason}\n`;
            if (link.context) md += `  - Context: "...${link.context.substring(0, 100)}..."\n`;
            md += '\n';
        });
    });

    const images = links.filter(l => l.isImage);
    if (images.length > 0) {
        md += `### 🖼️ <a id="images"></a>IMAGES (${images.length})\n`;
        images.forEach(link => {
            md += `- **${link.original_url || link.url}**\n`;
            md += '\n';
        });
    }

    return md;
}

// Run tests
console.log('--- Testing CSV Generation ---');
const csv = generateCSV(mockAudit);
console.log(csv);
if (csv.includes('Type') && csv.includes('Context') && csv.includes('Image,Working')) {
    console.log('✅ CSV generation passed.');
} else {
    console.error('❌ CSV generation failed.');
}

console.log('\n--- Testing Markdown Generation ---');
const md = generateMarkdown(mockAudit);
console.log(md);
if (md.includes('Table of Contents') && md.includes('IMAGES (1)') && md.includes('Context: "...')) {
    console.log('✅ Markdown generation passed.');
} else {
    console.error('❌ Markdown generation failed.');
}
