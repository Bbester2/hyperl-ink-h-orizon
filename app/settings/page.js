'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Use same icon set as dashboard
const Icons = {
    Home: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
    ),
    Settings: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
        </svg>
    ),
    Save: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
        </svg>
    ),
    Moon: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
    ),
    Sun: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
    )
};

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        exportFormat: 'csv',
        strictMode: false,
        ignoredDomains: '', // Stored as string with newlines
        theme: 'light'
    });
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        // Load settings
        const savedSettings = localStorage.getItem('hyperlink_settings');
        if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
        }

        // Apply theme immediately on load
        const theme = JSON.parse(savedSettings || '{}').theme || 'light';
        document.documentElement.setAttribute('data-theme', theme);
    }, []);

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        setSaved(false);
    };

    const handleSave = () => {
        localStorage.setItem('hyperlink_settings', JSON.stringify(settings));

        // Apply theme
        document.documentElement.setAttribute('data-theme', settings.theme);

        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="dashboard-layout">
            <aside className="sidebar open">
                <div className="sidebar-logo">
                    <Icons.Settings />
                    <span>Settings</span>
                </div>
                <nav className="sidebar-nav">
                    <Link href="/" className="sidebar-link">
                        <Icons.Home />
                        <span>Home</span>
                    </Link>
                    <Link href="/settings" className="sidebar-link active">
                        <Icons.Settings />
                        <span>Settings</span>
                    </Link>
                </nav>
            </aside>

            <main className="main-content">
                <h1>Configuration</h1>
                <p>Customize your Hyperlink Horizon experience.</p>

                <div className="settings-container" style={{ maxWidth: '800px', marginTop: 'var(--space-6)' }}>

                    {/* Export Preferences */}
                    <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                        <h3>Export Preferences</h3>
                        <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
                            <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 500 }}>Default Export Format</label>
                            <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                                <label className="radio-label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                    <input
                                        type="radio"
                                        name="exportFormat"
                                        value="csv"
                                        checked={settings.exportFormat === 'csv'}
                                        onChange={(e) => handleChange('exportFormat', e.target.value)}
                                    />
                                    CSV (Excel)
                                </label>
                                <label className="radio-label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                    <input
                                        type="radio"
                                        name="exportFormat"
                                        value="markdown"
                                        checked={settings.exportFormat === 'markdown'}
                                        onChange={(e) => handleChange('exportFormat', e.target.value)}
                                    />
                                    Markdown
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Analysis Configuration */}
                    <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                        <h3>Analysis Configuration</h3>

                        <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
                            <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={settings.strictMode}
                                    onChange={(e) => handleChange('strictMode', e.target.checked)}
                                />
                                <span style={{ fontWeight: 500 }}>Strict Mode</span>
                            </label>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginLeft: '1.5rem', marginTop: '0.25rem' }}>
                                If enabled, redirects (301/302) are marked as "Warning" instead of "Working".
                            </p>
                        </div>

                        <div className="form-group" style={{ marginTop: 'var(--space-6)' }}>
                            <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 500 }}>Ignored Domains (one per line)</label>
                            <textarea
                                value={settings.ignoredDomains}
                                onChange={(e) => handleChange('ignoredDomains', e.target.value)}
                                placeholder="example.com&#10;internal.test"
                                rows={5}
                                style={{
                                    width: '100%',
                                    padding: 'var(--space-3)',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border-color)',
                                    fontFamily: 'monospace'
                                }}
                            />
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                Links matching these domains will be skipped during analysis.
                            </p>
                        </div>
                    </div>

                    {/* Theme */}
                    <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                        <h3>Interface Theme</h3>
                        <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
                            <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                                <button
                                    onClick={() => handleChange('theme', 'light')}
                                    className={`btn ${settings.theme === 'light' ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
                                >
                                    <Icons.Sun /> Light
                                </button>
                                <button
                                    onClick={() => handleChange('theme', 'dark')}
                                    className={`btn ${settings.theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
                                >
                                    <Icons.Moon /> Dark
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Save Action */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
                        <button
                            onClick={handleSave}
                            className="btn btn-primary btn-lg"
                            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
                        >
                            <Icons.Save /> Save Configuration
                        </button>
                        {saved && (
                            <span style={{ color: 'var(--success-color)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                ✓ Settings saved
                            </span>
                        )}
                    </div>

                </div>
            </main>
        </div>
    );
}
