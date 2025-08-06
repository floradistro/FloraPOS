'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { useCallback, useEffect, useRef } from 'react'
import { CacheKeyManager, getSmartCacheManager } from '@/lib/cache-manager'
import { PERFORMANCE_CONFIG } from '@/config/performance'
import { floraAPI } from '@/lib/woocommerce'

interface PreloadingOptions {
  enableBackgroundPrefetch?: boolean
  preloadAdjacentCategories?: boolean
  maxPreloadItems?: number
}

/**
 * Optimized preloading hook that loads only necessary data
 * Replaces the aggressive preloading in AppWrapper
 */
export function useOptimizedPreloading(
  currentCategory?: string | number,
  options: PreloadingOptions = {}
) {
  const { isAuthenticated, store } = useAuth()
  const queryClient = useQueryClient()
  const smartCache = getSmartCacheManager(queryClient)
  const preloadedRef = useRef<Set<string>>(new Set())
  
  const {
    enableBackgroundPrefetch = true,
    preloadAdjacentCategories = true,
    maxPreloadItems = PERFORMANCE_CONFIG.PAGINATION.PRODUCTS_PER_PAGE
  } = options

  // Preload current category products (essential data only)
  const { isLoading: currentCategoryLoading } = useQuery({
    queryKey: CacheKeyManager.products(store?.id, currentCategory, { 
      status: 'in_stock',
      page: 1
    }),
    queryFn: async () => {
      if (!store?.id) return { products: [], total: 0 }
      
      const result = await floraAPI.getProductsComprehensive({
        storeId: store.id,
        category: currentCategory?.toString(),
        per_page: maxPreloadItems,
        page: 1,
        stock_status: 'in_stock'
      })

      return {
        products: result.products,
        total: result.total,
        hasMore: result.hasMore
      }
    },
    enabled: !!store?.id && isAuthenticated && !!currentCategory,
    staleTime: PERFORMANCE_CONFIG.CACHE.PRODUCTS_STALE_TIME,
    gcTime: PERFORMANCE_CONFIG.CACHE.PRODUCTS_GC_TIME,
  })

  // Preload tax rates (lightweight and frequently used)
  const { isLoading: taxRatesLoading } = useQuery({
    queryKey: CacheKeyManager.taxRates(store?.id || ''),
    queryFn: async () => {
      if (!store?.id) return null
      
      const response = await fetch(`/api/tax-rates/${store.id}`)
      if (!response.ok) throw new Error('Failed to fetch tax rates')
      return response.json()
    },
    enabled: !!store?.id && isAuthenticated,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  })

  // Background prefetching of adjacent categories
  useEffect(() => {
    if (!enableBackgroundPrefetch || !store?.id || !isAuthenticated || !currentCategory) {
      return
    }

    const prefetchKey = `${store.id}-${currentCategory}`
    if (preloadedRef.current.has(prefetchKey)) {
      return
    }

    // Mark as prefetched to avoid duplicates
    preloadedRef.current.add(prefetchKey)

    // Delay background prefetching to not interfere with critical rendering
    const timer = setTimeout(() => {
      if (preloadAdjacentCategories) {
        smartCache.backgroundPrefetch({
          storeId: store.id,
          currentCategory,
          recentlyViewedProducts: getRecentlyViewedProducts()
        })
      }
    }, PERFORMANCE_CONFIG.LAZY_LOADING.PRELOAD_DELAY_MS)

    return () => clearTimeout(timer)
  }, [store?.id, currentCategory, isAuthenticated, enableBackgroundPrefetch, preloadAdjacentCategories, smartCache])

  // Preload critical app data on authentication
  const preloadCriticalData = useCallback(async () => {
    if (!store?.id || !isAuthenticated) return

    try {
      await smartCache.preloadCriticalData({
        storeId: store.id,
        currentCategory
      })
    } catch (error) {
      console.warn('Failed to preload critical data:', error)
    }
  }, [store?.id, isAuthenticated, currentCategory, smartCache])

  // Trigger critical data preload on auth
  useEffect(() => {
    if (isAuthenticated && store?.id) {
      preloadCriticalData()
    }
  }, [isAuthenticated, store?.id, preloadCriticalData])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      preloadedRef.current.clear()
    }
  }, [])

  return {
    isLoading: currentCategoryLoading || taxRatesLoading,
    preloadCriticalData,
    isPreloadingComplete: !currentCategoryLoading && !taxRatesLoading
  }
}

/**
 * Hook for managing recently viewed products (for intelligent prefetching)
 */
export function useRecentlyViewedProducts() {
  const addRecentlyViewed = useCallback((productId: number) => {
    if (typeof window === 'undefined') return

    const key = 'flora_recently_viewed_products'
    const existing = JSON.parse(localStorage.getItem(key) || '[]') as number[]
    
    // Add to front, remove duplicates, limit to 10
    const updated = [productId, ...existing.filter(id => id !== productId)].slice(0, 10)
    
    localStorage.setItem(key, JSON.stringify(updated))
  }, [])

  const getRecentlyViewed = useCallback((): number[] => {
    if (typeof window === 'undefined') return []
    
    const key = 'flora_recently_viewed_products'
    return JSON.parse(localStorage.getItem(key) || '[]') as number[]
  }, [])

  const clearRecentlyViewed = useCallback(() => {
    if (typeof window === 'undefined') return
    
    const key = 'flora_recently_viewed_products'
    localStorage.removeItem(key)
  }, [])

  return {
    addRecentlyViewed,
    getRecentlyViewed,
    clearRecentlyViewed
  }
}

// Utility function to get recently viewed products
function getRecentlyViewedProducts(): number[] {
  if (typeof window === 'undefined') return []
  
  const key = 'flora_recently_viewed_products'
  return JSON.parse(localStorage.getItem(key) || '[]') as number[]
}

/**
 * Hook for intelligent data loading based on user behavior
 */
export function useSmartDataLoading() {
  const queryClient = useQueryClient()
  const smartCache = getSmartCacheManager(queryClient)
  const { store } = useAuth()

  const invalidateProductData = useCallback(async (productId?: number) => {
    await smartCache.invalidateByDependency('product', {
      storeId: store?.id,
      productId
    })
  }, [smartCache, store?.id])

  const invalidateOrderData = useCallback(async () => {
    await smartCache.invalidateByDependency('order', {
      storeId: store?.id
    })
  }, [smartCache, store?.id])

  const invalidateCustomerData = useCallback(async (customerId?: number) => {
    await smartCache.invalidateByDependency('customer', {
      storeId: store?.id,
      customerId
    })
  }, [smartCache, store?.id])

  const invalidateInventoryData = useCallback(async (productId?: number) => {
    await smartCache.invalidateByDependency('inventory', {
      storeId: store?.id,
      productId
    })
  }, [smartCache, store?.id])

  return {
    invalidateProductData,
    invalidateOrderData,
    invalidateCustomerData,
    invalidateInventoryData
  }
}