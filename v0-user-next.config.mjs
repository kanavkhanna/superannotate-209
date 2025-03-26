/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['placeholder.svg'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Optimize for Vercel deployment
  experimental: {
    optimizeCss: true,
    optimizeServerReact: true,
  },
}

export default nextConfig

