'use client';

import React, { useState } from 'react';
import Image from 'next/image';

import { WordPressUser } from '../../services/users-service';
import { CartItem } from '../../types';
import { CATEGORY_DISPLAY_NAMES } from '../../constants';

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
  onOpenCustomerSelector
}: CartProps) {

  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);
  
  const total = items.filter(item => !item.is_adjustment).reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const adjustmentCount = items.filter(item => item.is_adjustment).length;

  return (
    <div className="w-full bg-transparent flex flex-col h-full">
      {/* Cart Items */}
      <div className="flex-1 overflow-hidden">
        {isProductsLoading ? (
          // Show nothing while products are loading
          <div className="h-full"></div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-32 h-32 flex items-center justify-center mb-4 relative">
              <Image 
                src="/logo123.png" 
                alt="Flora POS Logo" 
                width={128}
                height={128}
                className="object-contain opacity-30 transition-all duration-500"
                style={{
                  animation: 'subtle-float 3s ease-in-out infinite'
                }}
                priority
              />
            </div>
            <h3 className="text-neutral-400 font-medium mb-2">
              {isAuditMode ? 'No adjustments pending' : 'Your cart is empty'}
            </h3>
            <p className="text-sm text-neutral-600 mb-6">
              {isAuditMode ? 'Make inventory adjustments to see them here' : 'Add products to get started'}
            </p>
            
            {/* Add Customer Button - Only show in normal mode */}
            {!isAuditMode && (
              <button
                onClick={() => {
                  onOpenCustomerSelector?.();
                }}
                className="group relative px-6 py-3 bg-transparent hover:bg-neutral-600/5 border border-white/[0.06] hover:border-white/[0.12] rounded-lg transition-all duration-300 ease-out cursor-pointer"
                style={{
                  animation: 'fade-in-up 0.6s ease-out 0.3s both'
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-neutral-700/30 flex items-center justify-center group-hover:bg-neutral-600/30 transition-colors duration-300">
                    <span className="text-neutral-400 group-hover:text-neutral-300 text-lg">+</span>
                  </div>
                  <div className="text-left">
                    <div className="text-neutral-400 group-hover:text-neutral-300 font-medium text-sm transition-colors duration-300">
                      Add Customer
                    </div>
                    <div className="text-neutral-600 group-hover:text-neutral-500 text-xs transition-colors duration-300">
                      Select a customer to start
                    </div>
                  </div>
                </div>
                
                {/* Subtle glow effect */}
                <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-r from-transparent via-white/[0.02] to-transparent"></div>
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
          <div className="h-full overflow-y-auto">
            <div className="gap-2 pt-2 px-2 pb-2 flex flex-col">
              {items.map((item) => (
                <div key={item.id} className="bg-transparent hover:bg-neutral-600/5 border border-white/[0.06] hover:border-white/[0.12] rounded-lg overflow-hidden p-2 relative transition-all duration-300 ease-out cursor-pointer">
                  <div className="flex items-center justify-between">
                    {/* Product Details with Image */}
                    <div className="flex-1 min-w-0 mr-3">
                      <div className="flex items-center gap-3 mb-1">
                        {/* Product Image */}
                        <div className="w-8 h-8 relative overflow-hidden flex-shrink-0 rounded">
                          {item.image ? (
                            <img 
                              src={item.image} 
                              alt={item.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-neutral-700/30">
                              <Image 
                                src="/logo123.png" 
                                alt="Flora POS Logo" 
                                width={32}
                                height={32}
                                className="object-contain opacity-20"
                              />
                            </div>
                          )}
                        </div>
                        
                        {/* Product Name and Category */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-neutral-400 truncate" style={{ fontFamily: 'Tiempos, serif', textShadow: '0 1px 2px rgba(0, 0, 0, 0.6), 0 0 4px rgba(0, 0, 0, 0.2)' }}>{item.name}</h4>
                          {item.category && (
                            <span className="text-xs text-neutral-500 bg-neutral-600/20 px-2 py-0.5 rounded-full whitespace-nowrap">
                              {CATEGORY_DISPLAY_NAMES[item.category] || item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Pricing tier information */}
                      {item.pricing_tier && (
                        <div className="text-xs text-neutral-600 mb-1">
                          <span className="text-neutral-500">{item.pricing_tier.tier_label}</span>
                          <span className="text-neutral-600 ml-1">({item.pricing_tier.tier_rule_name})</span>
                          {/* Show conversion ratio info if present */}
                          {item.pricing_tier.conversion_ratio && (
                            <div className="text-xs text-neutral-500 mt-1">
                              {item.pricing_tier.conversion_ratio.output_amount} {item.pricing_tier.conversion_ratio.output_unit} = {item.pricing_tier.conversion_ratio.input_amount} {item.pricing_tier.conversion_ratio.input_unit}
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        {item.is_adjustment ? (
                          /* Adjustment Item Display */
                          <div className="flex items-center gap-3">
                            {isAuditMode && onUpdateAdjustment ? (
                              /* Adjustment Controls in Audit Mode */
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    const currentAmount = item.adjustment_amount || 0;
                                    const step = 1; // You can make this dynamic based on product type
                                    onUpdateAdjustment(item.id, currentAmount - step);
                                  }}
                                  className="w-5 h-5 bg-transparent hover:bg-red-600/50 border border-white/[0.06] hover:border-red-500/50 flex items-center justify-center transition-all duration-300 ease-out rounded-lg"
                                  title="Decrease adjustment"
                                >
                                  <svg className="w-2.5 h-2.5 text-neutral-300 hover:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                    if (e.key === 'Enter') {
                                      e.currentTarget.blur();
                                    }
                                  }}
                                  className={`w-16 h-6 text-xs text-center bg-transparent border border-white/[0.06] hover:border-white/[0.12] rounded-lg font-medium focus:bg-neutral-600/90 focus:border-neutral-300 focus:outline-none transition-all duration-300 ease-out [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                    item.adjustment_amount && item.adjustment_amount > 0 
                                      ? 'text-green-400' 
                                      : item.adjustment_amount && item.adjustment_amount < 0
                                      ? 'text-red-400'
                                      : 'text-neutral-300'
                                  }`}
                                  title="Type adjustment amount"
                                />
                                
                                <button
                                  onClick={() => {
                                    const currentAmount = item.adjustment_amount || 0;
                                    const step = 1; // You can make this dynamic based on product type
                                    onUpdateAdjustment(item.id, currentAmount + step);
                                  }}
                                  className="w-5 h-5 bg-transparent hover:bg-green-600/50 border border-white/[0.06] hover:border-green-500/50 flex items-center justify-center transition-all duration-300 ease-out rounded-lg"
                                  title="Increase adjustment"
                                >
                                  <svg className="w-2.5 h-2.5 text-neutral-300 hover:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                  </svg>
                                </button>
                              </div>
                            ) : (
                              /* Read-only Adjustment Display */
                              <span className={`text-sm font-medium ${
                                item.adjustment_amount && item.adjustment_amount > 0 
                                  ? 'text-green-400' 
                                  : 'text-red-400'
                              }`}>
                                {item.adjustment_amount && item.adjustment_amount > 0 ? '+' : ''}
                                {item.adjustment_amount || 0}
                              </span>
                            )}
                            <span className="text-xs text-neutral-500 bg-neutral-600/20 px-2 py-0.5 rounded-full">
                              Adjustment
                            </span>
                          </div>
                        ) : (
                          /* Normal Cart Item Display */
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-neutral-600">${item.price.toFixed(2)}</span>
                            
                            {/* Quantity Controls */}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => onUpdateQuantity?.(item.id, Math.max(0, item.quantity - 1))}
                                className="w-5 h-5 bg-transparent hover:bg-neutral-600/5 border border-white/[0.06] hover:border-white/[0.12] flex items-center justify-center transition-all duration-300 ease-out rounded-lg"
                              >
                                <svg className="w-2.5 h-2.5 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                              </button>
                              <span className="text-sm text-neutral-400 min-w-[1.5rem] text-center">{item.quantity}</span>
                              <button
                                onClick={() => onUpdateQuantity?.(item.id, item.quantity + 1)}
                                className="w-5 h-5 bg-transparent hover:bg-neutral-600/5 border border-white/[0.06] hover:border-white/[0.12] flex items-center justify-center transition-all duration-300 ease-out rounded-lg"
                              >
                                <svg className="w-2.5 h-2.5 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {/* Subtotal - Only show for non-adjustment items */}
                        {!item.is_adjustment && (
                          <span className="text-sm font-medium text-neutral-400">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => onRemoveItem?.(item.id)}
                      className="w-5 h-5 bg-transparent hover:bg-red-600/50 border border-white/[0.06] hover:border-red-500/50 flex items-center justify-center transition-all duration-300 ease-out flex-shrink-0 rounded-lg"
                      title="Remove item"
                    >
                      <svg className="w-3 h-3 text-neutral-500 hover:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {items.length > 0 && (
        <div className="pt-2 px-2 pb-2 space-y-2">
          {/* Empty Cart Button */}
          <button
            onClick={() => setShowEmptyConfirm(true)}
            className="w-full bg-transparent hover:bg-neutral-600/5 border border-white/[0.06] hover:border-white/[0.12] text-neutral-400 hover:text-red-400 font-medium py-1 px-4 transition-all duration-300 ease-out flex items-center justify-center gap-2 rounded-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Empty Cart</span>
          </button>

          {/* Confirmation Dialog */}
          {showEmptyConfirm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowEmptyConfirm(false)}>
              <div className="bg-neutral-700/95 border border-white/[0.08] rounded-lg shadow-2xl max-w-md mx-4 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="px-4 py-3 border-b border-neutral-500/20 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-neutral-300">Burn List?</h3>
                  <button
                    onClick={() => setShowEmptyConfirm(false)}
                    className="text-neutral-400 hover:text-neutral-300 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Content */}
                <div className="px-4 py-4">
                  <p className="text-sm text-neutral-400 mb-6">
                    Remove all {itemCount} item{itemCount !== 1 ? 's' : ''} from cart?
                  </p>
                </div>
                
                {/* Actions */}
                <div className="px-4 py-3 border-t border-neutral-500/20 flex justify-end gap-3">
                  <button
                    onClick={() => setShowEmptyConfirm(false)}
                    className="px-3 py-1.5 text-sm text-neutral-400 hover:text-neutral-300 hover:bg-neutral-600/5 border border-transparent hover:border-white/[0.06] rounded transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onClearCart?.();
                      setShowEmptyConfirm(false);
                    }}
                    className="px-3 py-1.5 text-sm bg-transparent hover:bg-neutral-600/5 border border-white/[0.06] hover:border-white/[0.12] text-neutral-400 hover:text-neutral-300 rounded transition-all"
                  >
                    Burn List
                  </button>
                </div>
              </div>
            </div>
          )}

          {isAuditMode ? (
            /* Apply Adjustments Section */
            <div className="space-y-3">
              {/* Reason Input */}
              <div>
                <label className="block text-xs text-neutral-500 mb-1">
                  Adjustment Reason
                </label>
                <input
                  type="text"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="e.g., Physical count, damaged goods, etc."
                  className="w-full px-3 py-1 text-sm bg-transparent hover:bg-neutral-600/5 border border-white/[0.06] hover:border-white/[0.12] rounded-lg text-neutral-400 placeholder-neutral-500 focus:bg-neutral-600/5 focus:border-white/[0.12] focus:outline-none transition-all duration-300 ease-out"
                />
              </div>
              
              {/* Apply Adjustments Button */}
              <button
                onClick={() => onApplyAdjustments?.(adjustmentReason || 'Manual adjustment')}
                className="w-full bg-transparent hover:bg-neutral-600/5 border border-white/[0.06] hover:border-white/[0.12] text-neutral-400 font-medium py-3 px-4 transition-all duration-300 ease-out flex items-center justify-between rounded-lg cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Apply Adjustments</span>
                </div>
                <span className="font-semibold">{adjustmentCount} item{adjustmentCount !== 1 ? 's' : ''}</span>
              </button>
            </div>
          ) : (
            /* Checkout Button */
            <button
              onClick={() => onCheckout?.(selectedCustomer)}
              className="w-full bg-transparent hover:bg-neutral-600/5 border border-white/[0.06] hover:border-white/[0.12] text-neutral-400 font-medium py-3 px-4 transition-all duration-300 ease-out flex items-center justify-between rounded-lg cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span>Checkout</span>
              </div>
              <span className="font-semibold">${total.toFixed(2)}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Export memoized component for performance optimization
export const Cart = React.memo(CartComponent);