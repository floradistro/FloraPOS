'use client';

import React, { memo, useCallback, useState } from 'react';
import Image from 'next/image';
import { Product } from './ProductGrid';
import { QuantitySelector } from './QuantitySelector';

interface ProductCardProps {
  product: Product;
  userLocationId?: number;
  selectedVariants: Record<number, number>;
  isAuditMode: boolean;
  isSalesView?: boolean; // New prop to identify sales view
  isSelected?: boolean; // New prop for persistent selection state
  onVariantSelect: (productId: number, variantId: number) => void;
  onQuantityChange: (productId: number, quantity: number, price: number, category?: string) => void;
  onAddToCartWithVariant: (product: Product) => void;
  // Optional audit mode props
  editedStockValues?: Record<string, number | string>;
  focusedStockFields?: Set<string>;
  selectedProducts?: Set<number>;
  onStockFieldFocus?: (fieldKey: string) => void;
  onStockFieldBlur?: (fieldKey: string) => void;
  onStockValueChange?: (productId: number, variantId: number | null, newStock: number | string) => void;
  onStockValueApply?: (productId: number, variantId: number | null, newStock: number, currentStock: number) => void;
  onInventoryAdjustment?: (productId: number, variantId: number | null, adjustment: number, reason?: string) => void;
  onProductSelection?: (product: Product, event?: React.MouseEvent) => void;
}

