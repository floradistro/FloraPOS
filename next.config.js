/** @type {import('next').NextConfig} */
const nextConfig = {
  // Environment variables
  env: {
    WORDPRESS_URL: process.env.WORDPRESS_URL || 'https://api.floradistro.com',
    WP_USERNAME: process.env.WP_USERNAME || '',
    WP_PASSWORD: process.env.WP_PASSWORD || '',
    FLORA_CONSUMER_KEY: process.env.FLORA_CONSUMER_KEY || 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5',
    FLORA_CONSUMER_SECRET: process.env.FLORA_CONSUMER_SECRET || 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678',
    NEXT_PUBLIC_SCANDIT_LICENSE_KEY: process.env.NEXT_PUBLIC_SCANDIT_LICENSE_KEY || 'AgeGYiLhBGJdQp37D/G+XhtFawpGLLav3AK8r0IwAoMMApXCsk1i2Qx+rWZuQay0bngpEUlHu/iGVrLnuAlDUgwF/1vAeDqQcl700cwV/q+LOctTCCV41gMXguzHSYWCtgFkm/QBeLVvWMZhEWF22YRlVGCDadZjlEBbyPRS5usfZ6nhmX/EACpsY13aSkKgA2GRdvURjOTmctxY3nnHdHZT52XMUY+omUgACTZsdJuAVpqwnhdn7flykzW8cwewp1G1mQZpLosyeSmD/mhZrcpShQeieYoqbEQWIklHV90Nei7i53yeMKZv3fL+TRFJwlPjeCxX6iT6btwp7mlxFOB/IWs8fC1lBm6WGKZ9zbAiXKHXyTDizt5b1bSeYkSyIRRik09VrJ+7YxLpRC03JL9ktcmkQWhbvF4lZFk9YUJsdVihSWP+SeUWPppgXilpu1zUrwBXnMP3EmLsPgPzoTgO1i9TeN4v+lkXLqhoKZlxEvZUNBkjflx09uRzYJF3WEMrhOp0RxKtbsvMIQnclmBCKtQS3PWrd4TzL/oAQ0L0jFGSg4dVVCXQD9lJT/3qurovGYztTyJLCdfLNdN59VjuT4GNSd09HaRJqcLKyvqWLO2JJE7ct+ThEEoZ6joCLlnQYfdsk3exfrUCntGJQbg+GSVJKeX0Q3ChUFVRpDCj5vBhMqlg8tuHl5tG2puxYoZl5gdV4M8CUTL/xdW5yq477rdlORCKs4atbIRut+KXnUymRJkGfWRsbv007NVRaBjIHc/MOPxmyVjodpKKGxh4dSlquVcvSHVAHTOfkwO4lFuJE6sFYiFaVNHlncWb84SQcFAYpPZSkS7ccYM/L7HqyiFp47W6LQ78gnbmtZ925X29Zncp/WuXPsBR+J2MVRGOb964LdDHCxkuzgg1DS5g9Jg9YFq6sk+A1gc0hUxl3mGp6aJ3Pz4bDv372528FCJzTdIEWHSagtusHfEGi3RgiXQAOGGvSGqyr63OEcG6zUdloljBZ8jnJIsVvwTnu8finGuOEc9okPwIaUz5nKepYw0sbnT/8OJ4boS8YFqMfH47lnJ4MLXiJ8uUS1ITfJwWYAOnP7jzpTq/qvVaqQ5l5I5Y0owY41nvrN7xuNpQj+JtSaR8Rxdvy7WncBjGMKI9zUEfZr4y27MfEz39bYCI8WBJP0pnEHvLnlNpX1aoljS8GY/7C9ic+vi7AZHYwrI=',
  },
  // DEVELOPMENT MODE - Disable caching for better dev experience
  ...(process.env.NODE_ENV === 'development' && {
    onDemandEntries: {
      maxInactiveAge: 5 * 1000, // 5 seconds - faster refresh
      pagesBufferLength: 2, // Smaller buffer for faster updates
    },
    // Disable static optimization in development
    staticPageGenerationTimeout: 1000,
  }),
  
  // PRODUCTION MODE - ENABLE OPTIMIZATIONS
  ...(process.env.NODE_ENV === 'production' && {
    onDemandEntries: {
      maxInactiveAge: 25 * 1000, // 25 seconds
      pagesBufferLength: 5,
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
    // ENFORCE PORT 3000 POLICY IN DEVELOPMENT
    if (dev) {
      // Kill processes on common dev ports except 3000
      const { exec } = require('child_process');
      exec('lsof -ti:3001,3002,3003,3004,3005,8080,8000,5000,4000,9000 | xargs -r kill -9', (error) => {
        if (!error) console.log('🔒 Port policy enforced - only port 3000 allowed');
      });
    }
    
    // Handle Scandit and Three.js modules - exclude from server-side rendering
    if (isServer) {
      // Polyfill 'self' for server-side builds to prevent build errors
      const definePlugin = config.plugins.find(
        (plugin) => plugin.constructor.name === 'DefinePlugin'
      );
      if (definePlugin) {
        definePlugin.definitions = {
          ...definePlugin.definitions,
          'self': 'undefined',
        };
      }
      
      config.externals = config.externals || [];
      config.externals.push({
        '@scandit/web-datacapture-core': 'commonjs @scandit/web-datacapture-core',
        '@scandit/web-datacapture-id': 'commonjs @scandit/web-datacapture-id',
        '@scandit/web-datacapture-barcode': 'commonjs @scandit/web-datacapture-barcode',
        '@react-three/fiber': 'commonjs @react-three/fiber',
        '@react-three/drei': 'commonjs @react-three/drei',
        'three': 'commonjs three',
        'html2canvas': 'commonjs html2canvas',
        'jspdf': 'commonjs jspdf'
      });
    }
    
    // Exclude Scandit from webpack bundling issues
    config.resolve = config.resolve || {};
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };

    if (!dev) {
      // Production optimizations
      config.optimization = {
        ...config.optimization,
        // More aggressive splitting
        splitChunks: {
          chunks: (chunk) => {
            // Don't split server chunks - prevents 'self is not defined' errors
            return !isServer && chunk.name !== 'polyfills';
          },
          cacheGroups: {
            default: false,
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: -10,
              chunks: (chunk) => !isServer,
              reuseExistingChunk: true,
            },
            // Separate chunk for React Query (client-only)
            reactQuery: {
              test: /[\\/]node_modules[\\/]@tanstack[\\/]react-query[\\/]/,
              name: 'react-query',
              chunks: (chunk) => !isServer,
              priority: 10,
            },
            // Separate chunk for Zustand (client-only)
            zustand: {
              test: /[\\/]node_modules[\\/]zustand[\\/]/,
              name: 'zustand', 
              chunks: (chunk) => !isServer,
              priority: 10,
            },
            // Separate chunk for Scandit (client-side only)
            scandit: {
              test: /[\\/]node_modules[\\/]@scandit[\\/]/,
              name: 'scandit',
              chunks: (chunk) => !isServer,
              priority: 15,
            },
            // Separate chunk for Three.js (client-side only)
            threejs: {
              test: /[\\/]node_modules[\\/](three|@react-three)[\\/]/,
              name: 'threejs',
              chunks: (chunk) => !isServer,
              priority: 15,
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
    minimumCacheTTL: 60 * 60 * 24 * 7, // 1 week caching for images
  },
  
  // SMART CACHING - Disable in development, enable in production
  headers: async () => {
    const isDev = process.env.NODE_ENV === 'development';
    
    if (isDev) {
      // Development: Disable all caching
      return [
        {
          source: '/:path*',
          headers: [
            {
              key: 'Cache-Control',
              value: 'no-cache, no-store, must-revalidate, max-age=0',
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
      ];
    }
    
    // Production: Enable smart caching
    return [
      {
        source: '/api/proxy/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=600', // 5min client, 10min CDN
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable', // 1 year for static assets
          },
        ],
      },
      {
        source: '/scandit/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600', // 1 hour for Scandit assets
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },
  
  // Enable output optimization  
  output: 'standalone',
}

module.exports = nextConfig
