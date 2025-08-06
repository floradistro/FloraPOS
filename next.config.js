/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Security Headers Configuration
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: [
          // Prevent clickjacking attacks
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          // Enable XSS protection
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          // Referrer policy for privacy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          // Permissions policy to restrict browser features
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-eval and unsafe-inline
              "style-src 'self' 'unsafe-inline'", // Required for styled-jsx and Tailwind
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://wooapi.floradeliverydc.com https://api.floradistro.com",
              "media-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests"
            ].join('; ')
          },
          // Strict Transport Security (HTTPS only)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          }
        ]
      },
      {
        // Additional API-specific headers
        source: '/api/(.*)',
        headers: [
          {
            key: 'X-API-Rate-Limit',
            value: '1000'
          },
          {
            key: 'X-API-Version',
            value: '1.0'
          },
          // Prevent caching of API responses
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate'
          },
          {
            key: 'Pragma',
            value: 'no-cache'
          },
          {
            key: 'Expires',
            value: '0'
          }
        ]
      }
    ]
  },

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
    // Security: Disable external image optimization for untrusted sources
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  env: {
    WOO_API_URL: process.env.WOO_API_URL,
    WOO_CONSUMER_KEY: process.env.WOO_CONSUMER_KEY,
    WOO_CONSUMER_SECRET: process.env.WOO_CONSUMER_SECRET,
  },

  // Security: Disable server-side rendering for sensitive pages
  experimental: {
    // Enable modern bundling optimizations
    optimizePackageImports: ['lucide-react', '@headlessui/react'],
  },

  // Production optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },

  // Security: Configure output settings
  output: 'standalone',
  
  // Security: Disable powered-by header
  poweredByHeader: false,

  // App directory is enabled by default in Next.js 13+
}

module.exports = nextConfig 