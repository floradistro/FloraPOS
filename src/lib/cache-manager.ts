'use client'

import { QueryClient } from '@tanstack/react-query'
import { PERFORMANCE_CONFIG } from '@/config/performance'

/**
 * Centralized cache key management system
 * Provides consistent cache key generation and dependency tracking
 */
export class CacheKeyManager {
  // Base cache keys with proper scoping
  static readonly PRODUCTS = 'products'
  static readonly CUSTOMERS = 'customers'  
  static readonly ORDERS = 'orders'
  static readonly INVENTORY = 'inventory'
  static readonly TAX_RATES = 'tax-rates'
  static readonly VIRTUAL_INVENTORY = 'virtual-inventory'
  static readonly ACF_FIELDS = 'acf-fields'

  /**
   * Generate scoped cache key for products
   */
  static products(storeId?: string, categoryId?: string | number, options?: {
    search?: string
    page?: number
    status?: string
  }): string[] {
    const key = [this.PRODUCTS]
    
    if (storeId) key.push(`store:${storeId}`)
    if (categoryId) key.push(`category:${categoryId}`)
    if (options?.search) key.push(`search:${options.search}`)
    if (options?.page) key.push(`page:${options.page}`)
    if (options?.status) key.push(`status:${options.status}`)
    
    return key
  }

  /**
   * Generate scoped cache key for customers
   */
  static customers(storeId?: string, options?: {
    search?: string
    page?: number
  }): string[] {
    const key = [this.CUSTOMERS]
    
    if (storeId) key.push(`store:${storeId}`)
    if (options?.search) key.push(`search:${options.search}`)
    if (options?.page) key.push(`page:${options.page}`)
    
    return key
  }

  /**
   * Generate scoped cache key for orders
   */
  static orders(storeId?: string, options?: {
    status?: string
    dateFrom?: string
    dateTo?: string
    payment?: string
    search?: string
    page?: number
  }): string[] {
    const key = [this.ORDERS]
    
    if (storeId) key.push(`store:${storeId}`)
    if (options?.status && options.status !== 'all') key.push(`status:${options.status}`)
    if (options?.dateFrom) key.push(`from:${options.dateFrom}`)
    if (options?.dateTo) key.push(`to:${options.dateTo}`)
    if (options?.payment && options.payment !== 'all') key.push(`payment:${options.payment}`)
    if (options?.search) key.push(`search:${options.search}`)
    if (options?.page) key.push(`page:${options.page}`)
    
    return key
  }

  /**
   * Generate scoped cache key for inventory
   */
  static inventory(storeId?: string, productId?: string | number): string[] {
    const key = [this.INVENTORY]
    
    if (storeId) key.push(`store:${storeId}`)
    if (productId) key.push(`product:${productId}`)
    
    return key
  }

  /**
   * Generate scoped cache key for tax rates
   */
  static taxRates(storeId: string): string[] {
    return [this.TAX_RATES, `store:${storeId}`]
  }

  /**
   * Generate scoped cache key for ACF fields
   */
  static acfFields(productId: number): string[] {
    return [this.ACF_FIELDS, `product:${productId}`]
  }

  /**
   * Get all cache keys that should be invalidated when a product changes
   */
  static getProductDependencies(storeId?: string, productId?: string | number): string[][] {
    const dependencies: string[][] = []
    
    // Invalidate all product queries for the store
    dependencies.push([this.PRODUCTS])
    if (storeId) {
      dependencies.push([this.PRODUCTS, `store:${storeId}`])
    }
    
    // Invalidate inventory
    dependencies.push([this.INVENTORY])
    if (storeId) {
      dependencies.push([this.INVENTORY, `store:${storeId}`])
    }
    if (productId) {
      dependencies.push([this.INVENTORY, `product:${productId}`])
    }
    
    // Invalidate virtual inventory
    dependencies.push([this.VIRTUAL_INVENTORY])
    
    return dependencies
  }

  /**
   * Get all cache keys that should be invalidated when an order changes
   */
  static getOrderDependencies(storeId?: string): string[][] {
    const dependencies: string[][] = []
    
    // Invalidate all order queries
    dependencies.push([this.ORDERS])
    if (storeId) {
      dependencies.push([this.ORDERS, `store:${storeId}`])
    }
    
    // Orders might affect inventory
    dependencies.push(...this.getProductDependencies(storeId))
    
    return dependencies
  }
}

/**
 * Advanced cache management with intelligent invalidation
 */
