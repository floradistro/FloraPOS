'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { AppWrapper } from '@/components/AppWrapper'
import { StatusBar } from '@/components/StatusBar'
import { TopStatusBar } from '@/components/TopStatusBar'
import SettingsPanel from '@/components/SettingsPanel'
import Image from 'next/image'

interface Order {
  id: number
  number: string
  date_created: string
  status: string
  total: string
  currency: string
  payment_method?: string
  payment_method_title?: string
  processed_by_staff?: string
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
  points_earned?: number
  points_redeemed?: number
}

interface CustomerDetails {
  id: number
  email: string
  firstName: string
  lastName: string
  phone: string
  preferences?: Array<{
    id: string
    category: string
    value: string
    notes: string
    addedAt: string
  }>
}

interface StaffMember {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
}

export default function OrdersPage() {
  const { user, store, token, isLoading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('')
  const [minTotalFilter, setMinTotalFilter] = useState('')
  const [maxTotalFilter, setMaxTotalFilter] = useState('')
  const [staffMemberFilter, setStaffMemberFilter] = useState('')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set())
  const [customerDetails, setCustomerDetails] = useState<Map<number, CustomerDetails>>(new Map())
  const [loadingCustomers, setLoadingCustomers] = useState<Set<number>>(new Set())
  const [refundingOrders, setRefundingOrders] = useState<Set<number>>(new Set())
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [loadingStaff, setLoadingStaff] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
      return
    }
    
    if (user?.storeId) {
      fetchOrders()
      fetchStaffMembers()
    }
  }, [user, isLoading, router])

  const fetchStaffMembers = async () => {
    if (staffMembers.length > 0) return // Don't fetch if already loaded
    
    setLoadingStaff(true)
    try {
      const storeId = user?.storeId || 'Charlotte Monroe'
      const response = await fetch(`/api/staff?store_id=${encodeURIComponent(storeId)}`)
      if (response.ok) {
        const staff = await response.json()
        setStaffMembers(staff)
        console.log('✅ Loaded staff members for store (Addify-managed):', storeId, staff)
      } else {
        console.error('❌ Failed to fetch staff members')
      }
    } catch (error) {
      console.error('❌ Error fetching staff members:', error)
    } finally {
      setLoadingStaff(false)
    }
  }

  const fetchOrders = async (overrideStaffFilter?: string) => {
    // Temporarily removed token check since API is public for debugging
    // if (!token) {
    //   console.error('No authentication token available')
    //   return
    // }

    try {
      setLoading(true)
      const params = new URLSearchParams({
        store_id: 'Charlotte Monroe', // Using actual location for testing
        per_page: '50',
        orderby: 'date',
        order: 'desc'
      })

      if (dateFrom) params.append('after', dateFrom)
      if (dateTo) params.append('before', dateTo)
      if (statusFilter) params.append('status', statusFilter)
      if (searchTerm) params.append('search', searchTerm)
      if (paymentMethodFilter) params.append('payment_method', paymentMethodFilter)
      if (minTotalFilter) params.append('min_total', minTotalFilter)
      if (maxTotalFilter) params.append('max_total', maxTotalFilter)
      const activeStaffFilter = overrideStaffFilter ?? staffMemberFilter
      if (activeStaffFilter) params.append('staff_member', activeStaffFilter)

      console.log('🔍 Fetching orders with params:', params.toString())
      console.log('🔍 Search filters:', { searchTerm, dateFrom, dateTo, statusFilter, staffMemberFilter: activeStaffFilter })
      
      if (activeStaffFilter) {
        console.log('👤 Staff member filter active:', activeStaffFilter)
      }
      
      const response = await fetch(`/api/orders?${params}`, {
        headers: {
          // 'Authorization': `Bearer ${token}`, // Temporarily removed - JWT malformed
          'Content-Type': 'application/json',
        },
      })
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error:', errorText)
        throw new Error('Failed to fetch orders')
      }
      
      const data = await response.json()
      console.log('📦 Received orders:', data.length)
      if (data.length > 0) {
        console.log('📋 First order sample:', data[0])
        // Debug points data
        data.slice(0, 3).forEach((order: Order, index: number) => {
          console.log(`🎯 Order ${order.id} points - Earned: ${order.points_earned}, Redeemed: ${order.points_redeemed}`)
        })
      }
      setOrders(data)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomerDetails = async (customerId: number) => {
    if (customerDetails.has(customerId) || loadingCustomers.has(customerId)) {
      return
    }

    setLoadingCustomers(prev => new Set(prev).add(customerId))

    try {
      const response = await fetch(`/api/customers/${customerId}/preferences`)
      if (response.ok) {
        const data = await response.json()
        setCustomerDetails(prev => new Map(prev).set(customerId, data.customer))
      }
    } catch (error) {
      console.error('Error fetching customer details:', error)
    } finally {
      setLoadingCustomers(prev => {
        const newSet = new Set(prev)
        newSet.delete(customerId)
        return newSet
      })
    }
  }

  const toggleOrderExpansion = (orderId: number) => {
    const newExpanded = new Set(expandedOrders)
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId)
    } else {
      newExpanded.add(orderId)
      // Find the order and fetch customer details
      const order = orders.find(o => o.id === orderId)
      if (order?.billing?.email) {
        // Try to find customer by email - this is a simplified approach
        // In a real implementation, you'd have customer ID in the order data
        console.log('Would fetch customer details for:', order.billing.email)
      }
    }
    setExpandedOrders(newExpanded)
  }

  const handleSearch = () => {
    fetchOrders()
  }

  const clearFilters = () => {
    setSearchTerm('')
    setDateFrom('')
    setDateTo('')
    setStatusFilter('')
    setPaymentMethodFilter('')
    setMinTotalFilter('')
    setMaxTotalFilter('')
    setStaffMemberFilter('')
    // Fetch orders immediately after clearing filters
    setTimeout(() => {
      fetchOrders()
    }, 100)
  }

  // Auto-search when Enter is pressed in search field
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-emerald-300 bg-emerald-500/5 border-emerald-500/20'
      case 'processing': return 'text-sky-300 bg-sky-500/5 border-sky-500/20'
      case 'pending': return 'text-amber-300 bg-amber-500/5 border-amber-500/20'
      case 'cancelled': return 'text-rose-300 bg-rose-500/5 border-rose-500/20'
      case 'refunded': return 'text-violet-300 bg-violet-500/5 border-violet-500/20'
      default: return 'text-slate-400 bg-slate-500/5 border-slate-500/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
      case 'processing':
        return <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></div>
      case 'pending':
        return <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
      case 'cancelled':
        return <div className="w-1.5 h-1.5 rounded-full bg-rose-400"></div>
      default:
        return <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
    }
  }

  const handleRefund = async (orderId: number) => {
    if (!confirm('Are you sure you want to refund this order? This action cannot be undone.')) {
      return
    }

    setRefundingOrders(prev => new Set(prev).add(orderId))

    try {
      const response = await fetch(`/api/orders/${orderId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to refund order')
      }

      const result = await response.json()
      console.log('✅ Order refunded successfully:', result)

      // Update the order status in the local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: 'refunded' }
            : order
        )
      )

      alert('Order has been successfully refunded!')
    } catch (error) {
      console.error('❌ Error refunding order:', error)
      alert(`Failed to refund order: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setRefundingOrders(prev => {
        const newSet = new Set(prev)
        newSet.delete(orderId)
        return newSet
      })
    }
  }

  const handleLogout = async () => {
    try {
      // Add logout logic here
      setIsMenuOpen(false)
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleOpenSettings = () => {
    setIsSettingsOpen(true)
    setIsMenuOpen(false)
  }

  if (isLoading) {
    return (
      <AppWrapper>
        <div className="min-h-screen bg-[#1e1e1e] flex items-center justify-center">
          <div className="text-[#cccccc]">Loading...</div>
        </div>
      </AppWrapper>
    )
  }

  return (
    <AppWrapper>
      <div className="h-screen bg-background-primary text-text-primary flex flex-col relative overflow-hidden">
        {/* Menu Drawer */}
        <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-background-secondary border-r border-white/[0.04] transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="px-2 py-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-text-primary">Menu</h2>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 hover:bg-background-tertiary rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Menu Items */}
            <nav className="space-y-2">
              <button 
                onClick={() => router.push('/')}
                className="w-full text-left px-4 py-3 hover:bg-background-tertiary rounded-lg transition-colors flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4" />
                </svg>
                POS System
              </button>
              
              <button 
                onClick={() => router.push('/orders')}
                className="w-full text-left px-4 py-3 bg-primary text-white rounded-lg transition-colors flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Orders
              </button>
              
              <button 
                onClick={handleOpenSettings}
                className="w-full text-left px-4 py-3 hover:bg-background-tertiary rounded-lg transition-colors flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </button>
              
              <div className="border-t border-white/[0.04] my-4"></div>
              
              <button 
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 hover:bg-background-tertiary rounded-lg transition-colors flex items-center gap-3 text-red-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </nav>
          </div>
        </div>

        {/* Overlay */}
        {isMenuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsMenuOpen(false)}
          />
        )}

        {/* Top Status Bar */}
        <TopStatusBar isLoading={loading} />

        {/* Header Navigation */}
        <div className="bg-black border-b border-white/[0.04] px-2 py-1 flex-shrink-0 relative z-30">
          <div className="flex items-center justify-between gap-2">
            {/* Logo & Menu */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMenuOpen(true)}
                className="p-1 hover:bg-background-tertiary rounded-lg transition-colors"
              >
                <Image
                  src="/logo.png"
                  alt="Logo"
                  width={32}
                  height={32}
                  className="w-8 h-8 object-contain"
                />
              </button>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6.5a1.5 1.5 0 01-1.5 1.5h-7A1.5 1.5 0 016 11.5V5z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-text-primary">Orders Management</span>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-md mx-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  placeholder="Search orders, customers, emails..."
                  className="w-full px-3 py-1.5 pl-9 bg-background-tertiary border border-white/[0.04] rounded text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <svg className="absolute left-3 top-2 w-4 h-4 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="flex items-center gap-2">
              {/* Date Range Quick Filters */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setTimeout(fetchOrders, 300)
                }}
                className="px-2 py-1.5 bg-background-tertiary border border-white/[0.04] rounded text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>

              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                  showAdvancedFilters
                    ? 'bg-primary text-white'
                    : 'bg-background-tertiary text-text-secondary hover:bg-background-tertiary/80'
                }`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                </svg>
                Filters
              </button>

              <button
                onClick={() => router.push('/')}
                className="px-3 py-1.5 bg-primary hover:bg-primary/80 text-white rounded text-xs font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to POS
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col flex-1 min-h-0">
          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div className="bg-[#252526] border-b border-[#3e3e42] p-4 flex-shrink-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                
                {/* Date From */}
                <div>
                  <label className="block text-xs text-[#858585] mb-1.5 uppercase tracking-wide">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value)
                      setTimeout(fetchOrders, 500)
                    }}
                    className="w-full px-3 py-1.5 bg-[#3c3c3c] border border-[#464647] rounded text-sm text-[#cccccc] focus:outline-none focus:border-[#007acc] focus:bg-[#1e1e1e]"
                  />
                </div>

                {/* Date To */}
                <div>
                  <label className="block text-xs text-[#858585] mb-1.5 uppercase tracking-wide">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value)
                      setTimeout(fetchOrders, 500)
                    }}
                    className="w-full px-3 py-1.5 bg-[#3c3c3c] border border-[#464647] rounded text-sm text-[#cccccc] focus:outline-none focus:border-[#007acc] focus:bg-[#1e1e1e]"
                  />
                </div>

                {/* Payment Method Filter */}
                <div>
                  <label className="block text-xs text-[#858585] mb-1.5 uppercase tracking-wide">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethodFilter}
                    onChange={(e) => setPaymentMethodFilter(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#3c3c3c] border border-[#464647] rounded text-sm text-[#cccccc] focus:outline-none focus:border-[#007acc] focus:bg-[#1e1e1e]"
                  >
                    <option value="">All Methods</option>
                    <option value="bacs">Bank Transfer</option>
                    <option value="cheque">Check</option>
                    <option value="cod">Cash on Delivery</option>
                    <option value="paypal">PayPal</option>
                    <option value="stripe">Credit Card</option>
                    <option value="square">Square</option>
                  </select>
                </div>

                {/* Min Amount */}
                <div>
                  <label className="block text-xs text-[#858585] mb-1.5 uppercase tracking-wide">
                    Min Amount
                  </label>
                  <input
                    type="number"
                    value={minTotalFilter}
                    onChange={(e) => setMinTotalFilter(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-1.5 bg-[#3c3c3c] border border-[#464647] rounded text-sm text-[#cccccc] placeholder-[#858585] focus:outline-none focus:border-[#007acc] focus:bg-[#1e1e1e]"
                  />
                </div>

                {/* Staff Member Filter */}
                <div>
                  <label className="block text-xs text-[#858585] mb-1.5 uppercase tracking-wide">
                    Staff Member
                  </label>
                  <select
                    value={staffMemberFilter}
                    onChange={(e) => {
                      console.log('🔄 Staff filter changed to:', e.target.value)
                      setStaffMemberFilter(e.target.value)
                      setTimeout(() => fetchOrders(e.target.value), 300)
                    }}
                    disabled={loadingStaff}
                    className="w-full px-3 py-1.5 bg-[#3c3c3c] border border-[#464647] rounded text-sm text-[#cccccc] focus:outline-none focus:border-[#007acc] focus:bg-[#1e1e1e] disabled:opacity-50"
                  >
                    <option value="">
                      {loadingStaff ? 'Loading staff...' : 'All Staff'}
                    </option>
                    {staffMembers.map((staff) => (
                      <option key={staff.id} value={staff.name}>
                        {staff.name} ({staff.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end mt-3 gap-2">
                <button
                  onClick={handleSearch}
                  className="px-3 py-1.5 bg-[#007acc] text-white rounded text-sm hover:bg-[#005a9e] transition-colors flex items-center gap-2"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Apply Filters
                </button>
                <button
                  onClick={clearFilters}
                  className="px-3 py-1.5 bg-[#3c3c3c] text-[#cccccc] rounded text-sm hover:bg-[#464647] transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}

          {/* Orders List */}
          <div className="flex-1 overflow-hidden min-h-0">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-[#858585] text-sm">Loading orders...</div>
              </div>
            ) : orders.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-[#858585] text-sm">No orders found</div>
              </div>
            ) : (
              <div className="h-full overflow-auto">
                <table className="w-full">
                  <thead className="bg-[#2d2d30] sticky top-0 z-10 border-b border-[#3e3e42]">
                    <tr>
                      <th className="w-8 px-3 py-2"></th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-[#858585] uppercase tracking-wider">
                        Order
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-[#858585] uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-[#858585] uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-[#858585] uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-[#858585] uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-[#858585] uppercase tracking-wider">
                        Items
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order, index) => (
                      <>
                        <tr 
                          key={order.id} 
                          className="border-b border-[#3e3e42] hover:bg-[#2a2d2e] transition-colors cursor-pointer"
                          onClick={() => toggleOrderExpansion(order.id)}
                        >
                          <td className="px-3 py-3">
                            <button className="text-[#858585] hover:text-[#cccccc] transition-colors">
                              <svg 
                                className={`w-3 h-3 transition-transform ${expandedOrders.has(order.id) ? 'rotate-90' : ''}`} 
                                fill="currentColor" 
                                viewBox="0 0 20 20"
                              >
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </td>
                          <td className="px-3 py-3">
                            <div className="text-sm font-medium text-[#569cd6]">#{order.number}</div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="text-sm text-[#d4d4d4]">{formatDate(order.date_created)}</div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="text-sm text-[#d4d4d4]">
                              {order.billing.first_name} {order.billing.last_name}
                            </div>
                            <div className="text-xs text-[#858585]">{order.billing.email}</div>
                          </td>
                          <td className="px-3 py-3">
                            <span className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full border ${getStatusColor(order.status)}`}>
                              {getStatusIcon(order.status)}
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <div className="text-sm font-medium text-[#b5cea8]">
                              ${parseFloat(order.total).toFixed(2)}
                            </div>
                            <div className="text-xs text-[#858585]">{order.currency}</div>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <div className="text-sm text-[#d4d4d4]">
                              {order.line_items.length}
                            </div>
                          </td>
                        </tr>
                        
                        {/* Expanded Order Details */}
                        {expandedOrders.has(order.id) && (
                          <tr>
                            <td colSpan={7} className="px-0 py-0">
                              <div className="bg-[#252526] border-l-2 border-[#007acc] mx-3 mb-2 rounded p-3">
                                
                                {/* Compact Info Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mb-3">
                                  
                                  {/* Customer & Contact */}
                                  <div className="space-y-1">
                                    <div className="text-[#858585] uppercase tracking-wide font-medium">Customer</div>
                                    <div className="text-[#d4d4d4]">{order.billing.first_name} {order.billing.last_name}</div>
                                    <div className="text-[#569cd6]">{order.billing.email}</div>
                                    {order.billing.phone && <div className="text-[#d4d4d4]">{order.billing.phone}</div>}
                                  </div>

                                  {/* Order Info */}
                                  <div className="space-y-1">
                                    <div className="text-[#858585] uppercase tracking-wide font-medium">Order Details</div>
                                    <div className="text-[#d4d4d4]">{formatDate(order.date_created)}</div>
                                    <div className="flex items-center gap-2">
                                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(order.status)}`}>
                                        {getStatusIcon(order.status)}
                                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                      </span>
                                    </div>
                                    <div className="text-[#b5cea8] font-semibold">${parseFloat(order.total).toFixed(2)} {order.currency}</div>
                                    {order.processed_by_staff && (
                                      <div className="text-[#569cd6] text-xs">
                                        Processed by: {staffMembers.find(s => s.name === order.processed_by_staff)?.name || order.processed_by_staff}
                                      </div>
                                    )}
                                  </div>

                                  {/* Points & Actions */}
                                  <div className="space-y-2">
                                    <div className="text-[#858585] uppercase tracking-wide font-medium">Points & Actions</div>
                                    
                                    {/* Compact Points Display */}
                                    <div className="flex gap-2 text-xs">
                                      {order.points_earned && order.points_earned > 0 && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/10 text-emerald-300 rounded border border-emerald-500/20">
                                          <div className="w-1 h-1 rounded-full bg-emerald-400"></div>
                                          +{order.points_earned}
                                        </span>
                                      )}
                                      {order.points_redeemed && order.points_redeemed > 0 && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-sky-500/10 text-sky-300 rounded border border-sky-500/20">
                                          <div className="w-1 h-1 rounded-full bg-sky-400"></div>
                                          -{order.points_redeemed}
                                        </span>
                                      )}
                                      {(!order.points_earned || order.points_earned === 0) && (!order.points_redeemed || order.points_redeemed === 0) && (
                                        <span className="text-[#858585]">No points activity</span>
                                      )}
                                    </div>

                                    {/* Refund Button */}
                                    {order.status !== 'refunded' && order.status !== 'cancelled' && (
                                      <button
                                        onClick={() => handleRefund(order.id)}
                                        disabled={refundingOrders.has(order.id)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/30 text-rose-300 rounded text-xs font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        {refundingOrders.has(order.id) ? (
                                          <>
                                            <div className="w-3 h-3 border border-rose-400/30 border-t-rose-400 rounded-full animate-spin"></div>
                                            Processing...
                                          </>
                                        ) : (
                                          <>
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3" />
                                            </svg>
                                            Refund
                                          </>
                                        )}
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Compact Items List */}
                                <div className="border-t border-[#3e3e42] pt-2">
                                  <div className="text-[#858585] uppercase tracking-wide font-medium text-xs mb-2">Items ({order.line_items.length})</div>
                                  <div className="space-y-1">
                                    {order.line_items.map((item) => (
                                      <div key={item.id} className="flex justify-between items-center text-xs">
                                        <span className="text-[#d4d4d4]">{item.name}</span>
                                        <div className="flex items-center gap-3">
                                          <span className="text-[#858585]">×{item.quantity}</span>
                                          <span className="text-[#b5cea8] font-medium">${parseFloat(item.total).toFixed(2)}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Status Bar - Matching POS Layout */}
        <div className="bg-vscode-bgSecondary border-t border-border-light px-2 py-1 flex items-center justify-between text-xs text-text-secondary flex-shrink-0">
          {/* Left Section */}
          <div className="flex items-center space-x-2">
            {/* Store Info */}
            {store && (
              <div className="flex items-center">
                <span>{store.name}</span>
              </div>
            )}

            {/* Orders Count */}
            {store && (
              <div className="flex items-center">
                <span>{orders.length} orders</span>
              </div>
            )}

            {/* Filter Status */}
            {(statusFilter || dateFrom || dateTo || staffMemberFilter) && (
              <div className="flex items-center">
                <span>Filtered</span>
              </div>
            )}
          </div>

          {/* Center Section */}
          <div className="flex items-center space-x-2">
            {/* User Info */}
            {user && (
              <div className="flex items-center">
                <span>Hello, {user.firstName}</span>
              </div>
            )}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-2">
            {/* System Info */}
            <div className="flex items-center">
              <span>Orders</span>
            </div>

            {/* Current Time */}
            <div className="flex items-center">
              <span className="font-mono">{new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        <SettingsPanel 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
        />
      </div>
    </AppWrapper>
  )
} 