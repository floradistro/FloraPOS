import React from 'react';
import Image from 'next/image';
import { CartItem, TaxRate, WordPressUser } from '../../../types';
import { useUserPointsBalance } from '../../../hooks/useRewards';

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  taxRate: TaxRate;
  taxAmount: number;
  total: number;
  selectedCustomer?: WordPressUser | null;
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
  taxRate,
  taxAmount,
  total,
  selectedCustomer
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
          <span className="lowercase">subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs font-mono text-neutral-400">
          <span className="lowercase">tax</span>
          <span>${taxAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center py-2.5 px-3 bg-white/[0.02] rounded-xl mt-2">
          <span className="text-xs font-mono text-neutral-400 lowercase">total</span>
          <span className="text-xl font-mono font-bold text-white">${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};
