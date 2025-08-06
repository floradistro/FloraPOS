'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { PERFORMANCE_CONFIG } from '@/config/performance'
import { performanceMonitor, performanceUtils } from '@/config/performance'

/**
 * Hook for managing memory usage and cleanup in the POS application
 */
export function useMemoryOptimization() {
  const queryClient = useQueryClient()
  const cleanupTimerRef = useRef<NodeJS.Timeout>()
  const memoryCheckIntervalRef = useRef<NodeJS.Timeout>()

  // Monitor memory usage and trigger cleanup when needed
  const checkMemoryUsage = useCallback(() => {
    const memoryInfo = performanceMonitor.getMemoryUsage()
    
    if (memoryInfo) {
      const usedMB = memoryInfo.used / (1024 * 1024)
      const limitMB = memoryInfo.limit / (1024 * 1024)
      const usagePercentage = (usedMB / limitMB) * 100

      console.log(`💾 Memory usage: ${usedMB.toFixed(1)}MB / ${limitMB.toFixed(1)}MB (${usagePercentage.toFixed(1)}%)`)

      // Trigger cleanup if memory usage is high
      if (usedMB > PERFORMANCE_CONFIG.MEMORY.MEMORY_THRESHOLD_MB || usagePercentage > 80) {
        console.log('🧹 High memory usage detected, triggering cleanup...')
        performMemoryCleanup()
      }
    }
  }, [])

  // Perform memory cleanup
  const performMemoryCleanup = useCallback(() => {
    const cache = queryClient.getQueryCache()
    const queries = cache.getAll()

    // Remove stale queries beyond the limit
    const staleQueries = queries
      .filter(query => query.isStale())
      .sort((a, b) => (a.state.dataUpdatedAt || 0) - (b.state.dataUpdatedAt || 0))

    if (staleQueries.length > PERFORMANCE_CONFIG.MEMORY.MAX_CACHED_ITEMS) {
      const queriesToRemove = staleQueries.slice(0, staleQueries.length - PERFORMANCE_CONFIG.MEMORY.MAX_CACHED_ITEMS)
      
      queriesToRemove.forEach(query => {
        queryClient.removeQueries({ queryKey: query.queryKey })
      })

      console.log(`🗑️ Removed ${queriesToRemove.length} stale queries from cache`)
    }

    // Force garbage collection if available
    performanceUtils.cleanupResources()

    console.log('✅ Memory cleanup completed')
  }, [queryClient])

  // Debounced cleanup function to avoid excessive cleanup calls
  const debouncedCleanup = useCallback(
    performanceUtils.debounce(performMemoryCleanup, 1000),
    [performMemoryCleanup]
  )

  // Setup memory monitoring
  useEffect(() => {
    // Start memory monitoring interval
    memoryCheckIntervalRef.current = setInterval(
      checkMemoryUsage,
      PERFORMANCE_CONFIG.MEMORY.CLEANUP_INTERVAL_MS
    )

    // Setup periodic cleanup
    cleanupTimerRef.current = setInterval(
      debouncedCleanup,
      PERFORMANCE_CONFIG.MEMORY.CLEANUP_INTERVAL_MS * 2 // Less frequent than memory checks
    )

    // Cleanup on visibility change (user switches tabs)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User switched away, good time to cleanup
        setTimeout(debouncedCleanup, 1000)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup on page unload
    const handleBeforeUnload = () => {
      performMemoryCleanup()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      if (cleanupTimerRef.current) {
        clearInterval(cleanupTimerRef.current)
      }
      if (memoryCheckIntervalRef.current) {
        clearInterval(memoryCheckIntervalRef.current)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [checkMemoryUsage, debouncedCleanup])

  // Manual cleanup trigger
  const triggerCleanup = useCallback(() => {
    performMemoryCleanup()
  }, [performMemoryCleanup])

  // Get current memory stats
  const getMemoryStats = useCallback(() => {
    const cache = queryClient.getQueryCache()
    const queries = cache.getAll()
    const memoryInfo = performanceMonitor.getMemoryUsage()

    return {
      totalQueries: queries.length,
      staleQueries: queries.filter(q => q.isStale()).length,
      activeQueries: queries.filter(q => q.getObserversCount() > 0).length,
      memoryUsage: memoryInfo ? {
        used: Math.round(memoryInfo.used / (1024 * 1024)), // MB
        total: Math.round(memoryInfo.total / (1024 * 1024)), // MB
        limit: Math.round(memoryInfo.limit / (1024 * 1024)), // MB
        percentage: Math.round((memoryInfo.used / memoryInfo.limit) * 100)
      } : null
    }
  }, [queryClient])

  return {
    triggerCleanup,
    getMemoryStats,
    performMemoryCleanup
  }
}

/**
 * Hook for optimizing component rendering performance
 */
export function useRenderOptimization(componentName: string) {
  const renderCountRef = useRef(0)
  const startTimeRef = useRef<number>()

  useEffect(() => {
    renderCountRef.current += 1
    startTimeRef.current = performance.now()

    performanceMonitor.mark(`${componentName}-render-start`)

    return () => {
      if (startTimeRef.current) {
        const renderTime = performance.now() - startTimeRef.current
        performanceMonitor.logMetrics(`${componentName}-render`, renderTime)

        // Log excessive render warnings
        if (renderCountRef.current > 10) {
          console.warn(`⚠️ ${componentName} has rendered ${renderCountRef.current} times`)
        }

        if (renderTime > 100) {
          console.warn(`⚠️ ${componentName} took ${renderTime.toFixed(2)}ms to render`)
        }
      }
    }
  })

  return {
    renderCount: renderCountRef.current
  }
}

/**
 * Hook for managing intersection observer for lazy loading
 */
export function useIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
) {
  const observerRef = useRef<IntersectionObserver>()
  const elementsRef = useRef<Set<Element>>(new Set())

  const observe = useCallback((element: Element) => {
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(callback, {
        threshold: PERFORMANCE_CONFIG.LAZY_LOADING.INTERSECTION_THRESHOLD,
        rootMargin: PERFORMANCE_CONFIG.LAZY_LOADING.INTERSECTION_ROOT_MARGIN,
        ...options
      })
    }

    observerRef.current.observe(element)
    elementsRef.current.add(element)
  }, [callback, options])

  const unobserve = useCallback((element: Element) => {
    if (observerRef.current) {
      observerRef.current.unobserve(element)
      elementsRef.current.delete(element)
    }
  }, [])

  const disconnect = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
      elementsRef.current.clear()
    }
  }, [])

  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    observe,
    unobserve,
    disconnect
  }
}