/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
    remotePatterns: [],
    unoptimized: false,
  },
  // Force Next.js to transpile tinacms packages so ESM/CJS dual-package
  // exports resolve correctly during SSR and static generation.
  transpilePackages: ['tinacms', '@tinacms/mdx'],
  experimental: {
    mdxRs: false,
  },
  // Enable static exports if needed
  // output: 'export',
  // For Vercel deployment
  poweredByHeader: false,
  compress: true,
}

module.exports = nextConfig
