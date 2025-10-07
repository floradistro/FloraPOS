/**
 * TV Menu Display - Clean Rewrite
 * Modern, working, VS Code themed display for TVs
 */

'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { BlueprintPricingService } from '../../services/blueprint-pricing-service'
import { Product, Category } from '../../types'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { useTVRegistration } from '@/hooks/useTVRegistration'
import { ConnectionStatusIndicator } from '@/components/tv/ConnectionStatusIndicator'

function MenuDisplayContent() {
  const searchParams = useSearchParams()
  
  // State
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // URL Parameters
  const locationId = searchParams.get('location_id') || '20'
  const tvNumber = searchParams.get('tv_number') || '1'
  const categoryFilter = searchParams.get('category')
  const isDualMenu = searchParams.get('dual') === 'true'
  const backgroundColor = searchParams.get('backgroundColor') || '#000000'
  const fontColor = searchParams.get('fontColor') || '#ffffff'
  const containerColor = searchParams.get('containerColor') || '#1f1f1f'
  const showImages = searchParams.get('showImages') !== 'false'
  
  // Dual menu params
  const leftCategory = searchParams.get('leftCategory')
  const rightCategory = searchParams.get('rightCategory')
  const leftImages = searchParams.get('leftImages') !== 'false'
  const rightImages = searchParams.get('rightImages') !== 'false'

  // TV Registration
  const [tvId, setTvId] = useState<string | null>(null)
  
  useEffect(() => {
    const storageKey = `tv-id-${locationId}-${tvNumber}`
    let storedId = localStorage.getItem(storageKey)
    
    if (!storedId) {
      storedId = crypto.randomUUID()
      localStorage.setItem(storageKey, storedId)
    }
    
    setTvId(storedId)
  }, [locationId, tvNumber])
  
  const { connectionStatus, lastCommand } = useTVRegistration({
    tvId,
    tvNumber: parseInt(tvNumber),
    locationId: parseInt(locationId),
    deviceName: `TV ${tvNumber}`,
  })

  // Fetch products
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const params = new URLSearchParams({
          per_page: '1000',
          location_id: locationId,
          _t: Date.now().toString()
        })


        const response = await fetch(`/api/proxy/flora-im/products?${params}`, {
          headers: { 'Cache-Control': 'no-cache' }
        })
        const result = await response.json()
        
        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to load products')
        }

        console.log(`✅ Loaded ${result.data.length} products`)

        // Apply blueprint pricing
        try {
          const productsWithCategories = result.data.map((p: Product) => ({
            id: p.id,
            categoryIds: p.categories?.map(c => c.id) || []
          }))
          
          const batchPricing = await BlueprintPricingService.getBlueprintPricingBatch(productsWithCategories)
          
          const enrichedProducts = result.data.map((p: Product) => ({
            ...p,
            blueprintPricing: batchPricing[p.id] || null
          }))
          
          setProducts(enrichedProducts)
        } catch (err) {
          console.warn('Pricing failed, using products without pricing:', err)
          setProducts(result.data)
        }
        
        // Extract categories
        const catMap = new Map()
        result.data.forEach((p: Product) => {
          p.categories?.forEach(cat => {
            if (!catMap.has(cat.id)) {
              catMap.set(cat.id, cat)
            }
          })
        })
        setCategories(Array.from(catMap.values()))
        
        
      } catch (err: any) {
        console.error('❌ Error loading products:', err)
        setError(err.message || 'Failed to load products')
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [locationId])

  // Render product row
  const renderProduct = (product: Product, index: number) => {
    const price = product.blueprintPricing?.calculated_price || product.regular_price || '0'
    const priceNum = parseFloat(price.toString())

    return (
      <div
        key={product.id}
        className={`group flex items-center gap-4 py-3 px-6 border-b border-[#3e3e3e]/50 hover:bg-[#2a2a2a]/50 transition-all ${
          index % 2 === 0 ? 'bg-[#1e1e1e]/30' : 'bg-transparent'
        }`}
        style={{ color: fontColor }}
      >
        {/* Number */}
        <div className="w-12 text-center flex-shrink-0">
          <span className="text-sm font-mono text-gray-500">
            {(index + 1).toString().padStart(2, '0')}
          </span>
        </div>

        {/* Image */}
        {showImages && (
          <div className="w-14 h-14 rounded-lg overflow-hidden bg-black/30 flex-shrink-0">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
        )}

        {/* Name */}
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-semibold text-white group-hover:text-[#007acc] transition-colors truncate">
            {product.name}
          </h3>
        </div>

        {/* Price */}
        {priceNum > 0 && (
          <div className="text-3xl font-bold text-[#4ec9b0] flex-shrink-0">
            ${priceNum.toFixed(2)}
          </div>
        )}

        {/* Stock */}
        {product.stock_status && (
          <div className={`flex-shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
            product.stock_status === 'instock'
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              product.stock_status === 'instock' ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`} />
            {product.stock_status === 'instock' ? 'In Stock' : 'Sold Out'}
          </div>
        )}

        {/* Hover accent */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#007acc] transform scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center" style={{ backgroundColor }}>
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-400">Loading menu...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center" style={{ backgroundColor }}>
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-xl text-red-400 font-semibold mb-2">Error</p>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    )
  }

  // SINGLE MENU
  if (!isDualMenu) {
    // Filter products by selected category
    let displayProducts = products
    let displayCategory = 'All Products'
    
    if (categoryFilter) {
      const cat = categories.find(c => c.slug === categoryFilter)
      if (cat) {
        displayProducts = products.filter(p => p.categories?.some(c => c.id === cat.id))
        displayCategory = cat.name
        console.log(`✅ Showing category "${cat.name}" with ${displayProducts.length} products`)
      }
    } else {
      // Default to first category
      const firstCat = categories.find(cat => products.some(p => p.categories?.some(c => c.id === cat.id)))
      if (firstCat) {
        displayProducts = products.filter(p => p.categories?.some(c => c.id === firstCat.id))
        displayCategory = firstCat.name
        console.log(`✅ Showing default category "${firstCat.name}" with ${displayProducts.length} products`)
      }
    }

    return (
      <div className="h-screen w-screen flex flex-col overflow-hidden" style={{ backgroundColor }}>
        {/* Header */}
        <div className="px-8 py-4 border-b border-[#007acc]/20 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-2 h-14 bg-gradient-to-b from-[#007acc] to-[#4ec9b0] rounded-full" />
            <div>
              <h1 className="text-4xl font-bold text-white">
                {displayCategory}
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                {displayProducts.length} items available
              </p>
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {displayProducts.length > 0 ? (
            <div className="rounded-xl overflow-hidden border border-[#3e3e3e] bg-[#1e1e1e]/50">
              {displayProducts.map((product, idx) => renderProduct(product, idx))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-[#007acc]/10 border border-[#007acc]/20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-[#007acc]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <p className="text-2xl font-semibold text-white mb-2">No Products</p>
                <p className="text-gray-400">No products found in this category</p>
              </div>
            </div>
          )}
        </div>

        {/* Connection Status */}
        {tvId && (
          <ConnectionStatusIndicator
            status={connectionStatus}
            tvId={tvId}
            lastCommand={lastCommand}
          />
        )}
      </div>
    )
  }

  // DUAL MENU
  const leftProducts = leftCategory 
    ? products.filter(p => p.categories?.some(c => c.slug === leftCategory))
    : []
  const rightProducts = rightCategory
    ? products.filter(p => p.categories?.some(c => c.slug === rightCategory))
    : []
  
  const leftCatName = categories.find(c => c.slug === leftCategory)?.name || 'Menu'
  const rightCatName = categories.find(c => c.slug === rightCategory)?.name || 'Menu'

  return (
    <div className="h-screen w-screen flex" style={{ backgroundColor }}>
      {/* Left Panel */}
      <div className="flex-1 flex flex-col border-r-2 border-[#007acc]/30 overflow-hidden">
        <div className="px-6 py-3 border-b border-[#007acc]/20 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-2 h-12 bg-gradient-to-b from-[#007acc] to-[#4ec9b0] rounded-full" />
            <div>
              <h2 className="text-3xl font-bold text-white">{leftCatName}</h2>
              <p className="text-xs text-gray-400">{leftProducts.length} items</p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="rounded-xl overflow-hidden border border-[#3e3e3e] bg-[#1e1e1e]/50">
            {leftProducts.map((p, idx) => renderProduct(p, idx))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 py-3 border-b border-[#007acc]/20 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-2 h-12 bg-gradient-to-b from-[#4ec9b0] to-[#007acc] rounded-full" />
            <div>
              <h2 className="text-3xl font-bold text-white">{rightCatName}</h2>
              <p className="text-xs text-gray-400">{rightProducts.length} items</p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="rounded-xl overflow-hidden border border-[#3e3e3e] bg-[#1e1e1e]/50">
            {rightProducts.map((p, idx) => renderProduct(p, idx))}
          </div>
        </div>
      </div>

      {/* Connection Status */}
      {tvId && (
        <ConnectionStatusIndicator
          status={connectionStatus}
          tvId={tvId}
          lastCommand={lastCommand}
        />
      )}
    </div>
  )
}

export default function MenuDisplayPage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-screen flex items-center justify-center bg-[#1e1e1e]">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <MenuDisplayContent />
    </Suspense>
  )
}

