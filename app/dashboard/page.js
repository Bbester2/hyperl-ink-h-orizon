'use client';

import { useState } from 'react';
import Link from 'next/link';

// SVG Icons - Professional stroke-style icons
const Icons = {
    Link: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
    ),
    Home: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
    ),
    FileText: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
    ),
    Settings: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
        </svg>
    ),
    Plus: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    ),
    ExternalLink: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
    ),
    Download: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
    ),
    X: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    ),
    CheckCircle: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    ),
    XCircle: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
    ),
    AlertTriangle: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    ),
    TrendingUp: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
        </svg>
    ),
    Sparkles: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        </svg>
    ),
    Layers: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
        </svg>
    ),
};

// Mock data
const mockAudits = [
    {
        id: '1',
        filename: 'research-paper.pdf',
        file_type: 'PDF',
        created_at: '2026-02-06',
        total_links: 45,
        working_count: 38,
        broken_count: 5,
        restricted_count: 2,
        status: 'complete'
    },
    {
        id: '2',
        filename: 'blog-article.docx',
        file_type: 'DOCX',
        created_at: '2026-02-03',
        total_links: 23,
        working_count: 20,
        broken_count: 2,
        restricted_count: 1,
        status: 'complete'
    },
    {
        id: '3',
        filename: 'example.com',
        file_type: 'URL',
        created_at: '2026-02-01',
        total_links: 87,
        working_count: 79,
        broken_count: 6,
        restricted_count: 2,
        status: 'complete'
    }
];

const mockLinks = [
    { url: 'https://example.com/old-page', status: 'broken', statusCode: 404, reason: 'Page not found' },
    { url: 'https://academic.paper.com/research', status: 'restricted', statusCode: 403, reason: 'Requires subscription' },
    { url: 'https://docs.example.com/api', status: 'working', statusCode: 200, reason: null },
];

