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

                {children}
            </body>
        </html>
    );
}
