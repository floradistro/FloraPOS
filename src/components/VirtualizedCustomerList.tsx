'use client'

import { useMemo, useCallback } from 'react'
import { VirtualizedList } from './VirtualizedList'
import { FloraCustomer } from '../lib/woocommerce'
import { Customer } from '../types/auth'

interface VirtualizedCustomerListProps {
  customers: FloraCustomer[]
  selectedCustomer: Customer | null
  onSelectCustomer: (customer: Customer | null) => void
  loading: boolean
  searchQuery: string
  containerHeight: number
  onLoadMore?: () => void
  hasMore?: boolean
  isLoadingMore?: boolean
}

const CUSTOMER_ITEM_HEIGHT = 120 // Height of each customer item in pixels

export function VirtualizedCustomerList({ 
  customers,
  selectedCustomer,
  onSelectCustomer,
  loading,
  searchQuery,
  containerHeight,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false
}: VirtualizedCustomerListProps) {

  // Filter customers based on search
  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return customers
    
    const query = searchQuery.toLowerCase()
    return customers.filter(customer => {
      const customerName = `${customer.first_name} ${customer.last_name}`.trim() || customer.username
      return (
        customerName.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query) ||
        customer.billing?.phone?.includes(query)
      )
    })
  }, [customers, searchQuery])

  const handleCustomerClick = useCallback((customer: FloraCustomer) => {
    if (selectedCustomer?.id === customer.id.toString()) {
      onSelectCustomer(null)
    } else {
      const customerName = `${customer.first_name} ${customer.last_name}`.trim() || customer.username
      const customerPhone = customer.billing?.phone || ''
      const totalSpent = parseFloat(customer.total_spent || '0')
      const ordersCount = customer.orders_count || 0
      const loyaltyPoints = customer.loyalty_points || 0
      
      onSelectCustomer({
        id: customer.id.toString(),
        firstName: customer.first_name || customer.username,
        lastName: customer.last_name || '',
        email: customer.email,
        phone: customerPhone,
        dateOfBirth: '',
        totalSpent: totalSpent,
        orderCount: ordersCount,
        loyaltyPoints: loyaltyPoints,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    }
  }, [selectedCustomer, onSelectCustomer])

  const renderCustomerItem = useCallback((customer: FloraCustomer, index: number) => {
    const customerName = `${customer.first_name} ${customer.last_name}`.trim() || customer.username
    const customerPhone = customer.billing?.phone || ''
    const totalSpent = parseFloat(customer.total_spent || '0')
    const ordersCount = customer.orders_count || 0
    const loyaltyPoints = customer.loyalty_points || 0
    
    const isSelected = selectedCustomer?.id === customer.id.toString()
    
    return (
      <div
        className={`p-3 mx-2 my-1 rounded-lg cursor-pointer transition-colors ${
          isSelected
            ? 'bg-primary/20 border border-primary/30'
            : 'hover:bg-background-tertiary'
        }`}
        onClick={() => handleCustomerClick(customer)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="font-medium text-text-primary text-sm">{customerName}</div>
            <div className="text-xs text-text-secondary">{customer.email}</div>
            {customerPhone && (
              <div className="text-xs text-text-tertiary">{customerPhone}</div>
            )}
          </div>
          <div className="text-right">
            <div className="text-xs text-text-secondary">
              {ordersCount > 0 ? `${ordersCount} orders` : 'No orders'}
            </div>
            <div className="text-xs font-medium text-text-primary">${totalSpent.toFixed(2)}</div>
            <div className="text-xs font-medium text-green-400">
              {loyaltyPoints > 0 ? `${loyaltyPoints.toLocaleString()} chips` : '0 chips'}
            </div>
          </div>
        </div>
      </div>
    )
  }, [selectedCustomer, handleCustomerClick])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-2 text-text-secondary">
          <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Loading customers...</span>
        </div>
      </div>
    )
  }

  if (filteredCustomers.length === 0) {
    return (
      <div className="p-4 text-center text-text-secondary text-sm">
        {searchQuery ? 'No customers found matching your search.' : 'No customers found.'}
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-hidden">
      <VirtualizedList
        items={filteredCustomers}
        itemHeight={CUSTOMER_ITEM_HEIGHT}
        containerHeight={containerHeight}
        renderItem={renderCustomerItem}
        overscan={3}
        className="scrollable-container"
        loadMore={onLoadMore}
        hasMore={hasMore}
        isLoading={isLoadingMore}
      />
    </div>
  )
}