'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import { ProductGrid } from '../components/ProductGrid'
import { Cart } from '../components/Cart'
import { AppWrapper } from '../components/AppWrapper'
import { StatusBar } from '../components/StatusBar'
import { TopStatusBar } from '../components/TopStatusBar'
import SettingsPanel from '../components/SettingsPanel'
import { useAuth } from '../contexts/AuthContext'
import { useLocation } from '../contexts/LocationContext'
import { FloraProduct, floraAPI, FloraCustomer } from '../lib/woocommerce'
import { Customer } from '../types/auth'

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
  const [isListView, setIsListView] = useState(false)

  // Sync location with authenticated store
  useEffect(() => {
    if (store?.id) {
      syncWithStore(store.id)
    }
  }, [store?.id, syncWithStore])

  // Fetch customers data
  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ['customers', customerSearchQuery],
    queryFn: async (): Promise<FloraCustomer[]> => {
      return floraAPI.getCustomers({
        search: customerSearchQuery || undefined,
        per_page: 50
      })
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

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
    <AppWrapper>
      <div className="h-screen bg-background-primary text-text-primary flex flex-col relative">
        {/* Menu Drawer */}
        <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-black border-r border-white/[0.04] transform transition-transform duration-300 ease-in-out ${
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
                onClick={() => window.location.href = '/orders'}
                className="w-full text-left px-4 py-3 hover:bg-background-tertiary rounded-lg transition-colors flex items-center gap-3">
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
        <TopStatusBar isLoading={isProductsLoading} />

        {/* Header */}
                  <div className="bg-black border-b border-white/[0.04] px-2 py-1 flex-shrink-0 relative z-30">
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
            
            {/* Category Selector */}
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
            
            {/* Navigation Controls */}
            <div className="flex items-center">
              {/* Customer View Toggle */}
              <button
                onClick={() => setIsCustomerViewOpen(!isCustomerViewOpen)}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-300 ease-out active:scale-95 flex items-center gap-2 ${
                  isCustomerViewOpen
                    ? 'text-vscode-text bg-white/15 shadow-lg shadow-white/10 border border-white/30'
                    : 'text-vscode-textSecondary hover:text-vscode-text bg-transparent hover:bg-vscode-bgTertiary/50 border border-transparent hover:border-vscode-border/50 hover:shadow-sm hover:shadow-black/10'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                Customers
              </button>

              {/* Divider */}
              <div className="w-px h-4 bg-vscode-border/60 mx-2"></div>

              {/* List View Toggle */}
              <button
                onClick={() => setIsListView(!isListView)}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-300 ease-out active:scale-95 flex items-center gap-2 ${
                  isListView
                    ? 'text-vscode-text bg-white/15 shadow-lg shadow-white/10 border border-white/30'
                    : 'text-vscode-textSecondary hover:text-vscode-text bg-transparent hover:bg-vscode-bgTertiary/50 border border-transparent hover:border-vscode-border/50 hover:shadow-sm hover:shadow-black/10'
                }`}
              >
                {isListView ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                )}
                {isListView ? 'List' : 'Grid'}
              </button>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-sm flex items-center gap-2">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-neutral-900/65 border border-white/[0.04] rounded text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-1 focus:ring-primary"
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
        <div className="flex-1 flex min-h-0">
          {/* Customer View Panel */}
          {isCustomerViewOpen && (
            <div className="w-80 bg-black border-r border-white/[0.04] flex-shrink-0">
                              <div className="px-2 py-6 border-b border-white/[0.04]">
                <h3 className="text-lg font-semibold text-text-primary mb-3">Customer Directory</h3>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search customers..."
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 bg-background-tertiary border border-white/[0.04] rounded text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <svg className="absolute right-3 top-2.5 w-4 h-4 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              
              <div className="overflow-y-auto flex-1">
                {customersLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2 text-text-secondary text-sm">Loading customers...</span>
                  </div>
                ) : customers.length === 0 ? (
                  <div className="p-4 text-center text-text-secondary text-sm">
                    {customerSearchQuery ? 'No customers found matching your search.' : 'No customers found.'}
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {customers.map((customer) => {
                      const customerName = `${customer.first_name} ${customer.last_name}`.trim() || customer.username
                      const customerPhone = customer.billing?.phone || ''
                      const totalSpent = parseFloat(customer.total_spent || '0')
                      const ordersCount = customer.orders_count || 0
                      const loyaltyPoints = customer.loyalty_points || 0
                      
                      // Debug log for first customer
                      if (customer === customers[0]) {
                        console.log('🔍 Customer data debug:', {
                          customer,
                          ordersCount,
                          totalSpent,
                          loyaltyPoints,
                          rawTotalSpent: customer.total_spent,
                          rawOrdersCount: customer.orders_count,
                          rawLoyaltyPoints: customer.loyalty_points
                        })
                      }
                      
                      return (
                        <div
                          key={customer.id}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            assignedCustomer?.id === customer.id.toString()
                              ? 'bg-primary/20 border border-primary/30'
                              : 'hover:bg-background-tertiary'
                          }`}
                          onClick={() => {
                            if (assignedCustomer?.id === customer.id.toString()) {
                              setAssignedCustomer(null)
                            } else {
                              setAssignedCustomer({
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
                          }}
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
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Products Grid */}
          <div className="flex-1 px-0 pb-6 overflow-y-auto relative bg-black">
            <ProductGrid
              category={activeCategory === 'all' ? null : mainCategories.find(cat => cat.slug === activeCategory)?.id || null}
              searchQuery={searchQuery}
              onAddToCart={handleAddToCart}
              onProductCountChange={setProductCount}
              onLoadingChange={setIsProductsLoading}
              isCustomerViewOpen={isCustomerViewOpen}
              isListView={isListView}
            />
          </div>

          {/* Cart Sidebar */}
          <Cart
            items={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveFromCart}
            assignedCustomer={assignedCustomer}
            onAssignCustomer={handleAssignCustomer}
            onUnassignCustomer={handleUnassignCustomer}
          />
        </div>

        {/* VSCode-style Status Bar */}
        <StatusBar
          store={store ? { name: store.name, address: store.address } : undefined}
          user={user ? { name: `${user.firstName} ${user.lastName}`, role: user.role } : undefined}
          cartItemCount={cartItems.length}
          productCount={productCount}
        />

        {/* Settings Panel */}
        <SettingsPanel 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
        />
      </div>
    </AppWrapper>
  )
} 