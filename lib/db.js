/**
 * Hyperlink Horizon - Database Layer
 * In-memory storage for audits, links, and suggestions
 * (For production, replace with a persistent database like PostgreSQL or MongoDB)
 */

import { v4 as uuidv4 } from 'uuid';

// In-memory storage
const audits = new Map();
const links = new Map();
const suggestions = new Map();

/**
 * Create a new audit record
 */
export function createAudit(filename, fileType, sourceUrl = null) {
    const id = uuidv4();
    const audit = {
        id,
        filename,
        file_type: fileType,
        source_url: sourceUrl,
        created_at: new Date().toISOString(),
        total_links: 0,
        working_count: 0,
        broken_count: 0,
        restricted_count: 0,
        images_count: 0,
        status: 'processing',
    };
    audits.set(id, audit);
    return id;
}

/**
 * Update audit with results
 */
export function updateAudit(auditId, stats) {
    const audit = audits.get(auditId);
    if (audit) {
        audit.total_links = stats.total;
        audit.working_count = stats.working;
        audit.broken_count = stats.broken;
        audit.restricted_count = stats.restricted;
        audit.images_count = stats.images || 0;
        audit.status = 'complete';
        audits.set(auditId, audit);
    }
}

/**
 * Get audit by ID
 */
export function getAudit(auditId) {
    return audits.get(auditId) || null;
}

/**
 * Get all audits
 */
export function getAllAudits(limit = 50) {
    const allAudits = Array.from(audits.values());
    return allAudits
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, limit);
}

/**
 * Save links for an audit
 */
export function saveLinks(auditId, linksList) {
    const savedLinks = [];

    for (const link of linksList) {
        const id = uuidv4();
        const linkRecord = {
            id,
            audit_id: auditId,
            original_url: link.url,
            status: link.status,
            status_code: link.statusCode,
            reason: link.reason,
            context: link.context,
            is_image: link.isImage || false,
            content_type: link.contentType || null,
            response_time: link.responseTime,
            checked_at: link.checkedAt,
        };
        links.set(id, linkRecord);
        savedLinks.push({ ...link, id });
    }

    return savedLinks;
}

/**
 * Get links for an audit
 */
export function getLinksForAudit(auditId) {
    return Array.from(links.values())
        .filter(link => link.audit_id === auditId)
        .sort((a, b) => {
            const statusOrder = { broken: 0, restricted: 1, redirect: 2, working: 3 };
            return (statusOrder[a.status] || 4) - (statusOrder[b.status] || 4);
        });
}

/**
 * Save suggestions for a link
 */
export function saveSuggestions(linkId, suggestionsList) {
    for (const suggestion of suggestionsList) {
        const id = uuidv4();
        const suggestionRecord = {
            id,
            link_id: linkId,
            suggested_url: suggestion.url,
            title: suggestion.title,
            description: suggestion.description,
            source_type: suggestion.sourceType,
            credibility_score: suggestion.credibility?.score || 0.5,
            created_at: new Date().toISOString(),
        };
        suggestions.set(id, suggestionRecord);
    }
}

/**
 * Get suggestions for a link
 */
export function getSuggestionsForLink(linkId) {
    return Array.from(suggestions.values())
        .filter(s => s.link_id === linkId)
        .sort((a, b) => b.credibility_score - a.credibility_score);
}

/**
 * Delete an audit and related data
 */
export function deleteAudit(auditId) {
    // Get link IDs for this audit
    const auditLinks = Array.from(links.values())
        .filter(link => link.audit_id === auditId);

    // Delete suggestions for each link
    for (const link of auditLinks) {
        for (const [id, suggestion] of suggestions.entries()) {
            if (suggestion.link_id === link.id) {
                suggestions.delete(id);
            }
        }
        links.delete(link.id);
    }

    // Delete audit
    return audits.delete(auditId);
}

/**
 * Clear all data (for testing)
 */
export function clearAll() {
    audits.clear();
    links.clear();
    suggestions.clear();
}
