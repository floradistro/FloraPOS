/**
 * TV Menu Display - Complete Rewrite
 * Modern, VS Code themed, works perfectly
 */

'use client'

import React, { useState, useEffect, useCallback, Suspense, memo } from 'react'
import { useSearchParams } from 'next/navigation'
import { apiFetch } from '../../lib/api-fetch'
import { BlueprintPricingService } from '../../services/blueprint-pricing-service'
import { Product, Category } from '../../types'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { useTVRegistration } from '@/hooks/useTVRegistration'
import { ConnectionStatusIndicator } from '@/components/tv/ConnectionStatusIndicator'
import { MagicBackground } from '../../components/ui/MagicBackground'
import { loadGoogleFont } from '../../lib/fonts'
import { hexToRgba } from '../../lib/color-utils'

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
  const orientation = (searchParams.get('orientation') as 'horizontal' | 'vertical') || 'horizontal'
  const categoryFilter = searchParams.get('category')
  const viewMode = (searchParams.get('viewMode') as 'table' | 'card' | 'auto') || 'auto'
  const isDualMenu = searchParams.get('dual') === 'true'
  const backgroundColor = searchParams.get('backgroundColor') || '#000000'
  const fontColor = searchParams.get('fontColor') || '#ffffff'
  const cardFontColor = searchParams.get('cardFontColor') || '#ffffff'
  const containerColor = searchParams.get('containerColor') || '#1a1a1a'
  const imageBackgroundColor = searchParams.get('imageBackgroundColor') || '#1a1a1a'
  const titleFont = searchParams.get('titleFont') || 'Tiempos, serif'
  const pricingFont = searchParams.get('pricingFont') || 'Tiempos, serif'
  const cardFont = searchParams.get('cardFont') || 'Tiempos, serif'
  const showImages = searchParams.get('showImages') === 'true'
  const priceLocation = (searchParams.get('priceLocation') as 'none' | 'header' | 'inline') || 'none'
  
  // Transparency and border controls
  const containerOpacity = parseInt(searchParams.get('containerOpacity') || '100')
  const borderWidth = parseInt(searchParams.get('borderWidth') || '1')
  const borderOpacity = parseInt(searchParams.get('borderOpacity') || '100')
  const imageOpacity = parseInt(searchParams.get('imageOpacity') || '100')
  const blurIntensity = parseInt(searchParams.get('blurIntensity') || '8')
  const glowIntensity = parseInt(searchParams.get('glowIntensity') || '40')
  
  // Font sizes
  const headerTitleSize = parseInt(searchParams.get('headerTitleSize') || '60')
  const cardTitleSize = parseInt(searchParams.get('cardTitleSize') || '18')
  const priceSize = parseInt(searchParams.get('priceSize') || '32')
  const categorySize = parseInt(searchParams.get('categorySize') || '40')
  
  // Get custom background from localStorage (not URL to avoid 431 error)
  const magicBgId = searchParams.get('magicBgId')
  const customBackground = magicBgId && typeof window !== 'undefined' 
    ? localStorage.getItem(magicBgId) || '' 
    : ''
  
  console.log('🎨 [TV DISPLAY] View mode from URL:', viewMode)
  console.log('📐 [TV DISPLAY] Orientation from URL:', orientation)
  console.log('📏 [TV DISPLAY] Font sizes from URL:', {
    headerTitleSize,
    cardTitleSize,
    priceSize,
    categorySize
  })
  
  // Dual menu params
  const leftCategory = searchParams.get('leftCategory')
  const rightCategory = searchParams.get('rightCategory')
  const leftViewMode = (searchParams.get('leftViewMode') as 'table' | 'card' | 'auto') || 'auto'
  const rightViewMode = (searchParams.get('rightViewMode') as 'table' | 'card' | 'auto') || 'auto'
  const leftImages = searchParams.get('leftImages') === 'true'
  const rightImages = searchParams.get('rightImages') === 'true'
  const leftPriceLocation = (searchParams.get('leftPriceLocation') as 'header' | 'inline') || 'inline'
  const rightPriceLocation = (searchParams.get('rightPriceLocation') as 'header' | 'inline') || 'inline'
  
  // Quad stacking params (left/right bottom quadrants)
  const leftCategory2 = searchParams.get('leftCategory2')
  const rightCategory2 = searchParams.get('rightCategory2')
  const leftViewMode2 = (searchParams.get('leftViewMode2') as 'table' | 'card' | 'auto') || 'auto'
  const rightViewMode2 = (searchParams.get('rightViewMode2') as 'table' | 'card' | 'auto') || 'auto'
  const leftImages2 = searchParams.get('leftImages2') === 'true'
  const rightImages2 = searchParams.get('rightImages2') === 'true'
  const leftPriceLocation2 = (searchParams.get('leftPriceLocation2') as 'header' | 'inline') || 'inline'
  const rightPriceLocation2 = (searchParams.get('rightPriceLocation2') as 'header' | 'inline') || 'inline'
  const enableLeftStacking = searchParams.get('enableLeftStacking') === 'true'
  const enableRightStacking = searchParams.get('enableRightStacking') === 'true'

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
  
  // Handle incoming commands
  const handleCommand = useCallback((command: any) => {
    console.log('📺 [TV DISPLAY] Received command:', command.command_type)
    
    if (command.command_type === 'refresh_inventory' || command.command_type === 'refresh') {
      // Reload products when inventory changes
      console.log('🔄 [TV DISPLAY] Reloading page...')
      window.location.reload()
    } else if (command.command_type === 'update_theme') {
      const payload = command.payload
      
      // Check if this is a close window command
      if (payload?.closeWindow) {
        console.log('🚪 [TV DISPLAY] Closing window...')
        window.close()
        return
      }
      
      console.log('🎨 [TV DISPLAY] Updating theme...')
      const currentUrl = new URL(window.location.href)
      
      // Update URL params with new config
      if (payload.orientation) currentUrl.searchParams.set('orientation', payload.orientation)
      if (payload.backgroundColor) currentUrl.searchParams.set('backgroundColor', payload.backgroundColor)
      if (payload.fontColor) currentUrl.searchParams.set('fontColor', payload.fontColor)
      if (payload.cardFontColor) currentUrl.searchParams.set('cardFontColor', payload.cardFontColor)
      if (payload.containerColor) currentUrl.searchParams.set('containerColor', payload.containerColor)
      if (payload.imageBackgroundColor) currentUrl.searchParams.set('imageBackgroundColor', payload.imageBackgroundColor)
      if (payload.titleFont) currentUrl.searchParams.set('titleFont', payload.titleFont)
      if (payload.pricingFont) currentUrl.searchParams.set('pricingFont', payload.pricingFont)
      if (payload.cardFont) currentUrl.searchParams.set('cardFont', payload.cardFont)
      if (payload.containerOpacity !== undefined) currentUrl.searchParams.set('containerOpacity', payload.containerOpacity.toString())
      if (payload.borderWidth !== undefined) currentUrl.searchParams.set('borderWidth', payload.borderWidth.toString())
      if (payload.borderOpacity !== undefined) currentUrl.searchParams.set('borderOpacity', payload.borderOpacity.toString())
      if (payload.imageOpacity !== undefined) currentUrl.searchParams.set('imageOpacity', payload.imageOpacity.toString())
      if (payload.blurIntensity !== undefined) currentUrl.searchParams.set('blurIntensity', payload.blurIntensity.toString())
      if (payload.glowIntensity !== undefined) currentUrl.searchParams.set('glowIntensity', payload.glowIntensity.toString())
      
      // Handle font sizes
      if (payload.headerTitleSize !== undefined) currentUrl.searchParams.set('headerTitleSize', payload.headerTitleSize.toString())
      if (payload.cardTitleSize !== undefined) currentUrl.searchParams.set('cardTitleSize', payload.cardTitleSize.toString())
      if (payload.priceSize !== undefined) currentUrl.searchParams.set('priceSize', payload.priceSize.toString())
      if (payload.categorySize !== undefined) currentUrl.searchParams.set('categorySize', payload.categorySize.toString())
      
      // Handle custom background
      if (payload.customBackground) {
        const bgId = `magic-bg-${Date.now()}`
        localStorage.setItem(bgId, payload.customBackground)
        currentUrl.searchParams.set('magicBgId', bgId)
        console.log('🎨 [TV DISPLAY] Saved custom background to localStorage:', bgId)
      }
      
      if (payload.isDualMenu) {
        currentUrl.searchParams.set('dual', 'true')
        if (payload.leftPanel) {
          if (payload.leftPanel.category) currentUrl.searchParams.set('leftCategory', payload.leftPanel.category)
          currentUrl.searchParams.set('leftViewMode', payload.leftPanel.viewMode || 'auto')
          currentUrl.searchParams.set('leftPriceLocation', payload.leftPanel.priceLocation || 'inline')
          currentUrl.searchParams.set('leftImages', payload.leftPanel.showImages ? 'true' : 'false')
        }
        if (payload.rightPanel) {
          if (payload.rightPanel.category) currentUrl.searchParams.set('rightCategory', payload.rightPanel.category)
          currentUrl.searchParams.set('rightViewMode', payload.rightPanel.viewMode || 'auto')
          currentUrl.searchParams.set('rightPriceLocation', payload.rightPanel.priceLocation || 'inline')
          currentUrl.searchParams.set('rightImages', payload.rightPanel.showImages ? 'true' : 'false')
        }
      } else if (payload.singleMenu) {
        currentUrl.searchParams.delete('dual')
        if (payload.singleMenu.category) currentUrl.searchParams.set('category', payload.singleMenu.category)
        currentUrl.searchParams.set('viewMode', payload.singleMenu.viewMode || 'auto')
        currentUrl.searchParams.set('priceLocation', payload.singleMenu.priceLocation || 'inline')
        currentUrl.searchParams.set('showImages', payload.singleMenu.showImages ? 'true' : 'false')
      }
      
      console.log('✅ [TV DISPLAY] Applying new config:', currentUrl.search)
      window.location.href = currentUrl.href
    }
  }, [])

  const { connectionStatus, lastCommand } = useTVRegistration({
    tvId,
    tvNumber: parseInt(tvNumber),
    locationId: parseInt(locationId),
    deviceName: `TV ${tvNumber}`,
    onCommand: handleCommand,
  })
  
  // Disable animations on body for TV displays
  useEffect(() => {
    document.body.classList.add('tv-display-active')
    document.documentElement.style.overflow = 'hidden'
    
    return () => {
      document.body.classList.remove('tv-display-active')
    }
  }, [])
  
  // Load fonts dynamically
  useEffect(() => {
    loadGoogleFont(titleFont)
    loadGoogleFont(pricingFont)
    loadGoogleFont(cardFont)
  }, [titleFont, pricingFont, cardFont])

  // Fetch products - EXACT SAME as MenuView
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true)
        setError(null)
      
      const params = new URLSearchParams({
        per_page: '1000',
        page: '1',
        location_id: locationId,
        _t: Math.floor(Date.now() / 300000).toString() // Cache for 5 minutes (same as ProductGrid)
        })
      

        // Use optimized bulk endpoint
        const response = await apiFetch(`/api/proxy/flora-im/products/bulk?${params}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Expires': '0'
          }
        })
        const result = await response.json()
        
        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to load products')
        }
        
        console.log(`📦 [TV DISPLAY] Loaded ${result.data.length} products for location ${locationId}`)

        // Apply blueprint pricing - BATCH (same as MenuView)
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
          
          // Filter to show only products with stock > 0 at current location
          const inStockProducts = enrichedProducts.filter((product: Product) => {
            const locationInventory = product.inventory?.find((inv: any) => 
              inv.location_id?.toString() === locationId
            )
            const locationStock = locationInventory ? (parseFloat(locationInventory.stock?.toString() || '0') || 0) : 0
            
            // Debug logging for products with 0 stock
            if (locationStock === 0 && product.name?.toLowerCase().includes('animal')) {
              console.log(`🚫 [TV DISPLAY] Filtering out "${product.name}" - Stock: ${locationStock} at location ${locationId}`, {
                locationInventory,
                allInventory: product.inventory
              })
            }
            
            return locationStock > 0
          })
          
          console.log(`✅ [TV DISPLAY] Filtered to ${inStockProducts.length} in-stock products at location ${locationId}`)
          
          // Only update if products actually changed
          setProducts(prev => {
            if (JSON.stringify(prev) === JSON.stringify(inStockProducts)) {
              return prev
            }
            return inStockProducts
          })
        } catch (err) {
          // Even on pricing error, filter by location-specific stock
          const inStockProducts = result.data.filter((product: Product) => {
            const locationInventory = product.inventory?.find((inv: any) => 
              inv.location_id?.toString() === locationId
            )
            const locationStock = locationInventory ? (parseFloat(locationInventory.stock?.toString() || '0') || 0) : 0
            return locationStock > 0
          })
          
          setProducts(prev => {
            if (JSON.stringify(prev) === JSON.stringify(inStockProducts)) {
              return prev
            }
            return inStockProducts
          })
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
        const extractedCategories = Array.from(catMap.values())
        
        // Only update categories if changed
        setCategories(prev => {
          if (JSON.stringify(prev) === JSON.stringify(extractedCategories)) {
            return prev
          }
          return extractedCategories
        })
        
      } catch (err: any) {
        setError(err.message || 'Failed to load products')
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
    
    // Refresh products every 5 minutes (same as ProductGrid cache)
    const refreshInterval = setInterval(() => {
      loadProducts()
    }, 300000)
    
    return () => {
      clearInterval(refreshInterval)
    }
  }, [locationId])

  // Render product card - PREMIUM APPLE-STYLE (memoized)
  const renderProductCard = useCallback((product: Product, panelShowImages: boolean, panelPriceLocation: 'header' | 'inline' | 'none') => {
    const priceNum = product.blueprintPricing?.calculated_price ? parseFloat(product.blueprintPricing.calculated_price.toString()) : parseFloat(product.regular_price || '0')
    const pricingTiers = product.blueprintPricing?.ruleGroups?.[0]?.tiers || []
    const hasTiers = pricingTiers.length > 0

    // Calculate alpha values for transparency
    const containerAlpha = Math.round((containerOpacity / 100) * 240).toString(16).padStart(2, '0')
    const borderAlpha = (borderOpacity / 100).toFixed(2)

    return (
      <div
        key={product.id}
        className="group rounded-2xl p-4 flex flex-col"
        style={{ 
          background: `linear-gradient(135deg, ${containerColor}${containerAlpha} 0%, ${containerColor}${Math.round((containerOpacity / 100) * 224).toString(16).padStart(2, '0')} 100%)`,
          border: `${borderWidth}px solid rgba(255, 255, 255, ${borderAlpha})`,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          backdropFilter: `blur(${blurIntensity}px)`,
          willChange: 'auto'
        }}
      >
        {panelShowImages && product.image && (
          <div 
            className="aspect-square rounded-xl overflow-hidden mb-3 flex-shrink-0" 
            style={{ 
              background: `${imageBackgroundColor}${Math.round((imageOpacity / 100) * 255).toString(16).padStart(2, '0')}`,
              boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.3)'
            }}
          >
            <img 
              src={product.image} 
              alt={product.name} 
              className="w-full h-full object-cover" 
            />
          </div>
        )}
        <h3 
          className="font-bold mb-2 line-clamp-2 flex-shrink-0" 
          style={{ 
            fontSize: `${cardTitleSize}px`,
            color: cardFontColor, 
            minHeight: `${cardTitleSize * 2.5}px`, 
            fontFamily: cardFont,
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
            letterSpacing: '-0.02em',
            lineHeight: '1.2'
          }}
        >
          {product.name}
        </h3>
        
        {/* Only show pricing if inline mode */}
        {panelPriceLocation === 'inline' && (
          hasTiers ? (
            <div className="space-y-1.5">
              {pricingTiers.slice(0, 2).map((tier: any, idx: number) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between text-sm rounded-lg px-2 py-1"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <span style={{ color: `${cardFontColor}CC`, fontFamily: pricingFont, fontSize: '0.85rem', fontWeight: 500 }}>{tier.label}</span>
                  <span className="font-bold" style={{ color: cardFontColor, fontFamily: pricingFont, fontSize: '1rem' }}>
                    ${parseFloat(tier.price).toFixed(2)}
                  </span>
                </div>
              ))}
              {pricingTiers.length > 2 && (
                <div className="text-xs text-center py-1" style={{ color: `${cardFontColor}99`, fontFamily: pricingFont }}>+{pricingTiers.length - 2} more options</div>
              )}
            </div>
          ) : priceNum > 0 && (
            <div 
              className="font-bold mt-auto" 
              style={{ 
                fontSize: `${priceSize}px`,
                color: cardFontColor,
                fontFamily: pricingFont
              }}
            >
              ${priceNum.toFixed(2)}
            </div>
          )
        )}
      </div>
    )
  }, [containerColor, imageBackgroundColor, cardFontColor, cardFont, pricingFont, containerOpacity, borderWidth, borderOpacity, cardTitleSize, priceSize])
  
  // Render product row (memoized)
  const renderProduct = useCallback((product: Product, index: number, panelPriceLocation: 'header' | 'inline' | 'none' = priceLocation, panelShowImages: boolean = showImages) => {
    const price = product.blueprintPricing?.calculated_price || product.regular_price || '0'
    const priceNum = parseFloat(price.toString())
    
    // Get REAL pricing tiers from blueprint pricing
    const blueprintData = product.blueprintPricing
    
    // Extract tiers from YOUR REAL structure: blueprintPricing.ruleGroups[0].tiers
    const pricingTiers = blueprintData?.ruleGroups?.[0]?.tiers || []
    const hasTiers = pricingTiers.length > 0

    // Calculate alpha values for row transparency
    const rowAlpha1 = Math.round((containerOpacity / 100) * 64).toString(16).padStart(2, '0')
    const rowAlpha2 = Math.round((containerOpacity / 100) * 32).toString(16).padStart(2, '0')
    const borderAlpha = (borderOpacity / 100).toFixed(2)

    return (
      <div
        key={product.id}
        className="group flex items-center gap-4 py-3 px-5"
        style={{
          background: index % 2 === 0 
            ? `linear-gradient(90deg, ${containerColor}${rowAlpha1} 0%, ${containerColor}${rowAlpha2} 100%)` 
            : `rgba(255, 255, 255, ${(containerOpacity / 100) * 0.02})`,
          borderBottom: `${borderWidth}px solid rgba(255, 255, 255, ${borderAlpha})`,
          color: fontColor,
          willChange: 'auto',
          backdropFilter: `blur(${blurIntensity}px)`
        }}
      >
        {/* Image */}
        {panelShowImages && (
          <div 
            className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0" 
            style={{ 
              background: `${imageBackgroundColor}${Math.round((imageOpacity / 100) * 255).toString(16).padStart(2, '0')}`,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-8 h-8" style={{ color: `${fontColor}30` }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
        )}

        {/* Name */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold truncate" style={{ 
            fontSize: `${cardTitleSize}px`,
            color: fontColor, 
            fontFamily: cardFont,
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            letterSpacing: '-0.01em'
          }}>
            {product.name}
          </h3>
        </div>
        
        {/* Pricing Tiers (inline mode) - Premium */}
        {panelPriceLocation === 'inline' && hasTiers && (
          <div className="flex items-center gap-3 flex-shrink-0">
            {pricingTiers.map((tier: any, idx: number) => (
              <div 
                key={idx} 
                  className="text-center px-4 py-2 rounded-xl"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
              >
                <div className="text-[10px] mb-1 uppercase tracking-wider font-semibold" style={{ color: `${fontColor}CC`, fontFamily: cardFont }}>
                  {tier.label}
                </div>
                <div className="font-bold" style={{ 
                  fontSize: `${priceSize * 0.5}px`,
                  color: fontColor, 
                  fontFamily: cardFont
                }}>
                  ${parseFloat(tier.price).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Single Price (inline mode, no tiers) */}
        {panelPriceLocation === 'inline' && !hasTiers && priceNum > 0 && (
          <div 
            className="font-bold flex-shrink-0 text-right px-5 py-2 rounded-xl"
            style={{
              fontSize: `${priceSize}px`,
              background: `${containerColor}60`,
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: fontColor,
              fontFamily: cardFont,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
            }}
          >
            ${priceNum.toFixed(2)}
          </div>
        )}

      </div>
    )
  }, [containerColor, imageBackgroundColor, fontColor, cardFont, pricingFont, priceLocation, showImages, containerOpacity, borderWidth, borderOpacity, cardTitleSize, priceSize])

  // Loading
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center tv-menu-display" style={{ backgroundColor }}>
        <div className="text-center">
        <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-400">Loading menu...</p>
        </div>
      </div>
    )
  }

  // Error
  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center tv-menu-display" style={{ backgroundColor }}>
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
    let displayProducts = products
    let displayCategory = 'Menu'
    let showDefaultEmptyState = false
    
    if (categoryFilter) {
      // ALWAYS filter by slug directly - don't rely on categories array being populated
      displayProducts = products.filter(p => p.categories?.some(c => c.slug === categoryFilter))
      
      // Try to get nice display name from categories array if available
      const cat = categories.find(c => c.slug === categoryFilter)
      displayCategory = cat?.name || categoryFilter
      
      console.log(`📊 [TV DISPLAY] Category: "${displayCategory}" (slug: ${categoryFilter})`)
      console.log(`📦 [TV DISPLAY] Showing ${displayProducts.length} of ${products.length} products`)
      
      // Only show empty state if we have products loaded but none match
      if (products.length > 0 && displayProducts.length === 0) {
        console.warn(`⚠️ [TV DISPLAY] No products found for category "${categoryFilter}"`)
        showDefaultEmptyState = true
      }
    } else {
      // No category selected - show empty state
      showDefaultEmptyState = true
      displayProducts = []
    }
    
    // Calculate price range for header display - from ALL tiers
    const allTierPrices: number[] = []
    displayProducts.forEach(p => {
      const tiers = p.blueprintPricing?.ruleGroups?.[0]?.tiers || []
      if (tiers.length > 0) {
        tiers.forEach((tier: any) => {
          allTierPrices.push(parseFloat(tier.price))
        })
      } else {
        const price = parseFloat((p.blueprintPricing?.calculated_price || p.regular_price || '0').toString())
        if (price > 0) allTierPrices.push(price)
      }
    })
    const minPrice = allTierPrices.length > 0 ? Math.min(...allTierPrices) : 0
    const maxPrice = allTierPrices.length > 0 ? Math.max(...allTierPrices) : 0

    // Show default empty state with logo
    if (showDefaultEmptyState) {
      return (
        <div className="h-screen w-screen flex items-center justify-center tv-menu-display" style={{ backgroundColor }}>
          <div className="text-center">
            <img 
              src="/logo123.png" 
              alt="Logo" 
              className="mx-auto mb-8 max-w-md w-full px-8"
              style={{ filter: 'brightness(0.9)' }}
            />
            <p className="text-xl text-gray-400 font-light" style={{ fontFamily: titleFont }}>
              Select a category to display
            </p>
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

    return (
      <div className="h-screen w-screen flex flex-col overflow-hidden tv-menu-display relative" style={{ backgroundColor }}>
        {/* Magic Background */}
        {customBackground && <MagicBackground key={customBackground} htmlCode={customBackground} />}
        
        {/* Header */}
        <div className="flex-shrink-0 relative z-10" style={{
          paddingLeft: `${Math.max(32, headerTitleSize * 0.4)}px`,
          paddingRight: `${Math.max(32, headerTitleSize * 0.4)}px`,
          paddingTop: `${Math.max(16, headerTitleSize * 0.25)}px`,
          paddingBottom: `${Math.max(16, headerTitleSize * 0.25)}px`, 
          background: `linear-gradient(180deg, ${containerColor}80 0%, ${containerColor}40 100%)`,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
          backdropFilter: `blur(${blurIntensity}px)`
        }}>
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center min-w-0" style={{ gap: `${Math.max(12, headerTitleSize * 0.2)}px` }}>
              <div className="rounded-full flex-shrink-0" style={{ 
                width: `${Math.max(6, headerTitleSize * 0.08)}px`,
                minHeight: `${Math.max(60, headerTitleSize * 0.8)}px`,
                background: `linear-gradient(180deg, ${fontColor}FF 0%, ${fontColor}60 100%)`,
                boxShadow: `0 0 ${glowIntensity * 0.5}px ${hexToRgba(fontColor, 0.8)}, 0 0 ${glowIntensity}px ${hexToRgba(fontColor, 0.4)}`
              }} />
              <div className="min-w-0">
                <h1 className="font-black truncate" style={{ 
                  fontSize: `${headerTitleSize}px`,
                  color: fontColor, 
                  fontFamily: titleFont,
                  textShadow: `0 4px 12px rgba(0, 0, 0, 0.5), 0 0 ${glowIntensity}px ${hexToRgba(fontColor, 0.6)}, 0 0 ${glowIntensity * 2}px ${hexToRgba(fontColor, 0.3)}`,
                  letterSpacing: '-0.03em',
                  lineHeight: '1'
                }}>
                  {displayCategory}
                </h1>
              </div>
            </div>
            
            {/* All Pricing Tiers in Header (header mode) */}
            {priceLocation === 'header' && displayProducts.length > 0 && (() => {
              // Get first product with tiers to show tier structure
              const firstProductWithTiers = displayProducts.find(p => p.blueprintPricing?.ruleGroups?.[0]?.tiers?.length > 0)
              const tierStructure = firstProductWithTiers?.blueprintPricing?.ruleGroups?.[0]?.tiers || []
              
              return tierStructure.length > 0 ? (
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-4">
                    {tierStructure.map((tier: any, idx: number) => (
                      <div 
                        key={idx} 
                        className="text-center rounded-2xl backdrop-blur-xl"
                        style={{
                          paddingLeft: `${Math.max(16, priceSize * 0.3)}px`,
                          paddingRight: `${Math.max(16, priceSize * 0.3)}px`,
                          paddingTop: `${Math.max(12, priceSize * 0.25)}px`,
                          paddingBottom: `${Math.max(12, priceSize * 0.25)}px`,
                          background: `${containerColor}80`,
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                        }}
                      >
                        <div className="mb-2 uppercase tracking-widest font-bold" style={{ fontSize: `${priceSize * 0.3}px`, color: `${fontColor}DD`, fontFamily: pricingFont }}>
                          {tier.label} {tier.unit}
                        </div>
                        <div className="font-black" style={{ 
                          fontSize: `${priceSize * 1.5}px`,
                          color: fontColor, 
                          fontFamily: pricingFont,
                          letterSpacing: '-0.02em',
                          lineHeight: '1'
                        }}>
                          ${parseFloat(tier.price).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : minPrice > 0 ? (
                <div className="text-right flex-shrink-0">
                  <div 
                    className="text-5xl font-black px-8 py-4 rounded-2xl backdrop-blur-xl" 
                    style={{ 
                      background: `${containerColor}80`,
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: fontColor, 
                      fontFamily: pricingFont,
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
                    }}
                  >
                    ${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}
                  </div>
                </div>
              ) : null
            })()}
          </div>
        </div>

        {/* Products */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-5 relative z-10">
          {displayProducts.length > 0 ? (
            (() => {
              const actualMode = viewMode === 'auto' ? (displayProducts.length > 20 ? 'table' : 'card') : viewMode;
              
              return actualMode === 'card' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-min">
                  {displayProducts.map(product => renderProductCard(product, showImages, priceLocation))}
                </div>
              ) : (() => {
                const maxItemsPerColumn = 12;
                const useDoubleColumn = displayProducts.length > maxItemsPerColumn;
                
                if (useDoubleColumn) {
                  const midPoint = Math.ceil(displayProducts.length / 2);
                  const leftCol = displayProducts.slice(0, midPoint);
                  const rightCol = displayProducts.slice(midPoint);
                  
                  return (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-2xl overflow-hidden backdrop-blur-xl" style={{ 
                        background: `linear-gradient(135deg, ${containerColor}${Math.round((containerOpacity / 100) * 96).toString(16).padStart(2, '0')} 0%, ${containerColor}${Math.round((containerOpacity / 100) * 64).toString(16).padStart(2, '0')} 100%)`,
                        border: `${borderWidth}px solid rgba(255, 255, 255, ${(borderOpacity / 100)})`,
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                      }}>
                        {leftCol.map((product, idx) => renderProduct(product, idx, priceLocation, showImages))}
                      </div>
                      <div className="rounded-2xl overflow-hidden backdrop-blur-xl" style={{ 
                        background: `linear-gradient(135deg, ${containerColor}${Math.round((containerOpacity / 100) * 96).toString(16).padStart(2, '0')} 0%, ${containerColor}${Math.round((containerOpacity / 100) * 64).toString(16).padStart(2, '0')} 100%)`,
                        border: `${borderWidth}px solid rgba(255, 255, 255, ${(borderOpacity / 100)})`,
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                      }}>
                        {rightCol.map((product, idx) => renderProduct(product, idx, priceLocation, showImages))}
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="rounded-2xl overflow-hidden backdrop-blur-xl" style={{ 
                      background: `linear-gradient(135deg, ${containerColor}${Math.round((containerOpacity / 100) * 96).toString(16).padStart(2, '0')} 0%, ${containerColor}${Math.round((containerOpacity / 100) * 64).toString(16).padStart(2, '0')} 100%)`,
                      border: `${borderWidth}px solid rgba(255, 255, 255, ${(borderOpacity / 100)})`,
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                    }}>
                      {displayProducts.map((product, idx) => renderProduct(product, idx, priceLocation, showImages))}
                    </div>
                  );
                }
              })();
            })()
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-[#007acc]/10 border border-[#007acc]/20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-[#007acc]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <p className="text-2xl font-semibold text-white mb-2">No Products</p>
                <p className="text-gray-400">No products in this category</p>
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
  
  // QUAD STACKING
  const leftProducts2 = enableLeftStacking && leftCategory2
    ? products.filter(p => p.categories?.some(c => c.slug === leftCategory2))
    : []
  const rightProducts2 = enableRightStacking && rightCategory2
    ? products.filter(p => p.categories?.some(c => c.slug === rightCategory2))
    : []
  
  const leftCatName = categories.find(c => c.slug === leftCategory)?.name || leftCategory || 'Menu'
  const rightCatName = categories.find(c => c.slug === rightCategory)?.name || rightCategory || 'Menu'
  const leftCatName2 = categories.find(c => c.slug === leftCategory2)?.name || leftCategory2 || ''
  const rightCatName2 = categories.find(c => c.slug === rightCategory2)?.name || rightCategory2 || ''
  
  console.log(`📊 [TV DISPLAY] Dual menu products: Left=${leftProducts.length} (${leftCatName}), Right=${rightProducts.length} (${rightCatName})`)
  
  // Get pricing tiers for headers
  const leftFirstWithTiers = leftProducts.find(p => p.blueprintPricing?.ruleGroups?.[0]?.tiers?.length > 0)
  const leftHeaderTiers = leftFirstWithTiers?.blueprintPricing?.ruleGroups?.[0]?.tiers || []
  
  const rightFirstWithTiers = rightProducts.find(p => p.blueprintPricing?.ruleGroups?.[0]?.tiers?.length > 0)
  const rightHeaderTiers = rightFirstWithTiers?.blueprintPricing?.ruleGroups?.[0]?.tiers || []


  return (
    <div className="h-screen w-screen flex overflow-hidden tv-menu-display relative" style={{ backgroundColor }}>
      {/* Magic Background */}
      {customBackground && <MagicBackground key={customBackground} htmlCode={customBackground} />}
      
      {/* Left Panel - with stacking support */}
      <div className="w-1/2 flex flex-col border-r overflow-hidden flex-shrink-0 relative z-10" style={{ borderRightColor: `${containerColor}40` }}>
        {/* Left Top Quadrant */}
        <div className={`${enableLeftStacking && leftCategory2 ? 'h-1/2 border-b' : 'h-full'} flex flex-col`} style={{ borderColor: enableLeftStacking && leftCategory2 ? `${containerColor}40` : undefined }}>
        <div className="flex-shrink-0" style={{ 
          paddingLeft: `${Math.max(16, categorySize * 0.4)}px`,
          paddingRight: `${Math.max(16, categorySize * 0.4)}px`,
          paddingTop: `${Math.max(12, categorySize * 0.3)}px`,
          paddingBottom: `${Math.max(12, categorySize * 0.3)}px`,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          borderBottomColor: `${containerColor}40`,
          background: `linear-gradient(180deg, ${containerColor}60 0%, ${containerColor}30 100%)`,
          backdropFilter: `blur(${blurIntensity * 0.5}px)`
        }}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center min-w-0" style={{ gap: `${Math.max(8, categorySize * 0.2)}px` }}>
              <div className="rounded-full flex-shrink-0" style={{ 
                width: `${Math.max(4, categorySize * 0.08)}px`,
                minHeight: `${categorySize * 1.2}px`, 
                backgroundColor: `${fontColor}30`,
                boxShadow: `0 0 ${glowIntensity * 0.3}px ${hexToRgba(fontColor, 0.6)}`
              }} />
              <div className="min-w-0">
                <h2 className="font-bold truncate" style={{ 
                  fontSize: `${categorySize}px`, 
                  color: fontColor, 
                  fontFamily: titleFont, 
                  lineHeight: '1',
                  textShadow: `0 2px 8px rgba(0, 0, 0, 0.4), 0 0 ${glowIntensity * 0.5}px ${hexToRgba(fontColor, 0.5)}, 0 0 ${glowIntensity}px ${hexToRgba(fontColor, 0.2)}`
                }}>{leftCatName}</h2>
              </div>
            </div>
            
            {/* Left Pricing Tiers in Header */}
            {leftPriceLocation === 'header' && leftHeaderTiers.length > 0 && (
              <div className="flex items-center gap-3 flex-shrink-0">
                {leftHeaderTiers.map((tier: any, idx: number) => (
                  <div 
                    key={idx} 
                    className="text-center rounded-xl backdrop-blur-xl"
                    style={{
                      paddingLeft: `${Math.max(12, priceSize * 0.25)}px`,
                      paddingRight: `${Math.max(12, priceSize * 0.25)}px`,
                      paddingTop: `${Math.max(8, priceSize * 0.2)}px`,
                      paddingBottom: `${Math.max(8, priceSize * 0.2)}px`,
                      background: `${containerColor}80`,
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
                    }}
                  >
                    <div className="mb-1 uppercase" style={{ fontSize: `${priceSize * 0.35}px`, color: `${fontColor}60`, fontFamily: pricingFont }}>
                      {tier.label} {tier.unit}
                    </div>
                    <div className="font-bold" style={{ fontSize: `${priceSize * 0.7}px`, color: fontColor, fontFamily: pricingFont, lineHeight: '1' }}>
                      ${parseFloat(tier.price).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3">
          {(() => {
            const actualMode = leftViewMode === 'auto' ? (leftProducts.length > 20 ? 'table' : 'card') : leftViewMode;
            
            return actualMode === 'card' ? (
              <div className="grid grid-cols-4 gap-3 auto-rows-min">
                {leftProducts.map((p) => renderProductCard(p, leftImages, leftPriceLocation))}
              </div>
            ) : (() => {
              const maxItemsPerColumn = 12;
              const useDoubleColumn = leftProducts.length > maxItemsPerColumn;
              
              if (useDoubleColumn) {
                const midPoint = Math.ceil(leftProducts.length / 2);
                const leftCol = leftProducts.slice(0, midPoint);
                const rightCol = leftProducts.slice(midPoint);
                
                return (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl overflow-hidden backdrop-blur-xl" style={{ 
                      background: `linear-gradient(135deg, ${containerColor}${Math.round((containerOpacity / 100) * 96).toString(16).padStart(2, '0')} 0%, ${containerColor}${Math.round((containerOpacity / 100) * 64).toString(16).padStart(2, '0')} 100%)`,
                      border: `${borderWidth}px solid rgba(255, 255, 255, ${(borderOpacity / 100)})`,
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                    }}>
                      {leftCol.map((p, idx) => renderProduct(p, idx, leftPriceLocation, leftImages))}
                    </div>
                    <div className="rounded-2xl overflow-hidden backdrop-blur-xl" style={{ 
                      background: `linear-gradient(135deg, ${containerColor}${Math.round((containerOpacity / 100) * 96).toString(16).padStart(2, '0')} 0%, ${containerColor}${Math.round((containerOpacity / 100) * 64).toString(16).padStart(2, '0')} 100%)`,
                      border: `${borderWidth}px solid rgba(255, 255, 255, ${(borderOpacity / 100)})`,
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                    }}>
                      {rightCol.map((p, idx) => renderProduct(p, idx, leftPriceLocation, leftImages))}
                    </div>
                  </div>
                );
              } else {
                return (
                  <div className="rounded-xl overflow-hidden border" style={{ 
                    borderColor: `${containerColor}60`,
                    backgroundColor: `${containerColor}30`
                  }}>
                    {leftProducts.map((p, idx) => renderProduct(p, idx, leftPriceLocation, leftImages))}
                  </div>
                );
              }
            })();
          })()}
        </div>
        </div>
        
        {/* Left Bottom Quadrant (Stacking) - Match top styling */}
        {enableLeftStacking && leftCategory2 && leftProducts2.length > 0 && (
          <div className="h-1/2 flex flex-col">
            <div className="flex-shrink-0" style={{ 
              paddingLeft: `${Math.max(16, categorySize * 0.4)}px`,
              paddingRight: `${Math.max(16, categorySize * 0.4)}px`,
              paddingTop: `${Math.max(12, categorySize * 0.3)}px`,
              paddingBottom: `${Math.max(12, categorySize * 0.3)}px`,
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              borderBottomColor: `${containerColor}40`,
              background: `linear-gradient(180deg, ${containerColor}60 0%, ${containerColor}30 100%)`,
              backdropFilter: `blur(${blurIntensity * 0.5}px)`
            }}>
              <div className="flex items-center min-w-0" style={{ gap: `${Math.max(8, categorySize * 0.2)}px` }}>
                <div className="rounded-full flex-shrink-0" style={{ 
                  width: `${Math.max(4, categorySize * 0.08)}px`,
                  minHeight: `${categorySize * 1.2}px`, 
                  backgroundColor: `${fontColor}30`,
                  boxShadow: `0 0 ${glowIntensity * 0.3}px ${hexToRgba(fontColor, 0.6)}`
                }} />
                <div className="min-w-0">
                  <h2 className="font-bold truncate" style={{ 
                    fontSize: `${categorySize}px`, 
                    color: fontColor, 
                    fontFamily: titleFont, 
                    lineHeight: '1',
                    textShadow: `0 2px 8px rgba(0, 0, 0, 0.4), 0 0 ${glowIntensity * 0.5}px ${hexToRgba(fontColor, 0.5)}, 0 0 ${glowIntensity}px ${hexToRgba(fontColor, 0.2)}`
                  }}>{leftCatName2}</h2>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3">
              {(() => {
                const actualMode = leftViewMode2 === 'auto' ? (leftProducts2.length > 20 ? 'table' : 'card') : leftViewMode2;
                
                return actualMode === 'card' ? (
                  <div className="grid grid-cols-4 gap-3 auto-rows-min">
                    {leftProducts2.map((p) => renderProductCard(p, leftImages2, leftPriceLocation2))}
                  </div>
                ) : (() => {
                  const maxItemsPerColumn = 12;
                  const useDoubleColumn = leftProducts2.length > maxItemsPerColumn;
                  
                  if (useDoubleColumn) {
                    const midPoint = Math.ceil(leftProducts2.length / 2);
                    const leftCol = leftProducts2.slice(0, midPoint);
                    const rightCol = leftProducts2.slice(midPoint);
                    
                    return (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl overflow-hidden border" style={{ 
                          borderColor: `${containerColor}60`,
                          backgroundColor: `${containerColor}30`
                        }}>
                          {leftCol.map((p, idx) => renderProduct(p, idx, leftPriceLocation2, leftImages2))}
                        </div>
                        <div className="rounded-xl overflow-hidden border" style={{ 
                          borderColor: `${containerColor}60`,
                          backgroundColor: `${containerColor}30`
                        }}>
                          {rightCol.map((p, idx) => renderProduct(p, idx, leftPriceLocation2, leftImages2))}
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div className="rounded-2xl overflow-hidden backdrop-blur-xl" style={{ 
                        background: `linear-gradient(135deg, ${containerColor}${Math.round((containerOpacity / 100) * 96).toString(16).padStart(2, '0')} 0%, ${containerColor}${Math.round((containerOpacity / 100) * 64).toString(16).padStart(2, '0')} 100%)`,
                        border: `${borderWidth}px solid rgba(255, 255, 255, ${(borderOpacity / 100)})`,
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                      }}>
                        {leftProducts2.map((p, idx) => renderProduct(p, idx, leftPriceLocation2, leftImages2))}
                      </div>
                    );
                  }
                })();
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - with stacking support */}
      <div className="w-1/2 flex flex-col overflow-hidden flex-shrink-0 relative z-10">
        {/* Right Top Quadrant */}
        <div className={`${enableRightStacking && rightCategory2 ? 'h-1/2 border-b' : 'h-full'} flex flex-col`} style={{ borderColor: enableRightStacking && rightCategory2 ? `${containerColor}40` : undefined }}>
        <div className="flex-shrink-0" style={{ 
          paddingLeft: `${Math.max(16, categorySize * 0.4)}px`,
          paddingRight: `${Math.max(16, categorySize * 0.4)}px`,
          paddingTop: `${Math.max(12, categorySize * 0.3)}px`,
          paddingBottom: `${Math.max(12, categorySize * 0.3)}px`,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          borderBottomColor: `${containerColor}40`,
          background: `linear-gradient(180deg, ${containerColor}60 0%, ${containerColor}30 100%)`,
          backdropFilter: `blur(${blurIntensity * 0.5}px)`
        }}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center min-w-0" style={{ gap: `${Math.max(8, categorySize * 0.2)}px` }}>
              <div className="rounded-full flex-shrink-0" style={{ 
                width: `${Math.max(4, categorySize * 0.08)}px`,
                minHeight: `${categorySize * 1.2}px`, 
                backgroundColor: `${fontColor}30`,
                boxShadow: `0 0 ${glowIntensity * 0.3}px ${hexToRgba(fontColor, 0.6)}`
              }} />
              <div className="min-w-0">
                <h2 className="font-bold truncate" style={{ 
                  fontSize: `${categorySize}px`, 
                  color: fontColor, 
                  fontFamily: titleFont, 
                  lineHeight: '1',
                  textShadow: `0 2px 8px rgba(0, 0, 0, 0.4), 0 0 ${glowIntensity * 0.5}px ${hexToRgba(fontColor, 0.5)}, 0 0 ${glowIntensity}px ${hexToRgba(fontColor, 0.2)}`
                }}>{rightCatName}</h2>
              </div>
            </div>
            
            {/* Right Pricing Tiers in Header */}
            {rightPriceLocation === 'header' && rightHeaderTiers.length > 0 && (
              <div className="flex items-center gap-3 flex-shrink-0">
                {rightHeaderTiers.map((tier: any, idx: number) => (
                  <div 
                    key={idx} 
                    className="text-center rounded-xl backdrop-blur-xl"
                    style={{
                      paddingLeft: `${Math.max(12, priceSize * 0.25)}px`,
                      paddingRight: `${Math.max(12, priceSize * 0.25)}px`,
                      paddingTop: `${Math.max(8, priceSize * 0.2)}px`,
                      paddingBottom: `${Math.max(8, priceSize * 0.2)}px`,
                      background: `${containerColor}80`,
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
                    }}
                  >
                    <div className="mb-1 uppercase" style={{ fontSize: `${priceSize * 0.35}px`, color: `${fontColor}60`, fontFamily: pricingFont }}>
                      {tier.label} {tier.unit}
                    </div>
                    <div className="font-bold" style={{ fontSize: `${priceSize * 0.7}px`, color: fontColor, fontFamily: pricingFont, lineHeight: '1' }}>
                      ${parseFloat(tier.price).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3">
          {(() => {
            const actualMode = rightViewMode === 'auto' ? (rightProducts.length > 20 ? 'table' : 'card') : rightViewMode;
            
            return actualMode === 'card' ? (
              <div className="grid grid-cols-4 gap-3 auto-rows-min">
                {rightProducts.map((p) => renderProductCard(p, rightImages, rightPriceLocation))}
              </div>
            ) : (() => {
              const maxItemsPerColumn = 12;
              const useDoubleColumn = rightProducts.length > maxItemsPerColumn;
              
              if (useDoubleColumn) {
                const midPoint = Math.ceil(rightProducts.length / 2);
                const leftCol = rightProducts.slice(0, midPoint);
                const rightCol = rightProducts.slice(midPoint);
                
                return (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl overflow-hidden backdrop-blur-xl" style={{ 
                      background: `linear-gradient(135deg, ${containerColor}${Math.round((containerOpacity / 100) * 96).toString(16).padStart(2, '0')} 0%, ${containerColor}${Math.round((containerOpacity / 100) * 64).toString(16).padStart(2, '0')} 100%)`,
                      border: `${borderWidth}px solid rgba(255, 255, 255, ${(borderOpacity / 100)})`,
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                    }}>
                      {leftCol.map((p, idx) => renderProduct(p, idx, rightPriceLocation, rightImages))}
                    </div>
                    <div className="rounded-2xl overflow-hidden backdrop-blur-xl" style={{ 
                      background: `linear-gradient(135deg, ${containerColor}${Math.round((containerOpacity / 100) * 96).toString(16).padStart(2, '0')} 0%, ${containerColor}${Math.round((containerOpacity / 100) * 64).toString(16).padStart(2, '0')} 100%)`,
                      border: `${borderWidth}px solid rgba(255, 255, 255, ${(borderOpacity / 100)})`,
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                    }}>
                      {rightCol.map((p, idx) => renderProduct(p, idx, rightPriceLocation, rightImages))}
                    </div>
                  </div>
                );
              } else {
                return (
                  <div className="rounded-xl overflow-hidden border" style={{ 
                    borderColor: `${containerColor}60`,
                    backgroundColor: `${containerColor}30`
                  }}>
                    {rightProducts.map((p, idx) => renderProduct(p, idx, rightPriceLocation, rightImages))}
                  </div>
                );
              }
            })();
          })()}
        </div>
        </div>
        
        {/* Right Bottom Quadrant (Stacking) - Match top styling */}
        {enableRightStacking && rightCategory2 && rightProducts2.length > 0 && (
          <div className="h-1/2 flex flex-col">
            <div className="flex-shrink-0" style={{ 
              paddingLeft: `${Math.max(16, categorySize * 0.4)}px`,
              paddingRight: `${Math.max(16, categorySize * 0.4)}px`,
              paddingTop: `${Math.max(12, categorySize * 0.3)}px`,
              paddingBottom: `${Math.max(12, categorySize * 0.3)}px`,
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              borderBottomColor: `${containerColor}40`,
              background: `linear-gradient(180deg, ${containerColor}60 0%, ${containerColor}30 100%)`,
              backdropFilter: `blur(${blurIntensity * 0.5}px)`
            }}>
              <div className="flex items-center min-w-0" style={{ gap: `${Math.max(8, categorySize * 0.2)}px` }}>
                <div className="rounded-full flex-shrink-0" style={{ 
                  width: `${Math.max(4, categorySize * 0.08)}px`,
                  minHeight: `${categorySize * 1.2}px`, 
                  backgroundColor: `${fontColor}30`,
                  boxShadow: `0 0 ${glowIntensity * 0.3}px ${hexToRgba(fontColor, 0.6)}`
                }} />
                <div className="min-w-0">
                  <h2 className="font-bold truncate" style={{ 
                    fontSize: `${categorySize}px`, 
                    color: fontColor, 
                    fontFamily: titleFont, 
                    lineHeight: '1',
                    textShadow: `0 2px 8px rgba(0, 0, 0, 0.4), 0 0 ${glowIntensity * 0.5}px ${hexToRgba(fontColor, 0.5)}, 0 0 ${glowIntensity}px ${hexToRgba(fontColor, 0.2)}`
                  }}>{rightCatName2}</h2>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3">
              {(() => {
                const actualMode = rightViewMode2 === 'auto' ? (rightProducts2.length > 20 ? 'table' : 'card') : rightViewMode2;
                
                return actualMode === 'card' ? (
                  <div className="grid grid-cols-4 gap-3 auto-rows-min">
                    {rightProducts2.map((p) => renderProductCard(p, rightImages2, rightPriceLocation2))}
                  </div>
                ) : (() => {
                  const maxItemsPerColumn = 12;
                  const useDoubleColumn = rightProducts2.length > maxItemsPerColumn;
                  
                  if (useDoubleColumn) {
                    const midPoint = Math.ceil(rightProducts2.length / 2);
                    const leftCol = rightProducts2.slice(0, midPoint);
                    const rightCol = rightProducts2.slice(midPoint);
                    
                    return (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl overflow-hidden border" style={{ 
                          borderColor: `${containerColor}60`,
                          backgroundColor: `${containerColor}30`
                        }}>
                          {leftCol.map((p, idx) => renderProduct(p, idx, rightPriceLocation2, rightImages2))}
                        </div>
                        <div className="rounded-xl overflow-hidden border" style={{ 
                          borderColor: `${containerColor}60`,
                          backgroundColor: `${containerColor}30`
                        }}>
                          {rightCol.map((p, idx) => renderProduct(p, idx, rightPriceLocation2, rightImages2))}
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div className="rounded-2xl overflow-hidden backdrop-blur-xl" style={{ 
                        background: `linear-gradient(135deg, ${containerColor}${Math.round((containerOpacity / 100) * 96).toString(16).padStart(2, '0')} 0%, ${containerColor}${Math.round((containerOpacity / 100) * 64).toString(16).padStart(2, '0')} 100%)`,
                        border: `${borderWidth}px solid rgba(255, 255, 255, ${(borderOpacity / 100)})`,
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                      }}>
                        {rightProducts2.map((p, idx) => renderProduct(p, idx, rightPriceLocation2, rightImages2))}
                      </div>
                    );
                  }
                })();
              })()}
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
