'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { MAX_FILE_SIZE } from '@/lib/security';

// SVG Icons - Professional stroke-style icons
const Icons = {
    Link: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
    ),
    Upload: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
    ),
    FileText: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
        </svg>
    ),
    Search: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    ),
    Shield: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
    ),
    Sparkles: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            <path d="M5 3v4" />
            <path d="M19 17v4" />
            <path d="M3 5h4" />
            <path d="M17 19h4" />
        </svg>
    ),
    BarChart: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="20" x2="12" y2="10" />
            <line x1="18" y1="20" x2="18" y2="4" />
            <line x1="6" y1="20" x2="6" y2="16" />
        </svg>
    ),
    Globe: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
    ),
    Zap: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
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
    ArrowRight: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
        </svg>
    ),
};

export default function Home() {
    const [file, setFile] = useState(null);
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

    const [error, setError] = useState(null);

    const handleSubmit = async (fileToProcess = null, urlToProcess = '') => {
        const fileToUse = fileToProcess || file;
        const urlToUse = urlToProcess || url;

        if (!fileToUse && !urlToUse) return;

        // Client-side validation
        if (fileToUse && fileToUse.size > MAX_FILE_SIZE) {
            setError(`File is too large (${(fileToUse.size / 1024 / 1024).toFixed(1)}MB). Max size is 4.5MB.`);
            return;
        }

        setLoading(true);
        setResults(null);
        setError(null);

        try {
            const formData = new FormData();
            if (fileToUse) {
                formData.append('file', fileToUse);
            } else if (urlToUse) {
                formData.append('url', urlToUse);
            }

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                // Handle non-200 responses (e.g. 504 Timeout, 413 Payload Too Large)
                if (response.status === 504) {
                    throw new Error('Analysis timed out. The file might be too large/complex.');
                }
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Server error: ${response.status}`);
            }

            const data = await response.json();
            setResults(data);

            // Save to localStorage for Dashboard persistence
            try {
                const currentHistory = JSON.parse(localStorage.getItem('hyperlink_audits') || '[]');

                // Create audit summary object
                const newAudit = {
                    id: data.auditId,
                    filename: data.filename,
                    file_type: fileToUse ? (fileToUse.type.includes('pdf') ? 'PDF' : 'DOCX') : 'URL',
                    created_at: new Date().toISOString(),
                    total_links: data.summary.total,
                    working_count: data.summary.working,
                    broken_count: data.summary.broken,
                    restricted_count: data.summary.review,
                    status: 'complete',
                    links: data.links // Store links for details view
                };

                // Add to beginning of history, limit to 20 items
                const updatedHistory = [newAudit, ...currentHistory].slice(0, 20);
                localStorage.setItem('hyperlink_audits', JSON.stringify(updatedHistory));
            } catch (err) {
                console.error('Failed to save to history:', err);
            }

            // Scroll to results
            const resultsElement = document.getElementById('results-section');
            if (resultsElement) {
                resultsElement.scrollIntoView({ behavior: 'smooth' });
            }
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.type === 'application/pdf' ||
                droppedFile.name.endsWith('.docx')) {
                setFile(droppedFile);
                handleSubmit(droppedFile, null);
            }
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            handleSubmit(selectedFile, null);
        }
    };

    const features = [
        {
            icon: <Icons.FileText />,
            title: "Multi-Format Support",
            description: "Extract and analyze links from PDF documents, DOCX files, and live web pages with intelligent parsing."
        },
        {
            icon: <Icons.Shield />,
            title: "Deep Link Verification",
            description: "Detect broken links, paywalls, login requirements, and accessibility issues with comprehensive status checks."
        },
        {
            icon: <Icons.Sparkles />,
            title: "AI-Powered Alternatives",
            description: "Get intelligent replacement suggestions with credibility scoring and recency filtering."
        },
        {
            icon: <Icons.BarChart />,
            title: "Interactive Reports",
            description: "Beautiful dashboards with exportable reports in PDF, CSV, and Markdown formats."
        },
        {
            icon: <Icons.Globe />,
            title: "Real-Time Monitoring",
            description: "Track link health over time with automated re-checks and instant notifications."
        },
        {
            icon: <Icons.Zap />,
            title: "Smart Context Analysis",
            description: "AI understands the surrounding text to suggest contextually relevant alternatives."
        }
    ];

    return (
        <>
            {/* Navigation */}
            <nav className="navbar">
                <div className="container navbar-content">
                    <Link href="/" className="navbar-logo">
                        <Icons.Link />
                        <span>Hyperlink Horizon</span>
                    </Link>

                    <div className="navbar-links">
                        <Link href="/" className="navbar-link active">Home</Link>
                        <Link href="/dashboard" className="navbar-link">Dashboard</Link>
                        <a href="#features" className="navbar-link">Features</a>
                        <Link href="/dashboard" className="btn btn-primary">Get Started</Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero">
                <div className="container hero-content">
                    <div className="hero-badge">
                        <Icons.Sparkles />
                        <span>AI-Powered Link Intelligence</span>
                    </div>

                    <h1>
                        Discover & Fix <strong>Broken Links</strong> Before They Break Trust
                    </h1>

                    <p className="hero-description">
                        Upload your documents, paste URLs, and let our AI analyze every link.
                        Get instant verification, smart alternatives, and actionable reports.
                    </p>

                    {/* Upload Zone */}
                    <div
                        className={`upload-zone ${dragActive ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="file-input"
                            accept=".pdf,.docx"
                            onChange={handleFileChange}
                        />
                        <Icons.Upload />
                        <h3>{file ? file.name : 'Drop your document here'}</h3>
                        <p>{file ? 'Click to change file' : 'Supports PDF and DOCX files'}</p>
                    </div>

                    {/* URL Input */}
                    <div className="url-input-wrapper">
                        <input
                            type="url"
                            className="url-input"
                            placeholder="https://example.com/article"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                        />
                        <button
                            className="btn btn-primary"
                            onClick={() => handleSubmit()}
                            disabled={loading || (!file && !url)}
                        >
                            {loading ? (
                                <>
                                    <div className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Icons.Search />
                                    Analyze
                                </>
                            )}
                        </button>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div style={{
                            marginTop: 'var(--space-4)',
                            padding: 'var(--space-3) var(--space-4)',
                            background: '#fee2e2',
                            color: '#dc2626',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.875rem',
                            textAlign: 'center',
                            maxWidth: '400px',
                            margin: 'var(--space-4) auto 0'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <Icons.AlertTriangle />
                                {error}
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Results Preview */}
            {results && (
                <section id="results-section" style={{ padding: 'var(--space-12) 0', background: 'var(--bg-secondary)' }}>
                    <div className="container">
                        <ResultsPreview results={results} />
                    </div>
                </section>
            )}

            {/* Features Section */}
            <section id="features" className="features-section">
                <div className="container">
                    <h2>Powerful Features for Link Management</h2>
                    <p>Everything you need to ensure your documents maintain healthy, accessible links.</p>

                    <div className="features-grid">
                        {features.map((feature, index) => (
                            <div key={index} className="feature-card">
                                <div className="icon-wrapper">
                                    {feature.icon}
                                </div>
                                <h3>{feature.title}</h3>
                                <p>{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="container">
                    <h2>Ready to Audit Your Links?</h2>
                    <p>Start with a free audit. No signup required for your first document.</p>

                    <div className="cta-buttons">
                        <Link href="/dashboard" className="btn btn-primary">
                            Start Free Audit
                            <Icons.ArrowRight />
                        </Link>
                        <a href="#features" className="btn btn-secondary">
                            Learn More
                        </a>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="container">
                    <p>© 2026 Hyperlink Horizon. All rights reserved.</p>
                </div>
            </footer>
        </>
    );
}

function ResultsPreview({ results }) {
    const { stats, links = [] } = results;

    return (
        <>
            <h2 style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>Analysis Results</h2>

            <div className="stats-grid">
                <div className="stat-card">
                    <h4>Total Links</h4>
                    <div className="value">{stats?.total || links.length}</div>
                </div>
                <div className="stat-card">
                    <h4>Working</h4>
                    <div className="value success">{stats?.working || 0}</div>
                </div>
                <div className="stat-card">
                    <h4>Broken</h4>
                    <div className="value error">{stats?.broken || 0}</div>
                </div>
                <div className="stat-card">
                    <h4>Needs Review</h4>
                    <div className="value warning">{stats?.restricted || 0}</div>
                </div>
            </div>

            {links.slice(0, 5).map((link, index) => (
                <div key={index} className="card" style={{ marginBottom: 'var(--space-4)' }}>
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

            <div style={{ textAlign: 'center', marginTop: 'var(--space-8)' }}>
                <Link href="/dashboard" className="btn btn-primary">
                    View Full Report
                    <Icons.ArrowRight />
                </Link>
            </div>
        </>
    );
}
