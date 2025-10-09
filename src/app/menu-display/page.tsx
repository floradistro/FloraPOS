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
import { loadGoogleFont } from '../../lib/fonts'

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
  
  console.log('🎨 [TV DISPLAY] View mode from URL:', viewMode)
  console.log('📐 [TV DISPLAY] Orientation from URL:', orientation)
  
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
    if (command.command_type === 'update_theme') {
      const payload = command.payload
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
          location_id: locationId,
        _t: Date.now().toString()
        })
      

        const response = await apiFetch(`/api/proxy/flora-im/products?${params}`, {
        headers: { 'Cache-Control': 'no-cache' }
        })
        const result = await response.json()
        
        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to load products')
        }

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
          
          // Only update if products actually changed
          setProducts(prev => {
            if (JSON.stringify(prev) === JSON.stringify(enrichedProducts)) {
              return prev
            }
            return enrichedProducts
          })
        } catch (err) {
          setProducts(prev => {
            if (JSON.stringify(prev) === JSON.stringify(result.data)) {
              return prev
            }
            return result.data
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
  }, [locationId])

  // Render product card - COMPACT & RESPONSIVE (memoized)
  const renderProductCard = useCallback((product: Product, panelShowImages: boolean, panelPriceLocation: 'header' | 'inline' | 'none') => {
    const priceNum = product.blueprintPricing?.calculated_price ? parseFloat(product.blueprintPricing.calculated_price.toString()) : parseFloat(product.regular_price || '0')
    const pricingTiers = product.blueprintPricing?.ruleGroups?.[0]?.tiers || []
    const hasTiers = pricingTiers.length > 0

    return (
      <div
        key={product.id}
        className="group rounded-lg p-2 border flex flex-col"
        style={{ 
          backgroundColor: containerColor,
          borderColor: `${containerColor}80`,
          willChange: 'auto'
        }}
      >
        {panelShowImages && product.image && (
          <div className="aspect-square rounded-lg overflow-hidden mb-1.5 flex-shrink-0" style={{ backgroundColor: imageBackgroundColor }}>
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          </div>
        )}
        <h3 className="text-sm font-semibold mb-1 line-clamp-2 flex-shrink-0" style={{ color: cardFontColor, minHeight: '2.5rem', fontFamily: cardFont }}>{product.name}</h3>
        
        {/* Only show pricing if inline mode */}
        {panelPriceLocation === 'inline' && (
          hasTiers ? (
            <div className="space-y-0.5">
              {pricingTiers.slice(0, 2).map((tier: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span style={{ color: `${cardFontColor}70`, fontFamily: pricingFont }}>{tier.label}</span>
                  <span className="font-bold text-sm" style={{ color: cardFontColor, fontFamily: pricingFont }}>${parseFloat(tier.price).toFixed(2)}</span>
                </div>
              ))}
              {pricingTiers.length > 2 && (
                <div className="text-xs text-center" style={{ color: `${cardFontColor}60`, fontFamily: pricingFont }}>+{pricingTiers.length - 2} more</div>
              )}
            </div>
          ) : priceNum > 0 && (
            <div className="text-lg font-bold" style={{ color: cardFontColor, fontFamily: pricingFont }}>${priceNum.toFixed(2)}</div>
          )
        )}
      </div>
    )
  }, [containerColor, imageBackgroundColor, cardFontColor, cardFont, pricingFont])
  
  // Render product row (memoized)
  const renderProduct = useCallback((product: Product, index: number, panelPriceLocation: 'header' | 'inline' | 'none' = priceLocation, panelShowImages: boolean = showImages) => {
    const price = product.blueprintPricing?.calculated_price || product.regular_price || '0'
    const priceNum = parseFloat(price.toString())
    
    // Get REAL pricing tiers from blueprint pricing
    const blueprintData = product.blueprintPricing
    
    // Extract tiers from YOUR REAL structure: blueprintPricing.ruleGroups[0].tiers
    const pricingTiers = blueprintData?.ruleGroups?.[0]?.tiers || []
    const hasTiers = pricingTiers.length > 0

    return (
      <div
        key={product.id}
        className="group flex items-center gap-2 py-1.5 px-3 border-b"
        style={{
          backgroundColor: index % 2 === 0 ? `${containerColor}30` : 'transparent',
          borderBottomColor: `${containerColor}50`,
          color: fontColor,
          willChange: 'auto'
        }}
      >
        {/* Image */}
        {panelShowImages && (
          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0" style={{ backgroundColor: imageBackgroundColor }}>
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-8 h-8" style={{ color: `${fontColor}40` }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
        )}

        {/* Name */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold truncate" style={{ color: fontColor, fontFamily: cardFont }}>
            {product.name}
          </h3>
        </div>
        
        {/* Pricing Tiers (inline mode) - Compact */}
        {panelPriceLocation === 'inline' && hasTiers && (
          <div className="flex items-center gap-3 flex-shrink-0">
            {pricingTiers.map((tier: any, idx: number) => (
              <div key={idx} className="text-center">
                <div className="text-[9px] mb-0.5 uppercase tracking-wide" style={{ color: `${fontColor}60`, fontFamily: cardFont }}>
                  {tier.label}
                </div>
                <div className="text-sm font-bold" style={{ color: fontColor, fontFamily: cardFont }}>
                  ${parseFloat(tier.price).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Single Price (inline mode, no tiers) */}
        {panelPriceLocation === 'inline' && !hasTiers && priceNum > 0 && (
          <div className="text-base font-bold flex-shrink-0 text-right" style={{ color: fontColor, fontFamily: cardFont }}>
            ${priceNum.toFixed(2)}
          </div>
        )}

      </div>
    )
  }, [containerColor, imageBackgroundColor, fontColor, cardFont, pricingFont, priceLocation, showImages])

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
      // Find category by slug
      const cat = categories.find(c => c.slug === categoryFilter)
      
      if (cat) {
        displayProducts = products.filter(p => p.categories?.some(c => c.id === cat.id))
        displayCategory = cat.name
      } else {
        showDefaultEmptyState = true
        displayProducts = []
      }
    } else {
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
      <div className="h-screen w-screen flex flex-col overflow-hidden tv-menu-display" style={{ backgroundColor }}>
        {/* Header */}
        <div className="px-6 py-5 border-b flex-shrink-0" style={{ borderBottomColor: `${containerColor}40` }}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-2 h-16 rounded-full flex-shrink-0" style={{ backgroundColor: `${fontColor}30` }} />
              <div className="min-w-0">
                <h1 className="text-5xl font-bold truncate" style={{ color: fontColor, fontFamily: titleFont }}>
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
                  <div className="flex items-center gap-6">
                    {tierStructure.map((tier: any, idx: number) => (
                      <div key={idx} className="text-center">
                        <div className="text-sm mb-1 uppercase" style={{ color: `${fontColor}60`, fontFamily: pricingFont }}>
                          {tier.label} {tier.unit}
                        </div>
                        <div className="text-4xl font-bold" style={{ color: fontColor, fontFamily: pricingFont }}>
                          ${parseFloat(tier.price).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : minPrice > 0 ? (
                <div className="text-right flex-shrink-0">
                  <div className="text-4xl font-bold" style={{ color: fontColor, fontFamily: pricingFont }}>
                    ${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}
                  </div>
                </div>
              ) : null
            })()}
          </div>
        </div>

        {/* Products */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-5">
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
                      <div className="rounded-xl overflow-hidden border" style={{ 
                        borderColor: `${containerColor}60`,
                        backgroundColor: `${containerColor}30`
                      }}>
                        {leftCol.map((product, idx) => renderProduct(product, idx, priceLocation, showImages))}
                      </div>
                      <div className="rounded-xl overflow-hidden border" style={{ 
                        borderColor: `${containerColor}60`,
                        backgroundColor: `${containerColor}30`
                      }}>
                        {rightCol.map((product, idx) => renderProduct(product, idx, priceLocation, showImages))}
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="rounded-xl overflow-hidden border" style={{ 
                      borderColor: `${containerColor}60`,
                      backgroundColor: `${containerColor}30`
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
  
  const leftCatName = categories.find(c => c.slug === leftCategory)?.name || 'Menu'
  const rightCatName = categories.find(c => c.slug === rightCategory)?.name || 'Menu'
  const leftCatName2 = categories.find(c => c.slug === leftCategory2)?.name || ''
  const rightCatName2 = categories.find(c => c.slug === rightCategory2)?.name || ''
  
  // Get pricing tiers for headers
  const leftFirstWithTiers = leftProducts.find(p => p.blueprintPricing?.ruleGroups?.[0]?.tiers?.length > 0)
  const leftHeaderTiers = leftFirstWithTiers?.blueprintPricing?.ruleGroups?.[0]?.tiers || []
  
  const rightFirstWithTiers = rightProducts.find(p => p.blueprintPricing?.ruleGroups?.[0]?.tiers?.length > 0)
  const rightHeaderTiers = rightFirstWithTiers?.blueprintPricing?.ruleGroups?.[0]?.tiers || []


  return (
    <div className="h-screen w-screen flex overflow-hidden tv-menu-display" style={{ backgroundColor }}>
      {/* Left Panel - with stacking support */}
      <div className="w-1/2 flex flex-col border-r overflow-hidden flex-shrink-0" style={{ borderRightColor: `${containerColor}40` }}>
        {/* Left Top Quadrant */}
        <div className={`${enableLeftStacking && leftCategory2 ? 'h-1/2 border-b' : 'h-full'} flex flex-col`} style={{ borderColor: enableLeftStacking && leftCategory2 ? `${containerColor}40` : undefined }}>
        <div className="px-6 py-4 border-b flex-shrink-0" style={{ borderBottomColor: `${containerColor}40` }}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-1.5 h-12 rounded-full flex-shrink-0" style={{ backgroundColor: `${fontColor}30` }} />
              <div className="min-w-0">
                <h2 className="text-4xl font-bold truncate" style={{ color: fontColor, fontFamily: titleFont }}>{leftCatName}</h2>
              </div>
            </div>
            
            {/* Left Pricing Tiers in Header */}
            {leftPriceLocation === 'header' && leftHeaderTiers.length > 0 && (
              <div className="flex items-center gap-3 flex-shrink-0">
                {leftHeaderTiers.map((tier: any, idx: number) => (
                  <div key={idx} className="text-center">
                    <div className="text-xs mb-1 uppercase" style={{ color: `${fontColor}60`, fontFamily: pricingFont }}>
                      {tier.label} {tier.unit}
                    </div>
                    <div className="text-2xl font-bold" style={{ color: fontColor, fontFamily: pricingFont }}>
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
                    <div className="rounded-xl overflow-hidden border" style={{ 
                      borderColor: `${containerColor}60`,
                      backgroundColor: `${containerColor}30`
                    }}>
                      {leftCol.map((p, idx) => renderProduct(p, idx, leftPriceLocation, leftImages))}
                    </div>
                    <div className="rounded-xl overflow-hidden border" style={{ 
                      borderColor: `${containerColor}60`,
                      backgroundColor: `${containerColor}30`
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
            <div className="px-6 py-4 border-b flex-shrink-0" style={{ borderBottomColor: `${containerColor}40` }}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-1.5 h-12 rounded-full flex-shrink-0" style={{ backgroundColor: `${fontColor}30` }} />
                <div className="min-w-0">
                  <h2 className="text-4xl font-bold truncate" style={{ color: fontColor, fontFamily: titleFont }}>{leftCatName2}</h2>
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
                      <div className="rounded-xl overflow-hidden border" style={{ 
                        borderColor: `${containerColor}60`,
                        backgroundColor: `${containerColor}30`
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
      <div className="w-1/2 flex flex-col overflow-hidden flex-shrink-0">
        {/* Right Top Quadrant */}
        <div className={`${enableRightStacking && rightCategory2 ? 'h-1/2 border-b' : 'h-full'} flex flex-col`} style={{ borderColor: enableRightStacking && rightCategory2 ? `${containerColor}40` : undefined }}>
        <div className="px-6 py-4 border-b flex-shrink-0" style={{ borderBottomColor: `${containerColor}40` }}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-1.5 h-12 rounded-full flex-shrink-0" style={{ backgroundColor: `${fontColor}30` }} />
              <div className="min-w-0">
                <h2 className="text-4xl font-bold truncate" style={{ color: fontColor, fontFamily: titleFont }}>{rightCatName}</h2>
              </div>
            </div>
            
            {/* Right Pricing Tiers in Header */}
            {rightPriceLocation === 'header' && rightHeaderTiers.length > 0 && (
              <div className="flex items-center gap-3 flex-shrink-0">
                {rightHeaderTiers.map((tier: any, idx: number) => (
                  <div key={idx} className="text-center">
                    <div className="text-xs mb-1 uppercase" style={{ color: `${fontColor}60`, fontFamily: pricingFont }}>
                      {tier.label} {tier.unit}
                    </div>
                    <div className="text-2xl font-bold" style={{ color: fontColor, fontFamily: pricingFont }}>
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
                    <div className="rounded-xl overflow-hidden border" style={{ 
                      borderColor: `${containerColor}60`,
                      backgroundColor: `${containerColor}30`
                    }}>
                      {leftCol.map((p, idx) => renderProduct(p, idx, rightPriceLocation, rightImages))}
                    </div>
                    <div className="rounded-xl overflow-hidden border" style={{ 
                      borderColor: `${containerColor}60`,
                      backgroundColor: `${containerColor}30`
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
            <div className="px-6 py-4 border-b flex-shrink-0" style={{ borderBottomColor: `${containerColor}40` }}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-1.5 h-12 rounded-full flex-shrink-0" style={{ backgroundColor: `${fontColor}30` }} />
                <div className="min-w-0">
                  <h2 className="text-4xl font-bold truncate" style={{ color: fontColor, fontFamily: titleFont }}>{rightCatName2}</h2>
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
                      <div className="rounded-xl overflow-hidden border" style={{ 
                        borderColor: `${containerColor}60`,
                        backgroundColor: `${containerColor}30`
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
