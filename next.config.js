/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
    remotePatterns: [],
    unoptimized: false,
  },
  experimental: {
    mdxRs: false,
    serverComponentsExternalPackages: ['tinacms'],
  },
  // Enable static exports if needed
  // output: 'export',
  // For Vercel deployment
  poweredByHeader: false,
  compress: true,
}

module.exports = nextConfig
