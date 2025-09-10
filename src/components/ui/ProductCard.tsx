'use client';

import React, { memo, useCallback, useState } from 'react';
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

  // Handle click with selection
  const handleCardClick = useCallback((e: React.MouseEvent) => {
    // Call selection handler if provided
    onProductSelection?.(product, e);
  }, [onProductSelection, product]);

  return (
    <div 
      key={product.id} 
      onClick={handleCardClick}
      className={`rounded-lg overflow-hidden p-2 relative cursor-pointer transition-all duration-300 ease-out ${
        isAuditMode 
          ? isAuditSelected
            ? 'border-2 border-blue-500/30 bg-gradient-to-br from-blue-950/40 to-neutral-600/60 shadow-lg shadow-blue-500/10 hover:from-blue-950/50 hover:to-neutral-600/70'
            : 'border border-neutral-500/30 bg-transparent hover:bg-neutral-600/10 hover:border-neutral-400/40 hover:shadow-md'
          : isSalesView 
            ? isSelected
              ? 'border-2 border-white/30 bg-gradient-to-br from-neutral-500/40 to-neutral-600/80 shadow-lg shadow-white/5 hover:from-neutral-500/50 hover:to-neutral-600/90 transform scale-[1.02]'
              : 'border border-neutral-500/30 bg-transparent hover:bg-neutral-600/10 hover:border-neutral-400/40 hover:-translate-y-1 hover:shadow-lg hover:shadow-neutral-700/20'
            : 'border border-white/[0.06] bg-transparent hover:border-white/[0.12] hover:bg-neutral-600/5 hover:-translate-y-1 hover:shadow-lg'
      }`}
    >
      {/* Product Image and Name Row */}
      <div className="flex gap-4 items-start mb-4">
        {/* Product Image */}
        <div className="w-24 h-24 relative overflow-hidden flex-shrink-0">
          {product.image ? (
            <img 
              src={product.image} 
              alt={product.name}
              className="w-full h-full object-contain"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-12 h-12 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          )}
        </div>

        {/* Product Name and Category */}
        <div className="flex-1 min-w-0 flex flex-col justify-center items-center text-center h-24">
          <h3 className="text-neutral-200 font-normal text-lg mb-2 line-clamp-2 leading-tight">
            {product.name}
          </h3>
          {product.categories.length > 0 && (
            <p className="text-neutral-400 text-sm mb-2">
              {product.categories[0].name}
            </p>
          )}
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
                className="absolute left-1 z-10 w-6 h-6 text-neutral-500 hover:text-red-400 transition-colors opacity-60 hover:opacity-100 cursor-pointer flex items-center justify-center"
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
                          className="w-32 h-8 text-sm text-center bg-neutral-500/50 border border-neutral-400 rounded text-neutral-200 focus:border-neutral-300 focus:outline-none font-medium pl-6 pr-6 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              
              {/* Increase Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onInventoryAdjustment?.(product.id, null, product.blueprintPricing ? 0.1 : 1, 'Manual increase');
                }}
                className="absolute right-1 z-10 w-6 h-6 text-neutral-500 hover:text-green-400 transition-colors opacity-60 hover:opacity-100 cursor-pointer flex items-center justify-center"
                title={product.blueprintPricing ? "Increase by 0.1" : "Increase by 1"}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Variant Selector and Quantity Selector / Audit Controls */}
      <div className="mb-4">
        {isAuditMode ? (
          /* Audit Mode - Stacked Quantity Editors for Variants */
          <div className="space-y-2">
            {product.has_variants && product.variants ? (
              /* Variant Products - Stacked Quantity Editors */
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
                        <div className="text-xs font-medium text-neutral-200 truncate">
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
                          className="absolute left-0.5 z-10 w-5 h-5 text-neutral-500 hover:text-red-400 transition-colors opacity-60 hover:opacity-100 cursor-pointer flex items-center justify-center"
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
                          className="w-40 h-6 text-sm text-center bg-neutral-500/50 border border-neutral-400 rounded text-neutral-200 focus:border-neutral-300 focus:outline-none pl-6 pr-6 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        
                        {/* Increase Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onInventoryAdjustment?.(product.id, variant.id, product.blueprintPricing ? 0.1 : 1, 'Manual increase');
                          }}
                          className="absolute right-0.5 z-10 w-5 h-5 text-neutral-500 hover:text-green-400 transition-colors opacity-60 hover:opacity-100 cursor-pointer flex items-center justify-center"
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
                  <div className="text-xs text-neutral-600 text-center py-1 border-t border-dashed border-neutral-600/20">
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
              {/* Variant options - Clean theme-consistent design */}
              <div className="grid grid-cols-2 gap-1">
                {product.variants.slice(0, 6).map((variant) => {
                  const selectedVariantId = selectedVariants[product.id];
                  const isVariantSelected = selectedVariantId === variant.id;
                  const variantStock = userLocationId 
                    ? variant.inventory.find(inv => inv.location_id === userLocationId)?.quantity || 0
                    : variant.total_stock;
                  const variantInStock = variantStock > 0;

                  return (
                    <button
                      key={variant.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onVariantSelect(product.id, variant.id);
                      }}
                      disabled={!variantInStock}
                      className={`w-full px-2 py-2 ${isSalesView ? 'text-sm' : 'text-xs'} rounded transition-colors text-left ${
                        isVariantSelected
                          ? 'bg-transparent border border-neutral-400 text-neutral-200'
                          : variantInStock
                          ? 'bg-transparent border border-neutral-600 text-neutral-300 hover:border-neutral-500 hover:text-neutral-200 hover:bg-neutral-600/10'
                          : 'bg-transparent border border-neutral-600/40 text-neutral-600 cursor-not-allowed opacity-50'
                      }`}
                    >
                      <div className={`truncate font-medium ${isSalesView ? 'text-sm' : ''}`}>{variant.name}</div>
                      <div className="mt-1">
                        <span className={`${isSalesView ? 'text-sm' : 'text-xs'} ${variantInStock ? 'text-neutral-400' : 'text-red-400'}`}>
                          {variantInStock ? `${variantStock} in stock` : 'Out of stock'}
                        </span>
                      </div>
                    </button>
                  );
                })}
                {product.variants.length > 6 && (
                  <div className="text-xs text-neutral-500 text-center py-2 col-span-2 border border-dashed border-neutral-600 rounded">
                    +{product.variants.length - 6} more variants
                  </div>
                )}
              </div>

              {/* Show quantity selector ONLY after variant is selected and NOT in audit mode */}
              {!isAuditMode && selectedVariants[product.id] && (
                <div className="mt-3 pt-3 border-t border-neutral-600">
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
                  />
                </div>
              )}
            </div>
          ) : !isAuditMode ? (
            <QuantitySelector
              productId={product.id}
              basePrice={parseFloat(product.regular_price) || 0}
              blueprintPricing={product.blueprintPricing}
              onQuantityChange={(quantity, price, category) => onQuantityChange(product.id, quantity, price, category)}
              disabled={false}
              hidePrices={isSalesView}
            />
          ) : null
        )}
      </div>

      {/* Stock Info */}
      <div className="text-center mb-2 h-4 flex items-center justify-center">
        {isAuditMode ? (
          /* Audit Mode - Show current stock only when field is focused */
          <span className={`text-xs text-neutral-500 transition-opacity duration-200 ${
            focusedStockFields.has(`${product.id}`) || (product.has_variants && selectedVariants[product.id] && focusedStockFields.has(`${product.id}-${selectedVariants[product.id]}`))
              ? 'opacity-100' 
              : 'opacity-0'
          }`}>
            {product.has_variants && product.variants
              ? `${typeof stockDisplay === 'number' ? (product.blueprintPricing ? stockDisplay.toFixed(2) : Math.floor(stockDisplay)) : stockDisplay} current stock`
              : `${typeof stockDisplay === 'number' ? (product.blueprintPricing ? stockDisplay.toFixed(2) : Math.floor(stockDisplay)) : stockDisplay} current stock`}
          </span>
        ) : (
          /* Normal Mode - Display Only */
          <span className="text-xs text-neutral-400">
            {product.has_variants && !selectedVariants[product.id] 
              ? `${stockDisplay} total stock` 
              : `${stockDisplay} in stock`}
          </span>
        )}
      </div>

      {/* Selected Price - Bottom Left - Only show in normal mode */}
      {!isAuditMode && (
        <div className="absolute bottom-2 left-2 text-xs text-neutral-400">
          {product.has_variants && selectedVariants[product.id] ? (
            product.selected_price ? formatPrice(product.selected_price) : (
              <span className="text-neutral-500">Select quantity</span>
            )
          ) : product.selected_price ? (
            formatPrice(product.selected_price)
          ) : (
            formatPrice(displayPrice)
          )}
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
            className="absolute bottom-2 right-2 text-neutral-400 hover:text-white transition-colors disabled:opacity-50"
            title={isInStock ? 'Add to Cart' : 'Out of Stock'}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
