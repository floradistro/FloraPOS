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
  onCompleteSession?: () => Promise<void> | void;
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
        
        {/* Compact Session Form - Single Row Glass */}
        {(isAuditMode || isRestockMode) && (
          <div className="mb-4 bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-ios p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={sessionName}
                  onChange={(e) => onSessionNameChange?.(e.target.value)}
                  placeholder={`${isRestockMode ? 'Supplier' : 'Audit'} Name *`}
                  className="w-full bg-white/[0.02] backdrop-blur-sm rounded-ios px-4 py-2 text-body-sm font-tiempo font-medium text-white placeholder-neutral-500 focus:outline-none focus:bg-white/[0.04] focus:border-white/[0.1] border border-white/[0.06] transition-all duration-200"
                />
              </div>
              
              <div className="flex-1">
                <input
                  type="text"
                  value={sessionDescription}
                  onChange={(e) => onSessionDescriptionChange?.(e.target.value)}
                  placeholder="Description (Optional)"
                  className="w-full bg-white/[0.02] backdrop-blur-sm rounded-ios px-4 py-2 text-body-sm font-tiempo text-white placeholder-neutral-500 focus:outline-none focus:bg-white/[0.04] focus:border-white/[0.1] border border-white/[0.06] transition-all duration-200"
                />
              </div>
              
              {hasAdjustments && (
                <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.02] rounded-ios border border-white/[0.05]">
                  <span className="text-caption-2 font-tiempo text-neutral-500">Pending</span>
                  <span className="text-body-sm font-mono font-semibold text-white">{pendingAdjustments.size}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Header - Minimal */}
        <div className="mb-4">
          <div className="grid grid-cols-12 gap-6 px-6 py-2">
            <div className="col-span-4 text-caption-2 font-tiempo font-medium text-neutral-500 uppercase tracking-wider">
              Product
            </div>
            <div className="col-span-2 text-caption-2 font-tiempo font-medium text-neutral-500 uppercase tracking-wider">
              SKU
            </div>
            <div className="col-span-2 text-caption-2 font-tiempo font-medium text-neutral-500 uppercase tracking-wider">
              Category
            </div>
            <div className="col-span-2 text-center text-caption-2 font-tiempo font-medium text-neutral-500 uppercase tracking-wider">
              Stock
            </div>
            <div className="col-span-2 text-center text-caption-2 font-tiempo font-medium text-neutral-500 uppercase tracking-wider">
              {isRestockMode ? 'Qty' : 'Adjust'}
            </div>
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
                {/* Main Product Row - Glass Style */}
                <div 
                  className={`grid grid-cols-12 gap-6 px-6 py-4 rounded-ios cursor-pointer transition-all duration-200 backdrop-blur-sm ${
                    hasAdjustment
                      ? 'bg-white/[0.05] border border-white/[0.1] shadow-sm'
                      : isSelected 
                        ? 'bg-white/[0.03] border border-white/[0.08]' 
                        : 'bg-white/[0.015] border border-white/[0.05] hover:bg-white/[0.03] hover:border-white/[0.08]'
                  }`}
                  onClick={(e) => onProductSelection(product, e)}
                >
                  {/* Product Name & Image */}
                  <div className="col-span-4 flex items-center gap-3">
                    {product.image && (
                      <div className="w-12 h-12 rounded-ios bg-white/[0.02] backdrop-blur-sm border border-white/[0.06] overflow-hidden flex-shrink-0">
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-full h-full object-contain p-1"
                        />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-body font-tiempo font-medium text-white truncate">
                        {product.name}
                      </div>
                      {product.parent_id && (
                        <div className="text-caption-1 font-tiempo text-neutral-500 truncate">
                          Variation of parent
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* SKU */}
                  <div className="col-span-2 flex items-center">
                    <span className="text-caption-1 font-mono text-neutral-500 truncate">
                      {product.sku || '—'}
                    </span>
                  </div>
                  
                  {/* Category */}
                  <div className="col-span-2 flex items-center">
                    <span className="text-caption-1 font-tiempo text-neutral-400 truncate">
                      {product.categories?.[0]?.name || '—'}
                    </span>
                  </div>
                  
                  {/* Current Stock */}
                  <div className="col-span-2 flex items-center justify-center">
                    <span className={`text-body font-mono font-semibold ${
                      stock <= 0 ? 'text-neutral-600' : stock <= 5 ? 'text-neutral-400' : 'text-white'
                    }`}>
                      {stock}
                    </span>
                  </div>
                  
                  {/* Adjustment Input - Premium Style with Clean Controls */}
                  <div className="col-span-2 flex items-center justify-center">
                    <div className="flex items-center gap-2">
                      {/* Decrease Button - Glass Circle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isRestockMode) {
                            const currentValue = pendingAdjustments.get(`${product.id}`) || 0;
                            if (currentValue > 0) {
                              onSetAdjustmentValue?.(product.id, null, currentValue - 1);
                            }
                          } else {
                            onInventoryAdjustment?.(product.id, null, -1, 'Manual decrease');
                          }
                        }}
                        className="w-9 h-9 rounded-full bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] text-neutral-400 hover:text-white transition-all duration-200 flex items-center justify-center active:scale-95 shadow-sm"
                        title="Decrease by 1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                        </svg>
                      </button>
                      
                      <input
                        type="number"
                        placeholder="0"
                        className={`w-24 px-4 py-2.5 rounded-ios text-center text-headline font-mono font-semibold transition-all duration-200 focus:outline-none backdrop-blur-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                          (pendingAdjustments.get(`${product.id}`) || 0) !== 0
                            ? 'bg-white text-black shadow-md border border-white/[0.2]'
                            : 'bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] focus:border-white/[0.15] text-white'
                        }`}
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
                      
                      {/* Increase Button - Glass Circle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isRestockMode) {
                            const currentValue = pendingAdjustments.get(`${product.id}`) || 0;
                            onSetAdjustmentValue?.(product.id, null, currentValue + 1);
                          } else {
                            onInventoryAdjustment?.(product.id, null, 1, 'Manual increase');
                          }
                        }}
                        className="w-9 h-9 rounded-full bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] text-neutral-400 hover:text-white transition-all duration-200 flex items-center justify-center active:scale-95 shadow-sm"
                        title="Increase by 1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Variants Rows */}
                {product.variants && product.variants.length > 0 && (
                  <div className="ml-12 mt-2 space-y-1.5">
                    {product.variants.map((variant) => {
                      const variantStock = userLocationId 
                        ? variant.inventory?.find(inv => parseInt(inv.location_id.toString()) === parseInt(userLocationId.toString()))?.quantity || 0
                        : variant.total_stock || 0;
                      
                      const variantAdjustmentValue = pendingAdjustments.get(`${product.id}-${variant.id}`) || 0;
                      const hasVariantAdjustment = variantAdjustmentValue !== 0;
                      
                      return (
                        <div 
                          key={variant.id}
                          className={`grid grid-cols-12 gap-6 px-6 py-3 rounded-ios backdrop-blur-sm transition-all duration-200 ${
                            hasVariantAdjustment
                              ? 'bg-white/[0.04] border border-white/[0.08]'
                              : 'bg-white/[0.01] border border-white/[0.04]'
                          }`}
                        >
                          {/* Variant Name */}
                          <div className="col-span-4 flex items-center">
                            <div className="text-body-sm font-tiempo font-medium text-neutral-400 truncate pl-6">
                              {variant.name}
                            </div>
                          </div>
                          
                          {/* Variant SKU */}
                          <div className="col-span-2 flex items-center">
                            <span className="text-caption-1 font-mono text-neutral-500 truncate">
                              {variant.sku || '—'}
                            </span>
                          </div>
                          
                          {/* Empty Category Column */}
                          <div className="col-span-2"></div>
                          
                          {/* Variant Stock */}
                          <div className="col-span-2 flex items-center justify-center">
                            <span className={`text-body-sm font-mono font-semibold ${
                              variantStock <= 0 ? 'text-neutral-600' : variantStock <= 5 ? 'text-neutral-400' : 'text-white'
                            }`}>
                              {variantStock}
                            </span>
                          </div>
                          
                          {/* Variant Adjustment Input - Premium Style with Clean Controls */}
                          <div className="col-span-2 flex items-center justify-center">
                            <div className="flex items-center gap-2">
                              {/* Decrease Button - Glass */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isRestockMode) {
                                    const currentValue = pendingAdjustments.get(`${product.id}-${variant.id}`) || 0;
                                    if (currentValue > 0) {
                                      onSetAdjustmentValue?.(product.id, variant.id, currentValue - 1);
                                    }
                                  } else {
                                    onInventoryAdjustment?.(product.id, variant.id, -1, 'Manual decrease');
                                  }
                                }}
                                className="w-7 h-7 rounded-full bg-white/[0.02] backdrop-blur-sm border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1] text-neutral-400 hover:text-white transition-all duration-200 flex items-center justify-center active:scale-95"
                                title="Decrease by 1"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                                </svg>
                              </button>
                              
                              <input
                                type="number"
                                placeholder="0"
                                className={`w-16 px-2 py-1.5 rounded-ios text-center text-body-sm font-mono font-semibold transition-all duration-200 focus:outline-none backdrop-blur-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                  (pendingAdjustments.get(`${product.id}-${variant.id}`) || 0) !== 0 
                                    ? 'bg-white text-black shadow-sm'
                                    : 'bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] focus:border-white/[0.1] text-white'
                                }`}
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
                              
                              {/* Increase Button - Glass */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isRestockMode) {
                                    const currentValue = pendingAdjustments.get(`${product.id}-${variant.id}`) || 0;
                                    onSetAdjustmentValue?.(product.id, variant.id, currentValue + 1);
                                  } else {
                                    onInventoryAdjustment?.(product.id, variant.id, 1, 'Manual increase');
                                  }
                                }}
                                className="w-7 h-7 rounded-full bg-white/[0.02] backdrop-blur-sm border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1] text-neutral-400 hover:text-white transition-all duration-200 flex items-center justify-center active:scale-95"
                                title="Increase by 1"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                              </button>
                            </div>
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
      
      {/* Complete Button - Minimal Floating */}
      {(isAuditMode || isRestockMode) && hasAdjustments && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={async () => {
              if (onCompleteSession) {
                console.log(`🚀 Starting ${isRestockMode ? 'Purchase Order' : 'Audit'} completion...`);
                try {
                  await onCompleteSession();
                  console.log(`✅ ${isRestockMode ? 'Purchase Order' : 'Audit'} completed successfully`);
                } catch (error) {
                  console.error(`❌ Error completing ${isRestockMode ? 'Purchase Order' : 'Audit'}:`, error);
                }
              } else {
                console.error('❌ onCompleteSession is not defined!');
              }
            }}
            disabled={!canComplete || isApplying}
            className={`px-8 py-3.5 rounded-ios-lg text-body font-tiempo font-semibold transition-all duration-200 backdrop-blur-xl ${
              canComplete && !isApplying
                ? 'bg-white hover:bg-neutral-100 text-black active:scale-95 shadow-2xl'
                : 'bg-white/[0.05] text-neutral-600 cursor-not-allowed opacity-40 border border-white/[0.08]'
            }`}
          >
            {isApplying ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Complete {isRestockMode ? 'PO' : 'Audit'}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};