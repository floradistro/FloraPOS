'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'
import SiriGlowBorder from './SiriGlowBorder'

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

interface OrdersViewProps {
  statusFilter?: string
  dateFrom?: string
  dateTo?: string
  paymentFilter?: string
  searchQuery?: string
}

export function OrdersView({ 
  statusFilter = '', 
  dateFrom = '', 
  dateTo = '', 
  paymentFilter = '',
  searchQuery = ''
}: OrdersViewProps) {
  const { user, store } = useAuth()
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set())

  // Get preloaded orders from cache
  const { data: cachedOrders, isLoading, error } = useQuery<Order[]>({
    queryKey: ['orders-preload'],
    enabled: false, // Don't refetch, just use cached data
    staleTime: Infinity, // Never consider stale
  })

  // Filter orders based on props
  const filteredOrders = useMemo(() => {
    if (!cachedOrders) return []
    
    return cachedOrders.filter((order) => {
      // Status filter
      if (statusFilter && statusFilter !== 'all' && order.status !== statusFilter) {
        return false
      }
      
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase()
        const matchesSearch = 
          order.number.toLowerCase().includes(searchLower) ||
          order.billing.first_name.toLowerCase().includes(searchLower) ||
          order.billing.last_name.toLowerCase().includes(searchLower) ||
          order.billing.email.toLowerCase().includes(searchLower)
        if (!matchesSearch) return false
      }
      
      // Date filters
      if (dateFrom) {
        const orderDate = new Date(order.date_created).toISOString().split('T')[0]
        if (orderDate < dateFrom) return false
      }
      
      if (dateTo) {
        const orderDate = new Date(order.date_created).toISOString().split('T')[0]
        if (orderDate > dateTo) return false
      }
      
      // Payment filter
      if (paymentFilter && paymentFilter !== 'all' && order.payment_method !== paymentFilter) {
        return false
      }
      
      return true
    })
  }, [cachedOrders, statusFilter, searchQuery, dateFrom, dateTo, paymentFilter])

  const loading = isLoading || !cachedOrders

  // Show error state if there's an error
  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-black">
        <div className="text-center">
          <p className="text-red-400 mb-2">Failed to load orders</p>
          <p className="text-text-secondary text-sm">{error.message}</p>
        </div>
      </div>
    )
  }

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

  if (loading) {
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

  return (
    <div className="bg-black flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-text-primary">Orders Management</h2>
          <span className="text-sm text-text-secondary">({filteredOrders.length} orders)</span>
        </div>
      </div>

      {/* Orders List */}
      <div className="flex-1 overflow-y-auto">
        {filteredOrders.length === 0 ? (
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
          </div>
        )}
      </div>
    </div>
  )
}