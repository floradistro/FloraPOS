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
  onSetAdjustmentValue
}) => {
  return (
    <div className="h-full overflow-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-medium text-neutral-400 uppercase tracking-wider" style={{ fontFamily: 'Tiempos, serif' }}>
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
            
            const adjustmentKey = `${product.id}`;
            const currentAdjustment = pendingAdjustments.get(adjustmentKey) || 0;
            const isSelected = selectedProducts.has(product.id);
            
            return (
              <React.Fragment key={product.id}>
                {/* Main Product Card */}
                <div 
                  className={`rounded-lg overflow-hidden p-2 cursor-pointer transition-all duration-300 ease-out ${
                    isSelected
                      ? 'border-2 border-white/30 bg-gradient-to-br from-neutral-500/40 to-neutral-600/80 shadow-lg shadow-white/5 transform scale-[1.02]'
                      : 'border border-white/[0.06] bg-transparent hover:border-white/[0.12] hover:bg-neutral-600/5 hover:-translate-y-1 hover:shadow-lg hover:shadow-neutral-700/20'
                  }`}
                  onClick={(e) => onProductSelection(product, e)}
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Product Info */}
                    <div className="col-span-4 flex items-center gap-4">
                      {/* Product Image */}
                      <div className="w-12 h-12 relative overflow-hidden flex-shrink-0">
                        {product.image ? (
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="w-full h-full object-contain rounded"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-neutral-800/30 rounded">
                            <svg className="w-6 h-6 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-neutral-200 font-normal text-base mb-1 truncate" style={{ fontFamily: 'Tiempos, serif', textShadow: '0 1px 3px rgba(0, 0, 0, 0.8), 0 0 8px rgba(0, 0, 0, 0.3)' }}>
                          {product.name}
                        </h3>
                        {product.has_variants && (
                          <p className="text-xs text-neutral-500">{product.variants?.length || 0} variants</p>
                        )}
                      </div>
                    </div>

                    {/* SKU */}
                    <div className="col-span-2">
                      <span className="text-sm text-neutral-400" style={{ fontFamily: 'Tiempos, serif' }}>
                        {product.sku || '-'}
                      </span>
                    </div>

                    {/* Category */}
                    <div className="col-span-2">
                      <div className="flex flex-wrap gap-1">
                        {product.categories?.slice(0, 1).map(cat => (
                          <span key={cat.id} className="text-xs px-2 py-1 bg-neutral-800/50 border border-neutral-600/30 rounded text-neutral-400" style={{ fontFamily: 'Tiempos, serif' }}>
                            {cat.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Current Stock */}
                    <div className="col-span-2 text-center">
                      <span className="text-sm font-medium text-neutral-300" style={{ fontFamily: 'Tiempos, serif' }}>
                        {product.blueprintPricing ? stock.toFixed(2) : Math.floor(stock)}
                      </span>
                    </div>

                    {/* Adjustment Controls */}
                    <div className="col-span-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onInventoryAdjustment(product.id, null, product.blueprintPricing ? -0.1 : -1, 'Manual decrease');
                          }}
                          className="w-8 h-8 flex items-center justify-center text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg border border-transparent hover:border-red-500/20 transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </button>
                        <input
                          type="number"
                          step={product.blueprintPricing ? "0.1" : "1"}
                          value={currentAdjustment || ''}
                          onChange={(e) => {
                            const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                            if (!isNaN(value) && onSetAdjustmentValue) {
                              onSetAdjustmentValue(product.id, null, value);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur();
                            }
                          }}
                          placeholder="0"
                          className="w-24 h-8 text-sm text-center bg-transparent border border-neutral-400 rounded-lg text-neutral-200 focus:border-neutral-300 focus:outline-none placeholder:text-neutral-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          style={{ fontFamily: 'Tiempos, serif' }}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onInventoryAdjustment(product.id, null, product.blueprintPricing ? 0.1 : 1, 'Manual increase');
                          }}
                          className="w-8 h-8 flex items-center justify-center text-neutral-500 hover:text-green-400 hover:bg-green-500/10 rounded-lg border border-transparent hover:border-green-500/20 transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Variant Cards */}
                {product.has_variants && product.variants && (
                  <div className="ml-6 mt-1 space-y-1">
                    {product.variants.map((variant) => {
                      const variantStock = userLocationId 
                        ? variant.inventory?.find(inv => parseInt(inv.location_id.toString()) === parseInt(userLocationId.toString()))?.quantity || 0
                        : variant.total_stock || 0;
                      
                      const variantAdjustmentKey = `${product.id}-${variant.id}`;
                      const variantCurrentAdjustment = pendingAdjustments.get(variantAdjustmentKey) || 0;
                      
                      return (
                        <div 
                          key={`${product.id}-${variant.id}`} 
                          className={`rounded-lg p-2 transition-all duration-200 ${
                            isSelected
                              ? 'bg-neutral-800/30 border border-white/20'
                              : 'bg-neutral-900/20 border border-neutral-600/20 hover:bg-neutral-800/20'
                          }`}
                        >
                          <div className="grid grid-cols-12 gap-4 items-center">
                            {/* Variant Info */}
                            <div className="col-span-4 flex items-center gap-2">
                              <svg className="w-3 h-3 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                              <span className="text-sm text-neutral-300" style={{ fontFamily: 'Tiempos, serif' }}>
                                {variant.name}
                              </span>
                            </div>

                            {/* Variant SKU */}
                            <div className="col-span-2">
                              <span className="text-xs text-neutral-500" style={{ fontFamily: 'Tiempos, serif' }}>
                                {variant.sku || '-'}
                              </span>
                            </div>

                            {/* Empty Category Column */}
                            <div className="col-span-2"></div>

                            {/* Variant Stock */}
                            <div className="col-span-2 text-center">
                              <span className="text-sm font-medium text-neutral-300" style={{ fontFamily: 'Tiempos, serif' }}>
                                {product.blueprintPricing ? variantStock.toFixed(2) : Math.floor(variantStock)}
                              </span>
                            </div>

                            {/* Variant Adjustment Controls */}
                            <div className="col-span-2" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onInventoryAdjustment(product.id, variant.id, product.blueprintPricing ? -0.1 : -1, 'Manual decrease');
                                  }}
                                  className="w-7 h-7 flex items-center justify-center text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg border border-transparent hover:border-red-500/20 transition-all"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                  </svg>
                                </button>
                                <input
                                  type="number"
                                  step={product.blueprintPricing ? "0.1" : "1"}
                                  value={variantCurrentAdjustment || ''}
                                  onChange={(e) => {
                                    const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                    if (!isNaN(value) && onSetAdjustmentValue) {
                                      onSetAdjustmentValue(product.id, variant.id, value);
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.currentTarget.blur();
                                    }
                                  }}
                                  placeholder="0"
                                  className="w-20 h-7 text-xs text-center bg-transparent border border-neutral-400 rounded-lg text-neutral-300 focus:border-neutral-300 focus:outline-none placeholder:text-neutral-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  style={{ fontFamily: 'Tiempos, serif' }}
                                />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onInventoryAdjustment(product.id, variant.id, product.blueprintPricing ? 0.1 : 1, 'Manual increase');
                                  }}
                                  className="w-7 h-7 flex items-center justify-center text-neutral-500 hover:text-green-400 hover:bg-green-500/10 rounded-lg border border-transparent hover:border-green-500/20 transition-all"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </React.Fragment>
            );
          })}
      </div>
    </div>
  );
};
