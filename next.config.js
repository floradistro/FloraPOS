/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wooapi.floradeliverydc.com',
      },
      {
        protocol: 'https',
        hostname: 'api.floradistro.com',
      },
    ],
  },
  env: {
    WOO_API_URL: process.env.WOO_API_URL,
    WOO_CONSUMER_KEY: process.env.WOO_CONSUMER_KEY,
    WOO_CONSUMER_SECRET: process.env.WOO_CONSUMER_SECRET,
  },

  // App directory is enabled by default in Next.js 13+
}

module.exports = nextConfig 