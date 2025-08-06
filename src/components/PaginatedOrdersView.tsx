'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'
import SiriGlowBorder from './SiriGlowBorder'
import { usePaginatedData } from '../hooks/usePaginatedData'

interface Order {
  id: number
  number: string
  date_created: string
  status: string
  total: string
  currency: string
  payment_method?: string
  payment_method_title?: string
  billing: {
    first_name: string
    last_name: string
    email: string
    phone: string
  }
  line_items: Array<{
    id: number
    name: string
    quantity: number
    total: string
  }>
}

interface PaginatedOrdersViewProps {
  statusFilter?: string
  dateFrom?: string
  dateTo?: string
  paymentFilter?: string
  searchQuery?: string
}

const fetchOrders = async (page: number, pageSize: number, filters: any, storeId?: string, token?: string) => {
  // Build query parameters
  const params = new URLSearchParams({
    store_id: storeId || 'default', // Use the store ID from context or default
    page: page.toString(),
    per_page: pageSize.toString(),
    status: (!filters.statusFilter || filters.statusFilter === '' || filters.statusFilter === 'all') ? 'any' : filters.statusFilter, // Default to 'any' to get all orders
    search: filters.searchQuery || '',
    after: filters.dateFrom || '',
    before: filters.dateTo || '',
    payment_method: filters.paymentFilter === 'all' ? '' : (filters.paymentFilter || '')
  })
  
  // Remove empty parameters except status
  Array.from(params.entries()).forEach(([key, value]) => {
    if (key !== 'status' && (!value || value === '' || value === 'all')) {
      params.delete(key)
    }
  })
  
  // Get token from localStorage or cookie if not provided
  // Using bypass token temporarily for testing
  const authToken = token || localStorage.getItem('flora_auth_token') || 'flora-pos-bypass-token'
  
  const response = await fetch(`/api/orders?${params.toString()}`, {
    headers: {
      'Authorization': authToken ? `Bearer ${authToken}` : '',
      'Content-Type': 'application/json'
    },
    credentials: 'include' // Include cookies
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch orders' }))
    throw new Error(error.error || 'Failed to fetch orders')
  }
  
  const data = await response.json()
  
  console.log('📊 Orders API Response:', {
    isArray: Array.isArray(data),
    dataLength: Array.isArray(data) ? data.length : 'not array',
    firstItem: data?.[0] || data?.orders?.[0] || 'no items'
  })
  
  // The API returns an array directly, not wrapped in an object
  const items = Array.isArray(data) ? data : (data.orders || [])
  const total = items.length
  const hasMore = items.length >= pageSize // If we got a full page, there might be more
  
  console.log('✅ Returning orders:', { itemsCount: items.length, total, hasMore })
  
  return {
    items,
    total,
    hasMore
  }
}

export function PaginatedOrdersView({ 
  statusFilter = '', 
  dateFrom = '', 
  dateTo = '', 
  paymentFilter = '',
  searchQuery = ''
}: PaginatedOrdersViewProps) {
  const { user, store } = useAuth()
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set())
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Use Charlotte Monroe (30) as default store for testing
  const effectiveStoreId = store?.id || '30' // Using Charlotte Monroe as default
  
  console.log('🔍 PaginatedOrdersView - Store:', store)
  console.log('🔍 PaginatedOrdersView - User:', user)
  console.log('🔍 PaginatedOrdersView - Using store ID:', effectiveStoreId)

  // Fetch function for paginated orders
  const fetchOrdersData = useCallback(async (page: number, pageSize: number) => {
    console.log('📥 Fetching orders with store ID:', effectiveStoreId)
    return fetchOrders(page, pageSize, {
      statusFilter,
      dateFrom,
      dateTo,
      paymentFilter,
      searchQuery
    }, effectiveStoreId, user?.token)
  }, [statusFilter, dateFrom, dateTo, paymentFilter, searchQuery, effectiveStoreId, user?.token])

  // Use paginated data hook
  const {
    items: orders,
    hasNextPage,
    isFetching,
    isLoading,
    loadMore,
    refetch,
    totalItems,
    error
  } = usePaginatedData(
    ['paginated-orders', statusFilter, dateFrom, dateTo, paymentFilter, searchQuery, effectiveStoreId],
    fetchOrdersData,
    {
      pageSize: 25,
      enabled: true,
      staleTime: 1 * 60 * 1000, // 1 minute
      gcTime: 3 * 60 * 1000 // 3 minutes
    }
  )
  
  console.log('📦 Orders data from hook:', { 
    ordersCount: orders?.length, 
    isLoading, 
    isFetching,
    error: error?.message,
    hasNextPage,
    totalItems
  })

  // Filter orders in memory (additional client-side filtering if needed)
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Additional client-side filtering logic if needed
      return true
    })
  }, [orders])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const loadMoreElement = loadMoreRef.current
    if (!loadMoreElement || !hasNextPage || isFetching) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px'
      }
    )

    observer.observe(loadMoreElement)

    return () => {
      observer.unobserve(loadMoreElement)
    }
  }, [hasNextPage, isFetching, loadMore])

  // Refetch when filters change
  useEffect(() => {
    refetch()
  }, [statusFilter, dateFrom, dateTo, paymentFilter, searchQuery, refetch])

  const toggleOrderExpansion = (orderId: number) => {
    const newExpanded = new Set(expandedOrders)
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId)
    } else {
      newExpanded.add(orderId)
    }
    setExpandedOrders(newExpanded)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <>
        <SiriGlowBorder isLoading={true} />
        <div className="fixed inset-0 flex items-center justify-center bg-black z-40">
          <div className="text-center">
            <Image
              src="/logo.png"
              alt="Flora Distro"
              width={120}
              height={120}
              className="logo-fade-animation mx-auto mb-6"
              priority
            />
            <h2 className="flora-distro-text text-animated">Flora Distro</h2>
            <p className="text-text-secondary mt-2">Loading orders...</p>
          </div>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-black">
        <div className="text-center">
          <p className="text-red-400 mb-2">Failed to load orders</p>
          <p className="text-text-secondary text-sm mb-4">{error.message}</p>
          <button 
            onClick={() => refetch()}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-black flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-white/[0.04] flex-shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-text-primary">Orders Management</h2>
          <span className="text-sm text-text-secondary">({totalItems} total orders)</span>
          {isFetching && (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          )}
        </div>
      </div>

      {/* Orders List */}
      <div className="flex-1 overflow-y-auto">
        {filteredOrders.length === 0 && !isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <svg className="w-12 h-12 text-text-tertiary mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-text-secondary">No orders found</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2 p-2">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-neutral-900/40 border border-white/[0.04] rounded-lg p-3 hover:bg-neutral-900/60 transition-colors"
              >
                <div 
                  className="cursor-pointer"
                  onClick={() => toggleOrderExpansion(order.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text-primary">{order.billing.first_name} {order.billing.last_name}</span>
                    </div>
                    <span className="text-sm font-semibold text-text-primary">
                      ${parseFloat(order.total).toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="text-xs text-text-secondary">
                    <div className="flex items-center gap-2">
                      <span>#{order.number}</span>
                      <span className="text-text-tertiary">•</span>
                      <span>{formatDate(order.date_created)}</span>
                      <span className="text-text-tertiary">•</span>
                      <span className="text-text-tertiary capitalize">{order.status}</span>
                    </div>
                  </div>
                </div>

                {expandedOrders.has(order.id) && (
                  <div className="mt-3 pt-3 border-t border-white/[0.04]">
                    <div className="space-y-2">
                      <div className="text-xs">
                        <span className="text-text-tertiary">Email: </span>
                        <span className="text-text-secondary">{order.billing.email}</span>
                      </div>
                      {order.billing.phone && (
                        <div className="text-xs">
                          <span className="text-text-tertiary">Phone: </span>
                          <span className="text-text-secondary">{order.billing.phone}</span>
                        </div>
                      )}
                      <div className="text-xs">
                        <span className="text-text-tertiary">Payment: </span>
                        <span className="text-text-secondary">{order.payment_method_title || order.payment_method}</span>
                      </div>
                      
                      {order.line_items.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs text-text-tertiary mb-1">Items:</div>
                          <div className="space-y-1">
                            {order.line_items.map((item) => (
                              <div key={item.id} className="text-xs flex justify-between">
                                <span className="text-text-secondary">{item.quantity}x {item.name}</span>
                                <span className="text-text-primary">${parseFloat(item.total).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {/* Load More Trigger */}
            {hasNextPage && (
              <div ref={loadMoreRef} className="flex justify-center py-8">
                {isFetching ? (
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading more orders...</span>
                  </div>
                ) : (
                  <button
                    onClick={loadMore}
                    className="px-6 py-2 bg-primary/20 border border-primary/30 text-primary rounded-lg hover:bg-primary/30 transition-colors"
                  >
                    Load More Orders
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}