import './globals.css';

export const metadata = {
    title: 'Hyperlink Horizon - Intelligent Link Auditing & Recommendations',
    description: 'Comprehensive link auditing and AI-powered alternative recommendations for your digital content. Ensure link validity and discover fresh alternatives.',
    keywords: 'link checker, URL validator, broken links, SEO tool, content audit',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <div style={{ background: '#2EB1E9', color: 'white', padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>
                    SYSTEM UPDATE v4.0 LIVE - PLEASE REFRESH
                </div>
                <main style={{ flex: 1 }}>
                    {children}
                </main>
                <footer style={{
                    padding: '24px',
                    textAlign: 'center',
                    borderTop: '1px solid #e2e8f0',
                    color: '#64748b',
                    fontSize: '0.875rem',
                    background: '#ffffff'
                }}>
                    <p>Created by <strong>Bradley Bester</strong> (v3.11 - Clean Build)</p>
                </footer>
            </body>
        </html>
    );
}

