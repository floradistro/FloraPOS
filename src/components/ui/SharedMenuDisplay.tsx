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
import { hexToRgba } from '@/lib/color-utils'

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
  glowIntensity?: number
  headerTitleSize?: number
  cardTitleSize?: number
  priceSize?: number
  categorySize?: number
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
  glowIntensity = 0,
  headerTitleSize = 60,
  cardTitleSize = 18,
  priceSize = 32,
  categorySize = 40,
  customBackground = '',
  priceLocation = 'header',
  leftPriceLocation = 'header',
  rightPriceLocation = 'header',
  categoryColumnConfigs = new Map(),
  categoryBlueprintFields = new Map(),
  selectedSide = '',
  onSideClick,
  isPreview = false,
  pricingTiersShape = 'circle',
  pricingContainerOpacity = 80,
  pricingBorderWidth = 2,
  pricingBorderOpacity = 15,
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
    totalProducts: products.length,
    totalCategories: categories.length,
    categoryNames: categories.map(c => ({ id: c.id, name: c.name, slug: c.slug }))
  });
  
  // Get Flora Field value - checks ALL possible formats
  const getFieldValue = (product: Product, fieldName: string): string => {
    // Normalize field name
    let normalizedFieldName = fieldName;
    if (fieldName === 'effects') normalizedFieldName = 'effect';
    if (fieldName === 'thc_percentage') normalizedFieldName = 'thca_percentage';
    
    // Check V2 Flora Fields format: product.fields array
    if (product.fields && Array.isArray(product.fields)) {
      const field = product.fields.find(f => f.name === normalizedFieldName || f.name === fieldName);
      if (field && field.has_value) {
        return field.value?.toString() || '';
      }
    }
    
    // Check meta_data for ALL possible formats (same as ColumnSelector)
    if (product.meta_data && Array.isArray(product.meta_data)) {
      // Try all possible key formats - PRIORITIZE non-underscore keys first
      const possibleKeys = [
        // First try keys WITHOUT underscore (these have actual values)
        normalizedFieldName,
        fieldName,
        `_fd_field_${normalizedFieldName}`,
        `_fd_field_${fieldName}`,
        `_blueprint_${normalizedFieldName}`,
        `_blueprint_${fieldName}`,
        `blueprint_${normalizedFieldName}`,
        `blueprint_${fieldName}`,
        // Last resort: underscore-prefixed (but skip ACF field IDs)
        `_${normalizedFieldName}`,
        `_${fieldName}`
      ];
      
      for (const key of possibleKeys) {
        const meta = product.meta_data.find(m => m.key === key);
        if (meta && meta.value) {
          const value = String(meta.value).trim();
          // Skip ACF field ID references (format: "field_XXXXXXXXXXXXX")
          if (value && !value.startsWith('field_')) {
            return value;
          }
        }
      }
    }
    
    // Check direct product properties
    if ((product as any)[normalizedFieldName]) {
      return String((product as any)[normalizedFieldName]);
    }
    if ((product as any)[fieldName]) {
      return String((product as any)[fieldName]);
    }
    
    return '';
  }

  // Filter products by category
  const filterProductsByCategory = (categorySlug: string | null) => {
    if (!categorySlug) return products
    return products.filter(p => p.categories?.some(c => c.slug === categorySlug))
  }

  // Render product card - COMPACT & RESPONSIVE
  const renderProductCard = (product: Product, showImg: boolean, cardPriceLocation: 'none' | 'header' | 'inline' = priceLocation, categorySlug?: string) => {
    // Use blueprint pricing if available, otherwise regular price (SAME AS LIVE MENU)
    const priceNum = (product as any).blueprintPricing?.calculated_price 
      ? parseFloat((product as any).blueprintPricing.calculated_price.toString()) 
      : product.regular_price ? parseFloat(product.regular_price) : 0
    const hasImage = Boolean(product.image)
    const columns = categorySlug ? (categoryColumnConfigs.get(categorySlug) || ['name']) : ['name']
    
    // Get pricing tiers from blueprint pricing (SAME AS LIVE MENU)
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
        <h3 className="font-bold mb-2 line-clamp-2 flex-shrink-0" style={{ 
          fontSize: `${cardTitleSize}px`,
          color: cardFontColor, 
          minHeight: '2.5rem', 
          fontFamily: cardFont,
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
          letterSpacing: '-0.02em'
        }}>
          {product.name}
        </h3>
        
        {/* Flora Fields */}
        {blueprintColumns.length > 0 && (
          <div className="space-y-0.5 mb-2 text-left">
            {blueprintColumns.slice(0, 3).map((columnName) => {
              const value = getFieldValue(product, columnName)
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
                  <span style={{ color: `${cardFontColor}CC`, fontFamily: pricingFont, fontSize: `${priceSize * 0.4}px`, fontWeight: 500 }}>{tier.label}</span>
                  <span className="font-bold" style={{ color: cardFontColor, fontFamily: pricingFont, fontSize: `${priceSize * 0.6}px` }}>
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
  }

  // Render table header row - APPLE 2035 AESTHETIC
  const renderTableHeader = (categorySlug?: string, panelShowImages: boolean = showImages) => {
    const columns = categorySlug ? (categoryColumnConfigs.get(categorySlug) || ['name']) : ['name']
    const category = categories.find(c => c.slug === categorySlug)
    const categoryName = category?.name || 'Product'
    
    console.log(`📋 Rendering table header for ${categorySlug}:`, { 
      columns, 
      categoryName,
      hasConfig: categoryColumnConfigs.has(categorySlug || ''),
      allConfigs: Array.from(categoryColumnConfigs.entries())
    });
    
    return (
      <div className="flex items-center gap-6 py-4 px-6 sticky top-0 z-10 backdrop-blur-2xl" style={{ 
        background: `linear-gradient(180deg, ${containerColor}${Math.round((containerOpacity / 100) * 240).toString(16).padStart(2, '0')} 0%, ${containerColor}${Math.round((containerOpacity / 100) * 200).toString(16).padStart(2, '0')} 100%)`,
        borderBottom: `1px solid rgba(255, 255, 255, ${borderOpacity / 100 * 0.08})`,
        boxShadow: '0 1px 0 rgba(255, 255, 255, 0.04), 0 4px 16px rgba(0, 0, 0, 0.12)'
      }}>
        {/* Image Header - Minimal */}
        {panelShowImages && (
          <div className="w-16 flex-shrink-0" />
        )}
        
        {/* Column Headers - Clean & Modern */}
        <div className="flex-1 min-w-0 grid gap-6" style={{ 
          gridTemplateColumns: columns.length === 1 ? '1fr' : 
                              columns.length === 2 ? '2fr 1fr' :
                              columns.length === 3 ? '2fr 1fr 1fr' :
                              columns.length === 4 ? '2fr 1fr 1fr 1fr' :
                              `2fr ${Array(columns.length - 1).fill('1fr').join(' ')}`
        }}>
          {columns.map((columnName, idx) => (
            <div key={columnName} className="min-w-0 flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-[0.08em] truncate block" style={{ 
                color: `${fontColor}${idx === 0 ? 'DD' : '99'}`, 
                fontFamily: cardFont, 
                textAlign: 'left',
                letterSpacing: '0.08em',
                fontWeight: idx === 0 ? '600' : '500'
              }}>
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
    // Use blueprint pricing if available, otherwise regular price (SAME AS LIVE MENU)
    const price = (product as any).blueprintPricing?.calculated_price 
      ? parseFloat((product as any).blueprintPricing.calculated_price.toString()) 
      : product.regular_price ? parseFloat(product.regular_price) : 0
    const columns = categorySlug ? (categoryColumnConfigs.get(categorySlug) || ['name']) : ['name']
    const hasImage = Boolean(product.image)
    
    // Get pricing tiers from blueprint (SAME AS LIVE MENU)
    const pricingTiers = (product as any).blueprintPricing?.ruleGroups?.[0]?.tiers || []
    const hasTiers = pricingTiers.length > 0

    // Calculate alpha values for row transparency
    const rowAlpha1 = Math.round((containerOpacity / 100) * 64).toString(16).padStart(2, '0')
    const rowAlpha2 = Math.round((containerOpacity / 100) * 32).toString(16).padStart(2, '0')
    const borderAlpha = (borderOpacity / 100).toFixed(2)

    return (
      <div
        key={product.id}
        className="group relative flex items-center gap-6 py-5 px-6 flex-shrink-0 transition-all duration-200 hover:bg-white/[0.03]"
        style={{
          background: index % 2 === 0 
            ? `rgba(255, 255, 255, ${(containerOpacity / 100) * 0.015})` 
            : 'transparent',
          borderBottom: `1px solid rgba(255, 255, 255, ${borderOpacity / 100 * 0.05})`,
          color: fontColor,
          backdropFilter: `blur(${blurIntensity}px)`
        }}
      >
        {/* Image */}
        {panelShowImages && (
          <div 
            className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 ring-1 ring-white/[0.06]" 
            style={{ 
              background: `${imageBackgroundColor}${Math.round((imageOpacity / 100) * 255).toString(16).padStart(2, '0')}`,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
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

        {/* Columns Content - Modern Apple 2035 Table Layout */}
        <div className="flex-1 min-w-0 grid gap-6" style={{ 
          gridTemplateColumns: columns.length === 1 ? '1fr' : 
                              columns.length === 2 ? '2fr 1fr' :
                              columns.length === 3 ? '2fr 1fr 1fr' :
                              columns.length === 4 ? '2fr 1fr 1fr 1fr' :
                              `2fr ${Array(columns.length - 1).fill('1fr').join(' ')}`
        }}>
          {columns.map((columnName, idx) => {
            const value = columnName === 'name' ? product.name : getFieldValue(product, columnName)
            
            // Debug logging for first product
            if (index === 0 && idx > 0) {
              console.log(`🔍 [Column Debug] Product: "${product.name}", Column: "${columnName}", Value: "${value}"`, {
                hasFields: !!product.fields,
                fieldsArray: product.fields,
                hasMetaData: !!product.meta_data,
                metaDataKeys: product.meta_data?.map(m => m.key),
                metaDataSample: product.meta_data?.slice(0, 5)
              });
            }
            
            // Always render the cell to maintain grid layout
            return (
              <div key={columnName} className="min-w-0 flex items-center">
                <span className={`${idx === 0 ? 'font-semibold' : 'font-normal'} truncate block`} style={{ 
                  fontSize: idx === 0 ? `${cardTitleSize}px` : `${cardTitleSize * 0.85}px`,
                  color: value ? fontColor : `${fontColor}30`,
                  fontFamily: cardFont, 
                  textAlign: 'left',
                  letterSpacing: idx === 0 ? '-0.015em' : '0',
                  lineHeight: '1.4'
                }}>
                  {value || (idx === 0 ? 'Untitled' : '—')}
                </span>
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
                <div className="mb-1 uppercase tracking-wider font-semibold" style={{ fontSize: `${priceSize * 0.3}px`, color: `${fontColor}CC`, fontFamily: cardFont }}>
                  {tier.label}
                </div>
                <div className="font-bold" style={{ 
                  fontSize: `${priceSize * 0.6}px`,
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

        {/* Subtle accent line on hover */}
        <div className="absolute left-0 top-0 bottom-0 w-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ 
          background: `linear-gradient(180deg, transparent 0%, ${fontColor}40 50%, transparent 100%)` 
        }} />
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
              <div className="text-right flex-shrink-0">
                <div className="flex items-center gap-4">
                  {tierStructure.map((tier: any, idx: number) => (
                    <div 
                      key={idx} 
                      className="text-center px-4 py-3 rounded-xl backdrop-blur-xl"
                      style={{
                        background: `${containerColor}80`,
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      <div className="mb-2 uppercase font-semibold" style={{ fontSize: `${priceSize * 0.4}px`, color: `${fontColor}DD`, fontFamily: pricingFont }}>
                        {tier.label} {tier.unit}
                      </div>
                      <div className="font-bold" style={{ fontSize: `${priceSize}px`, color: fontColor, fontFamily: pricingFont }}>
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
        
        {/* Header - Only show when category is selected */}
        {singleCategory && (
        <div className="px-10 py-4 border-b flex-shrink-0 relative z-10" style={{ borderBottomColor: `${containerColor}40` }}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="w-2 h-16 rounded-full" style={{ backgroundColor: `${fontColor}30` }}></div>
              <div>
                <h1 className="font-bold" style={{ 
                  fontSize: `${headerTitleSize}px`, 
                  color: fontColor, 
                  fontFamily: titleFont,
                  textShadow: `0 4px 12px rgba(0, 0, 0, 0.5), 0 0 ${glowIntensity}px ${hexToRgba(fontColor, 0.6)}, 0 0 ${glowIntensity * 2}px ${hexToRgba(fontColor, 0.3)}`
                }}>
                  {singleCategory.category.name}
                </h1>
              </div>
            </div>
            
            {/* Pricing Tiers in Header (header mode) */}
            {priceLocation === 'header' && headerTiers.length > 0 && (
              <div className="text-right flex-shrink-0">
                <div className="flex items-center gap-4">
                  {headerTiers.map((tier: any, idx: number) => pricingTiersShape === 'circle' ? (
                    <div 
                      key={idx} 
                      className="flex flex-col items-center justify-center backdrop-blur-xl px-2"
                      style={{
                        width: `${priceSize * 3.8}px`,
                        height: `${priceSize * 3.8}px`,
                        minWidth: `${priceSize * 3.8}px`,
                        minHeight: `${priceSize * 3.8}px`,
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${containerColor}${Math.round((pricingContainerOpacity / 100) * 255).toString(16).padStart(2, '0')} 0%, ${containerColor}${Math.round((pricingContainerOpacity / 100) * 180).toString(16).padStart(2, '0')} 100%)`,
                        border: `${pricingBorderWidth}px solid rgba(255, 255, 255, ${pricingBorderOpacity / 100})`,
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.08), inset 0 -2px 0 rgba(0, 0, 0, 0.2)'
                      }}
                    >
                      <div className="uppercase tracking-wider font-semibold mb-1 text-center" style={{ fontSize: `${priceSize * 0.32}px`, color: `${fontColor}CC`, fontFamily: pricingFont }}>
                        {tier.label}
                      </div>
                      <div className="font-black text-center" style={{ fontSize: `${priceSize * 0.75}px`, color: fontColor, fontFamily: pricingFont, letterSpacing: '-0.02em' }}>
                        ${parseFloat(tier.price).toFixed(2)}
                      </div>
                      <div className="uppercase tracking-wider font-medium text-center" style={{ fontSize: `${priceSize * 0.24}px`, color: `${fontColor}80`, fontFamily: pricingFont }}>
                        {tier.unit}
                      </div>
                    </div>
                  ) : (
                    <div 
                      key={idx} 
                      className="text-center px-6 py-4 rounded-2xl backdrop-blur-xl"
                      style={{
                        background: `${containerColor}80`,
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      <div className="mb-2 uppercase tracking-widest font-bold" style={{ fontSize: `${priceSize * 0.4}px`, color: `${fontColor}DD`, fontFamily: pricingFont }}>
                        {tier.label} {tier.unit}
                      </div>
                      <div className="font-black" style={{ fontSize: `${priceSize}px`, color: fontColor, fontFamily: pricingFont, letterSpacing: '-0.02em' }}>
                        ${parseFloat(tier.price).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Products - Fixed No Scroll */}
        <div className="flex-1 overflow-hidden px-8 py-4 flex items-start relative z-10">
          {!singleCategory ? (
            <div className="flex items-center justify-center h-full w-full relative">
              {/* Rich Black Background with Depth */}
              <div className="absolute inset-0 overflow-hidden">
                {/* Subtle Vignette */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.4) 100%)',
                  pointerEvents: 'none'
                }} />
                
                {/* Top Light Glow */}
                <div style={{
                  position: 'absolute',
                  top: '-50%',
                  left: '50%',
                  width: '100%',
                  height: '100%',
                  transform: 'translateX(-50%)',
                  background: 'radial-gradient(ellipse, rgba(255, 255, 255, 0.02) 0%, transparent 50%)',
                  pointerEvents: 'none'
                }} />
                
                {/* Subtle Noise Texture */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0.015,
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                  pointerEvents: 'none'
                }} />
              </div>
              
              {/* Subtle Geometric Background */}
              <div className="absolute inset-0 overflow-hidden opacity-8">
                {/* Fine Grid Pattern */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundSize: '50px 50px',
                  backgroundImage: `
                    linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
                  `
                }} />
                
                {/* Rotating Ring 1 */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: '800px',
                  height: '800px',
                  transform: 'translate(-50%, -50%) rotate(45deg)',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                  borderRadius: '25%',
                  animation: 'rotate-slow 90s linear infinite'
                }} />
                
                {/* Rotating Ring 2 */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: '500px',
                  height: '500px',
                  transform: 'translate(-50%, -50%) rotate(-30deg)',
                  border: '1px solid rgba(255, 255, 255, 0.03)',
                  borderRadius: '35%',
                  animation: 'rotate-slow-reverse 120s linear infinite'
                }} />
                
                {/* Center Glow - Very Subtle */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: '80%',
                  height: '80%',
                  transform: 'translate(-50%, -50%)',
                  background: 'radial-gradient(circle, rgba(255, 255, 255, 0.02) 0%, transparent 60%)',
                  animation: 'pulse-glow 15s ease-in-out infinite'
                }} />
              </div>
              
              {/* Logo with Subtle Glow */}
              <div className="text-center relative z-10">
                <div style={{
                  filter: 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.05)) drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3))'
                }}>
                  <img src="/logo123.png" alt="Flora" className="w-20 h-20 mx-auto opacity-12" style={{ filter: 'brightness(1.1) contrast(0.95)' }} />
                </div>
              </div>
            </div>
          ) : singleCategory.products.length === 0 ? (
            <div className="flex items-center justify-center h-full w-full relative">
              {/* Rich Black Background with Depth */}
              <div className="absolute inset-0 overflow-hidden">
                {/* Subtle Vignette */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.15) 100%)',
                  pointerEvents: 'none'
                }} />
                
                {/* Top Light Glow */}
                <div style={{
                  position: 'absolute',
                  top: '-50%',
                  left: '50%',
                  width: '100%',
                  height: '100%',
                  transform: 'translateX(-50%)',
                  background: 'radial-gradient(ellipse, rgba(255, 255, 255, 0.008) 0%, transparent 50%)',
                  pointerEvents: 'none'
                }} />
                
                {/* Subtle Noise Texture */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0.005,
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                  pointerEvents: 'none'
                }} />
              </div>
              
              {/* Subtle Geometric Background */}
              <div className="absolute inset-0 overflow-hidden opacity-4">
                {/* Fine Grid Pattern */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundSize: '60px 60px',
                  backgroundImage: `
                    linear-gradient(rgba(255, 255, 255, 0.01) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255, 255, 255, 0.01) 1px, transparent 1px)
                  `
                }} />
                
                {/* Rotating Ring 1 */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: '1000px',
                  height: '1000px',
                  transform: 'translate(-50%, -50%) rotate(45deg)',
                  border: '1px solid rgba(255, 255, 255, 0.015)',
                  borderRadius: '30%',
                  animation: 'rotate-slow 120s linear infinite'
                }} />
                
                {/* Rotating Ring 2 */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: '600px',
                  height: '600px',
                  transform: 'translate(-50%, -50%) rotate(-30deg)',
                  border: '1px solid rgba(255, 255, 255, 0.01)',
                  borderRadius: '40%',
                  animation: 'rotate-slow-reverse 150s linear infinite'
                }} />
                
                {/* Center Glow - Very Subtle */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: '70%',
                  height: '70%',
                  transform: 'translate(-50%, -50%)',
                  background: 'radial-gradient(circle, rgba(255, 255, 255, 0.008) 0%, transparent 70%)',
                  animation: 'pulse-glow 20s ease-in-out infinite'
                }} />
              </div>
              
              {/* Logo with Soft Shadow */}
              <div className="text-center relative z-10">
                <div style={{
                  filter: 'drop-shadow(0 0 24px rgba(255, 255, 255, 0.015)) drop-shadow(0 4px 12px rgba(0, 0, 0, 0.2))'
                }}>
                  <img src="/logo123.png" alt="Flora" className="w-20 h-20 mx-auto opacity-6" style={{ filter: 'brightness(1.01) contrast(0.8)' }} />
                </div>
              </div>
              
              <style jsx>{`
                @keyframes rotate-slow {
                  from { transform: translate(-50%, -50%) rotate(45deg); }
                  to { transform: translate(-50%, -50%) rotate(405deg); }
                }
                @keyframes rotate-slow-reverse {
                  from { transform: translate(-50%, -50%) rotate(-30deg); }
                  to { transform: translate(-50%, -50%) rotate(-390deg); }
                }
                @keyframes pulse-glow {
                  0%, 100% { opacity: 0.2; transform: translate(-50%, -50%) scale(1); }
                  50% { opacity: 0.35; transform: translate(-50%, -50%) scale(1.03); }
                }
              `}</style>
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
                  {/* Show ALL products - no limits */}
                  {singleCategory.products.map(product => renderProductCard(product, showImages, priceLocation, singleCategory.category.slug))}
                </div>
              ) : (() => {
                const maxItemsPerColumn = 50; // Increased from 12 to handle larger menus
                const useDoubleColumn = singleCategory.products.length > maxItemsPerColumn;
                const visibleProducts = singleCategory.products; // Show ALL products, no slicing
                
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
                <h2 className="font-bold truncate" style={{ 
                  fontSize: `${categorySize}px`, 
                  color: fontColor, 
                  fontFamily: titleFont,
                  textShadow: `0 2px 8px rgba(0, 0, 0, 0.4), 0 0 ${glowIntensity * 0.5}px ${hexToRgba(fontColor, 0.5)}, 0 0 ${glowIntensity}px ${hexToRgba(fontColor, 0.2)}`
                }}>
                  {(() => {
                    const cat = categories.find(c => c.slug === leftMenuCategory);
                    if (!cat && leftMenuCategory) {
                      console.warn('⚠️ Left category not found:', { 
                        leftMenuCategory, 
                        availableCategories: categories.map(c => c.slug) 
                      });
                    }
                    return cat?.name || (leftMenuCategory ? leftMenuCategory.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Select Category');
                  })()}
                </h2>
              </div>
            </div>
            
            {/* Left Pricing Tiers in Header */}
            {leftPriceLocation === 'header' && leftHeaderTiers.length > 0 && (
              <div className="flex items-center gap-3 flex-shrink-0">
                {leftHeaderTiers.map((tier: any, idx: number) => pricingTiersShape === 'circle' ? (
                  <div 
                    key={idx} 
                    className="flex flex-col items-center justify-center backdrop-blur-xl px-2"
                    style={{
                      width: `${priceSize * 2.8}px`,
                      height: `${priceSize * 2.8}px`,
                      minWidth: `${priceSize * 2.8}px`,
                      minHeight: `${priceSize * 2.8}px`,
                      borderRadius: '50%',
                      background: `radial-gradient(circle, ${containerColor}${Math.round((pricingContainerOpacity / 100) * 255).toString(16).padStart(2, '0')} 0%, ${containerColor}${Math.round((pricingContainerOpacity / 100) * 180).toString(16).padStart(2, '0')} 100%)`,
                      border: `${pricingBorderWidth}px solid rgba(255, 255, 255, ${pricingBorderOpacity / 100})`,
                      boxShadow: '0 6px 24px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
                    }}
                  >
                    <div className="uppercase tracking-wide font-semibold text-center" style={{ fontSize: `${priceSize * 0.28}px`, color: `${fontColor}CC`, fontFamily: pricingFont }}>
                      {tier.label}
                    </div>
                    <div className="font-black text-center" style={{ fontSize: `${priceSize * 0.62}px`, color: fontColor, fontFamily: pricingFont, letterSpacing: '-0.02em' }}>
                      ${parseFloat(tier.price).toFixed(2)}
                    </div>
                    <div className="uppercase tracking-wide font-medium text-center" style={{ fontSize: `${priceSize * 0.22}px`, color: `${fontColor}80`, fontFamily: pricingFont }}>
                      {tier.unit}
                    </div>
                  </div>
                ) : (
                  <div 
                    key={idx} 
                    className="text-center px-4 py-2 rounded-xl backdrop-blur-xl"
                    style={{
                      background: `${containerColor}80`,
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <div className="mb-1 uppercase" style={{ fontSize: `${priceSize * 0.35}px`, color: `${fontColor}60`, fontFamily: pricingFont }}>
                      {tier.label} {tier.unit}
                    </div>
                    <div className="font-bold" style={{ fontSize: `${priceSize * 0.7}px`, color: fontColor, fontFamily: pricingFont }}>
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
                <div className="mb-6 relative">
                  <div className="w-28 h-28 mx-auto rounded-2xl bg-white/[0.02] backdrop-blur-sm border border-white/[0.08] flex items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent" />
                    <img src="/logo123.png" alt="Flora" className="w-16 h-16 object-contain opacity-20 group-hover:opacity-30 transition-opacity duration-300" />
                  </div>
                </div>
                <p className="text-sm font-medium mb-2 text-white/70" style={{ fontFamily: titleFont }}>No Category Selected</p>
                <p className="text-xs text-white/40" style={{ fontFamily: cardFont }}>Click "Left" and select a category</p>
              </div>
            </div>
          ) : leftProducts.length === 0 ? (
            <div className="flex items-center justify-center h-full w-full">
              <div className="text-center">
                <div className="mb-6 relative">
                  <div className="w-28 h-28 mx-auto rounded-2xl bg-white/[0.02] backdrop-blur-sm border border-white/[0.08] flex items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent" />
                    <img src="/logo123.png" alt="Flora" className="w-16 h-16 object-contain opacity-20 group-hover:opacity-30 transition-opacity duration-300" />
                  </div>
                </div>
                <p className="text-sm font-medium mb-2 text-white/70" style={{ fontFamily: titleFont }}>No Products</p>
                <p className="text-xs text-white/40" style={{ fontFamily: cardFont }}>No products in this category</p>
              </div>
            </div>
          ) : leftMenuViewMode === 'card' ? (
            <div className="grid grid-cols-4 gap-2 w-full overflow-hidden auto-rows-min">
              {/* Show ALL left products - no limits */}
              {leftProducts.map((product) => renderProductCard(product, leftMenuImages, leftPriceLocation, leftMenuCategory || undefined))}
            </div>
          ) : (() => {
            const maxItemsPerColumn = 50; // Increased from 12 to handle larger menus
            const useDoubleColumn = leftProducts.length > maxItemsPerColumn;
            const visibleProducts = leftProducts; // Show ALL products, no slicing
            
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
                  <h2 className="font-bold truncate" style={{ 
                    fontSize: `${categorySize}px`, 
                    color: fontColor, 
                    fontFamily: titleFont,
                    textShadow: `0 2px 8px rgba(0, 0, 0, 0.4), 0 0 ${glowIntensity * 0.5}px ${hexToRgba(fontColor, 0.5)}, 0 0 ${glowIntensity}px ${hexToRgba(fontColor, 0.2)}`
                  }}>
                    {(() => {
                      const cat = categories.find(c => c.slug === leftMenuCategory2);
                      if (!cat && leftMenuCategory2) {
                        console.warn('⚠️ Left bottom category not found:', { 
                          leftMenuCategory2, 
                          availableCategories: categories.map(c => c.slug) 
                        });
                      }
                      return cat?.name || (leftMenuCategory2 ? leftMenuCategory2.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Select Category');
                    })()}
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
                    {/* Show ALL left bottom products - no limits */}
                    {leftProducts2.map((p) => renderProductCard(p, leftMenuImages2, leftPriceLocation))}
                  </div>
                ) : (() => {
                  const maxItemsPerColumn = 50; // Increased from 8 to handle larger menus
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
                <h2 className="font-bold truncate" style={{ 
                  fontSize: `${categorySize}px`, 
                  color: fontColor, 
                  fontFamily: titleFont,
                  textShadow: `0 2px 8px rgba(0, 0, 0, 0.4), 0 0 ${glowIntensity * 0.5}px ${hexToRgba(fontColor, 0.5)}, 0 0 ${glowIntensity}px ${hexToRgba(fontColor, 0.2)}`
                }}>
                  {(() => {
                    const cat = categories.find(c => c.slug === rightMenuCategory);
                    if (!cat && rightMenuCategory) {
                      console.warn('⚠️ Right category not found:', { 
                        rightMenuCategory, 
                        availableCategories: categories.map(c => c.slug) 
                      });
                    }
                    return cat?.name || (rightMenuCategory ? rightMenuCategory.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Select Category');
                  })()}
                </h2>
              </div>
            </div>
            
            {/* Right Pricing Tiers in Header */}
            {rightPriceLocation === 'header' && rightHeaderTiers.length > 0 && (
              <div className="flex items-center gap-3 flex-shrink-0">
                {rightHeaderTiers.map((tier: any, idx: number) => pricingTiersShape === 'circle' ? (
                  <div 
                    key={idx} 
                    className="flex flex-col items-center justify-center backdrop-blur-xl px-2"
                    style={{
                      width: `${priceSize * 2.8}px`,
                      height: `${priceSize * 2.8}px`,
                      minWidth: `${priceSize * 2.8}px`,
                      minHeight: `${priceSize * 2.8}px`,
                      borderRadius: '50%',
                      background: `radial-gradient(circle, ${containerColor}${Math.round((pricingContainerOpacity / 100) * 255).toString(16).padStart(2, '0')} 0%, ${containerColor}${Math.round((pricingContainerOpacity / 100) * 180).toString(16).padStart(2, '0')} 100%)`,
                      border: `${pricingBorderWidth}px solid rgba(255, 255, 255, ${pricingBorderOpacity / 100})`,
                      boxShadow: '0 6px 24px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
                    }}
                  >
                    <div className="uppercase tracking-wide font-semibold text-center" style={{ fontSize: `${priceSize * 0.28}px`, color: `${fontColor}CC`, fontFamily: pricingFont }}>
                      {tier.label}
                    </div>
                    <div className="font-black text-center" style={{ fontSize: `${priceSize * 0.62}px`, color: fontColor, fontFamily: pricingFont, letterSpacing: '-0.02em' }}>
                      ${parseFloat(tier.price).toFixed(2)}
                    </div>
                    <div className="uppercase tracking-wide font-medium text-center" style={{ fontSize: `${priceSize * 0.22}px`, color: `${fontColor}80`, fontFamily: pricingFont }}>
                      {tier.unit}
                    </div>
                  </div>
                ) : (
                  <div 
                    key={idx} 
                    className="text-center px-4 py-2 rounded-xl backdrop-blur-xl"
                    style={{
                      background: `${containerColor}80`,
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <div className="mb-1 uppercase" style={{ fontSize: `${priceSize * 0.35}px`, color: `${fontColor}60`, fontFamily: pricingFont }}>
                      {tier.label} {tier.unit}
                    </div>
                    <div className="font-bold" style={{ fontSize: `${priceSize * 0.7}px`, color: fontColor, fontFamily: pricingFont }}>
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
                <div className="mb-6 relative">
                  <div className="w-28 h-28 mx-auto rounded-2xl bg-white/[0.02] backdrop-blur-sm border border-white/[0.08] flex items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent" />
                    <img src="/logo123.png" alt="Flora" className="w-16 h-16 object-contain opacity-20 group-hover:opacity-30 transition-opacity duration-300" />
                  </div>
                </div>
                <p className="text-sm font-medium mb-2 text-white/70" style={{ fontFamily: titleFont }}>No Category Selected</p>
                <p className="text-xs text-white/40" style={{ fontFamily: cardFont }}>Click "Right" and select a category</p>
              </div>
            </div>
          ) : rightProducts.length === 0 ? (
            <div className="flex items-center justify-center h-full w-full">
              <div className="text-center">
                <div className="mb-6 relative">
                  <div className="w-28 h-28 mx-auto rounded-2xl bg-white/[0.02] backdrop-blur-sm border border-white/[0.08] flex items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent" />
                    <img src="/logo123.png" alt="Flora" className="w-16 h-16 object-contain opacity-20 group-hover:opacity-30 transition-opacity duration-300" />
                  </div>
                </div>
                <p className="text-sm font-medium mb-2 text-white/70" style={{ fontFamily: titleFont }}>No Products</p>
                <p className="text-xs text-white/40" style={{ fontFamily: cardFont }}>No products in this category</p>
              </div>
            </div>
          ) : rightMenuViewMode === 'card' ? (
            <div className="grid grid-cols-4 gap-2 w-full overflow-hidden auto-rows-min">
              {/* Show ALL right products - no limits */}
              {rightProducts.map((product) => renderProductCard(product, rightMenuImages, rightPriceLocation, rightMenuCategory || undefined))}
            </div>
          ) : (() => {
            const maxItemsPerColumn = 50; // Increased from 12 to handle larger menus
            const useDoubleColumn = rightProducts.length > maxItemsPerColumn;
            const visibleProducts = rightProducts; // Show ALL products, no slicing
            
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
                  <h2 className="font-bold truncate" style={{ 
                    fontSize: `${categorySize}px`, 
                    color: fontColor, 
                    fontFamily: titleFont,
                    textShadow: `0 2px 8px rgba(0, 0, 0, 0.4), 0 0 ${glowIntensity * 0.5}px ${hexToRgba(fontColor, 0.5)}, 0 0 ${glowIntensity}px ${hexToRgba(fontColor, 0.2)}`
                  }}>
                    {(() => {
                      const cat = categories.find(c => c.slug === rightMenuCategory2);
                      if (!cat && rightMenuCategory2) {
                        console.warn('⚠️ Right bottom category not found:', { 
                          rightMenuCategory2, 
                          availableCategories: categories.map(c => c.slug) 
                        });
                      }
                      return cat?.name || (rightMenuCategory2 ? rightMenuCategory2.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Select Category');
                    })()}
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
                    {/* Show ALL right bottom products - no limits */}
                    {rightProducts2.map((p) => renderProductCard(p, rightMenuImages2, rightPriceLocation))}
                  </div>
                ) : (() => {
                  const maxItemsPerColumn = 50; // Increased from 8 to handle larger menus
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


