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
    <div className="h-full overflow-auto">
      <table className="w-full">
        <thead className="sticky top-0 bg-neutral-900/95 backdrop-blur-sm z-10">
          <tr className="border-b border-white/[0.08]">
            <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">Product</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">SKU</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">Category</th>
            <th className="text-center py-3 px-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">Current Stock</th>
            <th className="text-center py-3 px-4 text-xs font-medium text-neutral-400 uppercase tracking-wider w-48">Adjustment</th>
            <th className="text-right py-3 px-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">Price</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.06]">
          {filteredProducts.map((product) => {
            const stock = userLocationId 
              ? product.inventory?.find(inv => parseInt(inv.location_id.toString()) === parseInt(userLocationId.toString()))?.stock || 0
              : product.total_stock || 0;
            
            const adjustmentKey = `${product.id}`;
            const currentAdjustment = pendingAdjustments.get(adjustmentKey) || 0;
            
            return (
              <React.Fragment key={product.id}>
                <tr 
                  className={`
                    transition-all duration-200 cursor-pointer
                    ${selectedProducts.has(product.id) 
                      ? 'bg-white/[0.08]' 
                      : 'hover:bg-white/[0.02]'
                    }
                  `}
                  onClick={(e) => onProductSelection(product, e)}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {product.image && (
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-neutral-200">{product.name}</div>
                        {product.has_variants && (
                          <div className="text-xs text-neutral-500">{product.variants?.length || 0} variants</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-neutral-400">{product.sku || '-'}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {product.categories?.slice(0, 2).map(cat => (
                        <span key={cat.id} className="text-xs px-2 py-0.5 bg-neutral-800 rounded text-neutral-400">
                          {cat.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-sm font-medium ${stock <= 5 ? 'text-red-400' : stock <= 20 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {product.blueprintPricing ? stock.toFixed(2) : Math.floor(stock)}
                    </span>
                  </td>
                  <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onInventoryAdjustment(product.id, null, product.blueprintPricing ? -0.1 : -1, 'Manual decrease');
                        }}
                        className="w-7 h-7 flex items-center justify-center text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-all"
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
                        className="w-20 h-7 text-sm text-center bg-neutral-800/50 border border-white/[0.08] rounded text-neutral-300 focus:border-white/[0.2] focus:outline-none placeholder:text-neutral-600"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onInventoryAdjustment(product.id, null, product.blueprintPricing ? 0.1 : 1, 'Manual increase');
                        }}
                        className="w-7 h-7 flex items-center justify-center text-neutral-500 hover:text-green-400 hover:bg-green-500/10 rounded transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right text-sm font-medium text-neutral-300">
                    ${parseFloat(product.regular_price || '0').toFixed(2)}
                  </td>
                </tr>
                {/* Variant Rows */}
                {product.has_variants && product.variants && product.variants.map((variant) => {
                  const variantStock = userLocationId 
                    ? variant.inventory?.find(inv => parseInt(inv.location_id.toString()) === parseInt(userLocationId.toString()))?.quantity || 0
                    : variant.total_stock || 0;
                  
                  const variantAdjustmentKey = `${product.id}-${variant.id}`;
                  const variantCurrentAdjustment = pendingAdjustments.get(variantAdjustmentKey) || 0;
                  
                      return (
                        <tr 
                          key={`${product.id}-${variant.id}`} 
                          className={`
                            transition-colors
                            ${selectedProducts.has(product.id)
                              ? 'bg-neutral-800/50'
                              : 'bg-neutral-900/30 hover:bg-white/[0.02]'
                            }
                          `}
                        >
                          <td className="py-2 px-4 pl-16">
                        <div className="text-sm text-neutral-400">↳ {variant.name}</div>
                      </td>
                      <td className="py-2 px-4 text-sm text-neutral-500">{variant.sku || '-'}</td>
                      <td className="py-2 px-4"></td>
                      <td className="py-2 px-4 text-center">
                        <span className={`text-sm ${variantStock <= 5 ? 'text-red-400' : variantStock <= 20 ? 'text-yellow-400' : 'text-green-400'}`}>
                          {product.blueprintPricing ? variantStock.toFixed(2) : Math.floor(variantStock)}
                        </span>
                      </td>
                      <td className="py-2 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onInventoryAdjustment(product.id, variant.id, product.blueprintPricing ? -0.1 : -1, 'Manual decrease');
                            }}
                            className="w-6 h-6 flex items-center justify-center text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-all"
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
                            className="w-20 h-6 text-xs text-center bg-neutral-800/50 border border-white/[0.08] rounded text-neutral-400 focus:border-white/[0.2] focus:outline-none placeholder:text-neutral-600"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onInventoryAdjustment(product.id, variant.id, product.blueprintPricing ? 0.1 : 1, 'Manual increase');
                            }}
                            className="w-6 h-6 flex items-center justify-center text-neutral-500 hover:text-green-400 hover:bg-green-500/10 rounded transition-all"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td className="py-2 px-4 text-right text-sm text-neutral-400">
                        ${parseFloat(variant.regular_price || '0').toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
