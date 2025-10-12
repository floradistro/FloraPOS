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
    return <span className="text-xs font-mono text-neutral-500">loading...</span>;
  }
  
  if (!pointsBalance || customerId === 0) {
    return <span className="text-xs font-mono text-neutral-500">0 points</span>;
  }
  
  const balance = pointsBalance as any;
  const pointsLabel = balance.points_label || 'Point:Points';
  const [singular, plural] = pointsLabel.split(':');
  const pointsUnit = balance.balance === 1 ? (singular || 'Point') : (plural || 'Points');
  
  return (
    <span className="text-white text-xs font-mono bg-gradient-to-r from-purple-600 via-fuchsia-500 to-purple-600 px-2 py-0.5 rounded animate-pulse bg-[length:200%_100%]">
      {balance.balance.toLocaleString()} {pointsUnit.toLowerCase()}
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
    <div className="w-full backdrop-blur-xl flex flex-col h-full">
      {/* Cart Items */}
      <div className="flex-1 overflow-hidden">
        {isProductsLoading ? (
          // Show nothing while products are loading
          <div className="h-full"></div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
            {/* Logo - Only show when no customer selected */}
            {!selectedCustomer && (
              <div className="w-24 h-24 flex items-center justify-center mb-8 relative">
                <Image 
                  src="/logo123.png" 
                  alt="Flora POS Logo" 
                  width={96}
                  height={96}
                  className="object-contain opacity-20"
                  priority
                />
              </div>
            )}
            
            {/* Customer Info - Show when customer is selected */}
            {selectedCustomer && selectedCustomer.id >= 0 && !isAuditMode && (
              <div className="w-full mb-8 bg-white/[0.02] backdrop-blur-lg rounded-2xl p-5 transition-all duration-300">
                <div className="flex flex-col items-center gap-3">
                  {/* Logo instead of Avatar */}
                  <div className="w-16 h-16 flex items-center justify-center">
                    <Image 
                      src="/logo123.png" 
                      alt="Flora POS Logo" 
                      width={64}
                      height={64}
                      className="object-contain opacity-20"
                      priority
                    />
                  </div>
                  
                  <div className="text-base font-medium text-white">
                    {selectedCustomer.id === 0 ? 'Guest' : (selectedCustomer.display_name || selectedCustomer.name || selectedCustomer.username)}
                  </div>
                  
                  {selectedCustomer.id > 0 && (
                    <div className="text-xs text-neutral-500 font-mono mt-1">
                      <CustomerPointsDisplay customerId={selectedCustomer.id} />
                    </div>
                  )}
                  
                  <button
                    onClick={() => onCustomerSelect?.(null)}
                    className="mt-2 px-4 py-2 text-xs font-mono font-medium text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-300 active:scale-95 lowercase"
                  >
                    remove
                  </button>
                </div>
              </div>
            )}
            
            {/* Empty State Message */}
            {!isAuditMode && (
              <p className="text-sm font-mono text-neutral-500 lowercase">
                {selectedCustomer ? 'add items to cart' : 'select customer to begin'}
              </p>
            )}
            
            {/* Audit Mode Message */}
            {isAuditMode && (
              <p className="text-sm font-mono text-neutral-500 lowercase">
                no adjustments pending
              </p>
            )}
            
            {/* Add Customer Button - Only show in normal mode when no customer selected */}
            {!isAuditMode && !selectedCustomer && (
              <button
                onClick={() => {
                  onOpenCustomerSelector?.();
                }}
                className="mt-8 px-6 py-3 text-sm font-mono font-medium bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white rounded-xl transition-all duration-300 active:scale-95 lowercase"
              >
                add customer
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
              
              @keyframes slide-in-from-top-4 {
                from {
                  opacity: 0;
                  transform: translateY(-16px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
              
              .animate-in {
                animation-fill-mode: both;
              }
              
              .slide-in-from-top-4 {
                animation-name: slide-in-from-top-4;
              }
              
              .fade-in {
                animation-name: fadeIn;
              }
              
              .duration-500 {
                animation-duration: 500ms;
              }
              
              @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
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
            
            {/* Customer Card - Shows at top always */}
            <div className="sticky top-0 z-20 mx-4 mt-4 mb-3">
              {selectedCustomer && selectedCustomer.id >= 0 ? (
                <div className="bg-white/[0.02] backdrop-blur-xl rounded-2xl p-4 transition-all duration-300">
                  <div className="flex items-center gap-3">
                    {/* Customer Avatar */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neutral-700 to-neutral-800 flex items-center justify-center text-white font-mono font-bold text-lg flex-shrink-0">
                      {selectedCustomer.id === 0 ? '👤' : (selectedCustomer.display_name || selectedCustomer.name || 'U')[0].toUpperCase()}
                    </div>
                    
                    {/* Customer Info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        {selectedCustomer.id === 0 ? 'Guest' : (selectedCustomer.display_name || selectedCustomer.name || selectedCustomer.username)}
                      </div>
                      {selectedCustomer.id > 0 && (
                        <div className="text-xs text-neutral-500 font-mono mt-1">
                          <CustomerPointsDisplay customerId={selectedCustomer.id} />
                        </div>
                      )}
                    </div>
                    
                    {/* Remove Customer Button */}
                    <button
                      onClick={() => onCustomerSelect?.(null)}
                      className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-white/10 transition-all duration-200 active:scale-95 flex-shrink-0"
                      title="Remove"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => onOpenCustomerSelector?.()}
                  className="w-full bg-white/[0.02] hover:bg-white/[0.04] backdrop-blur-xl rounded-2xl p-4 transition-all duration-300 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-neutral-500 flex-shrink-0">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-mono font-medium text-neutral-400 lowercase">add customer</div>
                      <div className="text-xs font-mono text-neutral-600 mt-0.5">optional</div>
                    </div>
                    <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              )}
            </div>
            
            <div className="space-y-2 pt-0 px-4 pb-3 flex flex-col">
              {items.map((item) => (
                <div key={item.id} className="bg-white/[0.02] backdrop-blur-sm hover:bg-white/[0.04] rounded-2xl p-4 relative transition-all duration-300">
                  {/* Header Row: Image, Name, Remove Button */}
                  <div className="flex items-center gap-3 mb-3">
                    {/* Product Image */}
                    <div className="w-12 h-12 relative overflow-hidden flex-shrink-0 rounded-xl bg-neutral-800/50">
                      {item.image ? (
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image 
                            src="/logo123.png" 
                            alt="Flora POS Logo" 
                            width={48}
                            height={48}
                            className="object-contain opacity-20"
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* Product Name and Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-white mb-1 truncate">
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-2">
                        {item.category && (
                          <span className="text-[10px] font-mono text-neutral-400 bg-white/5 px-2 py-0.5 rounded lowercase">
                            {item.category}
                          </span>
                        )}
                        <span className="text-xs font-mono text-neutral-400">${item.price.toFixed(2)}</span>
                      </div>
                      {item.pricing_tier && (
                        <div className="text-[10px] font-mono text-neutral-500 mt-1">
                          {item.pricing_tier.tier_label}
                        </div>
                      )}
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => onRemoveItem?.(item.id)}
                      className="p-1.5 bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all duration-200 flex-shrink-0 rounded-lg active:scale-95"
                      title="Remove"
                    >
                      <svg className="w-3.5 h-3.5 text-neutral-500 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
                      <div className="flex items-center justify-between w-full gap-3">
                        {/* Quantity Controls - Minimal */}
                        <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1">
                          <button
                            onClick={() => onUpdateQuantity?.(item.id, Math.max(0, item.quantity - 1))}
                            className="w-8 h-8 hover:bg-white/10 flex items-center justify-center transition-all duration-200 rounded-lg active:scale-95"
                          >
                            <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </button>
                          <span className="text-base text-white min-w-[2rem] text-center font-mono">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity?.(item.id, item.quantity + 1)}
                            className="w-8 h-8 hover:bg-white/10 flex items-center justify-center transition-all duration-200 rounded-lg active:scale-95"
                          >
                            <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </button>
                        </div>
                        
                        {/* Subtotal - Clean */}
                        <span className="text-base font-mono font-medium text-white">
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
        <div className="pt-4 px-4 pb-4 space-y-3 border-t border-white/5">
          {/* Total Display - Minimal */}
          <div className="flex items-center justify-between py-3 px-4 bg-white/[0.02] rounded-xl">
            <span className="text-xs font-mono text-neutral-400 lowercase">total</span>
            <span className="text-2xl font-mono font-bold text-white">${total.toFixed(2)}</span>
          </div>
          
          {/* Item Count */}
          <div className="text-[10px] font-mono text-neutral-500 text-center lowercase">
            {itemCount} item{itemCount !== 1 ? 's' : ''}
          </div>
          
          {/* Empty Cart Button */}
          <button
            onClick={() => setShowEmptyConfirm(true)}
            className="w-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white font-mono font-medium py-2.5 px-4 transition-all duration-300 flex items-center justify-center gap-2 rounded-xl active:scale-95 text-xs lowercase"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>clear cart</span>
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
            /* Checkout Button - Apple 2035 */
            <button
              onClick={() => onCheckout?.(selectedCustomer)}
              disabled={isCheckoutLoading}
              className="w-full bg-neutral-200 text-neutral-900 hover:bg-neutral-100 font-mono font-bold py-4 px-5 transition-all duration-300 flex items-center justify-center gap-3 rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 text-sm lowercase"
            >
              {isCheckoutLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-neutral-900 border-t-transparent"></div>
                  <span>processing...</span>
                </>
              ) : (
                <>
                  <span>checkout</span>
                  <span className="ml-auto text-lg">${total.toFixed(2)}</span>
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Export memoized component for performance optimization
export const Cart = React.memo(CartComponent);