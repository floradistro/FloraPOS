'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import { Cart } from '../components/Cart'
import { AppWrapper } from '../components/AppWrapper'
import { StatusBar } from '../components/StatusBar'
import SiriGlowBorder from '../components/SiriGlowBorder'
import { 
  SuspensePaginatedProductGrid, 
  SuspensePaginatedOrdersView,
  preloadCriticalComponents,
  preloadSecondaryComponents 
} from '../components/DynamicImports'
import { SuspenseSettingsPanel } from '../components/LazyComponents'
import { VirtualizedCustomerList } from '../components/VirtualizedCustomerList'

import { useAuth } from '../contexts/AuthContext'
import { useLocation } from '../contexts/LocationContext'
import { FloraProduct, floraAPI, FloraCustomer } from '../lib/woocommerce'
import { Customer } from '../types/auth'
import { autoSetupScrollHandling, globalScrollUnlock } from '../utils/scrollUtils'

interface CartItem extends FloraProduct {
  selectedVariation: string
  cartQuantity: number
}

export default function FloraDistrosPOS() {
  const { store, user, logout } = useAuth()
  const { syncWithStore } = useLocation()
  const queryClient = useQueryClient()
  const [activeCategory, setActiveCategory] = useState('all')
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [assignedCustomer, setAssignedCustomer] = useState<Customer | null>(null)
  const [productCount, setProductCount] = useState<number>(0)
  const [isProductsLoading, setIsProductsLoading] = useState<boolean>(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isCustomerViewOpen, setIsCustomerViewOpen] = useState(false)
  const [customerSearchQuery, setCustomerSearchQuery] = useState('')
  const [isOrdersViewOpen, setIsOrdersViewOpen] = useState(false)
  const [isListView, setIsListView] = useState(false)
  const [isCheckingOut, setIsCheckingOut] = useState(false)


  // Orders filter states
  const [orderStatusFilter, setOrderStatusFilter] = useState('all')
  const [orderDateFrom, setOrderDateFrom] = useState('')
  const [orderDateTo, setOrderDateTo] = useState('')
  const [orderPaymentFilter, setOrderPaymentFilter] = useState('all')

  // Sync location with authenticated store
  useEffect(() => {
    if (store?.id) {
      syncWithStore(store.id)
    }
  }, [store?.id, syncWithStore])

  // Preload critical components on mount
  useEffect(() => {
    preloadCriticalComponents()
    
    // Preload secondary components after a short delay
    const timer = setTimeout(() => {
      preloadSecondaryComponents()
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  // Setup global scroll handling for iPad
  useEffect(() => {
    // Setup scroll handling for all scrollable containers
    autoSetupScrollHandling()
    
    // Add global touch handler to unlock scroll if it gets stuck
    const handleGlobalTouch = () => {
      globalScrollUnlock()
    }
    
    // Add emergency scroll unlock on any touch
    document.addEventListener('touchstart', handleGlobalTouch, { passive: true })
    
    return () => {
      document.removeEventListener('touchstart', handleGlobalTouch)
    }
  }, [])

  // Fetch customers data with pagination
  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ['customers', customerSearchQuery],
    queryFn: async () => {
      return floraAPI.getCustomers({
        search: customerSearchQuery || undefined,
        per_page: 50
      })
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  const customers = customersData?.customers || []

  const mainCategories = [
    { name: 'All', slug: 'all', id: null },
    { name: 'Flower', slug: 'flower', id: 25 },
    { name: 'Vapes', slug: 'vape', id: 19 },
    { name: 'Edibles', slug: 'edibles', id: 21 },
    { name: 'Concentrates', slug: 'concentrate', id: 22 },
    { name: 'Moonwater', slug: 'moonwater', id: 16 }
  ]

  const handleAddToCart = (product: FloraProduct, selectedVariation?: string) => {
    const variation = selectedVariation || 'default'
    
    // Calculate the correct price and quantity based on the selected variation
    let price = parseFloat(product.sale_price || product.price || '0')
    let cartQuantity = 1 // Default quantity
    
    if (variation && variation !== 'default') {
      if (product.mli_product_type === 'weight' && product.pricing_tiers) {
        if (variation.includes('preroll-')) {
          const count = variation.replace('preroll-', '')
          price = product.preroll_pricing_tiers?.[count] || price
        } else if (variation.includes('flower-')) {
          const grams = variation.replace('flower-', '')
          price = product.pricing_tiers[grams] || price
          // For flower products, cartQuantity stays 1 as the price is for the total grams
          // The actual grams will be extracted from the variation in the cart
          cartQuantity = 1
        }
      } else if (product.mli_product_type === 'quantity' && product.pricing_tiers) {
        const qty = variation.replace('qty-', '')
        price = product.pricing_tiers[qty] || price
        // For quantity products, pricing tiers already include total price
        // so cartQuantity stays 1, but we store the actual quantity in metadata
        cartQuantity = 1
      }
    }
    
    const existingItemIndex = cartItems.findIndex(
      item => item.id === product.id && item.selectedVariation === variation
    )

    if (existingItemIndex >= 0) {
      const updatedItems = [...cartItems]
      updatedItems[existingItemIndex].cartQuantity += cartQuantity // Add the actual quantity instead of always 1
      setCartItems(updatedItems)
    } else {
      const newItem: CartItem = { 
        ...product, 
        price: price.toString(), // Override the price with the variation-specific price
        cartQuantity: cartQuantity, 
        selectedVariation: variation 
      }
      setCartItems([...cartItems, newItem])
    }
  }

  const handleRemoveFromCart = (productId: number, variation: string) => {
    setCartItems(cartItems.filter(item => 
      !(item.id === productId && item.selectedVariation === variation)
    ))
  }

  const handleUpdateQuantity = (productId: number, variation: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(productId, variation)
    } else {
      setCartItems(cartItems.map(item =>
        item.id === productId && item.selectedVariation === variation
          ? { ...item, cartQuantity: newQuantity }
          : item
      ))
    }
  }

  const handleAssignCustomer = (customer: Customer) => {
    setAssignedCustomer(customer)
  }

  const handleUnassignCustomer = () => {
    setAssignedCustomer(null)
  }

  const handleLogout = async () => {
    try {
      await logout()
      setIsMenuOpen(false)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleOpenSettings = () => {
    setIsSettingsOpen(true)
    setIsMenuOpen(false)
  }

      return (
      <>
        <AppWrapper>
        {/* Main App Container - Black status bar, no bottom gap */}
        <div className="app-content-container text-text-primary flex flex-col" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: '#1E1E1E',
          height: '100vh',
          width: '100vw',
          paddingTop: 'env(safe-area-inset-top, 44px)', // Black status bar height
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          paddingLeft: 'env(safe-area-inset-left, 0px)',
          paddingRight: 'env(safe-area-inset-right, 0px)',
          boxSizing: 'border-box',
          zIndex: 1, // Below Siri ring
          overflow: 'hidden' // Prevent any overflow causing gaps
        }}>
        {/* Menu Drawer - Positioned within app content area */}
        <div className={`absolute left-0 top-0 bottom-0 z-50 w-80 bg-black border-r border-white/[0.04] transform transition-transform duration-300 ease-in-out ${
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
            className="absolute inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsMenuOpen(false)}
          />
        )}



        {/* Header */}
        <div className="header-nav bg-black px-4 py-1 flex-shrink-0 relative z-30">
          <div className="flex items-center justify-between gap-2">
            {/* Logo */}
            <div className="flex-shrink-0">
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
            </div>
            
            {/* Category Selector / Order Filters - Fixed Width */}
            <div className="flex items-center flex-1 justify-center">
              {isOrdersViewOpen ? (
                /* Order Filters */
                <div className="flex items-center gap-2">
                  {/* Status Filter */}
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="px-3 py-1 rounded-xl text-sm bg-neutral-900/65 text-text-primary border border-white/[0.04] focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="refunded">Refunded</option>
                  </select>

                  {/* Date From */}
                  <input
                    type="date"
                    value={orderDateFrom}
                    onChange={(e) => setOrderDateFrom(e.target.value)}
                    className="px-3 py-1 rounded-xl text-sm bg-neutral-900/65 text-text-primary border border-white/[0.04] focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="From Date"
                  />

                  {/* Date To */}
                  <input
                    type="date"
                    value={orderDateTo}
                    onChange={(e) => setOrderDateTo(e.target.value)}
                    className="px-3 py-1 rounded-xl text-sm bg-neutral-900/65 text-text-primary border border-white/[0.04] focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="To Date"
                  />

                  {/* Payment Method Filter */}
                  <select
                    value={orderPaymentFilter}
                    onChange={(e) => setOrderPaymentFilter(e.target.value)}
                    className="px-3 py-1 rounded-xl text-sm bg-neutral-900/65 text-text-primary border border-white/[0.04] focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="all">All Payment</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="bacs">Bank Transfer</option>
                  </select>
                </div>
              ) : (
                /* Product Categories */
                <div className="flex items-center">
                  {mainCategories.map((category, index) => (
                    <div key={category.slug} className="flex items-center">
                      <button
                        onClick={() => {
                          console.log(`🏷️ Category clicked: ${category.name} (slug: ${category.slug}, id: ${category.id})`)
                          setActiveCategory(category.slug)
                        }}
                        className={`px-2 py-1 rounded-xl text-sm font-medium transition-all duration-300 ease-out active:scale-95 flex items-center justify-center ${
                          activeCategory === category.slug
                            ? 'text-vscode-text bg-white/15 shadow-lg shadow-white/10 border border-white/30'
                            : 'text-vscode-textSecondary hover:text-vscode-text bg-transparent hover:bg-vscode-bgTertiary/50 border border-transparent hover:border-vscode-border/50 hover:shadow-sm hover:shadow-black/10'
                        }`}
                      >
                        {category.name}
                      </button>
                      {index < mainCategories.length - 1 && (
                        <div className="w-px h-4 bg-vscode-border/60 mx-1"></div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Navigation Controls - Fixed Position */}
            <div className="flex items-center flex-shrink-0">
              {/* Customer View Toggle */}
              <button
                onClick={() => {
                  setIsCustomerViewOpen(!isCustomerViewOpen)
                }}
                className={`p-2 rounded-xl transition-all duration-300 ease-out active:scale-95 ${
                  isCustomerViewOpen
                    ? 'text-vscode-text bg-white/15 shadow-lg shadow-white/10 border border-white/30'
                    : 'text-vscode-textSecondary hover:text-vscode-text bg-transparent hover:bg-vscode-bgTertiary/50 border border-transparent hover:border-vscode-border/50 hover:shadow-sm hover:shadow-black/10'
                }`}
                title="Customers"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>

              {/* Divider */}
              <div className="w-px h-4 bg-vscode-border/60 mx-2"></div>

              {/* Orders View Toggle */}
              <button
                onClick={() => {
                  setIsOrdersViewOpen(!isOrdersViewOpen)
                }}
                className={`p-2 rounded-xl transition-all duration-300 ease-out active:scale-95 ${
                  isOrdersViewOpen
                    ? 'text-vscode-text bg-white/15 shadow-lg shadow-white/10 border border-white/30'
                    : 'text-vscode-textSecondary hover:text-vscode-text bg-transparent hover:bg-vscode-bgTertiary/50 border border-transparent hover:border-vscode-border/50 hover:shadow-sm hover:shadow-black/10'
                }`}
                title="Orders"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>

              {/* Divider */}
              <div className="w-px h-4 bg-vscode-border/60 mx-2"></div>

              {/* List View Toggle */}
              <button
                onClick={() => setIsListView(!isListView)}
                className={`p-2 rounded-xl transition-all duration-300 ease-out active:scale-95 ${
                  isListView
                    ? 'text-vscode-text bg-white/15 shadow-lg shadow-white/10 border border-white/30'
                    : 'text-vscode-textSecondary hover:text-vscode-text bg-transparent hover:bg-vscode-bgTertiary/50 border border-transparent hover:border-vscode-border/50 hover:shadow-sm hover:shadow-black/10'
                }`}
                title={isListView ? 'List View' : 'Grid View'}
              >
                {isListView ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-sm flex items-center gap-2">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-neutral-900/65 rounded text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={() => {
                  window.location.reload()
                }}
                className="p-1.5 bg-neutral-900/65 hover:bg-background-secondary border border-white/[0.04] rounded text-text-secondary hover:text-text-primary transition-colors"
                title="Refresh app"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Cart Summary */}
            <div className="text-right text-xs">
              <span className="text-text-secondary">{cartItems.length} items</span>
              <span className="text-text-primary font-semibold ml-2">
                ${cartItems.reduce((total, item) => total + (parseFloat(item.price) * item.cartQuantity), 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className={`flex-1 min-h-0 ${
          isCustomerViewOpen 
            ? 'grid grid-cols-[1fr_2fr_320px] gap-0'
            : 'flex'
        } overflow-hidden`}>
          {/* Customer View Panel */}
          {isCustomerViewOpen && (
            <div className="bg-black border-r border-white/[0.04]">
                              <div className="px-2 py-6">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search customers..."
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-900/65 rounded text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <svg className="absolute right-3 top-2.5 w-4 h-4 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              
              <VirtualizedCustomerList
                customers={customers}
                selectedCustomer={assignedCustomer}
                onSelectCustomer={setAssignedCustomer}
                loading={customersLoading}
                searchQuery={customerSearchQuery}
                containerHeight={400} // Adjust based on your layout needs
                hasMore={customersData?.hasMore || false}
                isLoadingMore={false}
              />
            </div>
          )}

          {/* Products Grid / Orders View */}
          <div className={`px-0 pb-0 relative bg-black scrollable-container ${
            isCustomerViewOpen ? '' : 'flex-1'
          } ${
            isListView ? 'overflow-hidden' : 'overflow-y-auto'
          }`}>
            {isOrdersViewOpen ? (
              <SuspensePaginatedOrdersView 
                statusFilter={orderStatusFilter}
                dateFrom={orderDateFrom}
                dateTo={orderDateTo}
                paymentFilter={orderPaymentFilter}
                searchQuery={searchQuery}
              />
            ) : (
              <SuspensePaginatedProductGrid
                category={activeCategory === 'all' ? null : mainCategories.find(cat => cat.slug === activeCategory)?.id || null}
                searchQuery={searchQuery}
                onAddToCart={handleAddToCart}
                onProductCountChange={setProductCount}
                onLoadingChange={setIsProductsLoading}
                isCustomerViewOpen={isCustomerViewOpen}
                isListView={isListView}
              />
            )}
          </div>

          {/* Cart Sidebar */}
          <Cart
            items={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveFromCart}
            assignedCustomer={assignedCustomer}
            onAssignCustomer={handleAssignCustomer}
            onUnassignCustomer={handleUnassignCustomer}
            onCheckoutStatusChange={setIsCheckingOut}
          />
        </div>





        {/* VSCode-style Status Bar - Matches Header Nav */}
        <div className="bg-black px-6 pt-2 pb-6 flex items-center text-xs text-text-secondary flex-shrink-0">
          {/* Left Section */}
          <div className="flex items-center gap-4 flex-1">
            {store && <span>{store.name}</span>}
            {isOrdersViewOpen ? (
              <span>Orders management</span>
            ) : (
              <span>{productCount} products available</span>
            )}
          </div>

          {/* Center Section - Perfectly Centered */}
          <div className="flex items-center justify-center flex-1">
            {user && <span>Hello, {user.firstName}</span>}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4 flex-1 justify-end">
            <span>POS</span>
          </div>
        </div>

        {/* Settings Panel */}
        <SuspenseSettingsPanel 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
        />

        {/* Siri Glow Border - Locks to viewport edge OVER iOS status bar */}
        <SiriGlowBorder isLoading={isProductsLoading || isCheckingOut} />


      </div>
    </AppWrapper>
    </>
  )
} 