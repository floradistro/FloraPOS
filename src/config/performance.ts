// Performance optimization configuration
export const PERFORMANCE_CONFIG = {
  // Pagination settings
  PAGINATION: {
    PRODUCTS_PER_PAGE: 20,
    ORDERS_PER_PAGE: 25,
    CUSTOMERS_PER_PAGE: 20,
    SEARCH_DEBOUNCE_MS: 300,
  },

  // Virtualization settings
  VIRTUALIZATION: {
    CUSTOMER_ITEM_HEIGHT: 120,
    PRODUCT_ITEM_HEIGHT: 200,
    ORDER_ITEM_HEIGHT: 80,
    OVERSCAN_COUNT: 5,
    LOAD_MORE_THRESHOLD: 3, // Items from bottom to trigger load more
  },

  // Cache settings
  CACHE: {
    PRODUCTS_STALE_TIME: 2 * 60 * 1000, // 2 minutes
    PRODUCTS_GC_TIME: 5 * 60 * 1000, // 5 minutes
    CUSTOMERS_STALE_TIME: 5 * 60 * 1000, // 5 minutes
    CUSTOMERS_GC_TIME: 10 * 60 * 1000, // 10 minutes
    ORDERS_STALE_TIME: 1 * 60 * 1000, // 1 minute
    ORDERS_GC_TIME: 3 * 60 * 1000, // 3 minutes
  },

  // Lazy loading settings
  LAZY_LOADING: {
    INTERSECTION_THRESHOLD: 0.1,
    INTERSECTION_ROOT_MARGIN: '100px',
    PRELOAD_DELAY_MS: 2000,
  },

  // Code splitting thresholds
  CODE_SPLITTING: {
    MIN_CHUNK_SIZE: 20000, // 20KB
    MAX_CHUNK_SIZE: 244000, // 244KB
    PRIORITY_CHUNKS: ['main', 'vendor', 'runtime'],
  },

  // Image optimization
  IMAGES: {
    LAZY_LOADING: true,
    BLUR_PLACEHOLDER: true,
    QUALITY: 75,
    FORMATS: ['webp', 'avif'],
  },

  // Bundle optimization
  BUNDLE: {
    TREE_SHAKING: true,
    MINIFICATION: true,
    COMPRESSION: true,
    SOURCE_MAPS: false, // Disable in production
  },

  // Memory management
  MEMORY: {
    MAX_CACHED_ITEMS: 1000,
    CLEANUP_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes
    MEMORY_THRESHOLD_MB: 100,
  },

  // Network optimization
  NETWORK: {
    RETRY_COUNT: 2,
    TIMEOUT_MS: 10000, // 10 seconds
    CONCURRENT_REQUESTS: 6,
    REQUEST_DEBOUNCE_MS: 100,
  }
} as const

// Performance monitoring utilities
export const performanceMonitor = {
  // Mark performance milestones
  mark: (name: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark(name)
    }
  },

  // Measure performance between marks
  measure: (name: string, startMark: string, endMark?: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      try {
        window.performance.measure(name, startMark, endMark)
        const measure = window.performance.getEntriesByName(name, 'measure')[0]
        return measure?.duration || 0
      } catch (error) {
        console.warn('Performance measurement failed:', error)
        return 0
      }
    }
    return 0
  },

  // Get memory usage (if available)
  getMemoryUsage: () => {
    if (typeof window !== 'undefined' && 'memory' in window.performance) {
      const memory = (window.performance as any).memory
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      }
    }
    return null
  },

  // Log performance metrics
  logMetrics: (componentName: string, duration: number) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚡ ${componentName}: ${duration.toFixed(2)}ms`)
    }
  }
}

// Utility functions for performance optimization
export const performanceUtils = {
  // Debounce function
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  },

  // Throttle function
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  },

  // Check if device is low-end
  isLowEndDevice: (): boolean => {
    if (typeof navigator === 'undefined') return false
    
    // Check for device memory
    if ('deviceMemory' in navigator) {
      return (navigator as any).deviceMemory < 4 // Less than 4GB RAM
    }
    
    // Check for hardware concurrency (CPU cores)
    if ('hardwareConcurrency' in navigator) {
      return navigator.hardwareConcurrency < 4 // Less than 4 cores
    }
    
    return false
  },

  // Get optimal chunk size based on device capabilities
  getOptimalChunkSize: (): number => {
    const isLowEnd = performanceUtils.isLowEndDevice()
    return isLowEnd 
      ? PERFORMANCE_CONFIG.PAGINATION.PRODUCTS_PER_PAGE / 2 
      : PERFORMANCE_CONFIG.PAGINATION.PRODUCTS_PER_PAGE
  },

  // Preload critical resources
  preloadResource: (href: string, as: string) => {
    if (typeof document !== 'undefined') {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = href
      link.as = as
      document.head.appendChild(link)
    }
  },

  // Clean up unused resources
  cleanupResources: () => {
    if (typeof window !== 'undefined' && window.gc) {
      // Force garbage collection if available (Chrome DevTools)
      window.gc()
    }
  }
}

// Export performance hooks for React components
export const usePerformanceMonitoring = (componentName: string) => {
  const startTime = React.useRef<number>()
  
  React.useEffect(() => {
    startTime.current = performance.now()
    performanceMonitor.mark(`${componentName}-start`)
    
    return () => {
      if (startTime.current) {
        const duration = performance.now() - startTime.current
        performanceMonitor.logMetrics(componentName, duration)
      }
    }
  }, [componentName])
}

import React from 'react'