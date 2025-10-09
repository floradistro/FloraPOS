/**
 * SharedMenuDisplay V2
 * Modern, VS Code/Apple themed TV menu display
 * Optimized for readability and visual appeal
 */

'use client'

import React from 'react'
import { Product, Category } from '../../types'
import { ProductBlueprintFields } from '../../services/blueprint-fields-service'
import { MagicBackground } from './MagicBackground'

interface SharedMenuDisplayProps {
  products: Product[]
  categories: Category[]
  orientation: 'horizontal' | 'vertical'
  viewMode: 'table' | 'card' | 'auto'
  showImages: boolean
  leftMenuImages: boolean
  rightMenuImages: boolean
  categoryFilter?: string | null
  selectedCategoryName?: string
  isDualMenu: boolean
  leftMenuCategory: string | null
  rightMenuCategory: string | null
  leftMenuCategory2: string | null
  rightMenuCategory2: string | null
  leftMenuImages2: boolean
  rightMenuImages2: boolean
  leftMenuViewMode?: 'table' | 'card' | 'auto'
  rightMenuViewMode?: 'table' | 'card' | 'auto'
  leftMenuViewMode2?: 'table' | 'card' | 'auto'
  rightMenuViewMode2?: 'table' | 'card' | 'auto'
  enableLeftStacking: boolean
  enableRightStacking: boolean
  backgroundColor: string
  fontColor: string
  cardFontColor?: string
  containerColor: string
  imageBackgroundColor?: string
  titleFont?: string
  pricingFont?: string
  cardFont?: string
  isPreview?: boolean
  containerOpacity?: number
  borderWidth?: number
  borderOpacity?: number
  imageOpacity?: number
  blurIntensity?: number
  customBackground?: string
  pandaMode: boolean
  priceLocation?: 'none' | 'header' | 'inline'
  leftPriceLocation?: 'none' | 'header' | 'inline'
  rightPriceLocation?: 'none' | 'header' | 'inline'
  categoryColumnConfigs?: Map<string, string[]>
  categoryBlueprintFields?: Map<string, ProductBlueprintFields[]>
  selectedSide?: string
  onSideClick?: (side: string) => void
  selectedMenuSection?: string | null
  onSectionClick?: (section: string) => void
  isPreview?: boolean
}

