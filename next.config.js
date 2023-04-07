/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: [process.env.IMAGE_DOMAIN || 'flodef.github.io'],
    },
    reactStrictMode: true,
    modularizeImports: {
        '@mui/material': {
            transform: '@mui/material/{{member}}',
        },
    },
    async redirects() {
        return [
            {
                source: '/',
                destination: '/new',
                permanent: false,
                has: [
                    {
                        type: 'query',
                        key: 'recipient',
                    },
                ],
            },
            {
                source: '/',
                destination: '/new',
                permanent: false,
                has: [
                    {
                        type: 'query',
                        key: 'id',
                    },
                ],
            },
            {
                source: '/',
                destination: '/merchants',
                permanent: false,
            },
        ];
    },
    async rewrites() {
        return [
            {
                source: '/sitemap.xml',
                destination: '/api/sitemap',
            },
        ];
    },
};

module.exports = nextConfig;
