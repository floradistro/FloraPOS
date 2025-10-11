'use client';

import React, { useState } from 'react';
import Image from 'next/image';

import { WordPressUser } from '../../services/users-service';
import { CartItem } from '../../types';
import { CATEGORY_DISPLAY_NAMES } from '../../constants';
import { UnifiedPopout } from './UnifiedPopout';
import { useUserPointsBalance } from '../../hooks/useRewards';

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

// Component to display customer points
const CustomerPointsDisplay = ({ customerId }: { customerId: number }) => {
  const { data: pointsBalance, isLoading } = useUserPointsBalance(customerId);
  
  if (isLoading) {
    return <span className="text-xs text-neutral-500">Loading...</span>;
  }
  
  if (!pointsBalance || customerId === 0) {
    return <span className="text-xs text-neutral-500">0 Points</span>;
  }
  
  const pointsLabel = pointsBalance.points_label || 'Point:Points';
  const [singular, plural] = pointsLabel.split(':');
  const pointsUnit = pointsBalance.balance === 1 ? (singular || 'Point') : (plural || 'Points');
  
  return (
    <span 
      className="text-white text-sm font-bold bg-gradient-to-r from-purple-600 via-fuchsia-500 via-pink-500 via-rose-400 via-pink-400 via-fuchsia-400 to-purple-600 px-4 py-2 rounded-full animate-pulse bg-[length:300%_100%] shadow-lg" 
      style={{ 
        boxShadow: '0 0 12px rgba(217, 70, 239, 0.8), 0 0 24px rgba(217, 70, 239, 0.5), 0 0 36px rgba(217, 70, 239, 0.3)',
        animation: 'gradient 4s ease-in-out infinite, pulse 2s ease-in-out infinite'
      }}
    >
      {pointsBalance.balance.toLocaleString()} {pointsUnit}
    </span>
  );
};

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
            {/* Logo with conditional glow based on customer selection */}
            <div className="w-40 h-40 flex items-center justify-center mb-6 relative">
              <Image 
                src="/logo123.png" 
                alt="Flora POS Logo" 
                width={160}
                height={160}
                className={`object-contain transition-all duration-500 ${
                  selectedCustomer && selectedCustomer.id >= 0 ? 'opacity-90' : 'opacity-30'
                }`}
                style={{
                  animation: 'subtle-float 3s ease-in-out infinite',
                  ...(selectedCustomer && selectedCustomer.id >= 0 ? {
                    filter: 'drop-shadow(0 0 20px rgba(236, 72, 153, 0.8)) drop-shadow(0 0 40px rgba(236, 72, 153, 0.5)) drop-shadow(0 0 60px rgba(236, 72, 153, 0.3))',
                  } : {})
                }}
                priority
              />
            </div>
            
            {/* Customer Info - Show when customer is selected */}
            {selectedCustomer && selectedCustomer.id >= 0 && !isAuditMode && (
              <div className="mb-6 bg-white/[0.05] hover:bg-white/[0.08] backdrop-blur-lg border border-pink-500/30 rounded-2xl p-5 transition-all duration-300 shadow-xl" style={{ boxShadow: '0 0 20px rgba(236, 72, 153, 0.3)' }}>
                <div className="flex flex-col items-center gap-3">
                  <div className="text-xl font-bold text-pink-200 mb-1" style={{ fontFamily: 'Tiempos, serif', textShadow: '0 0 10px rgba(236, 72, 153, 0.5)' }}>
                    {selectedCustomer.id === 0 ? 'Guest Customer' : (selectedCustomer.display_name || selectedCustomer.name || selectedCustomer.username)}
                  </div>
                  {selectedCustomer.id > 0 && (
                    <>
                      <div className="text-sm text-neutral-400">
                        {selectedCustomer.email}
                      </div>
                      <CustomerPointsDisplay customerId={selectedCustomer.id} />
                    </>
                  )}
                  {selectedCustomer.id === 0 && (
                    <div className="text-sm text-neutral-400">Walk-in customer</div>
                  )}
                  <button
                    onClick={() => onCustomerSelect?.(null)}
                    className="mt-2 px-4 py-2 text-sm font-medium text-pink-300 hover:text-pink-200 bg-pink-600/10 hover:bg-pink-600/20 border border-pink-500/30 hover:border-pink-500/50 rounded-xl transition-all duration-200 active:scale-95"
                  >
                    Clear Customer
                  </button>
                </div>
              </div>
            )}
            
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
            
            {/* Add Customer Button - Only show in normal mode when no customer selected */}
            {!isAuditMode && !selectedCustomer && (
              <button
                onClick={() => {
                  onOpenCustomerSelector?.();
                }}
                className="px-8 py-4 text-lg font-semibold bg-white/[0.05] hover:bg-white/[0.1] backdrop-blur-md border-2 border-neutral-500/40 hover:border-neutral-400/60 text-neutral-200 hover:text-white rounded-2xl transition-all duration-200 ease-out mt-8 shadow-xl active:scale-95"
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

              @keyframes gradient {
                0%, 100% {
                  background-position: 0% 50%;
                }
                50% {
                  background-position: 100% 50%;
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
            <div className="gap-4 pt-3 px-3 pb-3 flex flex-col">
              {items.map((item) => (
                <div key={item.id} className="bg-white/[0.03] hover:bg-white/[0.06] backdrop-blur-lg border border-white/[0.12] hover:border-white/[0.2] rounded-2xl p-4 relative transition-all duration-200 shadow-xl">
                  {/* Header Row: Image, Name, Remove Button */}
                  <div className="flex items-center gap-4 mb-4">
                    {/* Product Image */}
                    <div className="w-16 h-16 relative overflow-hidden flex-shrink-0 rounded-xl ring-2 ring-white/10 hover:ring-white/20 transition-all">
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
                            width={64}
                            height={64}
                            className="object-contain opacity-25"
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* Product Name, Category, and Price */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-bold text-neutral-100 mb-2 leading-tight" style={{ fontFamily: 'Tiempos, serif', textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)' }}>
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.category && (
                          <span className="text-xs text-neutral-300 bg-neutral-600/40 backdrop-blur-sm px-3 py-1 rounded-full font-medium">
                            {CATEGORY_DISPLAY_NAMES[item.category] || item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                          </span>
                        )}
                        <span className="text-base text-neutral-300 font-semibold">${item.price.toFixed(2)}</span>
                      </div>
                      {/* Pricing tier information */}
                      {item.pricing_tier && (
                        <div className="text-xs text-neutral-400 mt-2 bg-neutral-600/20 px-2 py-1 rounded-lg inline-block">
                          <span className="font-medium">{item.pricing_tier.tier_label}</span>
                          {item.pricing_tier.conversion_ratio && (
                            <span className="ml-1">
                              ({item.pricing_tier.conversion_ratio.output_amount} {item.pricing_tier.conversion_ratio.output_unit})
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => onRemoveItem?.(item.id)}
                      className="w-11 h-11 bg-red-600/10 hover:bg-red-600/30 border border-red-500/20 hover:border-red-500/50 flex items-center justify-center transition-all duration-200 flex-shrink-0 rounded-xl active:scale-95"
                      title="Remove item"
                    >
                      <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Controls Row */}
                  <div className="flex items-center gap-3 pt-3 border-t border-white/10">
                    {item.is_adjustment ? (
                      /* Adjustment Item Display */
                      <div className="flex items-center gap-4 flex-1">
                        {isAuditMode && onUpdateAdjustment ? (
                          /* Adjustment Controls in Audit Mode */
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => {
                                const currentAmount = item.adjustment_amount || 0;
                                onUpdateAdjustment(item.id, currentAmount - 1);
                              }}
                              className="w-11 h-11 bg-red-600/10 hover:bg-red-600/30 border border-red-500/20 hover:border-red-500/50 flex items-center justify-center transition-all duration-200 rounded-xl active:scale-95"
                            >
                              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
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
                              className={`w-20 h-11 text-base text-center bg-white/[0.05] border border-white/15 rounded-xl font-bold focus:bg-neutral-600/90 focus:border-neutral-300 focus:outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                item.adjustment_amount && item.adjustment_amount > 0 ? 'text-green-400' : 
                                item.adjustment_amount && item.adjustment_amount < 0 ? 'text-red-400' : 'text-neutral-300'
                              }`}
                            />
                            <button
                              onClick={() => {
                                const currentAmount = item.adjustment_amount || 0;
                                onUpdateAdjustment(item.id, currentAmount + 1);
                              }}
                              className="w-11 h-11 bg-green-600/10 hover:bg-green-600/30 border border-green-500/20 hover:border-green-500/50 flex items-center justify-center transition-all duration-200 rounded-xl active:scale-95"
                            >
                              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <span className={`text-lg font-bold ${item.adjustment_amount && item.adjustment_amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {item.adjustment_amount && item.adjustment_amount > 0 ? '+' : ''}{item.adjustment_amount || 0}
                          </span>
                        )}
                        <span className="text-sm text-neutral-300 bg-neutral-600/30 px-3 py-1.5 rounded-full font-medium">Adjustment</span>
                      </div>
                    ) : (
                      /* Normal Cart Item Display */
                      <div className="flex items-center justify-between w-full gap-4">
                        {/* Quantity Controls - Left Side */}
                        <div className="flex items-center gap-3 bg-white/[0.03] border border-white/10 rounded-xl p-1.5">
                          <button
                            onClick={() => onUpdateQuantity?.(item.id, Math.max(0, item.quantity - 1))}
                            className="w-11 h-11 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 hover:border-white/20 flex items-center justify-center transition-all duration-200 rounded-lg active:scale-95"
                          >
                            <svg className="w-5 h-5 text-neutral-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                            </svg>
                          </button>
                          <span className="text-xl text-neutral-100 min-w-[3rem] text-center font-bold">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity?.(item.id, item.quantity + 1)}
                            className="w-11 h-11 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 hover:border-white/20 flex items-center justify-center transition-all duration-200 rounded-lg active:scale-95"
                          >
                            <svg className="w-5 h-5 text-neutral-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </button>
                        </div>
                        
                        {/* Subtotal - Right Side */}
                        <span className="text-xl font-black text-neutral-50">
                          ${(() => {
                            let finalPrice = item.override_price !== undefined ? item.override_price : item.price;
                            if (item.discount_percentage !== undefined && item.discount_percentage > 0) {
                              finalPrice = finalPrice * (1 - item.discount_percentage / 100);
                            }
                            return (finalPrice * item.quantity).toFixed(2);
                          })()}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Price Override and Discount Row - Only show for non-adjustment items */}
                  {!item.is_adjustment && (
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/10">
                      {/* Price Override */}
                      <div className="flex-1">
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
                            className="w-full h-11 px-3 text-base text-center bg-white/[0.05] border border-white/15 rounded-xl text-neutral-100 font-semibold focus:bg-neutral-600/90 focus:border-neutral-300 focus:outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            autoFocus
                          />
                        ) : (
                          <button
                            onClick={() => setEditingPriceItemId(item.id)}
                            className={`w-full h-11 rounded-xl border transition-all font-semibold text-base active:scale-98 ${
                              item.override_price !== undefined 
                                ? 'text-green-400 border-green-400/50 bg-green-400/15 hover:bg-green-400/25' 
                                : 'text-neutral-200 border-white/15 bg-white/[0.05] hover:bg-white/[0.08]'
                            }`}
                          >
                            ${(item.override_price ?? item.price).toFixed(2)} {item.override_price !== undefined && '✓'}
                          </button>
                        )}
                      </div>
                      
                      {/* Discount */}
                      <div className="flex-1">
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
                            className="w-full h-11 px-3 text-base text-center bg-white/[0.05] border border-white/15 rounded-xl text-neutral-100 font-semibold focus:bg-neutral-600/90 focus:border-neutral-300 focus:outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            autoFocus
                          />
                        ) : (
                          <button
                            onClick={() => setEditingDiscountItemId(item.id)}
                            className={`w-full h-11 rounded-xl border transition-all font-semibold text-base active:scale-98 ${
                              item.discount_percentage 
                                ? 'text-orange-400 border-orange-400/50 bg-orange-400/15 hover:bg-orange-400/25' 
                                : 'text-neutral-200 border-white/15 bg-white/[0.05] hover:bg-white/[0.08]'
                            }`}
                          >
                            {item.discount_percentage ?? 0}% {item.discount_percentage && '✓'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {items.length > 0 && (
        <div className="pt-4 px-4 pb-4 space-y-4 bg-gradient-to-t from-neutral-900/60 to-transparent backdrop-blur-md border-t border-white/[0.08]">
          {/* Empty Cart Button */}
          <button
            onClick={() => setShowEmptyConfirm(true)}
            className="w-full bg-red-600/10 hover:bg-red-600/20 border border-red-500/30 hover:border-red-500/50 text-red-300 hover:text-red-200 font-semibold py-4 px-5 transition-all duration-200 flex items-center justify-center gap-3 rounded-2xl shadow-lg hover:shadow-xl active:scale-98"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span className="text-lg">Empty Cart</span>
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
                <label className="block text-base text-neutral-300 mb-3 font-semibold">
                  Adjustment Reason
                </label>
                <input
                  type="text"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="e.g., Physical count, damaged goods"
                  className="w-full px-5 py-4 text-base bg-white/[0.05] hover:bg-white/[0.07] border border-white/15 hover:border-white/25 rounded-2xl text-neutral-100 placeholder-neutral-400 font-medium focus:bg-white/[0.07] focus:border-white/30 focus:outline-none transition-all duration-200"
                />
              </div>
              
              {/* Apply Adjustments Button */}
              <button
                onClick={() => onApplyAdjustments?.(adjustmentReason || 'Manual adjustment')}
                className="w-full bg-gradient-to-r from-green-600/20 to-emerald-600/20 hover:from-green-600/30 hover:to-emerald-600/30 backdrop-blur-md border border-green-500/40 hover:border-green-500/60 text-green-300 font-bold py-5 px-6 transition-all duration-200 flex items-center justify-between rounded-2xl cursor-pointer shadow-lg hover:shadow-xl active:scale-98"
              >
                <div className="flex items-center gap-4">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-lg">Apply Adjustments</span>
                </div>
                <span className="text-xl font-black">{adjustmentCount}</span>
              </button>
            </div>
          ) : (
            /* Checkout Button */
            <button
              onClick={() => onCheckout?.(selectedCustomer)}
              disabled={isCheckoutLoading}
              className="w-full bg-gradient-to-r from-white/[0.06] to-white/[0.04] hover:from-white/[0.1] hover:to-white/[0.08] backdrop-blur-md border border-white/20 hover:border-white/30 text-neutral-100 hover:text-white font-black py-6 px-6 transition-all duration-200 flex items-center justify-between rounded-2xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl active:scale-98"
            >
              <div className="flex items-center gap-4">
                {isCheckoutLoading ? (
                  <div className="animate-spin rounded-full h-7 w-7 border-3 border-white/80 border-t-transparent"></div>
                ) : (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                )}
                <span className="text-xl">{isCheckoutLoading ? 'Processing...' : 'Checkout'}</span>
              </div>
              <span className="text-2xl font-black tracking-tight">${total.toFixed(2)}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Export memoized component for performance optimization
export const Cart = React.memo(CartComponent);