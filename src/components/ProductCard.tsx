import Image from 'next/image'
import { Plus, ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { FloraProduct } from '../lib/woocommerce'
import { ACFFieldsDisplay } from './ACFFieldsDisplay'
import { ProductLineage } from './ProductLineage'
import { ProductNameSideInfo } from './ProductNameSideInfo'
import { ProductCharacteristics } from './ProductCharacteristics'
import { VirtualPrerollSection } from './VirtualPrerollSection'
import { useACFFields } from '../hooks/useACFFields'
import { useVirtualPrerolls } from '../hooks/useVirtualPrerolls'
import { useLocation } from '../contexts/LocationContext'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'

// Helper functions
function getStockStatus(product: FloraProduct): 'instock' | 'outofstock' | 'onbackorder' {
  // Use location-specific stock if available
  if (product.location_stock !== undefined) {
    return product.location_stock > 0 ? 'instock' : 'outofstock'
  }
  return product.in_stock ? 'instock' : 'outofstock'
}

function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}

interface ProductCardProps {
  product: FloraProduct
  onAddToCart: (product: FloraProduct, selectedVariation?: string) => void
  globalSelectedProduct: { productId: number; variation: string } | null
  setGlobalSelectedProduct: (selection: { productId: number; variation: string } | null) => void
  isListView?: boolean
  index?: number
  gridCols?: number
}

