/** @type {import('next').NextConfig} */
const nextConfig = {
    // Security: Disable powered-by header
    poweredByHeader: false,

    // Security headers (also set in middleware, but good as fallback)
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'X-Frame-Options', value: 'DENY' },
                    { key: 'X-XSS-Protection', value: '1; mode=block' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                ],
            },
        ];
    },

    // Environment variables that are safe to expose to client
    env: {
        NEXT_PUBLIC_APP_NAME: 'Hyperlink Horizon',
        NEXT_PUBLIC_APP_VERSION: '1.0.0',
    },

    // Optimize for production
    reactStrictMode: true,

    // Compress responses
    compress: true,
};

module.exports = nextConfig;
