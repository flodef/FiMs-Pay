/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: [process.env.IMAGE_DOMAIN || 'flodef.github.io'],
    },
    reactStrictMode: true,
    // modularizeImports: {
    //     '@radix-ui/react-icons':{
    //         transform:'@radix-ui/react-icons/dist/{{member}}.d.ts',
    //     },
    // },
    async redirects() {
        return [
            {
                source: '/',
                destination: '/new',
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
