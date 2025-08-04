'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

/**
 * Hook for refreshing cached data after inventory-changing operations
 */
export function useDataRefresh() {
  const queryClient = useQueryClient()

  const refreshAllData = useCallback(async () => {
    console.log('🔄 Refreshing all cached data...')
    
    // Invalidate all product and inventory data
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['all-products-preload'] }),
      queryClient.invalidateQueries({ queryKey: ['products'] }),
      queryClient.invalidateQueries({ queryKey: ['customers-preload'] }),
      queryClient.invalidateQueries({ queryKey: ['customers'] }),
      queryClient.invalidateQueries({ queryKey: ['orders-preload'] }),
      queryClient.invalidateQueries({ queryKey: ['orders'] }),
      queryClient.invalidateQueries({ queryKey: ['virtual-inventory'] }),
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    ])
    
    console.log('✅ All cached data refreshed')
  }, [queryClient])

  const refreshProducts = useCallback(async () => {
    console.log('🔄 Refreshing product data...')
    
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['all-products-preload'] }),
      queryClient.invalidateQueries({ queryKey: ['products'] }),
      queryClient.invalidateQueries({ queryKey: ['virtual-inventory'] })
    ])
    
    console.log('✅ Product data refreshed')
  }, [queryClient])

  const refreshCustomers = useCallback(async () => {
    console.log('🔄 Refreshing customer data...')
    
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['customers-preload'] }),
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    ])
    
    console.log('✅ Customer data refreshed')
  }, [queryClient])

  const refreshOrders = useCallback(async () => {
    console.log('🔄 Refreshing orders data...')
    
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['orders-preload'] }),
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    ])
    
    console.log('✅ Orders data refreshed')
  }, [queryClient])

  const refreshInventory = useCallback(async () => {
    console.log('🔄 Refreshing inventory data...')
    
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['all-products-preload'] }),
      queryClient.invalidateQueries({ queryKey: ['products'] }),
      queryClient.invalidateQueries({ queryKey: ['virtual-inventory'] }),
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    ])
    
    console.log('✅ Inventory data refreshed')
  }, [queryClient])

  return {
    refreshAllData,
    refreshProducts,
    refreshCustomers,
    refreshOrders,
    refreshInventory
  }
}