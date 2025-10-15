import React from 'react';
import Image from 'next/image';
import { CartItem, TaxRate, WordPressUser } from '../../../types';
import { useUserPointsBalance } from '../../../hooks/useRewards';

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  calculatedSubtotal: number;
  taxRate: TaxRate;
  taxAmount: number;
  total: number;
  selectedCustomer?: WordPressUser | null;
  manualPreTaxAmount?: string;
  onManualPreTaxAmountChange?: (value: string) => void;
  manualDiscountPercentage?: number;
  locationTaxRates?: any[];
}

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

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  items,
  subtotal,
  calculatedSubtotal,
  taxRate,
  taxAmount,
  total,
  selectedCustomer,
  manualPreTaxAmount = '',
  onManualPreTaxAmountChange,
  manualDiscountPercentage = 0,
  locationTaxRates = []
}) => {
  return (
    <div className="px-4 pt-2 pb-3 flex flex-col flex-1">
      {/* Header */}
      <div className="mb-3">
        <h3 className="text-xs font-mono text-neutral-500 lowercase tracking-wider">order summary</h3>
      </div>
      
      {/* Products List - Scrollable */}
      <div className="space-y-2 mb-3 flex-1 overflow-y-auto">
        {items.map((item) => {
          // Calculate final price with overrides and discounts
          let finalPrice = item.override_price !== undefined ? item.override_price : item.price;
          const originalPrice = item.price;
          
          // Apply discount if present
          if (item.discount_percentage !== undefined && item.discount_percentage > 0) {
            finalPrice = finalPrice * (1 - item.discount_percentage / 100);
          }
          
          const hasOverride = item.override_price !== undefined && item.override_price !== originalPrice;
          const hasDiscount = item.discount_percentage !== undefined && item.discount_percentage > 0;
          
          return (
            <div key={item.id} className="flex items-center justify-between p-3 bg-white/[0.02] backdrop-blur-sm hover:bg-white/[0.04] rounded-xl transition-all duration-300">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Product Image - Smaller */}
                <div className="w-10 h-10 relative overflow-hidden flex-shrink-0 rounded-lg bg-neutral-800/50">
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
                        width={40}
                        height={40}
                        className="object-contain opacity-20"
                      />
                    </div>
                  )}
                </div>
                
                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate mb-0.5">
                    {item.name}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-neutral-400">
                      ${(item.override_price ?? originalPrice).toFixed(2)} × {item.quantity}
                    </span>
                    {hasDiscount && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded">
                        -{item.discount_percentage}%
                      </span>
                    )}
                  </div>
                  {item.pricing_tier && (
                    <div className="text-[10px] font-mono text-neutral-500 mt-0.5">
                      {item.pricing_tier.tier_label}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Final Total */}
              <div className="text-right ml-3 flex-shrink-0">
                <div className="text-base font-mono font-bold text-white">
                  ${(finalPrice * item.quantity).toFixed(2)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Totals - Fixed at bottom */}
      <div className="pt-3 space-y-2 flex-shrink-0">
        {/* Manual Pre-Tax Amount Input */}
        <div className="mb-3 p-3 bg-white/[0.03] rounded-xl border border-white/[0.05]">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-mono text-neutral-400 lowercase">
              override pre-tax total
            </label>
            {manualPreTaxAmount && onManualPreTaxAmountChange && (
              <button
                onClick={() => onManualPreTaxAmountChange('')}
                className="text-[10px] font-mono text-neutral-500 hover:text-white transition-colors px-2 py-0.5 rounded bg-white/5 hover:bg-white/10"
              >
                clear
              </button>
            )}
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-mono text-sm">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={manualPreTaxAmount}
              onChange={(e) => onManualPreTaxAmountChange && onManualPreTaxAmountChange(e.target.value)}
              placeholder={calculatedSubtotal.toFixed(2)}
              className="w-full bg-white/[0.05] text-white font-mono text-sm py-2 pl-6 pr-3 rounded-lg border border-white/[0.08] focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10 placeholder:text-neutral-600"
            />
          </div>
          {manualPreTaxAmount && parseFloat(manualPreTaxAmount) > 0 && (
            <div className="mt-2 text-[10px] font-mono text-neutral-500">
              {manualDiscountPercentage && manualDiscountPercentage > 0 ? (
                <span className="text-orange-400">
                  ↓ {manualDiscountPercentage.toFixed(1)}% discount applied
                </span>
              ) : manualDiscountPercentage && manualDiscountPercentage < 0 ? (
                <span className="text-blue-400">
                  ↑ {Math.abs(manualDiscountPercentage).toFixed(1)}% markup applied
                </span>
              ) : (
                <span className="text-green-400">
                  ✓ matches calculated total
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Show total discounts if any */}
        {(() => {
          const originalSubtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          const totalDiscount = originalSubtotal - subtotal;
          
          if (totalDiscount > 0) {
            return (
              <div className="flex justify-between text-xs font-mono text-neutral-500 mb-2">
                <span className="lowercase">discount</span>
                <span>-${totalDiscount.toFixed(2)}</span>
              </div>
            );
          }
          return null;
        })()}
        
        <div className="flex justify-between text-xs font-mono text-neutral-400">
          <span className="lowercase">subtotal (pre-tax)</span>
          <span className={manualPreTaxAmount ? 'text-orange-400 font-bold' : ''}>
            ${subtotal.toFixed(2)}
          </span>
        </div>
        
        {/* Show individual tax rates if multiple, otherwise show combined */}
        {locationTaxRates.length > 1 ? (
          <>
            {locationTaxRates.map((tax, index) => {
              const individualTaxAmount = Math.round(subtotal * (parseFloat(tax.tax_rate) / 100) * 100) / 100;
              return (
                <div key={index} className="flex justify-between text-xs font-mono text-neutral-500">
                  <span className="lowercase pl-2">→ {tax.tax_rate_name} ({tax.tax_rate}%)</span>
                  <span>${individualTaxAmount.toFixed(2)}</span>
                </div>
              );
            })}
            <div className="flex justify-between text-xs font-mono text-neutral-400 pt-1 border-t border-white/5">
              <span className="lowercase">total tax ({(taxRate.rate * 100).toFixed(2)}%)</span>
              <span className="font-bold">${taxAmount.toFixed(2)}</span>
            </div>
          </>
        ) : (
          <div className="flex justify-between text-xs font-mono text-neutral-400">
            <span className="lowercase">tax ({(taxRate.rate * 100).toFixed(2)}%)</span>
            <span>${taxAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between items-center py-2.5 px-3 bg-white/[0.02] rounded-xl mt-2">
          <span className="text-xs font-mono text-neutral-400 lowercase">total</span>
          <span className="text-xl font-mono font-bold text-white">${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};
