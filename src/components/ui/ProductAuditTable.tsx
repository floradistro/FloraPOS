'use client';

import React from 'react';
import { Product } from './ProductGrid';

interface ProductAuditTableProps {
  filteredProducts: Product[];
  selectedProducts: Set<number>;
  editedStockValues: Record<string, string | number>;
  userLocationId?: number;
  onProductSelection: (product: Product, event?: React.MouseEvent) => void;
  onInventoryAdjustment: (productId: number, variantId: number | null, adjustment: number, reason: string) => void;
  onStockValueChange: (productId: number, variantId: number | null, value: string) => void;
  onStockFieldFocus: (key: string) => void;
  onStockFieldBlur: (key: string) => void;
  onStockValueApply: (productId: number, variantId: number | null, newValue: number, oldValue: number) => void;
  setSelectedProducts: (products: Set<number>) => void;
  pendingAdjustments?: Map<string, number>;
  onSetAdjustmentValue?: (productId: number, variantId: number | null, value: number) => void;
  isRestockMode?: boolean;
  isAuditMode?: boolean;
  // Filter and sort controls - these are now managed by Header
  showOnlySelected?: boolean;
  onShowOnlySelectedChange?: (show: boolean) => void;
  sortAlphabetically?: boolean;
  onSortAlphabeticallyChange?: (sort: boolean) => void;
}