export function ProductCard({ product, onAddToCart, globalSelectedProduct, setGlobalSelectedProduct, isListView = false, index = 0, gridCols = 3 }: ProductCardProps) {
  // Use global selection state instead of local state
  const selectedVariation = globalSelectedProduct?.productId === product.id ? globalSelectedProduct.variation : 'default'
  
  // Local state for list view expansion
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Clean alternating row logic
  const isOddRow = isListView 
    ? index % 2 === 1  // List view: alternate by item index
    : Math.floor(index / gridCols) % 2 === 1  // Grid view: alternate by actual row
  
  // Get ACF fields for strain type (only for list view)
  const { acfFields = [] } = useACFFields(isListView ? product.id : null)
  
  // Virtual pre-rolls conversion hook
  const { convertToPrerolls } = useVirtualPrerolls()
  
  // Get current location
  const { currentLocation } = useLocation()
  
  // Query client for refreshing products
  const queryClient = useQueryClient()
  
  // Helper function to get strain type
  const getStrainType = () => {
    const strainField = acfFields.find((field: any) => field.key === 'strain_type')
    return strainField?.value || ''
  }

  // Handle pricing for weight-based products vs regular products
  const getDisplayPrice = () => {
    if (product.mli_product_type === 'weight' && product.pricing_tiers) {
      // For weight-based products, show the best per-gram rate (from largest quantity)
      const pricePerGramRates = Object.entries(product.pricing_tiers).map(([grams, totalPrice]) => 
        totalPrice / parseFloat(grams)
      )
      return Math.min(...pricePerGramRates)
    }
    return parseFloat(product.sale_price || product.price || '0')
  }

  const price = getDisplayPrice()
  const regularPrice = parseFloat(product.regular_price || '0')
  const hasDiscount = product.sale_price && price < regularPrice && product.mli_product_type !== 'weight'
  const stockStatus = getStockStatus(product)

  const getStockColor = () => {
    switch (stockStatus) {
      case 'outofstock': return 'text-red-400'
      case 'onbackorder': return 'text-orange-400'
      default: return 'text-vscode-textMuted'
    }
  }

  const getStockText = () => {
    if (stockStatus === 'outofstock') return 'Out of Stock'
    
    // Use location-specific stock if available
    if (product.location_stock !== undefined) {
      return `${product.location_stock} at ${product.location_name || 'this location'}`
    }
    
    if (product.stock_quantity !== null && product.stock_quantity !== undefined) {
      return `${product.stock_quantity} in stock`
    }
    return 'In Stock'
  }
  
  // Get pre-roll availability text
  const getPrerollAvailability = (count: number) => {
    const virtualAvailable = product.virtual_preroll_count || 0
    const gramsNeeded = count * (product.mli_preroll_conversion || 0.7)
    const canMakeFromFlower = product.stock_quantity >= gramsNeeded
    
    if (virtualAvailable >= count) {
      return `${virtualAvailable} ready`
    } else if (virtualAvailable > 0 && canMakeFromFlower) {
      return `${virtualAvailable} ready + make ${count - virtualAvailable}`
    } else if (canMakeFromFlower) {
      return 'Make fresh'
    }
    return 'Not available'
  }

  const isOutOfStock = stockStatus === 'outofstock'

  const handleVariationSelect = (variation: string) => {
    if (!isOutOfStock) {
      // If the same variation is clicked, unselect it
      if (selectedVariation === variation) {
        setGlobalSelectedProduct(null)
      } else {
        setGlobalSelectedProduct({ productId: product.id, variation })
      }
    }
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isOutOfStock) {
      onAddToCart(product, selectedVariation)
    }
  }

  // Get the price for the currently selected variation
  const getSelectedPrice = () => {
    if (selectedVariation === 'default') return null

    if (product.mli_product_type === 'weight' && product.pricing_tiers) {
      if (selectedVariation.startsWith('flower-')) {
        const grams = selectedVariation.replace('flower-', '')
        return product.pricing_tiers[grams]
      }
      if (selectedVariation.startsWith('preroll-') && product.preroll_pricing_tiers) {
        const count = selectedVariation.replace('preroll-', '')
        return product.preroll_pricing_tiers[count]
      }
    }

    if (product.mli_product_type === 'quantity' && product.pricing_tiers) {
      if (selectedVariation.startsWith('qty-')) {
        const qty = selectedVariation.replace('qty-', '')
        return product.pricing_tiers[qty]
      }
    }

    return null
  }

  const selectedPrice = getSelectedPrice()

  if (isListView) {
    return (
      <div 
        className="bg-neutral-900/40 border border-white/[0.04] rounded-lg p-3 hover:bg-neutral-900/60 transition-colors mb-2"
      >
        <div 
          className="cursor-pointer flex items-start gap-3"
          onClick={() => {
            const newExpandedState = !isExpanded
            setIsExpanded(newExpandedState)
            if (!newExpandedState && globalSelectedProduct?.productId === product.id) {
              setGlobalSelectedProduct(null)
            }
          }}
        >
          {/* Product Image */}
          <div className="w-12 h-12 flex-shrink-0 relative">
            {product.images?.[0] ? (
              <Image
                src={product.images[0].src}
                alt={product.images[0].alt || product.name}
                fill
                className="object-contain rounded"
                sizes="48px"
              />
            ) : (
              <div className="w-full h-full bg-neutral-800 flex items-center justify-center rounded">
                <span className="text-text-tertiary text-xs">No img</span>
              </div>
            )}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded">
                <span className="text-white text-[10px] font-medium">OOS</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-text-primary">{product.name}</span>
              </div>
              <span className="text-sm font-semibold text-text-primary">
                {(product.mli_product_type === 'weight' || product.mli_product_type === 'quantity') ? (
                  selectedPrice ? `$${selectedPrice.toFixed(2)}` : (
                    <svg className="w-4 h-4 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )
                ) : (
                  `$${price.toFixed(2)}`
                )}
              </span>
            </div>
            
            <div className="text-xs text-text-secondary">
              <div className="flex items-center gap-2">
                <span>{product.categories?.[0]?.name || 'Other'}</span>
                <span className="text-text-tertiary">•</span>
                <span className="text-text-tertiary capitalize">{getStockText()}</span>
              </div>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="border-l-4 border-black mx-3 mb-2 rounded p-4 ml-12 bg-black/20 hover:bg-black/30 transition-all duration-300">
            
            {/* Compact Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mb-3">
              
              {/* Product Info */}
              <div className="space-y-1">
                <div className="text-vscode-textMuted font-medium">Product</div>
                <div className="text-vscode-text font-medium">{product.name}</div>
                <div className="text-vscode-textMuted font-medium">{product.categories?.[0]?.name || 'Other'}</div>
                {getStrainType() && <div className="text-vscode-text font-medium capitalize">{getStrainType()}</div>}
                
                {/* Product Lineage */}
                <div className="mt-2">
                  <ProductLineage productId={product.id} product={product} />
                </div>
                
                {/* ACF Fields Display */}
                <div className="mt-2">
                  <ACFFieldsDisplay productId={product.id} productName={product.name} />
                </div>
              </div>

              {/* Stock & Pricing */}
              <div className="space-y-1">
                <div className="text-vscode-textMuted font-medium">Details</div>
                <div className="text-vscode-text font-medium">{getStockText()}</div>
                <div className="text-green-400 font-bold text-base">
                  {(product.mli_product_type === 'weight' || product.mli_product_type === 'quantity') ? (
                    selectedPrice ? `$${selectedPrice.toFixed(2)}` : 'Select option'
                  ) : (
                    `$${price.toFixed(2)}`
                  )}
                </div>
                {hasDiscount && (
                  <div className="text-vscode-textMuted text-sm line-through">${regularPrice.toFixed(2)}</div>
                )}
                
                {/* Product Characteristics */}
                <div className="mt-2">
                  <ProductCharacteristics productId={product.id} />
                </div>
              </div>

              {/* Options & Actions */}
              <div className="space-y-2">
                <div className="text-vscode-textMuted font-medium">Options & Actions</div>
                
                {/* Weight Options */}
                {(product.mli_product_type === 'weight' && product.pricing_tiers) && (
                  <div>
                    <div className="text-vscode-textMuted text-xs mb-1">
                      {product.preroll_pricing_tiers ? 'Flower Options' : 'Weight Options'}
                    </div>
                    <div className="flex gap-1 text-xs overflow-visible">
                      {Object.entries(product.pricing_tiers || {}).map(([grams, totalPrice], index, array) => {
                        const variationKey = `flower-${grams}`
                        const isSelected = selectedVariation === variationKey
                        return (
                          <div key={grams} className="flex-1 relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleVariationSelect(variationKey)
                              }}
                              disabled={isOutOfStock}
                              className={`w-full justify-center px-2 py-1 rounded-xl text-sm font-medium transition-all duration-300 ease-out active:scale-95 ${
                                isOutOfStock 
                                  ? 'cursor-not-allowed text-gray-600 bg-transparent border border-transparent' 
                                  : isSelected
                                  ? 'text-white bg-white/15 shadow-lg shadow-white/10 border border-transparent'
                                  : 'text-text-secondary hover:text-white bg-transparent hover:bg-white/5 border border-transparent hover:border-white/50 hover:shadow-sm hover:shadow-white/10'
                              }`}
                            >
                              {grams}g
                            </button>
                            {index < array.length - 1 && (
                              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-px h-6 bg-neutral-600/20 transition-all duration-300 group-hover:bg-neutral-600/40"></div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    
                    {/* Preroll Options */}
                    {product.preroll_pricing_tiers && (
                      <div className="mt-2">
                        <div className="text-vscode-textMuted text-xs mb-1">Pre-roll Options</div>
                        <div className="flex gap-1 text-xs overflow-visible">
                          {Object.entries(product.preroll_pricing_tiers || {}).map(([count, totalPrice], index, array) => {
                            const variationKey = `preroll-${count}`
                            const isSelected = selectedVariation === variationKey
                            const gramsPerPreroll = product.mli_preroll_conversion || 0.7
                            const totalGrams = parseFloat((parseInt(count) * gramsPerPreroll).toFixed(1))
                            const availability = getPrerollAvailability(parseInt(count))
                            return (
                              <div key={count} className="flex-1 relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleVariationSelect(variationKey)
                                  }}
                                  disabled={isOutOfStock}
                                  className={`w-full flex-col justify-center px-2 py-1 rounded-xl text-sm font-medium transition-all duration-300 ease-out active:scale-95 ${
                                    isOutOfStock 
                                      ? 'cursor-not-allowed text-vscode-textMuted bg-transparent border border-transparent' 
                                      : isSelected
                                      ? 'text-vscode-text bg-white/15 shadow-lg shadow-white/10 border border-white/30'
                                      : 'text-vscode-textSecondary hover:text-vscode-text bg-transparent hover:bg-vscode-bgTertiary/50 border border-transparent hover:border-vscode-border/50 hover:shadow-sm hover:shadow-black/10'
                                  }`}
                                  title={`${count} pre-rolls (${totalGrams}g total) - ${availability}`}
                                >
                                  <div>{count}x</div>
                                  <div className="text-xs opacity-70">({totalGrams}g)</div>
                                </button>
                                {index < array.length - 1 && (
                                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-px h-8 bg-neutral-600/20 transition-all duration-300 group-hover:bg-neutral-600/40"></div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Best Rate Display */}
                    <div className="text-xs text-vscode-textMuted mt-1">
                      Best rate: ${price.toFixed(2)}/g
                    </div>
                  </div>
                )}

                {/* Quantity Options */}
                {(product.mli_product_type === 'quantity' && product.pricing_tiers) && (
                  <div>
                    <div className="text-vscode-textMuted text-xs mb-1">Quantity Options</div>
                    <div className="flex gap-1 text-xs overflow-visible">
                      {Object.entries(product.pricing_tiers || {}).slice(0, 4).map(([qty, pricePerUnit], index, array) => {
                        const variationKey = `qty-${qty}`
                        const isSelected = selectedVariation === variationKey
                        return (
                          <div key={qty} className="flex-1 relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleVariationSelect(variationKey)
                              }}
                              disabled={isOutOfStock}
                              className={`w-full justify-center px-2 py-1 rounded-xl text-sm font-medium transition-all duration-300 ease-out active:scale-95 ${
                                isOutOfStock 
                                  ? 'cursor-not-allowed text-vscode-textMuted bg-transparent border border-transparent' 
                                  : isSelected
                                  ? 'text-vscode-text bg-white/15 shadow-lg shadow-white/10 border border-white/30'
                                  : 'text-vscode-textSecondary hover:text-vscode-text bg-transparent hover:bg-vscode-bgTertiary/50 border border-transparent hover:border-vscode-border/50 hover:shadow-sm hover:shadow-black/10'
                              }`}
                            >
                              {qty}
                            </button>
                            {index < array.length - 1 && (
                              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-px h-6 bg-neutral-600/20 transition-all duration-300 group-hover:bg-neutral-600/40"></div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Virtual Pre-roll Section */}
                <VirtualPrerollSection 
                  product={product}
                  linkedPrerollProduct={product.linkedPrerollProduct}
                  onConvert={async (count) => {
                    try {
                      await convertToPrerolls(product.id, count, currentLocation?.id)
                      await queryClient.invalidateQueries({ queryKey: ['products'] })
                    } catch (error) {
                      console.error('Conversion failed:', error)
                    }
                  }}
                />

                {/* Add to Cart Button */}
                {((product.mli_product_type === 'weight' || product.mli_product_type === 'quantity') && selectedVariation !== 'default') || 
                 !(product.mli_product_type === 'weight' || product.mli_product_type === 'quantity') ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAddToCart(e)
                    }}
                    disabled={isOutOfStock}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      isOutOfStock 
                        ? 'bg-neutral-700 text-text-tertiary cursor-not-allowed' 
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    Add to Cart
                  </button>
                ) : null}
              </div>
            </div>

            {/* Description */}
            {(product.description || product.short_description) && (
              <div className="border-t border-vscode-border pt-2">
                <div className="text-vscode-textMuted font-medium text-xs mb-2">Description</div>
                <div 
                  className="text-vscode-text text-xs"
                  dangerouslySetInnerHTML={{ 
                    __html: stripHtmlTags(product.description || product.short_description || '') 
                  }}
                />
              </div>
            )}

          </div>
        )}
      </div>
    )
  }

  // Grid View Layout
      return (
      <div className={`relative ${isOddRow ? 'bg-black/80' : 'bg-black/85'} hover:border-transparent hover:bg-neutral-800 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:z-10 transition-all duration-500 ease-out cursor-pointer group flex flex-col h-full transform hover:scale-[1.02] hover:-translate-y-1 overflow-visible rounded`}>
      {/* Main Content Area - Fixed Height */}
      <div className="flex gap-2 p-2 flex-1">
        {/* Product Image */}
        <div className="w-20 h-20 flex-shrink-0 relative group-hover:scale-105 transition-transform duration-300 ease-out">
          {product.images?.[0] ? (
            <Image
              src={product.images[0].src}
              alt={product.images[0].alt || product.name}
              fill
              className="object-contain transition-all duration-300 group-hover:brightness-110"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
            />
          ) : (
            <div className="w-full h-full bg-vscode-bgTertiary flex items-center justify-center border border-vscode-border/30 transition-all duration-300 group-hover:border-vscode-border/50">
              <span className="text-vscode-textMuted text-sm">No image</span>
            </div>
          )}
          {hasDiscount && (
            <div className="absolute top-1 right-1 bg-vscode-accent text-white px-1 py-0.5 text-xs font-medium animate-pulse">
              Sale
            </div>
          )}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-medium">Out of Stock</span>
            </div>
          )}
        </div>
        
        {/* Product Information */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-start justify-between mb-1">
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-medium text-vscode-text group-hover:text-white transition-colors flex-1 text-sm line-clamp-1">{product.name}</h3>
                    {(product.mli_product_type === 'weight' || product.mli_product_type === 'quantity') && selectedPrice && (
                      <span className="text-green-400 font-bold ml-2 flex-shrink-0 text-sm">${selectedPrice.toFixed(2)}</span>
                    )}
                  </div>
                  <div className="w-full overflow-visible">
                    <ProductLineage productId={product.id} product={product} />
                  </div>
                </div>
                <ProductNameSideInfo productId={product.id} />
              </div>
            </div>
          </div>
          
          {/* Product Characteristics */}
          <ProductCharacteristics productId={product.id} />
          
          {/* Standard Pricing Section */}
          {!(product.mli_product_type === 'weight' && product.pricing_tiers) && !(product.mli_product_type === 'quantity' && product.pricing_tiers) && (
            <>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-green-400 font-bold text-lg">${price.toFixed(2)}</span>
                {hasDiscount && (
                  <span className="text-vscode-textMuted text-sm line-through">${regularPrice.toFixed(2)}</span>
                )}
              </div>
              <div className="flex items-start justify-between mt-1">
                <span className={`text-xs ${getStockColor()}`}>
                  {getStockText()}
                </span>
              </div>
            </>
          )}
          
          {/* ACF Fields Display - Flex-grow to push selectors down */}
          <div className="flex-1">
            <ACFFieldsDisplay 
              productId={product.id}
              productName={product.name}
            />
          </div>
        </div>
      </div>
      
      {/* Weight/Quantity Selectors - Aligned at Bottom */}
      {(product.mli_product_type === 'weight' && product.pricing_tiers) && (
        <div className="w-full space-y-1 px-2 pb-12 pt-3 mt-auto">

          <div className="flex gap-1 text-xs overflow-visible">
            {Object.entries(product.pricing_tiers || {}).map(([grams, totalPrice], index, array) => {
              const variationKey = `flower-${grams}`
              const isSelected = selectedVariation === variationKey
              return (
                <div key={grams} className="flex-1 relative">
                  <button
                    onClick={() => handleVariationSelect(variationKey)}
                    disabled={isOutOfStock}
                    className={`w-full justify-center px-2 py-1 rounded-xl text-sm font-medium transition-all duration-300 ease-out active:scale-95 ${
                      isOutOfStock 
                        ? 'cursor-not-allowed text-gray-600 bg-transparent border border-transparent' 
                        : isSelected
                        ? 'text-white bg-white/15 shadow-lg shadow-white/10 border border-transparent'
                        : 'text-text-secondary hover:text-white bg-transparent hover:bg-white/5 border border-transparent hover:border-white/50 hover:shadow-sm hover:shadow-white/10'
                    }`}
                  >
                    {grams}g
                  </button>
                  {index < array.length - 1 && (
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-px h-6 bg-neutral-600/20 transition-all duration-300 group-hover:bg-neutral-600/40"></div>
                  )}
                </div>
              )
            })}
          </div>
          
          {/* Preroll Pricing (if available) */}
          {product.preroll_pricing_tiers && (
            <>
              <div className="h-2"></div>
                                      <div className="flex gap-1 text-xs overflow-visible">
                          {Object.entries(product.preroll_pricing_tiers || {}).map(([count, totalPrice], index, array) => {
                            const variationKey = `preroll-${count}`
                            const isSelected = selectedVariation === variationKey
                            const gramsPerPreroll = product.mli_preroll_conversion || 0.7
                            const totalGrams = parseFloat((parseInt(count) * gramsPerPreroll).toFixed(1))
                            const availability = getPrerollAvailability(parseInt(count))
                            return (
                                                  <div key={count} className="flex-1 relative">
                      <button
                        onClick={() => handleVariationSelect(variationKey)}
                        disabled={isOutOfStock}
                        className={`w-full flex-col justify-center px-2 py-1 rounded-xl text-sm font-medium transition-all duration-300 ease-out active:scale-95 ${
                          isOutOfStock 
                            ? 'cursor-not-allowed text-vscode-textMuted bg-transparent border border-transparent' 
                            : isSelected
                            ? 'text-vscode-text bg-white/15 shadow-lg shadow-white/10 border border-white/30'
                            : 'text-vscode-textSecondary hover:text-vscode-text bg-transparent hover:bg-vscode-bgTertiary/50 border border-transparent hover:border-vscode-border/50 hover:shadow-sm hover:shadow-black/10'
                        }`}
                        title={`${count} pre-rolls (${totalGrams}g total) - ${availability}`}
                      >
                        <div>{count}x</div>
                        <div className="text-xs opacity-70">({totalGrams}g)</div>
                      </button>
                      {index < array.length - 1 && (
                        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-px h-8 bg-neutral-600/20 transition-all duration-300 group-hover:bg-neutral-600/40"></div>
                      )}
                    </div>
                            )
                          })}
                        </div>
            </>
          )}
          
          <div className="text-xs text-vscode-textMuted text-center">
            Best rate: ${price.toFixed(2)}/g
          </div>
          
          {/* Stock Information */}
          <div className="flex items-center justify-center">
            <span className={`text-xs ${getStockColor()}`}>
              {getStockText()}
            </span>
          </div>
          
          {/* Virtual Pre-Roll Section for flower products */}
          <VirtualPrerollSection 
            product={product}
            linkedPrerollProduct={product.linkedPrerollProduct}
            onConvert={async (count) => {
              try {
                await convertToPrerolls(product.id, count, currentLocation?.id)
                // Invalidate products query to refresh inventory
                await queryClient.invalidateQueries({ queryKey: ['products'] })
              } catch (error) {
                console.error('Conversion failed:', error)
              }
            }}
          />
        </div>
      )}
      
      {(product.mli_product_type === 'quantity' && product.pricing_tiers) && (
        <div className="w-full space-y-1 px-2 pb-12 pt-3 mt-auto">
          <div className="flex gap-1 text-xs overflow-visible">
            {Object.entries(product.pricing_tiers || {}).slice(0, 4).map(([qty, pricePerUnit], index, array) => {
              const variationKey = `qty-${qty}`
              const isSelected = selectedVariation === variationKey
              return (
                <div key={qty} className="flex-1 relative">
                  <button
                    onClick={() => handleVariationSelect(variationKey)}
                    disabled={isOutOfStock}
                    className={`w-full justify-center px-2 py-1 rounded-xl text-sm font-medium transition-all duration-300 ease-out active:scale-95 ${
                      isOutOfStock 
                        ? 'cursor-not-allowed text-vscode-textMuted bg-transparent border border-transparent' 
                        : isSelected
                        ? 'text-vscode-text bg-white/15 shadow-lg shadow-white/10 border border-white/30'
                        : 'text-vscode-textSecondary hover:text-vscode-text bg-transparent hover:bg-vscode-bgTertiary/50 border border-transparent hover:border-vscode-border/50 hover:shadow-sm hover:shadow-black/10'
                    }`}
                  >
                    {qty} units
                  </button>
                  {index < array.length - 1 && (
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-px h-6 bg-neutral-600/20 transition-all duration-300 group-hover:bg-neutral-600/40"></div>
                  )}
                </div>
              )
            })}
          </div>
          
          {/* Stock Information */}
          <div className="flex items-center justify-center">
            <span className={`text-xs ${getStockColor()}`}>
              {getStockText()}
            </span>
          </div>
        </div>
      )}
      
      {/* Add Button - Positioned in selector area with proper spacing */}
      {(product.mli_product_type === 'weight' || product.mli_product_type === 'quantity') && selectedVariation !== 'default' && (
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className={`absolute bottom-3 right-3 w-7 h-7 rounded-full transition-all duration-300 ease-out flex items-center justify-center active:scale-95 shadow-md ${
            isOutOfStock 
              ? 'bg-gray-400/50 cursor-not-allowed text-gray-600' 
              : 'bg-white/10 text-white hover:bg-white/20 hover:shadow-lg hover:shadow-white/10 transform hover:scale-110'
          }`}
        >
          <Plus className="w-3 h-3" />
        </button>
      )}
    </div>
  )
} 