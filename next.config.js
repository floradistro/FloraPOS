/** @type {import('next').NextConfig} */
const nextConfig = {
  // Environment variables
  env: {
    WORDPRESS_URL: process.env.WORDPRESS_URL || 'https://api.floradistro.com',
    WP_USERNAME: process.env.WP_USERNAME || '',
    WP_PASSWORD: process.env.WP_PASSWORD || '',
    FLORA_CONSUMER_KEY: process.env.FLORA_CONSUMER_KEY || 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5',
    FLORA_CONSUMER_SECRET: process.env.FLORA_CONSUMER_SECRET || 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678',
  },
  // DEVELOPMENT MODE - DISABLE CACHING AND OPTIMIZATIONS
  ...(process.env.NODE_ENV === 'development' && {
    // Disable all caching in development
    onDemandEntries: {
      maxInactiveAge: 0,
      pagesBufferLength: 0,
    },
  }),
  
  // Enable SWC minification for better performance (production only)
  swcMinify: process.env.NODE_ENV === 'production',
  
  // Advanced bundle optimization (disabled in development)
  experimental: {
    ...(process.env.NODE_ENV === 'production' && {
      optimizePackageImports: [
        'lucide-react', 
        '@tanstack/react-query',
        'zustand',
        'react-dom'
      ],
      // Enable modern bundling optimizations
      optimizeServerReact: true,
      // Enable webpack build worker for faster builds
      webpackBuildWorker: true,
      // Optimize CSS handling
      optimizeCss: true,
    }),
  },
  
  // Compiler optimizations
  compiler: {
    // Remove console.logs in production
    removeConsole: process.env.NODE_ENV === 'production',
    // Remove React dev tools in production
    reactRemoveProperties: process.env.NODE_ENV === 'production',
  },
  
  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    if (!dev) {
      // Production optimizations
      config.optimization = {
        ...config.optimization,
        // More aggressive splitting
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: -10,
              chunks: 'all',
            },
            // Separate chunk for React Query
            reactQuery: {
              test: /[\\/]node_modules[\\/]@tanstack[\\/]react-query[\\/]/,
              name: 'react-query',
              chunks: 'all',
              priority: 10,
            },
            // Separate chunk for Zustand
            zustand: {
              test: /[\\/]node_modules[\\/]zustand[\\/]/,
              name: 'zustand', 
              chunks: 'all',
              priority: 10,
            }
          },
        },
      };
    }
    
    return config;
  },
  
  // Image optimization settings
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: process.env.NODE_ENV === 'development' ? 0 : 60 * 60 * 24 * 30, // No caching in dev
  },
  
  // DEVELOPMENT MODE - DISABLE ALL CACHING
  ...(process.env.NODE_ENV === 'development' && {
    headers: async () => [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
        ],
      },
    ],
  }),
  
  // Enable output optimization  
  output: 'standalone',
}

module.exports = nextConfig
