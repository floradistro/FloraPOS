'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { getSmartCacheManager } from '@/lib/cache-manager'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Hook for refreshing cached data after inventory-changing operations
 * Now uses intelligent cache invalidation
 */
export function useDataRefresh() {
  const queryClient = useQueryClient()
  const smartCache = getSmartCacheManager(queryClient)
  const { store } = useAuth()

  const refreshAllData = useCallback(async () => {
    console.log('🔄 Refreshing all cached data...')
    
    // Use smart cache invalidation for all data types
    await Promise.all([
      smartCache.invalidateByDependency('product', { storeId: store?.id }),
      smartCache.invalidateByDependency('order', { storeId: store?.id }),
      smartCache.invalidateByDependency('customer', { storeId: store?.id }),
      smartCache.invalidateByDependency('inventory', { storeId: store?.id })
    ])
    
    console.log('✅ All cached data refreshed')
  }, [queryClient, smartCache, store?.id])

  const refreshProducts = useCallback(async (productId?: number) => {
    console.log('🔄 Refreshing product data...')
    
    await smartCache.invalidateByDependency('product', { 
      storeId: store?.id,
      productId 
    })
    
    console.log('✅ Product data refreshed')
  }, [smartCache, store?.id])

  const refreshCustomers = useCallback(async (customerId?: number) => {
    console.log('🔄 Refreshing customer data...')
    
    await smartCache.invalidateByDependency('customer', { 
      storeId: store?.id,
      customerId 
    })
    
    console.log('✅ Customer data refreshed')
  }, [smartCache, store?.id])

  const refreshOrders = useCallback(async () => {
    console.log('🔄 Refreshing orders data...')
    
    await smartCache.invalidateByDependency('order', { storeId: store?.id })
    
    console.log('✅ Orders data refreshed')
  }, [smartCache, store?.id])

  const refreshInventory = useCallback(async (productId?: number) => {
    console.log('🔄 Refreshing inventory data...')
    
    await smartCache.invalidateByDependency('inventory', { 
      storeId: store?.id,
      productId 
    })
    
    console.log('✅ Inventory data refreshed')
  }, [smartCache, store?.id])

  return {
    refreshAllData,
    refreshProducts,
    refreshCustomers,
    refreshOrders,
    refreshInventory
  }
}