export default function Dashboard() {
    const [selectedAudit, setSelectedAudit] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const totalStats = mockAudits.reduce((acc, audit) => ({
        total: acc.total + audit.total_links,
        working: acc.working + audit.working_count,
        broken: acc.broken + audit.broken_count,
        restricted: acc.restricted + audit.restricted_count
    }), { total: 0, working: 0, broken: 0, restricted: 0 });

    const healthScore = totalStats.total > 0
        ? Math.round((totalStats.working / totalStats.total) * 100)
        : 0;

    return (
        <div className="dashboard-layout">
            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-logo">
                    <Icons.Link />
                    <span>Hyperlink</span>
                </div>

                <nav className="sidebar-nav">
                    <Link href="/" className="sidebar-link">
                        <Icons.Home />
                        <span>Home</span>
                    </Link>
                    <Link href="/dashboard" className="sidebar-link active">
                        <Icons.FileText />
                        <span>Audits</span>
                    </Link>
                    <a href="#" className="sidebar-link">
                        <Icons.Settings />
                        <span>Settings</span>
                    </a>
                </nav>

                <div className="sidebar-cta">
                    <button className="btn btn-primary">
                        <Icons.Plus />
                        New Audit
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <h1>Dashboard</h1>
                <p>Overview of your link audits and their status</p>

                {/* Stats Grid */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <h4>Total Links Analyzed</h4>
                        <div className="value">{totalStats.total}</div>
                    </div>
                    <div className="stat-card">
                        <h4>Working Links</h4>
                        <div className="value success">{totalStats.working}</div>
                        <div className="subtext">{healthScore}%</div>
                    </div>
                    <div className="stat-card">
                        <h4>Broken Links</h4>
                        <div className="value error">{totalStats.broken}</div>
                    </div>
                    <div className="stat-card">
                        <h4>Needs Review</h4>
                        <div className="value warning">{totalStats.restricted}</div>
                    </div>
                </div>

                {/* Recent Audits Table */}
                <div className="table-container">
                    <div className="table-header">
                        <h3>Recent Audits</h3>
                        <button className="btn btn-secondary">
                            <Icons.Plus />
                            New Audit
                        </button>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Document</th>
                                <th>Type</th>
                                <th>Date</th>
                                <th>Links</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mockAudits.map((audit) => (
                                <tr key={audit.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                            <Icons.FileText />
                                            {audit.filename}
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge badge-info">{audit.file_type}</span>
                                    </td>
                                    <td>{new Date(audit.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                    <td>
                                        <div className="link-counts">
                                            <span className="link-count working" title="Working">{audit.working_count}</span>
                                            <span className="link-count broken" title="Broken">{audit.broken_count}</span>
                                            <span className="link-count review" title="Needs Review">{audit.restricted_count}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge badge-success">Complete</span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                            <button
                                                className="action-btn"
                                                onClick={() => setSelectedAudit(audit)}
                                                title="View report"
                                            >
                                                <Icons.ExternalLink />
                                            </button>
                                            <button
                                                className="action-btn"
                                                title="Export"
                                            >
                                                <Icons.Download />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Insights Section */}
                <h3 style={{ marginBottom: 'var(--space-5)' }}>Insights</h3>
                <div className="insights-grid">
                    <div className="insight-card">
                        <h4>Link Health Score</h4>
                        <div className="value accent">{healthScore}%</div>
                        <div className="subtext">Based on all analyzed links</div>
                    </div>
                    <div className="insight-card">
                        <h4>AI Recommendations</h4>
                        <div className="value">{totalStats.broken + totalStats.restricted}</div>
                        <div className="subtext">Links with suggested alternatives</div>
                    </div>
                    <div className="insight-card">
                        <h4>Documents Analyzed</h4>
                        <div className="value">{mockAudits.length}</div>
                        <div className="subtext">Total audits performed</div>
                    </div>
                </div>
            </main>

            {/* Audit Detail Modal */}
            {selectedAudit && (
                <AuditDetailModal
                    audit={selectedAudit}
                    onClose={() => setSelectedAudit(null)}
                />
            )}
        </div>
    );
}

function AuditDetailModal({ audit, onClose }) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{audit.filename}</h2>
                    <button className="modal-close" onClick={onClose}>
                        <Icons.X />
                    </button>
                </div>

                <div className="modal-body">
                    {/* Stats */}
                    <div className="stats-grid" style={{ marginBottom: 'var(--space-8)' }}>
                        <div className="stat-card">
                            <h4>Total</h4>
                            <div className="value">{audit.total_links}</div>
                        </div>
                        <div className="stat-card">
                            <h4>Working</h4>
                            <div className="value success">{audit.working_count}</div>
                        </div>
                        <div className="stat-card">
                            <h4>Broken</h4>
                            <div className="value error">{audit.broken_count}</div>
                        </div>
                        <div className="stat-card">
                            <h4>Review</h4>
                            <div className="value warning">{audit.restricted_count}</div>
                        </div>
                    </div>

                    {/* Links Preview */}
                    <h3 style={{ marginBottom: 'var(--space-4)' }}>Link Details</h3>
                    {mockLinks.map((link, index) => (
                        <div key={index} className="card" style={{ marginBottom: 'var(--space-3)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                                <div className={`icon-wrapper ${link.status === 'working' ? 'success' : link.status === 'broken' ? 'error' : 'warning'}`}>
                                    {link.status === 'working' ? <Icons.CheckCircle /> :
                                        link.status === 'broken' ? <Icons.XCircle /> : <Icons.AlertTriangle />}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {link.url}
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
                                        {link.reason || `Status: ${link.statusCode}`}
                                    </div>
                                </div>
                                <span className={`badge badge-${link.status === 'working' ? 'success' : link.status === 'broken' ? 'error' : 'warning'}`}>
                                    {link.status}
                                </span>
                            </div>
                        </div>
                    ))}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-6)' }}>
                        <button className="btn btn-primary">
                            <Icons.Download />
                            Export Report
                        </button>
                        <button className="btn btn-secondary">
                            <Icons.Sparkles />
                            Get AI Suggestions
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
