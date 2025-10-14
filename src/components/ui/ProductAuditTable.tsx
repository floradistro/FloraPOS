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
  // Inline audit/restock form
  sessionName?: string;
  sessionDescription?: string;
  onSessionNameChange?: (name: string) => void;
  onSessionDescriptionChange?: (description: string) => void;
  onCompleteSession?: () => void;
  isApplying?: boolean;
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
  onSortAlphabeticallyChange,
  sessionName = '',
  sessionDescription = '',
  onSessionNameChange,
  onSessionDescriptionChange,
  onCompleteSession,
  isApplying = false
}) => {
  const hasAdjustments = pendingAdjustments && pendingAdjustments.size > 0;
  const canComplete = hasAdjustments && sessionName.trim().length > 0;

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto p-4">
        
        {/* Inline Session Form */}
        {(isAuditMode || isRestockMode) && (
          <div className="mb-6 bg-white/[0.02] backdrop-blur-xl rounded-2xl p-6 border border-white/[0.06]">
            <div className="space-y-4">
              <input
                type="text"
                value={sessionName}
                onChange={(e) => onSessionNameChange?.(e.target.value)}
                placeholder={`${isRestockMode ? 'Purchase Order' : 'Audit'} Name (Required)`}
                className="w-full bg-white/5 hover:bg-white/10 rounded-xl px-4 py-3 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:bg-white/10 transition-all duration-200"
                style={{ fontFamily: 'Tiempos, serif' }}
              />
              <textarea
                value={sessionDescription}
                onChange={(e) => onSessionDescriptionChange?.(e.target.value)}
                placeholder="Description (Optional)"
                rows={2}
                className="w-full bg-white/5 hover:bg-white/10 rounded-xl px-4 py-3 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:bg-white/10 transition-all duration-200 resize-none"
                style={{ fontFamily: 'Tiempos, serif' }}
              />
              {hasAdjustments && (
                <div className="text-xs text-neutral-500" style={{ fontFamily: 'Tiempos, serif' }}>
                  {pendingAdjustments.size} {pendingAdjustments.size === 1 ? 'adjustment' : 'adjustments'} pending
                </div>
              )}
            </div>
          </div>
        )}

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
            
            const hasAdjustment = pendingAdjustments.has(`${product.id}`) || 
              (product.has_variants && product.variants?.some(v => pendingAdjustments.has(`${product.id}-${v.id}`)));
            const adjustmentValue = pendingAdjustments.get(`${product.id}`) || 0;
            
            return (
              <div key={product.id}>
                {/* Main Product Row */}
                <div 
                  className={`grid grid-cols-12 gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                    hasAdjustment
                      ? adjustmentValue > 0
                        ? 'bg-purple-500/5 border-purple-500/20 hover:bg-purple-500/10 hover:border-purple-500/30'
                        : adjustmentValue < 0
                          ? 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10 hover:border-red-500/30'
                          : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.10]'
                      : isSelected 
                        ? 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.04]' 
                        : 'bg-white/[0.01] border-white/[0.04] hover:bg-white/[0.03] hover:border-white/[0.08]'
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
                          className={`w-20 px-6 py-1.5 rounded-xl text-center text-sm transition-all duration-200 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                            (pendingAdjustments.get(`${product.id}`) || 0) > 0
                              ? 'bg-purple-500/10 border border-purple-500/30 text-purple-400 font-medium'
                              : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-neutral-300'
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
                          className={`w-20 px-6 py-1.5 rounded-xl text-center text-sm transition-all duration-200 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                            (pendingAdjustments.get(`${product.id}`) || 0) > 0 
                              ? 'bg-purple-500/10 border border-purple-500/30 text-purple-400 font-medium' 
                              : (pendingAdjustments.get(`${product.id}`) || 0) < 0
                              ? 'bg-red-500/10 border border-red-500/30 text-red-400 font-medium'
                              : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-neutral-300'
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
                      
                      const variantAdjustmentValue = pendingAdjustments.get(`${product.id}-${variant.id}`) || 0;
                      const hasVariantAdjustment = variantAdjustmentValue !== 0;
                      
                      return (
                        <div 
                          key={variant.id}
                          className={`grid grid-cols-12 gap-4 p-3 rounded-xl border transition-all duration-200 ${
                            hasVariantAdjustment
                              ? variantAdjustmentValue > 0
                                ? 'bg-purple-500/5 border-purple-500/20'
                                : 'bg-red-500/5 border-red-500/20'
                              : 'bg-white/[0.01] border-white/[0.04]'
                          }`}
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
                                  className={`w-20 px-5 py-1.5 rounded-xl text-center text-xs transition-all duration-200 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                    (pendingAdjustments.get(`${product.id}-${variant.id}`) || 0) > 0 
                                      ? 'bg-purple-500/10 border border-purple-500/30 text-purple-400 font-medium' 
                                      : (pendingAdjustments.get(`${product.id}-${variant.id}`) || 0) < 0
                                      ? 'bg-red-500/10 border border-red-500/30 text-red-400 font-medium'
                                      : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-neutral-300'
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
      
      {/* Complete Button Footer */}
      {(isAuditMode || isRestockMode) && (
        <div className="flex-shrink-0 border-t border-white/[0.06] bg-black/20 backdrop-blur-xl p-4">
          <button
            onClick={onCompleteSession}
            disabled={!canComplete || isApplying}
            className={`w-full py-4 rounded-xl text-sm font-medium transition-all duration-200 ${
              canComplete && !isApplying
                ? 'bg-white/10 hover:bg-white/15 text-white shadow-lg shadow-white/5'
                : 'bg-white/[0.02] text-neutral-600 cursor-not-allowed'
            }`}
            style={{ fontFamily: 'Tiempos, serif' }}
          >
            {isApplying ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : canComplete ? (
              `Complete ${isRestockMode ? 'Purchase Order' : 'Audit'}`
            ) : (
              `${!hasAdjustments ? 'Add adjustments to continue' : 'Enter a name to continue'}`
            )}
          </button>
        </div>
      )}
    </div>
  );
};