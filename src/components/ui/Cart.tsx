'use client';

import React, { useState } from 'react';
import Image from 'next/image';

import { WordPressUser } from '../../services/users-service';
import { CartItem } from '../../types';
import { CATEGORY_DISPLAY_NAMES } from '../../constants';
import { UnifiedPopout } from './UnifiedPopout';

interface CartProps {
  items?: CartItem[];
  onUpdateQuantity?: (id: string, quantity: number) => void;
  onRemoveItem?: (id: string) => void;
  onClearCart?: () => void;
  onCheckout?: (selectedCustomer?: WordPressUser | null) => void;
  selectedCustomer?: WordPressUser | null;
  onCustomerSelect?: (customer: WordPressUser | null) => void;
  isProductsLoading?: boolean;
  isAuditMode?: boolean;
  onApplyAdjustments?: (reason?: string) => void;
  onUpdateAdjustment?: (id: string, adjustmentAmount: number) => void;
  onOpenCustomerSelector?: () => void;
  isCheckoutLoading?: boolean;
  onUpdatePriceOverride?: (id: string, overridePrice: number | undefined) => void;
  onUpdateDiscountPercentage?: (id: string, discountPercentage: number | undefined) => void;
}

const CartComponent = function Cart({ 
  items = [], 
  onUpdateQuantity,
  onRemoveItem, 
  onClearCart, 
  onCheckout,
  selectedCustomer,
  onCustomerSelect,
  isProductsLoading = false,
  isAuditMode = false,
  onApplyAdjustments,
  onUpdateAdjustment,
  onOpenCustomerSelector,
  isCheckoutLoading = false,
  onUpdatePriceOverride,
  onUpdateDiscountPercentage
}: CartProps) {

  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);
  const [editingPriceItemId, setEditingPriceItemId] = useState<string | null>(null);
  const [editingDiscountItemId, setEditingDiscountItemId] = useState<string | null>(null);
  
  // Calculate total with overrides and discounts
  const total = items.filter(item => !item.is_adjustment).reduce((sum, item) => {
    let finalPrice = item.override_price !== undefined ? item.override_price : item.price;
    if (item.discount_percentage !== undefined && item.discount_percentage > 0) {
      finalPrice = finalPrice * (1 - item.discount_percentage / 100);
    }
    return sum + (finalPrice * item.quantity);
  }, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const adjustmentCount = items.filter(item => item.is_adjustment).length;

  return (
    <div className="w-full bg-gradient-to-br from-neutral-900/40 via-neutral-800/30 to-neutral-900/40 backdrop-blur-xl flex flex-col h-full border-l border-white/[0.08] shadow-2xl">
      {/* Cart Items */}
      <div className="flex-1 overflow-hidden">
        {isProductsLoading ? (
          // Show nothing while products are loading
          <div className="h-full"></div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-10 text-center">
            <div className="w-40 h-40 flex items-center justify-center mb-6 relative">
              <Image 
                src="/logo123.png" 
                alt="Flora POS Logo" 
                width={160}
                height={160}
                className="object-contain opacity-30 transition-all duration-500"
                style={{
                  animation: 'subtle-float 3s ease-in-out infinite'
                }}
                priority
              />
            </div>
            
            {/* Only show messages in audit mode */}
            {isAuditMode && (
              <>
                <h3 className="text-neutral-300 text-lg font-medium mb-3" style={{ fontFamily: 'Tiempo, serif' }}>
                  No adjustments pending
                </h3>
                <p className="text-base text-neutral-500 mb-8" style={{ fontFamily: 'Tiempo, serif' }}>
                  Make inventory adjustments to see them here
                </p>
              </>
            )}
            
            {/* Add Customer Button - Only show in normal mode */}
            {!isAuditMode && (
              <button
                onClick={() => {
                  onOpenCustomerSelector?.();
                }}
                className="px-6 py-3 text-base bg-white/[0.03] hover:bg-white/[0.08] backdrop-blur-md border border-neutral-500/40 hover:border-neutral-400/60 text-neutral-300 hover:text-white rounded-xl transition-all duration-300 ease-out mt-6 shadow-lg"
              >
                Add Customer
              </button>
            )}

            {/* Custom CSS animations */}
            <style jsx>{`
              @keyframes subtle-float {
                0%, 100% { 
                  transform: translateY(0px) scale(1);
                  opacity: 0.3;
                }
                50% { 
                  transform: translateY(-2px) scale(1.02);
                  opacity: 0.4;
                }
              }
              
              @keyframes fade-in-up {
                0% {
                  opacity: 0;
                  transform: translateY(20px);
                }
                100% {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
            `}</style>
          </div>
        ) : (
          <div className="h-full overflow-y-auto relative scrollbar-thin scrollbar-thumb-neutral-600/50 scrollbar-track-transparent hover:scrollbar-thumb-neutral-500/50">
            {/* Loading overlay during checkout */}
            {isCheckoutLoading && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-10 rounded-lg">
                <div className="flex flex-col items-center gap-4">
                  <img src="/logo123.png" alt="Flora Logo" className="w-12 h-12 animate-pulse" />
                </div>
              </div>
            )}
            <div className="gap-3 pt-3 px-3 pb-3 flex flex-col">
              {items.map((item) => (
                <div key={item.id} className="bg-white/[0.02] hover:bg-white/[0.06] backdrop-blur-lg border border-white/[0.1] hover:border-white/[0.2] rounded-xl p-3 relative transition-all duration-300 ease-out shadow-lg hover:shadow-xl">
                  {/* Header Row: Image, Name, Remove Button */}
                  <div className="flex items-start gap-3 mb-3">
                    {/* Product Image */}
                    <div className="w-14 h-14 relative overflow-hidden flex-shrink-0 rounded-lg ring-1 ring-white/10 hover:ring-white/20 transition-all">
                      {item.image ? (
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-neutral-700/40">
                          <Image 
                            src="/logo123.png" 
                            alt="Flora POS Logo" 
                            width={56}
                            height={56}
                            className="object-contain opacity-25"
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* Product Name, Category, and Price */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-semibold text-neutral-200 mb-1.5 leading-tight" style={{ fontFamily: 'Tiempos, serif', textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)' }}>
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {item.category && (
                          <span className="text-xs text-neutral-400 bg-neutral-600/30 backdrop-blur-sm px-2 py-0.5 rounded-full">
                            {CATEGORY_DISPLAY_NAMES[item.category] || item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                          </span>
                        )}
                        <span className="text-sm text-neutral-400 font-medium">${item.price.toFixed(2)}</span>
                      </div>
                      {/* Pricing tier information */}
                      {item.pricing_tier && (
                        <div className="text-xs text-neutral-500">
                          <span className="text-neutral-400 font-medium">{item.pricing_tier.tier_label}</span>
                          {item.pricing_tier.conversion_ratio && (
                            <span className="ml-2 text-neutral-500">
                              ({item.pricing_tier.conversion_ratio.output_amount} {item.pricing_tier.conversion_ratio.output_unit})
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => onRemoveItem?.(item.id)}
                      className="w-8 h-8 bg-transparent hover:bg-red-600/50 border border-white/10 hover:border-red-500/50 flex items-center justify-center transition-all duration-300 ease-out flex-shrink-0 rounded-lg"
                      title="Remove item"
                    >
                      <svg className="w-4 h-4 text-neutral-400 hover:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Controls Row */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    {item.is_adjustment ? (
                      /* Adjustment Item Display */
                      <div className="flex items-center gap-3 flex-1">
                        {isAuditMode && onUpdateAdjustment ? (
                          /* Adjustment Controls in Audit Mode */
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                const currentAmount = item.adjustment_amount || 0;
                                onUpdateAdjustment(item.id, currentAmount - 1);
                              }}
                              className="w-7 h-7 bg-transparent hover:bg-red-600/50 border border-white/10 hover:border-red-500/50 flex items-center justify-center transition-all duration-200 rounded-lg"
                            >
                              <svg className="w-3.5 h-3.5 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            </button>
                            <input
                              type="number"
                              value={item.adjustment_amount || 0}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value) || 0;
                                onUpdateAdjustment(item.id, value);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') e.currentTarget.blur();
                              }}
                              className={`w-16 h-7 text-sm text-center bg-white/[0.03] border border-white/10 rounded-lg font-semibold focus:bg-neutral-600/90 focus:border-neutral-300 focus:outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                item.adjustment_amount && item.adjustment_amount > 0 ? 'text-green-400' : 
                                item.adjustment_amount && item.adjustment_amount < 0 ? 'text-red-400' : 'text-neutral-300'
                              }`}
                            />
                            <button
                              onClick={() => {
                                const currentAmount = item.adjustment_amount || 0;
                                onUpdateAdjustment(item.id, currentAmount + 1);
                              }}
                              className="w-7 h-7 bg-transparent hover:bg-green-600/50 border border-white/10 hover:border-green-500/50 flex items-center justify-center transition-all duration-200 rounded-lg"
                            >
                              <svg className="w-3.5 h-3.5 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <span className={`text-base font-semibold ${item.adjustment_amount && item.adjustment_amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {item.adjustment_amount && item.adjustment_amount > 0 ? '+' : ''}{item.adjustment_amount || 0}
                          </span>
                        )}
                        <span className="text-xs text-neutral-400 bg-neutral-600/30 px-2 py-0.5 rounded-full">Adjustment</span>
                      </div>
                    ) : (
                      /* Normal Cart Item Display */
                      <>
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onUpdateQuantity?.(item.id, Math.max(0, item.quantity - 1))}
                            className="w-7 h-7 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 flex items-center justify-center transition-all duration-200 rounded-lg"
                          >
                            <svg className="w-3.5 h-3.5 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </button>
                          <span className="text-base text-neutral-200 min-w-[1.75rem] text-center font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity?.(item.id, item.quantity + 1)}
                            className="w-7 h-7 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 flex items-center justify-center transition-all duration-200 rounded-lg"
                          >
                            <svg className="w-3.5 h-3.5 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </button>
                        </div>
                        
                        {/* Price Override */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-neutral-500">$</span>
                          {editingPriceItemId === item.id ? (
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              defaultValue={item.override_price ?? item.price}
                              onBlur={(e) => {
                                const value = parseFloat(e.target.value);
                                if (!isNaN(value) && value >= 0) {
                                  onUpdatePriceOverride?.(item.id, value === item.price ? undefined : value);
                                }
                                setEditingPriceItemId(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') e.currentTarget.blur();
                              }}
                              className="w-16 h-7 text-sm text-center bg-white/[0.03] border border-white/10 rounded-lg text-neutral-200 focus:bg-neutral-600/90 focus:border-neutral-300 focus:outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              autoFocus
                            />
                          ) : (
                            <button
                              onClick={() => setEditingPriceItemId(item.id)}
                              className={`text-sm px-2 py-0.5 rounded border border-white/10 hover:border-white/20 transition-all font-medium ${
                                item.override_price !== undefined ? 'text-green-400 border-green-400/40 bg-green-400/10' : 'text-neutral-300'
                              }`}
                            >
                              {(item.override_price ?? item.price).toFixed(2)}
                            </button>
                          )}
                        </div>
                        
                        {/* Discount */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-neutral-500">%</span>
                          {editingDiscountItemId === item.id ? (
                            <input
                              type="number"
                              step="1"
                              min="0"
                              max="100"
                              defaultValue={item.discount_percentage ?? 0}
                              onBlur={(e) => {
                                const value = parseFloat(e.target.value);
                                if (!isNaN(value) && value >= 0 && value <= 100) {
                                  onUpdateDiscountPercentage?.(item.id, value === 0 ? undefined : value);
                                }
                                setEditingDiscountItemId(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') e.currentTarget.blur();
                              }}
                              className="w-12 h-7 text-sm text-center bg-white/[0.03] border border-white/10 rounded-lg text-neutral-200 focus:bg-neutral-600/90 focus:border-neutral-300 focus:outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              autoFocus
                            />
                          ) : (
                            <button
                              onClick={() => setEditingDiscountItemId(item.id)}
                              className={`text-sm px-2 py-0.5 rounded border border-white/10 hover:border-white/20 transition-all font-medium ${
                                item.discount_percentage ? 'text-orange-400 border-orange-400/40 bg-orange-400/10' : 'text-neutral-300'
                              }`}
                            >
                              {item.discount_percentage ?? 0}
                            </button>
                          )}
                        </div>
                        
                        {/* Subtotal */}
                        <span className="text-base font-bold text-neutral-100 ml-auto">
                          ${(() => {
                            let finalPrice = item.override_price !== undefined ? item.override_price : item.price;
                            if (item.discount_percentage !== undefined && item.discount_percentage > 0) {
                              finalPrice = finalPrice * (1 - item.discount_percentage / 100);
                            }
                            return (finalPrice * item.quantity).toFixed(2);
                          })()}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {items.length > 0 && (
        <div className="pt-4 px-4 pb-4 space-y-3 bg-gradient-to-t from-neutral-900/60 to-transparent backdrop-blur-md border-t border-white/[0.08]">
          {/* Empty Cart Button */}
          <button
            onClick={() => setShowEmptyConfirm(true)}
            className="w-full bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-red-500/40 text-neutral-300 hover:text-red-300 font-medium py-3 px-5 transition-all duration-300 ease-out flex items-center justify-center gap-3 rounded-xl shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span className="text-base">Empty Cart</span>
          </button>

          {/* Confirmation Dialog */}
          <UnifiedPopout isOpen={showEmptyConfirm} onClose={() => setShowEmptyConfirm(false)} width="min(90vw, 500px)" height="auto">
            <div className="flex flex-col">
              {/* Header */}
              <div className="px-6 py-4 border-b border-neutral-500/20 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-200" style={{ fontFamily: 'Tiempos, serif' }}>
                  Burn List?
                </h3>
                <button
                  onClick={() => setShowEmptyConfirm(false)}
                  className="text-neutral-400 hover:text-neutral-200 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Content */}
              <div className="p-6">
                <p className="text-neutral-200 mb-8 text-base">
                  Remove all {itemCount} item{itemCount !== 1 ? 's' : ''} from cart?
                </p>
                
                {/* Form Actions */}
                <div className="flex items-center justify-end space-x-4 pt-2">
                  <button
                    onClick={() => setShowEmptyConfirm(false)}
                    className="px-6 py-3 text-base bg-neutral-700 hover:bg-neutral-600 border border-neutral-600 text-neutral-300 hover:text-white rounded-lg transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onClearCart?.();
                      setShowEmptyConfirm(false);
                    }}
                    className="px-8 py-3 text-base bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-neutral-800 shadow-lg"
                  >
                    Burn List
                  </button>
                </div>
              </div>
            </div>
          </UnifiedPopout>

          {isAuditMode ? (
            /* Apply Adjustments Section */
            <div className="space-y-4">
              {/* Reason Input */}
              <div>
                <label className="block text-sm text-neutral-400 mb-2 font-medium">
                  Adjustment Reason
                </label>
                <input
                  type="text"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="e.g., Physical count, damaged goods, etc."
                  className="w-full px-4 py-3 text-base bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 hover:border-white/20 rounded-xl text-neutral-200 placeholder-neutral-500 focus:bg-white/[0.05] focus:border-white/20 focus:outline-none transition-all duration-300 ease-out"
                />
              </div>
              
              {/* Apply Adjustments Button */}
              <button
                onClick={() => onApplyAdjustments?.(adjustmentReason || 'Manual adjustment')}
                className="w-full bg-white/[0.03] hover:bg-white/[0.08] backdrop-blur-md border border-white/10 hover:border-white/20 text-neutral-200 font-semibold py-4 px-5 transition-all duration-300 ease-out flex items-center justify-between rounded-xl cursor-pointer shadow-lg hover:shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-base">Apply Adjustments</span>
                </div>
                <span className="text-base font-bold">{adjustmentCount} item{adjustmentCount !== 1 ? 's' : ''}</span>
              </button>
            </div>
          ) : (
            /* Checkout Button */
            <button
              onClick={() => onCheckout?.(selectedCustomer)}
              disabled={isCheckoutLoading}
              className="w-full bg-gradient-to-r from-neutral-700/50 to-neutral-600/50 hover:from-neutral-600/60 hover:to-neutral-500/60 backdrop-blur-md border border-white/10 hover:border-white/20 text-neutral-100 font-bold py-5 px-5 transition-all duration-300 ease-out flex items-center justify-between rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-2xl"
            >
              <div className="flex items-center gap-3">
                {isCheckoutLoading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-neutral-200"></div>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                )}
                <span className="text-lg">{isCheckoutLoading ? 'Processing...' : 'Checkout'}</span>
              </div>
              <span className="text-xl font-black tracking-tight">${total.toFixed(2)}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Export memoized component for performance optimization
export const Cart = React.memo(CartComponent);