export const ProductAuditTable: React.FC<ProductAuditTableProps> = ({
  filteredProducts,
  selectedProducts,
  editedStockValues,
  userLocationId,
  onProductSelection,
  onInventoryAdjustment,
  onStockValueChange,
  onStockFieldFocus,
  onStockFieldBlur,
  onStockValueApply,
  setSelectedProducts,
  pendingAdjustments = new Map(),
  onSetAdjustmentValue,
  isRestockMode = false,
  isAuditMode = false,
  showOnlySelected = false,
  onShowOnlySelectedChange,
  sortAlphabetically = true,
  onSortAlphabeticallyChange
}) => {
  return (
    <div className="h-full overflow-auto p-4">
      
      {/* Header */}
      <div className="mb-3">
        <div className="grid grid-cols-12 gap-4 px-4 py-1 text-xs font-medium text-neutral-400 uppercase tracking-wider" style={{ fontFamily: 'Tiempos, serif' }}>
          <div className="col-span-4 text-left">Product</div>
          <div className="col-span-2 text-left">SKU</div>
          <div className="col-span-2 text-left">Category</div>
          <div className="col-span-2 text-center">Current Stock</div>
          <div className="col-span-2 text-center">Adjustment</div>
        </div>
      </div>
      
      {/* Product Cards */}
      <div className="space-y-2">
          {filteredProducts.map((product) => {
            const stock = userLocationId 
              ? product.inventory?.find(inv => parseInt(inv.location_id.toString()) === parseInt(userLocationId.toString()))?.stock || 0
              : product.total_stock || 0;
            
            const isSelected = selectedProducts.has(product.id);
            
            return (
              <div key={product.id}>
                {/* Main Product Row */}
                <div 
                  className={`grid grid-cols-12 gap-4 p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                    isSelected 
                      ? 'bg-neutral-700/30 border-neutral-500/30 shadow-lg shadow-neutral-400/5' 
                      : 'bg-neutral-800/30 border-neutral-700/50 hover:bg-neutral-700/40 hover:border-neutral-600/60'
                  }`}
                  onClick={(e) => onProductSelection(product, e)}
                >
                  {/* Product Name & Image */}
                  <div className="col-span-4 flex items-center gap-3">
                    {product.image && (
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-10 h-10 rounded object-cover flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="font-medium text-neutral-200 truncate" style={{ fontFamily: 'Tiempos, serif' }}>
                        {product.name}
                      </div>
                      {product.parent_id && (
                        <div className="text-xs text-neutral-500 truncate">
                          Variation of parent product
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* SKU */}
                  <div className="col-span-2 flex items-center">
                    <span className="text-neutral-400 text-sm font-mono truncate" style={{ fontFamily: 'Tiempos, serif' }}>
                      {product.sku || 'No SKU'}
                    </span>
                  </div>
                  
                  {/* Category */}
                  <div className="col-span-2 flex items-center">
                    <span className="text-neutral-400 text-sm truncate" style={{ fontFamily: 'Tiempos, serif' }}>
                      {product.categories?.[0]?.name || 'Uncategorized'}
                    </span>
                  </div>
                  
                  {/* Current Stock */}
                  <div className="col-span-2 flex items-center justify-center">
                    <span className={`text-sm font-medium ${
                      stock <= 0 ? 'text-red-400' : stock <= 5 ? 'text-yellow-400' : 'text-green-400'
                    }`} style={{ fontFamily: 'Tiempos, serif' }}>
                      {stock}
                    </span>
                  </div>
                  
                  {/* Adjustment Input */}
                  <div className="col-span-2 flex items-center justify-center">
                    {isRestockMode ? (
                      <div className="relative flex items-center">
                        {/* Decrease Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const currentValue = pendingAdjustments.get(`${product.id}`) || 0;
                            if (currentValue > 0) {
                              onSetAdjustmentValue?.(product.id, null, currentValue - 1);
                            }
                          }}
                          className="absolute left-0.5 z-10 w-5 h-5 text-neutral-400 hover:text-neutral-300 transition-colors opacity-60 hover:opacity-100 cursor-pointer flex items-center justify-center"
                          title="Decrease by 1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </button>
                        
                        <input
                          type="number"
                          placeholder="0"
                          className="w-20 px-6 py-1 bg-neutral-700 border border-neutral-600 rounded text-center text-sm text-white focus:outline-none focus:ring-1 focus:ring-neutral-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          style={{ fontFamily: 'Tiempos, serif' }}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                            onSetAdjustmentValue?.(product.id, null, value);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur();
                            }
                          }}
                          value={pendingAdjustments.get(`${product.id}`) || 0}
                        />
                        
                        {/* Increase Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const currentValue = pendingAdjustments.get(`${product.id}`) || 0;
                            onSetAdjustmentValue?.(product.id, null, currentValue + 1);
                          }}
                          className="absolute right-0.5 z-10 w-5 h-5 text-neutral-400 hover:text-neutral-300 transition-colors opacity-60 hover:opacity-100 cursor-pointer flex items-center justify-center"
                          title="Increase by 1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="relative flex items-center">
                        {/* Decrease Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onInventoryAdjustment?.(product.id, null, -1, 'Manual decrease');
                          }}
                          className="absolute left-0.5 z-10 w-5 h-5 text-neutral-400 hover:text-neutral-300 transition-colors opacity-60 hover:opacity-100 cursor-pointer flex items-center justify-center"
                          title="Decrease by 1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </button>
                        
                        <input
                          type="number"
                          placeholder="±0"
                          className={`w-20 px-6 py-1 bg-neutral-700 border border-neutral-600 rounded text-center text-sm focus:outline-none focus:ring-1 focus:ring-neutral-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                            (pendingAdjustments.get(`${product.id}`) || 0) > 0 
                              ? 'text-green-400' 
                              : (pendingAdjustments.get(`${product.id}`) || 0) < 0
                              ? 'text-red-400'
                              : 'text-white'
                          }`}
                          style={{ fontFamily: 'Tiempos, serif' }}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                            onSetAdjustmentValue?.(product.id, null, value);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur();
                            }
                          }}
                          value={pendingAdjustments.get(`${product.id}`) || 0}
                        />
                        
                        {/* Increase Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onInventoryAdjustment?.(product.id, null, 1, 'Manual increase');
                          }}
                          className="absolute right-0.5 z-10 w-5 h-5 text-neutral-400 hover:text-neutral-300 transition-colors opacity-60 hover:opacity-100 cursor-pointer flex items-center justify-center"
                          title="Increase by 1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Variants Rows */}
                {product.variants && product.variants.length > 0 && (
                  <div className="ml-8 mt-2 space-y-1">
                    {product.variants.map((variant) => {
                      const variantStock = userLocationId 
                        ? variant.inventory?.find(inv => parseInt(inv.location_id.toString()) === parseInt(userLocationId.toString()))?.quantity || 0
                        : variant.total_stock || 0;
                      
                      return (
                        <div 
                          key={variant.id}
                          className="grid grid-cols-12 gap-4 p-3 rounded border bg-neutral-800/20 border-neutral-700/30"
                        >
                          {/* Variant Name */}
                          <div className="col-span-4 flex items-center">
                            <div className="text-sm text-neutral-300 truncate pl-4" style={{ fontFamily: 'Tiempos, serif' }}>
                              ↳ {variant.name}
                            </div>
                          </div>
                          
                          {/* Variant SKU */}
                          <div className="col-span-2 flex items-center">
                            <span className="text-neutral-500 text-xs font-mono truncate" style={{ fontFamily: 'Tiempos, serif' }}>
                              {variant.sku || 'No SKU'}
                            </span>
                          </div>
                          
                          {/* Empty Category Column */}
                          <div className="col-span-2"></div>
                          
                          {/* Variant Stock */}
                          <div className="col-span-2 flex items-center justify-center">
                            <span className={`text-sm font-medium ${
                              variantStock <= 0 ? 'text-red-400' : variantStock <= 5 ? 'text-yellow-400' : 'text-green-400'
                            }`} style={{ fontFamily: 'Tiempos, serif' }}>
                              {variantStock}
                            </span>
                          </div>
                          
                          {/* Variant Adjustment Input */}
                          <div className="col-span-2 flex items-center justify-center">
                            {isRestockMode ? (
                              <input
                                type="number"
                                placeholder="Qty"
                                className="w-20 px-2 py-1 bg-neutral-700 border border-neutral-600 rounded text-center text-xs text-white focus:outline-none focus:ring-1 focus:ring-neutral-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                style={{ fontFamily: 'Tiempos, serif' }}
                                onChange={(e) => {
                                  const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                                  onSetAdjustmentValue?.(product.id, variant.id, value);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.currentTarget.blur();
                                  }
                                }}
                                value={pendingAdjustments.get(`${product.id}-${variant.id}`) || 0}
                              />
                            ) : (
                              <div className="relative flex items-center">
                                {/* Decrease Button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onInventoryAdjustment?.(product.id, variant.id, -1, 'Manual decrease');
                                  }}
                                  className="absolute left-0.5 z-10 w-4 h-4 text-neutral-400 hover:text-neutral-300 transition-colors opacity-60 hover:opacity-100 cursor-pointer flex items-center justify-center"
                                  title="Decrease by 1"
                                >
                                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                  </svg>
                                </button>
                                
                                <input
                                  type="number"
                                  placeholder="±0"
                                  className={`w-20 px-5 py-1 bg-neutral-700 border border-neutral-600 rounded text-center text-xs focus:outline-none focus:ring-1 focus:ring-neutral-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                    (pendingAdjustments.get(`${product.id}-${variant.id}`) || 0) > 0 
                                      ? 'text-green-400' 
                                      : (pendingAdjustments.get(`${product.id}-${variant.id}`) || 0) < 0
                                      ? 'text-red-400'
                                      : 'text-white'
                                  }`}
                                  style={{ fontFamily: 'Tiempos, serif' }}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value) || 0;
                                    onSetAdjustmentValue?.(product.id, variant.id, value);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.currentTarget.blur();
                                    }
                                  }}
                                  value={pendingAdjustments.get(`${product.id}-${variant.id}`) || 0}
                                />
                                
                                {/* Increase Button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onInventoryAdjustment?.(product.id, variant.id, 1, 'Manual increase');
                                  }}
                                  className="absolute right-0.5 z-10 w-4 h-4 text-neutral-400 hover:text-green-400 transition-colors opacity-60 hover:opacity-100 cursor-pointer flex items-center justify-center"
                                  title="Increase by 1"
                                >
                                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
    </div>
  );
};