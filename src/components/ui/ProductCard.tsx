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
  onProductSelection?: (product: Product) => void;
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

  // Handle variant products (with or without loaded variants)
  if (product.has_variants) {
    // If variants are loaded
    if (product.variants) {
      const selectedVariantId = selectedVariants[product.id];
      const selectedVariant = product.variants.find(v => v.id === selectedVariantId);
      
      if (selectedVariant) {
        // Show selected variant stock and price
        // When location is selected, inventory is already filtered to that location by the API
        stockDisplay = Number(selectedVariant.total_stock) || 0;
        displayPrice = selectedVariant.sale_price || selectedVariant.regular_price;
        isInStock = !isNaN(stockDisplay) && stockDisplay > 0;
      } else {
        // No variant selected, show aggregate info
        // Sum all variant stocks (already filtered by location if applicable)
        stockDisplay = product.variants.reduce((sum, variant) => {
          const variantStock = Number(variant.total_stock) || 0;
          return sum + variantStock;
        }, 0);
        isInStock = !isNaN(stockDisplay) && stockDisplay > 0;
      }
    } else {
      // Variants not loaded yet (lazy loading)
      // Use parent product stock as placeholder
      if (userLocationId) {
        const locationInventory = product.inventory?.find(inv => 
          parseInt(inv.location_id) === userLocationId
        );
        stockDisplay = locationInventory?.stock || 0;
      } else {
        stockDisplay = product.total_stock || 0;
      }
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
    // Don't trigger card click if clicking dropdown or variant selector
    if ((e.target as HTMLElement).closest('.pricing-tier-dropdown') || 
        (e.target as HTMLElement).closest('select')) {
      return;
    }
    // Call selection handler if provided
    onProductSelection?.(product);
  }, [onProductSelection, product]);

  return (
    <div 
      key={product.id} 
      onClick={handleCardClick}
      className={`p-2 relative cursor-pointer group apple-smooth min-h-[160px] flex flex-col ${
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
              className="w-6 h-6 flex items-center justify-center rounded bg-neutral-800/80 border border-white/20 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/80 apple-smooth-fast button-hover"
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
                    className={`w-full px-3 py-2 text-left text-sm apple-smooth-fast ${
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
        <div className="flex gap-2 items-center mb-2">
          {/* Product Image */}
          <div className="w-12 h-12 relative overflow-hidden flex-shrink-0 rounded bg-neutral-800/30 border border-white/10 group-hover:border-white/20 apple-smooth">
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
                  width={48}
                  height={48}
                  className="object-contain opacity-30 group-hover:opacity-40 transition-opacity duration-200"
                  priority
                />
              </div>
            )}
          </div>

          {/* Product Name and Category - Centered in remaining space */}
          <div className="flex-1 flex flex-col justify-center items-center text-center">
            <h3 className="text-neutral-200 font-normal text-sm mb-1 line-clamp-2 leading-tight group-hover:text-white transition-colors duration-200" style={{ fontFamily: 'Tiempos, serif' }}>
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

      {/* Variant Selector and Quantity Selector / Audit Controls - Flexible space */}
      <div className="flex-1">
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
              {/* Variant Dropdown - Always visible when product is selected */}
              {isSelected ? (
                <div 
                  className="space-y-1"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {/* Variant Dropdown */}
                  <div className="animate-in fade-in duration-200 ease-out relative">
                    <select
                      value={selectedVariants[product.id] || ''}
                      onChange={(e) => {
                        e.stopPropagation();
                        if (e.target.value) {
                          onVariantSelect(product.id, parseInt(e.target.value));
                        }
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                      }}
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-600 rounded-lg text-neutral-300 text-sm focus:bg-neutral-800 focus:border-neutral-500 focus:outline-none transition-all duration-200 appearance-none cursor-pointer"
                      style={{ fontFamily: 'Tiempos, serif' }}
                    >
                      <option value="">Select variant...</option>
                      {product.variants.map((variant) => {
                        // Inventory is already filtered by location if one is selected
                        const variantStock = Number(variant.total_stock) || 0;
                        const variantInStock = !isNaN(variantStock) && variantStock > 0;
                        // Format stock to 2 decimal places if it's a decimal, otherwise show as integer
                        const formattedStock = isNaN(variantStock) ? '0' : (Number.isInteger(variantStock) ? variantStock.toString() : variantStock.toFixed(2));
                        
                        return (
                          <option
                            key={variant.id}
                            value={variant.id}
                            disabled={!variantInStock}
                            className={variantInStock ? 'text-neutral-300' : 'text-neutral-500'}
                          >
                            {variant.name} - Stock: {formattedStock}
                          </option>
                        );
                      })}
                    </select>
                    
                    {/* Custom dropdown arrow */}
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none flex items-center justify-center">
                      <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    
                  </div>
                  
                  {/* Quantity selector - visible when variant is selected */}
                  {!isAuditMode && selectedVariants[product.id] ? (
                    <div className="animate-in fade-in duration-200 ease-out">
                      <div className="pt-1">
                        {(() => {
                          const selectedVariant = product.variants.find(v => v.id === selectedVariants[product.id]);
                          if (!selectedVariant) return null;
                          // When location is selected, inventory is already filtered to that location
                          const stock = Number(selectedVariant.total_stock) || 0;
                          // Format stock to 2 decimal places if it's a decimal, otherwise show as integer
                          const formattedStock = isNaN(stock) ? '0' : (Number.isInteger(stock) ? stock.toString() : stock.toFixed(2));
                          
                          return (
                            <QuantitySelector
                              productId={selectedVariants[product.id]} // Use variant ID
                              basePrice={parseFloat(
                                selectedVariant.sale_price || selectedVariant.regular_price || '0'
                              )}
                              blueprintPricing={product.blueprintPricing}
                              onQuantityChange={(quantity, price, category) => 
                                onQuantityChange(product.id, quantity, price, category)
                              }
                              disabled={false}
                              hidePrices={isSalesView}
                              selectedPricingTier={selectedPricingTier}
                            />
                          );
                        })()}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="min-h-[40px] flex items-center justify-center text-neutral-500 text-sm text-center px-2">
                  Click to select variant
                </div>
              )}
            </div>
          ) : !isAuditMode ? (
            <div className="min-h-[40px]">
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
             {typeof stockDisplay === 'number' 
               ? `${isNaN(Number(stockDisplay)) ? '0' : (Number.isInteger(Number(stockDisplay)) ? Number(stockDisplay) : Number(stockDisplay).toFixed(2))} current stock`
               : `${stockDisplay} current stock`}
           </span>
         ) : null}
       </div>

       {/* Stock Info - Bottom Center - Normal Mode Only */}
       {!isAuditMode && (
         <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-neutral-500" style={{ fontFamily: 'Tiempos, serif' }}>
           {product.has_variants && selectedVariants[product.id] 
             ? (() => {
                 const selectedVariant = product.variants?.find(v => v.id === selectedVariants[product.id]);
                 if (selectedVariant) {
                   const stock = Number(selectedVariant.total_stock) || 0;
                   const formattedStock = isNaN(stock) ? '0' : (Number.isInteger(stock) ? stock.toString() : stock.toFixed(2));
                   return `${formattedStock} units`;
                 }
                 return `${isNaN(Number(stockDisplay)) ? '0' : (Number.isInteger(Number(stockDisplay)) ? Number(stockDisplay) : Number(stockDisplay).toFixed(2))} in stock`;
               })()
             : product.has_variants && !selectedVariants[product.id] 
               ? `${isNaN(Number(stockDisplay)) ? '0' : (Number.isInteger(Number(stockDisplay)) ? Number(stockDisplay) : Number(stockDisplay).toFixed(2))} total stock` 
               : `${isNaN(Number(stockDisplay)) ? '0' : (Number.isInteger(Number(stockDisplay)) ? Number(stockDisplay) : Number(stockDisplay).toFixed(2))} in stock`}
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