export function SharedMenuDisplay({
  products,
  categories,
  orientation,
  viewMode,
  showImages,
  categoryFilter,
  selectedCategoryName,
  isDualMenu,
  leftMenuCategory,
  rightMenuCategory,
  leftMenuCategory2,
  rightMenuCategory2,
  leftMenuImages,
  rightMenuImages,
  leftMenuImages2,
  rightMenuImages2,
  leftMenuViewMode = 'auto',
  rightMenuViewMode = 'auto',
  leftMenuViewMode2 = 'auto',
  rightMenuViewMode2 = 'auto',
  enableLeftStacking,
  enableRightStacking,
  backgroundColor,
  fontColor,
  cardFontColor = '#ffffff',
  containerColor,
  imageBackgroundColor = '#1a1a1a',
  titleFont = 'Tiempos, serif',
  pricingFont = 'Tiempos, serif',
  cardFont = 'Tiempos, serif',
  containerOpacity = 100,
  borderWidth = 1,
  borderOpacity = 100,
  imageOpacity = 100,
  blurIntensity = 8,
  customBackground = '',
  priceLocation = 'none',
  leftPriceLocation = 'none',
  rightPriceLocation = 'none',
  categoryColumnConfigs = new Map(),
  categoryBlueprintFields = new Map(),
  selectedSide = '',
  onSideClick,
  isPreview = false,
}: SharedMenuDisplayProps) {
  
  console.log('🖼️ SharedMenuDisplay received:', {
    isDualMenu,
    leftMenuCategory,
    rightMenuCategory,
    leftMenuCategory2,
    rightMenuCategory2,
    enableLeftStacking,
    enableRightStacking,
    leftMenuViewMode,
    rightMenuViewMode,
    categoryFilter,
    totalProducts: products.length
  });
  
  // Get blueprint field value from new Blueprints plugin format
  const getBlueprintValue = (product: Product, fieldName: string): string => {
    if (!product.meta_data || !Array.isArray(product.meta_data)) return ''
    
    // New format: _blueprint_FIELDNAME
    const blueprintKey = `_blueprint_${fieldName}`
    const meta = product.meta_data.find(m => m.key === blueprintKey)
    
    return meta?.value?.toString() || ''
  }

  // Filter products by category
  const filterProductsByCategory = (categorySlug: string | null) => {
    if (!categorySlug) return products
    return products.filter(p => p.categories?.some(c => c.slug === categorySlug))
  }

  // Render product card - COMPACT & RESPONSIVE
  const renderProductCard = (product: Product, showImg: boolean, cardPriceLocation: 'none' | 'header' | 'inline' = priceLocation, categorySlug?: string) => {
    const priceNum = product.regular_price ? parseFloat(product.regular_price) : 0
    const hasImage = Boolean(product.image)
    const columns = categorySlug ? (categoryColumnConfigs.get(categorySlug) || ['name']) : ['name']
    
    // Get pricing tiers
    const pricingTiers = (product as any).blueprintPricing?.ruleGroups?.[0]?.tiers || []
    const hasTiers = pricingTiers.length > 0
    
    // Get blueprint fields to display (exclude 'name')
    const blueprintColumns = columns.filter(col => col !== 'name')

    // Calculate alpha values for transparency
    const containerAlpha = Math.round((containerOpacity / 100) * 240).toString(16).padStart(2, '0')
    const borderAlpha = (borderOpacity / 100).toFixed(2)

    return (
      <div
        key={product.id}
        className="group rounded-2xl p-4 flex flex-col overflow-hidden"
        style={{ 
          background: `linear-gradient(135deg, ${containerColor}${containerAlpha} 0%, ${containerColor}${Math.round((containerOpacity / 100) * 224).toString(16).padStart(2, '0')} 100%)`,
          border: `${borderWidth}px solid rgba(255, 255, 255, ${borderAlpha})`,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          backdropFilter: `blur(${blurIntensity}px)`,
          color: fontColor 
        }}
      >
        {/* Product Image */}
        {showImg && hasImage && (
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

        {/* Product Name */}
        <h3 className="text-base font-bold mb-2 line-clamp-2 flex-shrink-0" style={{ 
          color: cardFontColor, 
          minHeight: '2.5rem', 
          fontFamily: cardFont,
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
          letterSpacing: '-0.02em'
        }}>
          {product.name}
        </h3>
        
        {/* Blueprint Fields */}
        {blueprintColumns.length > 0 && (
          <div className="space-y-0.5 mb-2 text-left">
            {blueprintColumns.slice(0, 3).map((columnName) => {
              const value = getBlueprintValue(product, columnName)
              if (!value) return null
              
              return (
                <div key={columnName} className="flex items-start gap-1 text-left">
                  <span className="text-[10px] uppercase font-medium flex-shrink-0 text-left" style={{ color: `${cardFontColor}60`, fontFamily: cardFont }}>
                    {columnName.replace(/_/g, ' ')}:
                  </span>
                  <span className="text-[10px] flex-1 line-clamp-1 text-left" style={{ color: `${cardFontColor}90`, fontFamily: cardFont }}>
                    {value}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* Pricing Tiers - Only show if inline mode */}
        {cardPriceLocation === 'inline' && (
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
              className="text-2xl font-bold mt-auto" 
              style={{ 
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
  }

  // Render table header row
  const renderTableHeader = (categorySlug?: string, panelShowImages: boolean = showImages) => {
    const columns = categorySlug ? (categoryColumnConfigs.get(categorySlug) || ['name']) : ['name']
    const category = categories.find(c => c.slug === categorySlug)
    const categoryName = category?.name || 'Product'
    
    return (
      <div className="flex items-center gap-3 py-2 px-3 border-b-2 sticky top-0 z-10" style={{ 
        backgroundColor: `${containerColor}80`,
        borderBottomColor: `${fontColor}40`,
        backdropFilter: 'blur(10px)'
      }}>
        {/* Image Header */}
        {panelShowImages && (
          <div className="w-12 flex-shrink-0">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: `${fontColor}70`, fontFamily: cardFont }}>
              Image
            </span>
          </div>
        )}
        
        {/* Column Headers */}
        <div className="flex-1 min-w-0 grid gap-3" style={{ 
          gridTemplateColumns: columns.length === 1 ? '1fr' : 
                              columns.length === 2 ? '2fr 1fr' :
                              columns.length === 3 ? '2fr 1fr 1fr' :
                              `2fr ${Array(columns.length - 1).fill('1fr').join(' ')}`
        }}>
          {columns.map((columnName) => (
            <div key={columnName} className="min-w-0">
              <span className="text-xs font-semibold uppercase tracking-wider truncate block" style={{ color: `${fontColor}70`, fontFamily: cardFont, textAlign: 'left' }}>
                {columnName === 'name' ? categoryName : columnName.replace(/_/g, ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Render product row (modern table design)
  const renderProductRow = (product: Product, index: number, categorySlug?: string, panelPriceLocation: 'none' | 'header' | 'inline' = priceLocation, panelShowImages: boolean = showImages) => {
    const price = product.regular_price ? parseFloat(product.regular_price) : 0
    const columns = categorySlug ? (categoryColumnConfigs.get(categorySlug) || ['name']) : ['name']
    const hasImage = Boolean(product.image)
    
    // Get pricing tiers from blueprint
    const pricingTiers = (product as any).blueprintPricing?.ruleGroups?.[0]?.tiers || []
    const hasTiers = pricingTiers.length > 0

    // Calculate alpha values for row transparency
    const rowAlpha1 = Math.round((containerOpacity / 100) * 64).toString(16).padStart(2, '0')
    const rowAlpha2 = Math.round((containerOpacity / 100) * 32).toString(16).padStart(2, '0')
    const borderAlpha = (borderOpacity / 100).toFixed(2)

    return (
      <div
        key={product.id}
        className="group relative flex items-center gap-4 py-3 px-5 flex-shrink-0"
        style={{
          background: index % 2 === 0 
            ? `linear-gradient(90deg, ${containerColor}${rowAlpha1} 0%, ${containerColor}${rowAlpha2} 100%)` 
            : `rgba(255, 255, 255, ${(containerOpacity / 100) * 0.02})`,
          borderBottom: `${borderWidth}px solid rgba(255, 255, 255, ${borderAlpha})`,
          color: fontColor,
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
            {hasImage ? (
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

        {/* Columns Content - Responsive Table Layout */}
        <div className="flex-1 min-w-0 grid gap-3" style={{ 
          gridTemplateColumns: columns.length === 1 ? '1fr' : 
                              columns.length === 2 ? '2fr 1fr' :
                              columns.length === 3 ? '2fr 1fr 1fr' :
                              `2fr ${Array(columns.length - 1).fill('1fr').join(' ')}`
        }}>
          {columns.map((columnName, idx) => {
            const value = columnName === 'name' ? product.name : getBlueprintValue(product, columnName)
            if (!value) return null
            
            return (
              <div key={columnName} className="min-w-0">
                <h3 className={`${idx === 0 ? 'text-lg font-bold' : 'text-sm'} truncate`} style={{ 
                  color: fontColor, 
                  fontFamily: cardFont, 
                  textAlign: 'left',
                  textShadow: idx === 0 ? '0 2px 4px rgba(0, 0, 0, 0.2)' : 'none',
                  letterSpacing: idx === 0 ? '-0.01em' : '0'
                }}>
                  {value}
                </h3>
              </div>
            )
          })}
        </div>
        
        {/* Pricing Tiers (inline mode only) */}
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
                <div className="text-base font-bold" style={{ 
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
        {panelPriceLocation === 'inline' && !hasTiers && price > 0 && (
          <div 
            className="text-2xl font-bold flex-shrink-0 text-right px-5 py-2 rounded-xl"
            style={{
              background: `${containerColor}60`,
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: fontColor,
              fontFamily: cardFont,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
            }}
          >
            ${price.toFixed(2)}
          </div>
        )}

        {/* Stock Status Badge */}
        {product.stock_status && (
          <div className="flex-shrink-0">
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-lg font-medium border"
              style={{
                backgroundColor: product.stock_status === 'instock' ? `${fontColor}10` : `${fontColor}05`,
                borderColor: product.stock_status === 'instock' ? `${fontColor}20` : `${fontColor}10`,
                color: product.stock_status === 'instock' ? fontColor : `${fontColor}60`
              }}
            >
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: product.stock_status === 'instock' ? fontColor : `${fontColor}40` }}
              />
              {product.stock_status === 'instock' ? 'Available' : 'Sold Out'}
            </div>
          </div>
        )}

        {/* Hover Line */}
        <div className="absolute left-0 top-0 bottom-0 w-1 transform scale-y-0 group-hover:scale-y-100 transition-transform duration-200 origin-top" style={{ backgroundColor: `${fontColor}30` }} />
      </div>
    )
  }

  // Render category section
  const renderCategorySection = (category: Category, categoryProducts: Product[], showImg: boolean, mode: 'table' | 'card' | 'auto') => {
    const actualMode = mode === 'auto' ? (categoryProducts.length > 20 ? 'table' : 'card') : mode
    
    // Get pricing tiers for header display
    const firstProductWithTiers = categoryProducts.find(p => (p as any).blueprintPricing?.ruleGroups?.[0]?.tiers?.length > 0)
    const tierStructure = firstProductWithTiers ? (firstProductWithTiers as any).blueprintPricing?.ruleGroups?.[0]?.tiers || [] : []

    return (
      <div key={category.id} className="mb-16">
        {/* Category Header */}
        <div className="mb-8 pb-6 border-b-2" style={{ borderBottomColor: `${containerColor}40` }}>
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-2 h-20 rounded-full" style={{ backgroundColor: `${fontColor}30` }} />
              <div>
                <h2 className="text-6xl font-bold tracking-tight" style={{ color: fontColor, fontFamily: titleFont }}>
                  {category.name}
                </h2>
              </div>
            </div>
            
            {/* Pricing Tiers in Header (header mode) */}
            {priceLocation === 'header' && tierStructure.length > 0 && (
              <div className="text-right">
                <div className="flex items-center gap-8">
                  {tierStructure.map((tier: any, idx: number) => (
                    <div key={idx} className="text-center">
                      <div className="text-base mb-2 uppercase" style={{ color: `${fontColor}60`, fontFamily: pricingFont }}>
                        {tier.label} {tier.unit}
                      </div>
                      <div className="text-5xl font-bold" style={{ color: fontColor, fontFamily: pricingFont }}>
                        ${parseFloat(tier.price).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Products */}
        {actualMode === 'card' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {categoryProducts.map(product => renderProductCard(product, showImg, priceLocation, category.slug))}
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden backdrop-blur-xl" style={{ 
            background: `linear-gradient(135deg, ${containerColor}${Math.round((containerOpacity / 100) * 96).toString(16).padStart(2, '0')} 0%, ${containerColor}${Math.round((containerOpacity / 100) * 64).toString(16).padStart(2, '0')} 100%)`,
            border: `${borderWidth}px solid rgba(255, 255, 255, ${(borderOpacity / 100)})`,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
          }}>
            {renderTableHeader(category.slug)}
            {categoryProducts.map((product, idx) => renderProductRow(product, idx, category.slug))}
          </div>
        )}
      </div>
    )
  }

  // Single menu layout
  if (!isDualMenu) {
    console.log('🎨 Single menu mode:', { 
      categoryFilter, 
      totalProducts: products.length, 
      categories: categories.length 
    })
    
    // RESPECT the categoryFilter if provided!
    let singleCategory = null
    
    if (categoryFilter) {
      // User selected a specific category - show ONLY that category
      const selectedCat = categories.find(c => c.slug === categoryFilter)
      if (selectedCat) {
        const catProducts = filterProductsByCategory(categoryFilter)
        singleCategory = {
          category: selectedCat,
          products: catProducts
        }
        console.log('✅ Using selected category:', selectedCat.name, 'with', catProducts.length, 'products')
      }
    }
    // No else - if no category is selected, singleCategory remains null to show empty state
    
    if (!singleCategory) {
      console.log('ℹ️ No category selected - showing empty state')
    }

    // Get pricing tiers for header
    const firstWithTiers = singleCategory?.products.find(p => (p as any).blueprintPricing?.ruleGroups?.[0]?.tiers?.length > 0)
    const headerTiers = firstWithTiers ? (firstWithTiers as any).blueprintPricing?.ruleGroups?.[0]?.tiers || [] : []

    return (
      <div 
        className="h-full w-full flex flex-col relative overflow-hidden"
        style={{ backgroundColor }}
      >
        {/* Magic Background */}
        {customBackground && <MagicBackground key={customBackground.length} htmlCode={customBackground} />}
        
        {/* Header */}
        <div className="px-10 py-4 border-b flex-shrink-0 relative z-10" style={{ borderBottomColor: `${containerColor}40` }}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="w-2 h-16 rounded-full" style={{ backgroundColor: `${fontColor}30` }}></div>
              <div>
                <h1 className="text-5xl font-bold" style={{ color: fontColor, fontFamily: titleFont }}>
                  {singleCategory?.category.name || 'Select a Category'}
                </h1>
              </div>
            </div>
            
            {/* Pricing Tiers in Header (header mode) */}
            {priceLocation === 'header' && headerTiers.length > 0 && (
              <div className="text-right">
                <div className="flex items-center gap-8">
                  {headerTiers.map((tier: any, idx: number) => (
                    <div key={idx} className="text-center">
                      <div className="text-base mb-2 uppercase" style={{ color: `${fontColor}60`, fontFamily: pricingFont }}>
                        {tier.label} {tier.unit}
                      </div>
                      <div className="text-5xl font-bold" style={{ color: fontColor, fontFamily: pricingFont }}>
                        ${parseFloat(tier.price).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Products - Fixed No Scroll */}
        <div className="flex-1 overflow-hidden px-8 py-4 flex items-start relative z-10">
          {!singleCategory ? (
            <div className="flex items-center justify-center h-full w-full">
              <div className="text-center">
                <div className="mb-6">
                  <img src="/logo123.png" alt="Flora" className="w-32 h-32 mx-auto opacity-30" />
                </div>
                <p className="text-2xl font-semibold mb-2" style={{ color: fontColor, fontFamily: titleFont }}>No Category Selected</p>
                <p className="text-base" style={{ color: `${fontColor}60`, fontFamily: cardFont }}>Select a category from the toolbar above</p>
              </div>
            </div>
          ) : singleCategory.products.length === 0 ? (
            <div className="flex items-center justify-center h-full w-full">
              <div className="text-center">
                <div className="mb-6">
                  <img src="/logo123.png" alt="Flora" className="w-32 h-32 mx-auto opacity-30" />
                </div>
                <p className="text-2xl font-semibold mb-2" style={{ color: fontColor, fontFamily: titleFont }}>No Products</p>
                <p className="text-base" style={{ color: `${fontColor}60`, fontFamily: cardFont }}>No products found in this category</p>
              </div>
            </div>
          ) : (() => {
              const actualMode = viewMode === 'auto' ? (singleCategory.products.length > 20 ? 'table' : 'card') : viewMode
              
              console.log('🎨 Rendering with mode:', actualMode, 'viewMode prop:', viewMode)
              
              return actualMode === 'card' ? (
                <div className={`grid gap-3 w-full overflow-hidden auto-rows-min ${
                  orientation === 'horizontal' 
                    ? 'grid-cols-4' 
                    : 'grid-cols-3'
                }`}>
                  {singleCategory.products.slice(0, orientation === 'horizontal' ? 8 : 9).map(product => renderProductCard(product, showImages, priceLocation, singleCategory.category.slug))}
                </div>
              ) : (() => {
                const maxItemsPerColumn = 12;
                const useDoubleColumn = singleCategory.products.length > maxItemsPerColumn;
                const visibleProducts = singleCategory.products.slice(0, useDoubleColumn ? maxItemsPerColumn * 2 : maxItemsPerColumn);
                
                if (useDoubleColumn) {
                  const midPoint = Math.ceil(visibleProducts.length / 2);
                  const leftColumn = visibleProducts.slice(0, midPoint);
                  const rightColumn = visibleProducts.slice(midPoint);
                  
                  return (
                    <div className="grid grid-cols-2 gap-4 w-full">
                      <div className="rounded-2xl overflow-hidden backdrop-blur-xl" style={{ 
                        background: `linear-gradient(135deg, ${containerColor}${Math.round((containerOpacity / 100) * 96).toString(16).padStart(2, '0')} 0%, ${containerColor}${Math.round((containerOpacity / 100) * 64).toString(16).padStart(2, '0')} 100%)`,
                        border: `${borderWidth}px solid rgba(255, 255, 255, ${(borderOpacity / 100)})`,
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                      }}>
                        {renderTableHeader(singleCategory.category.slug, showImages)}
                        {leftColumn.map((product, idx) => 
                          renderProductRow(product, idx, singleCategory.category.slug)
                        )}
                      </div>
                      <div className="rounded-2xl overflow-hidden backdrop-blur-xl" style={{ 
                        background: `linear-gradient(135deg, ${containerColor}${Math.round((containerOpacity / 100) * 96).toString(16).padStart(2, '0')} 0%, ${containerColor}${Math.round((containerOpacity / 100) * 64).toString(16).padStart(2, '0')} 100%)`,
                        border: `${borderWidth}px solid rgba(255, 255, 255, ${(borderOpacity / 100)})`,
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                      }}>
                        {renderTableHeader(singleCategory.category.slug, showImages)}
                        {rightColumn.map((product, idx) => 
                          renderProductRow(product, idx, singleCategory.category.slug)
                        )}
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="rounded-2xl overflow-hidden backdrop-blur-xl w-full" style={{ 
                      background: `linear-gradient(135deg, ${containerColor}${Math.round((containerOpacity / 100) * 96).toString(16).padStart(2, '0')} 0%, ${containerColor}${Math.round((containerOpacity / 100) * 64).toString(16).padStart(2, '0')} 100%)`,
                      border: `${borderWidth}px solid rgba(255, 255, 255, ${(borderOpacity / 100)})`,
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                    }}>
                      {renderTableHeader(singleCategory.category.slug, showImages)}
                      {visibleProducts.map((product, idx) => 
                        renderProductRow(product, idx, singleCategory.category.slug)
                      )}
                    </div>
                  );
                }
              })()
            })()}
        </div>
      </div>
    )
  }

  // Dual menu layout
  const leftProducts = filterProductsByCategory(leftMenuCategory)
  const rightProducts = filterProductsByCategory(rightMenuCategory)
  const leftProducts2 = enableLeftStacking && leftMenuCategory2 ? filterProductsByCategory(leftMenuCategory2) : []
  const rightProducts2 = enableRightStacking && rightMenuCategory2 ? filterProductsByCategory(rightMenuCategory2) : []
  
  // Get pricing tiers for each panel header
  const leftFirstWithTiers = leftProducts.find(p => (p as any).blueprintPricing?.ruleGroups?.[0]?.tiers?.length > 0)
  const leftHeaderTiers = leftFirstWithTiers ? (leftFirstWithTiers as any).blueprintPricing?.ruleGroups?.[0]?.tiers || [] : []
  
  const rightFirstWithTiers = rightProducts.find(p => (p as any).blueprintPricing?.ruleGroups?.[0]?.tiers?.length > 0)
  const rightHeaderTiers = rightFirstWithTiers ? (rightFirstWithTiers as any).blueprintPricing?.ruleGroups?.[0]?.tiers || [] : []

  console.log('🎨 Quad layout check:', {
    enableLeftStacking,
    enableRightStacking,
    leftTop: leftMenuCategory,
    rightTop: rightMenuCategory,
    leftBottom: leftMenuCategory2,
    rightBottom: rightMenuCategory2,
    leftBottomProducts: leftProducts2.length,
    rightBottomProducts: rightProducts2.length
  });

  return (
    <div 
      className={`h-full w-full flex ${orientation === 'vertical' ? 'flex-col' : 'flex-row'} relative overflow-hidden`}
      style={{ backgroundColor }}
    >
      {/* Magic Background */}
      {customBackground && <MagicBackground key={customBackground.length} htmlCode={customBackground} />}
      
      {/* Left Panel - with stacking support */}
      <div 
        className={`w-1/2 flex ${enableLeftStacking && leftMenuCategory2 ? 'flex-col' : 'flex-col'} ${orientation === 'vertical' ? 'border-b' : 'border-r'} overflow-hidden flex-shrink-0`}
        style={{
          borderColor: `${containerColor}40`
        }}
      >
        {/* Left Top Quadrant */}
        <div 
          className={`${enableLeftStacking && leftMenuCategory2 ? 'h-1/2 border-b' : 'h-full'} flex flex-col cursor-pointer transition-all`}
          style={{
            borderColor: enableLeftStacking && leftMenuCategory2 ? `${containerColor}40` : undefined,
            backgroundColor: selectedSide === 'left' ? `${fontColor}05` : 'transparent'
          }}
          onClick={(e) => {
            e.stopPropagation()
            console.log('🖱️ LEFT TOP panel clicked')
            onSideClick?.('left')
          }}
        >
        {/* Left Header */}
        <div className="px-6 py-3 border-b flex-shrink-0" style={{ borderBottomColor: `${containerColor}40` }}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-1.5 h-10 rounded-full transition-all flex-shrink-0" style={{
                backgroundColor: selectedSide === 'left' ? fontColor : `${fontColor}30`
              }} />
              <div className="min-w-0">
                <h2 className="text-3xl font-bold truncate" style={{ color: fontColor, fontFamily: titleFont }}>
                  {categories.find(c => c.slug === leftMenuCategory)?.name || 'Select Category'}
                </h2>
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
        
        {/* Left Products */}
        <div className="flex-1 overflow-hidden px-4 py-2 flex items-start">
          {!leftMenuCategory ? (
            <div className="flex items-center justify-center h-full w-full">
              <div className="text-center">
                <div className="mb-4">
                  <img src="/logo123.png" alt="Flora" className="w-24 h-24 mx-auto opacity-30" />
                </div>
                <p className="text-lg font-semibold mb-2" style={{ color: fontColor, fontFamily: titleFont }}>No Category Selected</p>
                <p className="text-sm" style={{ color: `${fontColor}60`, fontFamily: cardFont }}>Click "Left" and select a category</p>
              </div>
            </div>
          ) : leftProducts.length === 0 ? (
            <div className="flex items-center justify-center h-full w-full">
              <div className="text-center">
                <div className="mb-4">
                  <img src="/logo123.png" alt="Flora" className="w-24 h-24 mx-auto opacity-30" />
                </div>
                <p className="text-lg font-semibold mb-2" style={{ color: fontColor, fontFamily: titleFont }}>No Products</p>
                <p className="text-sm" style={{ color: `${fontColor}60`, fontFamily: cardFont }}>No products in this category</p>
              </div>
            </div>
          ) : leftMenuViewMode === 'card' ? (
            <div className="grid grid-cols-4 gap-2 w-full overflow-hidden auto-rows-min">
              {leftProducts.slice(0, 12).map((product) => renderProductCard(product, leftMenuImages, leftPriceLocation, leftMenuCategory || undefined))}
            </div>
          ) : (() => {
            const maxItemsPerColumn = 12;
            const useDoubleColumn = leftProducts.length > maxItemsPerColumn;
            const visibleProducts = leftProducts.slice(0, useDoubleColumn ? maxItemsPerColumn * 2 : maxItemsPerColumn);
            
            if (useDoubleColumn) {
              const midPoint = Math.ceil(visibleProducts.length / 2);
              const leftCol = visibleProducts.slice(0, midPoint);
              const rightCol = visibleProducts.slice(midPoint);
              
              return (
                <div className="grid grid-cols-2 gap-2 w-full">
                  <div className="rounded-2xl overflow-hidden backdrop-blur-xl" style={{ 
                    background: `linear-gradient(135deg, ${containerColor}${Math.round((containerOpacity / 100) * 96).toString(16).padStart(2, '0')} 0%, ${containerColor}${Math.round((containerOpacity / 100) * 64).toString(16).padStart(2, '0')} 100%)`,
                    border: `${borderWidth}px solid rgba(255, 255, 255, ${(borderOpacity / 100)})`,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                  }}>
                    {leftCol.map((product, idx) => renderProductRow(product, idx, leftMenuCategory || undefined, leftPriceLocation, leftMenuImages))}
                  </div>
                  <div className="rounded-2xl overflow-hidden backdrop-blur-xl" style={{ 
                    background: `linear-gradient(135deg, ${containerColor}${Math.round((containerOpacity / 100) * 96).toString(16).padStart(2, '0')} 0%, ${containerColor}${Math.round((containerOpacity / 100) * 64).toString(16).padStart(2, '0')} 100%)`,
                    border: `${borderWidth}px solid rgba(255, 255, 255, ${(borderOpacity / 100)})`,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                  }}>
                    {rightCol.map((product, idx) => renderProductRow(product, idx, leftMenuCategory || undefined, leftPriceLocation, leftMenuImages))}
                  </div>
                </div>
              );
            } else {
              return (
                <div className="rounded-2xl overflow-hidden backdrop-blur-xl w-full" style={{ 
                  background: `linear-gradient(135deg, ${containerColor}${Math.round((containerOpacity / 100) * 96).toString(16).padStart(2, '0')} 0%, ${containerColor}${Math.round((containerOpacity / 100) * 64).toString(16).padStart(2, '0')} 100%)`,
                  border: `${borderWidth}px solid rgba(255, 255, 255, ${(borderOpacity / 100)})`,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                }}>
                  {visibleProducts.map((product, idx) => renderProductRow(product, idx, leftMenuCategory || undefined, leftPriceLocation, leftMenuImages))}
                </div>
              );
            }
          })()}
        </div>
        </div>

        {/* Left Bottom Quadrant (Stacking) */}
        {enableLeftStacking && leftMenuCategory2 && (
          <div 
            className="h-1/2 flex flex-col cursor-pointer transition-all"
            style={{
              backgroundColor: selectedSide === 'leftBottom' ? `${fontColor}05` : 'transparent'
            }}
            onClick={(e) => {
              e.stopPropagation()
              console.log('🖱️ LEFT BOTTOM panel clicked')
              onSideClick?.('leftBottom')
            }}
          >
            {/* Left Bottom Header - Match top quadrant styling */}
            <div className="px-6 py-3 border-b flex-shrink-0" style={{ borderBottomColor: `${containerColor}40` }}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-1.5 h-10 rounded-full transition-all flex-shrink-0" style={{
                  backgroundColor: selectedSide === 'leftBottom' ? fontColor : `${fontColor}30`
                }} />
                <div className="min-w-0">
                  <h2 className="text-3xl font-bold truncate" style={{ color: fontColor, fontFamily: titleFont }}>
                    {categories.find(c => c.slug === leftMenuCategory2)?.name}
                  </h2>
                </div>
              </div>
            </div>
            
            {/* Left Bottom Products - Match top quadrant styling */}
            <div className="flex-1 overflow-hidden px-4 py-2 flex items-start">
              {(() => {
                const actualMode = leftMenuViewMode2 === 'auto' ? (leftProducts2.length > 20 ? 'table' : 'card') : leftMenuViewMode2;
                console.log('🎨 [LEFT BOTTOM] Rendering mode:', actualMode, 'from leftMenuViewMode2:', leftMenuViewMode2);
                
                return actualMode === 'card' ? (
                  <div className="grid grid-cols-4 gap-3 auto-rows-min w-full">
                    {leftProducts2.map((p) => renderProductCard(p, leftMenuImages2, leftPriceLocation))}
                  </div>
                ) : (() => {
                  const maxItemsPerColumn = 8;
                  const useDoubleColumn = leftProducts2.length > maxItemsPerColumn;
                  
                  if (useDoubleColumn) {
                    const midPoint = Math.ceil(leftProducts2.length / 2);
                    const leftCol = leftProducts2.slice(0, midPoint);
                    const rightCol = leftProducts2.slice(midPoint);
                    
                    return (
                      <div className="grid grid-cols-2 gap-3 w-full">
                        <div className="rounded-2xl overflow-hidden backdrop-blur-xl" style={{ 
                    background: `linear-gradient(135deg, ${containerColor}${Math.round((containerOpacity / 100) * 96).toString(16).padStart(2, '0')} 0%, ${containerColor}${Math.round((containerOpacity / 100) * 64).toString(16).padStart(2, '0')} 100%)`,
                    border: `${borderWidth}px solid rgba(255, 255, 255, ${(borderOpacity / 100)})`,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                  }}>
                          {leftCol.map((p, idx) => renderProductRow(p, idx, leftMenuCategory2 || undefined, leftPriceLocation, leftMenuImages2))}
                        </div>
                        <div className="rounded-2xl overflow-hidden backdrop-blur-xl" style={{ 
                    background: `linear-gradient(135deg, ${containerColor}${Math.round((containerOpacity / 100) * 96).toString(16).padStart(2, '0')} 0%, ${containerColor}${Math.round((containerOpacity / 100) * 64).toString(16).padStart(2, '0')} 100%)`,
                    border: `${borderWidth}px solid rgba(255, 255, 255, ${(borderOpacity / 100)})`,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                  }}>
                          {rightCol.map((p, idx) => renderProductRow(p, idx, leftMenuCategory2 || undefined, leftPriceLocation, leftMenuImages2))}
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div className="rounded-2xl overflow-hidden backdrop-blur-xl w-full" style={{ 
                  background: `linear-gradient(135deg, ${containerColor}${Math.round((containerOpacity / 100) * 96).toString(16).padStart(2, '0')} 0%, ${containerColor}${Math.round((containerOpacity / 100) * 64).toString(16).padStart(2, '0')} 100%)`,
                  border: `${borderWidth}px solid rgba(255, 255, 255, ${(borderOpacity / 100)})`,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                }}>
                        {leftProducts2.map((p, idx) => renderProductRow(p, idx, leftMenuCategory2 || undefined, leftPriceLocation, leftMenuImages2))}
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
      <div 
        className="w-1/2 flex flex-col overflow-hidden flex-shrink-0"
      >
        {/* Right Top Quadrant */}
        <div 
          className={`${enableRightStacking && rightMenuCategory2 ? 'h-1/2 border-b' : 'h-full'} flex flex-col cursor-pointer transition-all`}
          style={{
            borderColor: enableRightStacking && rightMenuCategory2 ? `${containerColor}40` : undefined,
            backgroundColor: selectedSide === 'right' ? `${fontColor}05` : 'transparent'
          }}
          onClick={(e) => {
            e.stopPropagation()
            console.log('🖱️ RIGHT TOP panel clicked')
            onSideClick?.('right')
          }}
        >
        {/* Right Header */}
        <div className="px-6 py-3 border-b flex-shrink-0" style={{ borderBottomColor: `${containerColor}40` }}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-1.5 h-10 rounded-full transition-all flex-shrink-0" style={{
                backgroundColor: selectedSide === 'right' ? fontColor : `${fontColor}30`
              }} />
              <div className="min-w-0">
                <h2 className="text-3xl font-bold truncate" style={{ color: fontColor, fontFamily: titleFont }}>
                  {categories.find(c => c.slug === rightMenuCategory)?.name || 'Select Category'}
                </h2>
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
        
        {/* Right Products */}
        <div className="flex-1 overflow-hidden px-4 py-2 flex items-start">
          {!rightMenuCategory ? (
            <div className="flex items-center justify-center h-full w-full">
              <div className="text-center">
                <div className="mb-4">
                  <img src="/logo123.png" alt="Flora" className="w-24 h-24 mx-auto opacity-30" />
                </div>
                <p className="text-lg font-semibold mb-2" style={{ color: fontColor, fontFamily: titleFont }}>No Category Selected</p>
                <p className="text-sm" style={{ color: `${fontColor}60`, fontFamily: cardFont }}>Click "Right" and select a category</p>
              </div>
            </div>
          ) : rightProducts.length === 0 ? (
            <div className="flex items-center justify-center h-full w-full">
              <div className="text-center">
                <div className="mb-4">
                  <img src="/logo123.png" alt="Flora" className="w-24 h-24 mx-auto opacity-30" />
                </div>
                <p className="text-lg font-semibold mb-2" style={{ color: fontColor, fontFamily: titleFont }}>No Products</p>
                <p className="text-sm" style={{ color: `${fontColor}60`, fontFamily: cardFont }}>No products in this category</p>
              </div>
            </div>
          ) : rightMenuViewMode === 'card' ? (
            <div className="grid grid-cols-4 gap-2 w-full overflow-hidden auto-rows-min">
              {rightProducts.slice(0, 12).map((product) => renderProductCard(product, rightMenuImages, rightPriceLocation, rightMenuCategory || undefined))}
            </div>
          ) : (() => {
            const maxItemsPerColumn = 12;
            const useDoubleColumn = rightProducts.length > maxItemsPerColumn;
            const visibleProducts = rightProducts.slice(0, useDoubleColumn ? maxItemsPerColumn * 2 : maxItemsPerColumn);
            
            if (useDoubleColumn) {
              const midPoint = Math.ceil(visibleProducts.length / 2);
              const leftCol = visibleProducts.slice(0, midPoint);
              const rightCol = visibleProducts.slice(midPoint);
              
              return (
                <div className="grid grid-cols-2 gap-2 w-full">
                  <div className="rounded-2xl overflow-hidden backdrop-blur-xl" style={{ 
                    background: `linear-gradient(135deg, ${containerColor}${Math.round((containerOpacity / 100) * 96).toString(16).padStart(2, '0')} 0%, ${containerColor}${Math.round((containerOpacity / 100) * 64).toString(16).padStart(2, '0')} 100%)`,
                    border: `${borderWidth}px solid rgba(255, 255, 255, ${(borderOpacity / 100)})`,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                  }}>
                    {leftCol.map((product, idx) => renderProductRow(product, idx, rightMenuCategory || undefined, rightPriceLocation, rightMenuImages))}
                  </div>
                  <div className="rounded-2xl overflow-hidden backdrop-blur-xl" style={{ 
                    background: `linear-gradient(135deg, ${containerColor}${Math.round((containerOpacity / 100) * 96).toString(16).padStart(2, '0')} 0%, ${containerColor}${Math.round((containerOpacity / 100) * 64).toString(16).padStart(2, '0')} 100%)`,
                    border: `${borderWidth}px solid rgba(255, 255, 255, ${(borderOpacity / 100)})`,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                  }}>
                    {rightCol.map((product, idx) => renderProductRow(product, idx, rightMenuCategory || undefined, rightPriceLocation, rightMenuImages))}
                  </div>
                </div>
              );
            } else {
              return (
                <div className="rounded-2xl overflow-hidden backdrop-blur-xl w-full" style={{ 
                  background: `linear-gradient(135deg, ${containerColor}${Math.round((containerOpacity / 100) * 96).toString(16).padStart(2, '0')} 0%, ${containerColor}${Math.round((containerOpacity / 100) * 64).toString(16).padStart(2, '0')} 100%)`,
                  border: `${borderWidth}px solid rgba(255, 255, 255, ${(borderOpacity / 100)})`,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                }}>
                  {visibleProducts.map((product, idx) => renderProductRow(product, idx, rightMenuCategory || undefined, rightPriceLocation, rightMenuImages))}
                </div>
              );
            }
          })()}
        </div>
        </div>

        {/* Right Bottom Quadrant (Stacking) */}
        {enableRightStacking && rightMenuCategory2 && (
          <div 
            className="h-1/2 flex flex-col cursor-pointer transition-all"
            style={{
              backgroundColor: selectedSide === 'rightBottom' ? `${fontColor}05` : 'transparent'
            }}
            onClick={(e) => {
              e.stopPropagation()
              console.log('🖱️ RIGHT BOTTOM panel clicked')
              onSideClick?.('rightBottom')
            }}
          >
            {/* Right Bottom Header - Match top quadrant styling */}
            <div className="px-6 py-3 border-b flex-shrink-0" style={{ borderBottomColor: `${containerColor}40` }}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-1.5 h-10 rounded-full transition-all flex-shrink-0" style={{
                  backgroundColor: selectedSide === 'rightBottom' ? fontColor : `${fontColor}30`
                }} />
                <div className="min-w-0">
                  <h2 className="text-3xl font-bold truncate" style={{ color: fontColor, fontFamily: titleFont }}>
                    {categories.find(c => c.slug === rightMenuCategory2)?.name}
                  </h2>
                </div>
              </div>
            </div>
            
            {/* Right Bottom Products - Match top quadrant styling */}
            <div className="flex-1 overflow-hidden px-4 py-2 flex items-start">
              {(() => {
                const actualMode = rightMenuViewMode2 === 'auto' ? (rightProducts2.length > 20 ? 'table' : 'card') : rightMenuViewMode2;
                console.log('🎨 [RIGHT BOTTOM] Rendering mode:', actualMode, 'from rightMenuViewMode2:', rightMenuViewMode2);
                
                return actualMode === 'card' ? (
                  <div className="grid grid-cols-4 gap-3 auto-rows-min w-full">
                    {rightProducts2.map((p) => renderProductCard(p, rightMenuImages2, rightPriceLocation))}
                  </div>
                ) : (() => {
                  const maxItemsPerColumn = 8;
                  const useDoubleColumn = rightProducts2.length > maxItemsPerColumn;
                  
                  if (useDoubleColumn) {
                    const midPoint = Math.ceil(rightProducts2.length / 2);
                    const leftCol = rightProducts2.slice(0, midPoint);
                    const rightCol = rightProducts2.slice(midPoint);
                    
                    return (
                      <div className="grid grid-cols-2 gap-3 w-full">
                        <div className="rounded-2xl overflow-hidden backdrop-blur-xl" style={{ 
                    background: `linear-gradient(135deg, ${containerColor}${Math.round((containerOpacity / 100) * 96).toString(16).padStart(2, '0')} 0%, ${containerColor}${Math.round((containerOpacity / 100) * 64).toString(16).padStart(2, '0')} 100%)`,
                    border: `${borderWidth}px solid rgba(255, 255, 255, ${(borderOpacity / 100)})`,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                  }}>
                          {leftCol.map((p, idx) => renderProductRow(p, idx, rightMenuCategory2 || undefined, rightPriceLocation, rightMenuImages2))}
                        </div>
                        <div className="rounded-2xl overflow-hidden backdrop-blur-xl" style={{ 
                    background: `linear-gradient(135deg, ${containerColor}${Math.round((containerOpacity / 100) * 96).toString(16).padStart(2, '0')} 0%, ${containerColor}${Math.round((containerOpacity / 100) * 64).toString(16).padStart(2, '0')} 100%)`,
                    border: `${borderWidth}px solid rgba(255, 255, 255, ${(borderOpacity / 100)})`,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                  }}>
                          {rightCol.map((p, idx) => renderProductRow(p, idx, rightMenuCategory2 || undefined, rightPriceLocation, rightMenuImages2))}
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div className="rounded-2xl overflow-hidden backdrop-blur-xl w-full" style={{ 
                  background: `linear-gradient(135deg, ${containerColor}${Math.round((containerOpacity / 100) * 96).toString(16).padStart(2, '0')} 0%, ${containerColor}${Math.round((containerOpacity / 100) * 64).toString(16).padStart(2, '0')} 100%)`,
                  border: `${borderWidth}px solid rgba(255, 255, 255, ${(borderOpacity / 100)})`,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                }}>
                        {rightProducts2.map((p, idx) => renderProductRow(p, idx, rightMenuCategory2 || undefined, rightPriceLocation, rightMenuImages2))}
                      </div>
                    );
                  }
                })();
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


