/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
    remotePatterns: [],
  },
  experimental: {
    mdxRs: false,
  },
}

module.exports = nextConfig
