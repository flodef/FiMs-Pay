/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: [process.env.IMAGE_DOMAIN || 'flodef.github.io'],
    },
    reactStrictMode: true,
    modularizeImports:{
        '@radix-ui/react-icons':{
            transform:'@radix-ui/react-icons/{{member}}',
        },
    },
    async redirects() {
        return [
            {
                source: '/',
                destination: '/new',
                permanent: false,
            },
        ];
    },
};

module.exports = nextConfig;