export class SmartCacheManager {
  private queryClient: QueryClient
  private invalidationQueue: Set<string> = new Set()
  private batchTimeout: NodeJS.Timeout | null = null

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient
  }

  /**
   * Intelligently invalidate cache based on data dependencies
   */
  async invalidateByDependency(type: 'product' | 'order' | 'customer' | 'inventory', context?: {
    storeId?: string
    productId?: string | number
    customerId?: string | number
  }) {
    let dependencies: string[][] = []

    switch (type) {
      case 'product':
        dependencies = CacheKeyManager.getProductDependencies(context?.storeId, context?.productId)
        break
      case 'order':
        dependencies = CacheKeyManager.getOrderDependencies(context?.storeId)
        break
      case 'customer':
        dependencies = [[CacheKeyManager.CUSTOMERS]]
        if (context?.storeId) {
          dependencies.push([CacheKeyManager.CUSTOMERS, `store:${context.storeId}`])
        }
        break
      case 'inventory':
        dependencies = CacheKeyManager.getProductDependencies(context?.storeId, context?.productId)
        break
    }

    // Batch invalidations to avoid excessive re-renders
    dependencies.forEach(dep => {
      this.queueInvalidation(dep.join(':'))
    })

    this.processBatchedInvalidations()
  }

  /**
   * Queue invalidation for batching
   */
  private queueInvalidation(keyPattern: string) {
    this.invalidationQueue.add(keyPattern)

    // Clear existing timeout and set new one
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
    }

    this.batchTimeout = setTimeout(() => {
      this.processBatchedInvalidations()
    }, 100) // 100ms batch window
  }

  /**
   * Process all queued invalidations in a batch
   */
  private async processBatchedInvalidations() {
    if (this.invalidationQueue.size === 0) return

    const patterns = Array.from(this.invalidationQueue)
    this.invalidationQueue.clear()
    
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
      this.batchTimeout = null
    }

    console.log('🔄 Batch invalidating cache patterns:', patterns)

    // Convert patterns back to query key arrays and invalidate
    const invalidationPromises = patterns.map(pattern => {
      const keyParts = pattern.split(':')
      return this.queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey as string[]
          return keyParts.every((part, index) => 
            queryKey[index] === part || part.startsWith('store:') || part.startsWith('product:')
          )
        }
      })
    })

    await Promise.all(invalidationPromises)
    console.log('✅ Batch cache invalidation complete')
  }

  /**
   * Preload critical data based on context
   */
  async preloadCriticalData(context: {
    storeId: string
    userId?: string
    currentCategory?: string | number
  }) {
    const { storeId, currentCategory } = context

    // Only preload essential data
    const preloadPromises: Promise<any>[] = []

    // 1. Preload current category products (not all)
    if (currentCategory) {
      preloadPromises.push(
        this.queryClient.prefetchQuery({
          queryKey: CacheKeyManager.products(storeId, currentCategory, { status: 'in_stock' }),
          queryFn: async () => {
            // This would be implemented by the specific API call
            return null
          },
          staleTime: PERFORMANCE_CONFIG.CACHE.PRODUCTS_STALE_TIME
        })
      )
    }

    // 2. Preload tax rates (lightweight and frequently used)
    preloadPromises.push(
      this.queryClient.prefetchQuery({
        queryKey: CacheKeyManager.taxRates(storeId),
        queryFn: async () => {
          const response = await fetch(`/api/tax-rates/${storeId}`)
          return response.json()
        },
        staleTime: 30 * 60 * 1000 // 30 minutes
      })
    )

    await Promise.all(preloadPromises)
    console.log('✅ Critical data preloaded')
  }

  /**
   * Background prefetch of likely-needed data
   */
  async backgroundPrefetch(context: {
    storeId: string
    currentCategory?: string | number
    recentlyViewedProducts?: number[]
  }) {
    const { storeId, currentCategory, recentlyViewedProducts } = context

    // Use requestIdleCallback for non-critical prefetching
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        this.performBackgroundPrefetch(storeId, currentCategory, recentlyViewedProducts)
      })
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        this.performBackgroundPrefetch(storeId, currentCategory, recentlyViewedProducts)
      }, 2000)
    }
  }

  private async performBackgroundPrefetch(
    storeId: string, 
    currentCategory?: string | number,
    recentlyViewedProducts?: number[]
  ) {
    const prefetchPromises: Promise<any>[] = []

    // Prefetch adjacent categories (common user behavior)
    if (currentCategory) {
      const adjacentCategories = this.getAdjacentCategories(currentCategory)
      adjacentCategories.forEach(categoryId => {
        prefetchPromises.push(
          this.queryClient.prefetchQuery({
            queryKey: CacheKeyManager.products(storeId, categoryId, { 
              status: 'in_stock',
              page: 1 
            }),
            queryFn: async () => null, // Would be implemented
            staleTime: PERFORMANCE_CONFIG.CACHE.PRODUCTS_STALE_TIME
          })
        )
      })
    }

    // Prefetch ACF fields for recently viewed products
    if (recentlyViewedProducts?.length) {
      recentlyViewedProducts.slice(0, 5).forEach(productId => {
        prefetchPromises.push(
          this.queryClient.prefetchQuery({
            queryKey: CacheKeyManager.acfFields(productId),
            queryFn: async () => {
              const response = await fetch(`/api/products/${productId}/acf`)
              return response.json()
            },
            staleTime: 10 * 60 * 1000 // 10 minutes
          })
        )
      })
    }

    await Promise.all(prefetchPromises)
    console.log('🔮 Background prefetch complete')
  }

  /**
   * Get adjacent categories for prefetching
   */
  private getAdjacentCategories(currentCategory: string | number): number[] {
    const categoryMap: Record<string | number, number[]> = {
      25: [19, 21], // Flower -> Vapes, Edibles
      19: [25, 22], // Vapes -> Flower, Concentrates  
      21: [25, 22], // Edibles -> Flower, Concentrates
      22: [19, 21], // Concentrates -> Vapes, Edibles
      16: [25], // Moonwater -> Flower
    }

    return categoryMap[currentCategory] || []
  }

  /**
   * Clean up stale cache entries
   */
  cleanup() {
    // Clear batch timeout
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
      this.batchTimeout = null
    }

    // Clear invalidation queue
    this.invalidationQueue.clear()

    // Garbage collect old cache entries
    this.queryClient.getQueryCache().clear()
  }
}

// Export singleton instance
let smartCacheManager: SmartCacheManager | null = null

export function getSmartCacheManager(queryClient: QueryClient): SmartCacheManager {
  if (!smartCacheManager) {
    smartCacheManager = new SmartCacheManager(queryClient)
  }
  return smartCacheManager
}