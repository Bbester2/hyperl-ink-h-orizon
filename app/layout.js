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
            <body>
                <div style={{
                    position: 'fixed',
                    bottom: '10px',
                    right: '10px',
                    background: '#0f172a',
                    color: '#e2e8f0',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    zIndex: 9999,
                    pointerEvents: 'none',
                    opacity: 0.7
                }}>
                    v1.4 (Final)
                </div>
                {children}
            </body>
        </html>
    );
}