const ProductCard = memo<ProductCardProps>(({
  product,
  userLocationId,
  selectedVariants,
  isAuditMode,
  isSalesView = false,
  isSelected = false,
  onVariantSelect,
  onQuantityChange,
  onAddToCartWithVariant,
  // Optional audit mode props with defaults
  editedStockValues = {},
  focusedStockFields = new Set(),
  selectedProducts = new Set(),
  onStockFieldFocus,
  onStockFieldBlur,
  onStockValueChange,
  onStockValueApply,
  onInventoryAdjustment,
  onProductSelection,
}) => {
  
  // State for pricing tier selection
  const [selectedPricingTier, setSelectedPricingTier] = useState<string | null>(null);
  const [showPricingDropdown, setShowPricingDropdown] = useState(false);
  // Stock display logic that accounts for selected variants
  let stockDisplay = 0;
  let totalStock = product.total_stock || 0;
  let displayPrice = product.regular_price;
  let isInStock = false;

  if (product.has_variants && product.variants) {
    const selectedVariantId = selectedVariants[product.id];
    const selectedVariant = product.variants.find(v => v.id === selectedVariantId);
    
    if (selectedVariant) {
      // Show selected variant stock and price
      if (userLocationId) {
        const locationInventory = selectedVariant.inventory.find(inv => 
          inv.location_id === userLocationId
        );
        stockDisplay = locationInventory?.quantity || 0;
      } else {
        stockDisplay = selectedVariant.total_stock;
      }
      displayPrice = selectedVariant.sale_price || selectedVariant.regular_price;
      isInStock = stockDisplay > 0;
    } else {
      // No variant selected, show aggregate info
      stockDisplay = product.variants.reduce((sum, variant) => {
        if (userLocationId) {
          const locationInventory = variant.inventory.find(inv => inv.location_id === userLocationId);
          return sum + (locationInventory?.quantity || 0);
        } else {
          return sum + variant.total_stock;
        }
      }, 0);
      isInStock = stockDisplay > 0;
    }
  } else {
    // Simple product logic
    if (userLocationId) {
      const locationInventory = product.inventory.find(inv => 
        parseInt(inv.location_id) === userLocationId
      );
      stockDisplay = locationInventory?.stock || 0;
    } else {
      stockDisplay = totalStock;
    }
    isInStock = stockDisplay > 0;
  }

  const isAuditSelected = isAuditMode && selectedProducts.has(product.id);

  const formatPrice = useCallback((price: number | string): string => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(numPrice) ? '$0.00' : `$${numPrice.toFixed(2)}`;
  }, []);

  // Check if product has multiple pricing tiers
  const hasMultiplePricingTiers = product.blueprintPricing && product.blueprintPricing.ruleGroups.length > 1;
  
  // Get available pricing tiers
  const availablePricingTiers = hasMultiplePricingTiers 
    ? product.blueprintPricing!.ruleGroups.map(group => group.ruleName)
    : [];
    
  // Set default selected tier if none selected
  React.useEffect(() => {
    if (hasMultiplePricingTiers && !selectedPricingTier) {
      setSelectedPricingTier(availablePricingTiers[0]);
    }
  }, [hasMultiplePricingTiers, selectedPricingTier, availablePricingTiers]);

  // Listen for external clear events (like clicking outside)
  React.useEffect(() => {
    const handleClearSelections = () => {
      setSelectedPricingTier(hasMultiplePricingTiers ? availablePricingTiers[0] : null);
      setShowPricingDropdown(false);
    };

    window.addEventListener('clearQuantitySelections', handleClearSelections);
    return () => {
      window.removeEventListener('clearQuantitySelections', handleClearSelections);
    };
  }, [hasMultiplePricingTiers, availablePricingTiers]);

  // Handle click with selection
  const handleCardClick = useCallback((e: React.MouseEvent) => {
    // Don't trigger card click if clicking dropdown
    if ((e.target as HTMLElement).closest('.pricing-tier-dropdown')) {
      return;
    }
    // Call selection handler if provided
    onProductSelection?.(product, e);
  }, [onProductSelection, product]);

  return (
    <div 
      key={product.id} 
      onClick={handleCardClick}
      className={`p-3 relative cursor-pointer group transition-all duration-300 ease-out ${
        isAuditMode 
          ? isAuditSelected
            ? 'bg-blue-950/30'
            : 'bg-transparent hover:bg-neutral-800/20'
          : isSalesView 
            ? isSelected
              ? 'bg-neutral-600/20'
              : 'bg-black hover:bg-neutral-900'
            : isSelected
              ? 'bg-gradient-to-br from-neutral-800/25 to-neutral-700/15 shadow-lg shadow-black/10'
              : 'bg-transparent hover:bg-neutral-800/15'
      }`}
    >
      {/* Pricing Tier Dropdown - Top Right */}
      {hasMultiplePricingTiers && !isAuditMode && (
        <div className="absolute top-2 right-2 pricing-tier-dropdown z-30">
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowPricingDropdown(!showPricingDropdown);
              }}
              className="w-6 h-6 flex items-center justify-center rounded bg-neutral-800/80 border border-white/20 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/80 transition-all duration-200"
              title="Select Pricing Tier"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Dropdown Menu */}
            {showPricingDropdown && (
              <div className="absolute top-full right-0 mt-1 bg-neutral-900 border border-neutral-600 rounded-lg shadow-xl z-50 min-w-[120px]">
                {availablePricingTiers.map((tierName) => (
                  <button
                    key={tierName}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPricingTier(tierName);
                      setShowPricingDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                      selectedPricingTier === tierName
                        ? 'bg-neutral-700 text-white'
                        : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                    }`}
                    style={{ fontFamily: 'Tiempos, serif' }}
                  >
                    {tierName}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
        {/* Product Image and Name Row */}
        <div className="flex gap-4 items-center mb-4">
          {/* Product Image */}
          <div className="w-16 h-16 relative overflow-hidden flex-shrink-0 rounded bg-neutral-800/30 border border-white/10 group-hover:border-white/20 transition-colors duration-200">
            {product.image ? (
              <img 
                src={product.image} 
                alt={product.name}
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Image 
                  src="/logo123.png" 
                  alt="Flora POS Logo" 
                  width={64}
                  height={64}
                  className="object-contain opacity-30 group-hover:opacity-40 transition-opacity duration-200"
                  priority
                />
              </div>
            )}
          </div>

          {/* Product Name and Category - Centered in remaining space */}
          <div className="flex-1 flex flex-col justify-center items-center text-center">
            <h3 className="text-neutral-200 font-normal text-base mb-2 line-clamp-2 leading-tight group-hover:text-white transition-colors duration-200" style={{ fontFamily: 'Tiempos, serif' }}>
              {product.name}
            </h3>
            {product.categories.length > 0 && (
              <p className="text-neutral-400 text-xs group-hover:text-neutral-300 transition-colors duration-200" style={{ fontFamily: 'Tiempos, serif' }}>
                {product.categories[0].name}
              </p>
            )}
          </div>
        </div>

      {/* Quantity Selector for Non-Variant Products in Adjustment Mode */}
      {isAuditMode && !product.has_variants && (
        <div className="flex items-center">
          <div className="relative flex items-center">
            {/* Decrease Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onInventoryAdjustment?.(product.id, null, product.blueprintPricing ? -0.1 : -1, 'Manual decrease');
              }}
              className="absolute left-1 z-10 w-6 h-6 text-neutral-300 hover:text-red-400 transition-colors opacity-60 hover:opacity-100 cursor-pointer flex items-center justify-center"
              title={product.blueprintPricing ? "Decrease by 0.1" : "Decrease by 1"}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
            </button>
            
            <input
              type="number"
              min="0"
              step={product.blueprintPricing ? "0.1" : "1"}
              value={(() => {
                const key = `${product.id}`;
                const value = editedStockValues[key] !== undefined ? editedStockValues[key] : stockDisplay;
                return typeof value === 'string' ? value : (typeof value === 'number' ? (product.blueprintPricing ? value.toFixed(2) : Math.floor(value).toString()) : value);
              })()}
              onChange={(e) => {
                e.stopPropagation();
                onStockValueChange?.(product.id, null, e.target.value);
              }}
              onFocus={(e) => {
                e.stopPropagation();
                onStockFieldFocus?.(`${product.id}`);
              }}
              onBlur={(e) => {
                e.stopPropagation();
                const key = `${product.id}`;
                const newStock = editedStockValues[key];
                
                onStockFieldBlur?.(`${product.id}`);
                if (newStock !== undefined && newStock !== stockDisplay) {
                  const numericValue = typeof newStock === 'string' ? parseFloat(newStock) || 0 : newStock;
                  onStockValueApply?.(product.id, null, numericValue, stockDisplay);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              className="w-32 h-8 text-sm text-center bg-neutral-500/50 border border-neutral-400 rounded text-white focus:border-neutral-300 focus:outline-none font-medium pl-6 pr-6 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            
            {/* Increase Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onInventoryAdjustment?.(product.id, null, product.blueprintPricing ? 0.1 : 1, 'Manual increase');
              }}
              className="absolute right-1 z-10 w-6 h-6 text-neutral-300 hover:text-green-400 transition-colors opacity-60 hover:opacity-100 cursor-pointer flex items-center justify-center"
              title={product.blueprintPricing ? "Increase by 0.1" : "Increase by 1"}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Variant Selector and Quantity Selector / Audit Controls */}
      <div className="mb-4">
        {isAuditMode ? (
          <div className="space-y-2">
            {product.has_variants && product.variants ? (
              <div className="space-y-1">
                {product.variants.slice(0, 4).map((variant) => {
                  const variantStock = userLocationId 
                    ? variant.inventory.find(inv => inv.location_id === userLocationId)?.quantity || 0
                    : variant.total_stock;
                  
                  const editKey = `${product.id}-${variant.id}`;
                  const editedValue = editedStockValues[editKey];
                  const displayStock = editedValue !== undefined ? editedValue : variantStock;

                  return (
                    <div key={variant.id} className="flex items-center justify-between py-2 px-3 bg-transparent border-b border-neutral-600/30 last:border-b-0">
                      {/* Variant Name */}
                      <div className="flex-1 min-w-0 mr-2">
                        <div className="text-xs text-neutral-400 truncate" style={{ fontFamily: 'Tiempos, serif' }}>
                          {variant.name}
                        </div>
                      </div>
                      
                      {/* Integrated Quantity Editor */}
                      <div className="relative flex items-center">
                        {/* Decrease Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onInventoryAdjustment?.(product.id, variant.id, product.blueprintPricing ? -0.1 : -1, 'Manual decrease');
                          }}
                          className="absolute left-0.5 z-10 w-5 h-5 text-neutral-300 hover:text-red-400 transition-colors opacity-60 hover:opacity-100 cursor-pointer flex items-center justify-center"
                          title={product.blueprintPricing ? "Decrease by 0.1" : "Decrease by 1"}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </button>
                        
                        {/* Stock Display/Input */}
                        <input
                          type="number"
                          min="0"
                          step={product.blueprintPricing ? "0.1" : "1"}
                          value={typeof displayStock === 'string' ? displayStock : (typeof displayStock === 'number' ? (product.blueprintPricing ? displayStock.toFixed(2) : Math.floor(displayStock).toString()) : displayStock)}
                          onChange={(e) => {
                            e.stopPropagation();
                            onStockValueChange?.(product.id, variant.id, e.target.value);
                          }}
                          onFocus={(e) => {
                            e.stopPropagation();
                            onStockFieldFocus?.(`${product.id}-${variant.id}`);
                          }}
                          onBlur={(e) => {
                            e.stopPropagation();
                            onStockFieldBlur?.(`${product.id}-${variant.id}`);
                            if (editedValue !== undefined && editedValue !== variantStock) {
                              const numericValue = typeof editedValue === 'string' ? parseFloat(editedValue) || 0 : editedValue;
                              onStockValueApply?.(product.id, variant.id, numericValue, variantStock);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur();
                            }
                          }}
                          className="w-40 h-6 text-sm text-center bg-neutral-500/50 border border-neutral-400 rounded text-white focus:border-neutral-300 focus:outline-none pl-6 pr-6 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        
                        {/* Increase Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onInventoryAdjustment?.(product.id, variant.id, product.blueprintPricing ? 0.1 : 1, 'Manual increase');
                          }}
                          className="absolute right-0.5 z-10 w-5 h-5 text-neutral-300 hover:text-green-400 transition-colors opacity-60 hover:opacity-100 cursor-pointer flex items-center justify-center"
                          title={product.blueprintPricing ? "Increase by 0.1" : "Increase by 1"}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
                {product.variants.length > 4 && (
                  <div className="text-xs text-neutral-300 text-center py-1 border-t border-dashed border-neutral-600/20">
                    +{product.variants.length - 4} more variants
                  </div>
                )}
              </div>
            ) : null}
          </div>
        ) : (
          /* Normal Mode - Full Quantity Selector */
          product.has_variants && product.variants ? (
            <div className="space-y-2">
              {/* Variant Dropdown - Reserved space, visible when selected */}
              <div className="min-h-[40px] relative">
                {isSelected ? (
                  <div className="animate-in fade-in duration-200 ease-out">
                    <select
                      value={selectedVariants[product.id] || ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          onVariantSelect(product.id, parseInt(e.target.value));
                        }
                      }}
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-600 rounded-lg text-neutral-300 text-sm focus:bg-neutral-800 focus:border-neutral-500 focus:outline-none transition-all duration-200 appearance-none cursor-pointer"
                      style={{ fontFamily: 'Tiempos, serif' }}
                    >
                      <option value="">Select variant...</option>
                      {product.variants.map((variant) => {
                        const variantStock = userLocationId 
                          ? variant.inventory.find(inv => inv.location_id === userLocationId)?.quantity || 0
                          : variant.total_stock;
                        const variantInStock = variantStock > 0;
                        
                        return (
                          <option
                            key={variant.id}
                            value={variant.id}
                            disabled={!variantInStock}
                            className={variantInStock ? 'text-neutral-300' : 'text-neutral-500'}
                          >
                            {variant.name} ({variantInStock ? `${variantStock} in stock` : 'Out of stock'})
                          </option>
                        );
                      })}
                    </select>
                    
                    {/* Custom dropdown arrow */}
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Quantity selector - Reserved space, visible when variant is selected */}
              <div className="min-h-[60px]">
                {!isAuditMode && isSelected && selectedVariants[product.id] ? (
                  <div className="animate-in fade-in duration-200 ease-out delay-100">
                    <div className="pt-3 border-t border-neutral-600/30">
                      <QuantitySelector
                        productId={selectedVariants[product.id]} // Use variant ID
                        basePrice={parseFloat(
                          product.variants.find(v => v.id === selectedVariants[product.id])?.sale_price ||
                          product.variants.find(v => v.id === selectedVariants[product.id])?.regular_price ||
                          '0'
                        )}
                        blueprintPricing={product.blueprintPricing}
                        onQuantityChange={(quantity, price, category) => 
                          onQuantityChange(product.id, quantity, price, category)
                        }
                        disabled={false}
                        hidePrices={isSalesView}
                        selectedPricingTier={selectedPricingTier}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : !isAuditMode ? (
            <div className="min-h-[60px]">
              {isSelected ? (
                <div className="animate-in fade-in duration-200 ease-out">
                  <QuantitySelector
                    productId={product.id}
                    basePrice={parseFloat(product.regular_price) || 0}
                    blueprintPricing={product.blueprintPricing}
                    onQuantityChange={(quantity, price, category) => onQuantityChange(product.id, quantity, price, category)}
                    disabled={false}
                    hidePrices={isSalesView}
                    selectedPricingTier={selectedPricingTier}
                  />
                </div>
              ) : null}
            </div>
          ) : null
        )}
      </div>

      {/* Simple Fade Animation Styles */}
      <style jsx>{`
        @keyframes smooth-fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .animate-in {
          animation-fill-mode: both;
        }
        
        .fade-in {
          animation: smooth-fade-in forwards;
        }
        
        .duration-200 {
          animation-duration: 200ms;
        }
        
        .ease-out {
          animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        
        .delay-100 {
          animation-delay: 100ms;
        }
      `}</style>

       {/* Stock Info */}
       <div className="text-center mb-3 h-4 flex items-center justify-center">
         {isAuditMode ? (
           /* Audit Mode - Show current stock only when field is focused */
           <span className={`text-xs text-neutral-500 transition-opacity duration-200 ${
             focusedStockFields.has(`${product.id}`) || (product.has_variants && selectedVariants[product.id] && focusedStockFields.has(`${product.id}-${selectedVariants[product.id]}`))
               ? 'opacity-100' 
               : 'opacity-0'
           }`} style={{ fontFamily: 'Tiempos, serif' }}>
             {product.has_variants && product.variants
               ? `${typeof stockDisplay === 'number' ? (product.blueprintPricing ? stockDisplay.toFixed(2) : Math.floor(stockDisplay)) : stockDisplay} current stock`
               : `${typeof stockDisplay === 'number' ? (product.blueprintPricing ? stockDisplay.toFixed(2) : Math.floor(stockDisplay)) : stockDisplay} current stock`}
           </span>
         ) : null}
       </div>

       {/* Stock Info - Bottom Center - Normal Mode Only */}
       {!isAuditMode && (
         <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-neutral-500" style={{ fontFamily: 'Tiempos, serif' }}>
           {product.has_variants && !selectedVariants[product.id] 
             ? `${stockDisplay} total stock` 
             : `${stockDisplay} in stock`}
         </div>
       )}

      {/* Selected Price - Bottom Left - Only show when option is selected */}
      {!isAuditMode && (
        <div className="absolute bottom-2 left-2 text-xs text-neutral-500" style={{ fontFamily: 'Tiempos, serif' }}>
          {product.has_variants && selectedVariants[product.id] ? (
            product.selected_price ? formatPrice(product.selected_price) : null
          ) : product.selected_price ? (
            formatPrice(product.selected_price)
          ) : null}
        </div>
      )}

      {/* Action Buttons - Add to Cart */}
      {!isAuditMode && (
        /* Normal Mode - Add to Cart Button */
        ((product.has_variants && selectedVariants[product.id] && product.selected_quantity && product.selected_price) || 
          (!product.has_variants && ((product.selected_quantity && product.selected_price) || !product.blueprintPricing))) ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCartWithVariant(product);
            }}
            disabled={!isInStock}
            className="absolute bottom-2 right-2 w-6 h-6 rounded bg-white/20 hover:bg-white/30 disabled:bg-neutral-600 text-white transition-colors duration-200 flex items-center justify-center"
            title={isInStock ? 'Add to Cart' : 'Out of Stock'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        ) : null
      )}
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
