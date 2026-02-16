
import { verifyLink } from './lib/link-verifier.js';
import { createAudit, updateAudit, saveLinks, getAudit, getLinksForAudit } from './lib/db.js';

// Mock global fetch
global.fetch = async (url) => {
    if (url.includes('image.png')) {
        return {
            status: 200,
            headers: {
                get: (key) => key.toLowerCase() === 'content-type' ? 'image/png' : null
            },
            text: async () => '',
        };
    }
    if (url.includes('page.html')) {
        return {
            status: 200,
            headers: {
                get: (key) => key.toLowerCase() === 'content-type' ? 'text/html' : null
            },
            text: async () => '<html><body>Content</body></html>',
        };
    }
    return {
        status: 404,
        headers: { get: () => null },
        text: async () => '',
    };
};

// Test verifyLink for images
console.log('Testing verifyLink for image detection...');
const imageResult = await verifyLink('https://example.com/image.png');
if (imageResult.isImage && imageResult.contentType === 'image/png') {
    console.log('✅ verifyLink correctly identified image.');
} else {
    console.error('❌ verifyLink failed to identify image:', imageResult);
}

// Test verifyLink for non-images
console.log('Testing verifyLink for non-image...');
const pageResult = await verifyLink('https://example.com/page.html');
if (!pageResult.isImage && pageResult.status === 'working') {
    console.log('✅ verifyLink correctly identified non-image page.');
} else {
    console.error('❌ verifyLink failed for non-image:', pageResult);
}

// Test DB functions
console.log('Testing DB storage for image counts...');
const auditId = createAudit('test.pdf', 'application/pdf');

// Mock verified links
const verifiedLinks = [
    { url: 'https://example.com/image.png', status: 'working', isImage: true, contentType: 'image/png' },
    { url: 'https://example.com/page.html', status: 'working', isImage: false, contentType: 'text/html' },
    { url: 'https://example.com/broken', status: 'broken', isImage: false }
];

// Calculate summary (simulating route.js logic)
const summary = {
    total: verifiedLinks.length,
    working: verifiedLinks.filter(l => l.status === 'working' && !l.isImage).length,
    broken: verifiedLinks.filter(l => l.status === 'broken').length,
    review: 0,
    images: verifiedLinks.filter(l => l.isImage).length,
};

// Update audit
updateAudit(auditId, summary);

// Verify audit storage
const storedAudit = getAudit(auditId);
if (storedAudit.images_count === 1 && storedAudit.working_count === 1) {
    console.log('✅ DB correctly stored image count.');
} else {
    console.error('❌ DB failed to store correct counts:', storedAudit);
}

// Verify links storage
saveLinks(auditId, verifiedLinks);
const storedLinks = getLinksForAudit(auditId);
const storedImageLink = storedLinks.find(l => l.original_url === 'https://example.com/image.png');

if (storedImageLink && storedImageLink.is_image) {
    console.log('✅ DB correctly stored is_image flag for link.');
} else {
    console.error('❌ DB failed to store is_image flag:', storedLinks);
}
