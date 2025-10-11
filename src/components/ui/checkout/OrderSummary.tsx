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
    return <span className="text-xs text-neutral-500">Loading...</span>;
  }
  
  if (!pointsBalance || customerId === 0) {
    return <span className="text-xs text-neutral-500">0 Points</span>;
  }

  const pointsLabel = (pointsBalance as any).points_label || 'Point:Points';
  const [singular, plural] = pointsLabel.split(':');
  const pointsUnit = pointsBalance.balance === 1 ? (singular || 'Point') : (plural || 'Points');
  
  return (
    <span className="text-white text-xs font-medium bg-gradient-to-r from-purple-600 via-fuchsia-500 via-pink-500 via-rose-400 via-pink-400 via-fuchsia-400 to-purple-600 px-2 py-0.5 rounded animate-pulse bg-[length:300%_100%] animate-[gradient_4s_ease-in-out_infinite]" style={{ boxShadow: '0 0 8px rgba(217, 70, 239, 0.6), 0 0 16px rgba(217, 70, 239, 0.4)' }}>
      {pointsBalance.balance.toLocaleString()} {pointsUnit}
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
    <div className="bg-white/[0.02] hover:bg-white/[0.04] backdrop-blur-md border border-white/[0.08] hover:border-white/[0.12] rounded-xl p-3 relative transition-all duration-300 ease-out mb-3 flex flex-col flex-1 shadow-lg">
      {/* Header - Fixed */}
      <div className="pt-2 pr-2 pb-3 flex-shrink-0">
        <h3 className="text-lg font-semibold text-neutral-300 mb-3" style={{ fontFamily: 'Tiempos, serif' }}>Order Summary</h3>
        
        {/* Customer Selected Card */}
        {selectedCustomer && selectedCustomer.id > 0 && (
          <div className="bg-white/[0.03] hover:bg-white/[0.06] backdrop-blur-md border border-white/[0.1] hover:border-white/[0.15] rounded-xl p-3 mb-3 transition-all duration-300 ease-out shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="text-neutral-200 text-base font-semibold truncate mb-1" style={{ fontFamily: 'Tiempos, serif', textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)' }}>
                  {selectedCustomer.display_name || selectedCustomer.name || selectedCustomer.username}
                </div>
                <div className="text-neutral-400 text-sm">
                  {selectedCustomer.email}
                </div>
              </div>
              <div className="ml-3 flex-shrink-0">
                <CustomerPointsDisplay customerId={selectedCustomer.id} />
              </div>
            </div>
          </div>
        )}
        
        {/* Guest Customer Card */}
        {selectedCustomer && selectedCustomer.id === 0 && (
          <div className="bg-white/[0.03] hover:bg-white/[0.06] backdrop-blur-md border border-white/[0.1] hover:border-white/[0.15] rounded-xl p-3 mb-3 transition-all duration-300 ease-out shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="text-neutral-200 text-base font-semibold mb-1" style={{ fontFamily: 'Tiempos, serif', textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)' }}>
                  Guest Customer
                </div>
                <div className="text-neutral-400 text-sm">
                  Walk-in customer
                </div>
              </div>
              <div className="ml-3 flex-shrink-0">
                <span className="text-sm text-neutral-400 bg-neutral-600/30 px-2 py-1 rounded-lg">0 Points</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Products List - Scrollable */}
      <div className="pr-2 space-y-0 mb-2 flex-1 overflow-y-auto">
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
            <div key={item.id} className="flex justify-between items-start p-3 bg-white/[0.02] hover:bg-white/[0.05] backdrop-blur-md border border-white/[0.08] hover:border-white/[0.12] rounded-xl mb-2 last:mb-0 transition-all duration-300 ease-out shadow-md">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {/* Product Image */}
                <div className="w-10 h-10 relative overflow-hidden flex-shrink-0 rounded-lg ring-1 ring-white/10">
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
                        width={40}
                        height={40}
                        className="object-contain opacity-25"
                      />
                    </div>
                  )}
                </div>
                
                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <div className="text-neutral-200 font-semibold truncate text-sm leading-tight mb-1.5" style={{ fontFamily: 'Tiempos, serif', textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)' }}>
                    {item.name}
                  </div>
                  
                  {/* Price and Quantity Line */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Show original price with strikethrough if overridden */}
                    {hasOverride && (
                      <span className="text-neutral-500 line-through text-xs">
                        ${originalPrice.toFixed(2)}
                      </span>
                    )}
                    
                    {/* Show current price (or override price) */}
                    <span className="text-neutral-400 text-sm font-medium">
                      ${(item.override_price ?? originalPrice).toFixed(2)} × {item.quantity}
                    </span>
                    
                    {/* Show discount badge if applied */}
                    {hasDiscount && (
                      <span className="text-xs px-2 py-0.5 bg-orange-600/20 text-orange-400 border border-orange-600/40 rounded-full font-medium">
                        -{item.discount_percentage}%
                      </span>
                    )}
                  </div>
                  
                  {/* Display pricing tier information if available */}
                  {item.pricing_tier && (
                    <div className="text-xs text-neutral-400 mt-1.5 bg-neutral-600/20 px-2 py-0.5 rounded inline-block">
                      {item.pricing_tier.tier_label}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Final Total Column */}
              <div className="text-right ml-3 flex-shrink-0">
                {/* Show original total with strikethrough if there's any discount/override */}
                {(hasOverride || hasDiscount) && (
                  <div className="text-neutral-500 line-through text-xs mb-1">
                    ${(originalPrice * item.quantity).toFixed(2)}
                  </div>
                )}
                {/* Final total after all discounts/overrides */}
                <div className="text-neutral-200 font-bold text-base">
                  ${(finalPrice * item.quantity).toFixed(2)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Totals - Fixed at bottom */}
        <div className="pt-3 pr-2 pb-2 border-t border-white/[0.1] space-y-2 flex-shrink-0 bg-gradient-to-t from-neutral-900/20 to-transparent">
        {/* Show total discounts if any */}
        {(() => {
          const originalSubtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          const totalDiscount = originalSubtotal - subtotal;
          
          if (totalDiscount > 0) {
            return (
              <>
                <div className="flex justify-between text-neutral-400 text-sm">
                  <span>Original Subtotal</span>
                  <span className="line-through">${originalSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-400 text-sm font-medium">
                  <span>Discounts Applied</span>
                  <span>-${totalDiscount.toFixed(2)}</span>
                </div>
              </>
            );
          }
          return null;
        })()}
        
        <div className="flex justify-between text-neutral-300 text-sm font-medium">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-neutral-300 text-sm font-medium">
          <span>{taxRate.name} ({(taxRate.rate * 100).toFixed(2)}%)</span>
          <span>${taxAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-neutral-100 text-lg font-bold pt-2 mt-2 border-t border-white/[0.1]">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};
