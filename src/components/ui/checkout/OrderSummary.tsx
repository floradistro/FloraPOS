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

  const [singular, plural] = pointsBalance.points_label.split(':') || ['Point', 'Points'];
  const pointsUnit = pointsBalance.balance === 1 ? singular : plural;
  
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
    <div className="bg-transparent hover:bg-neutral-600/5 border border-white/[0.06] hover:border-white/[0.12] rounded-lg overflow-hidden p-2 relative transition-all duration-300 ease-out mb-2 flex flex-col flex-1">
      {/* Header - Fixed */}
      <div className="pt-2 pr-2 pb-2 flex-shrink-0">
        <h3 className="text-sm font-medium text-neutral-400 mb-2">Order Summary</h3>
        
        {/* Customer Selected Card */}
        {selectedCustomer && selectedCustomer.id > 0 && (
          <div className="bg-transparent hover:bg-neutral-600/5 border border-white/[0.06] hover:border-white/[0.12] rounded-lg p-2 mb-2 transition-all duration-300 ease-out">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="text-neutral-400 text-sm font-medium truncate" style={{ fontFamily: 'Tiempos, serif', textShadow: '0 1px 2px rgba(0, 0, 0, 0.6), 0 0 4px rgba(0, 0, 0, 0.2)' }}>
                  {selectedCustomer.display_name || selectedCustomer.name || selectedCustomer.username}
                </div>
                <div className="text-neutral-500 text-xs">
                  {selectedCustomer.email}
                </div>
              </div>
              <div className="ml-2 flex-shrink-0">
                <CustomerPointsDisplay customerId={selectedCustomer.id} />
              </div>
            </div>
          </div>
        )}
        
        {/* Guest Customer Card */}
        {selectedCustomer && selectedCustomer.id === 0 && (
          <div className="bg-transparent hover:bg-neutral-600/5 border border-white/[0.06] hover:border-white/[0.12] rounded-lg p-2 mb-2 transition-all duration-300 ease-out">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="text-neutral-400 text-sm font-medium" style={{ fontFamily: 'Tiempos, serif', textShadow: '0 1px 2px rgba(0, 0, 0, 0.6), 0 0 4px rgba(0, 0, 0, 0.2)' }}>
                  Guest Customer
                </div>
                <div className="text-neutral-500 text-xs">
                  Walk-in customer
                </div>
              </div>
              <div className="ml-2 flex-shrink-0">
                <span className="text-xs text-neutral-500">0 Points</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Products List - Scrollable */}
      <div className="pr-2 space-y-0 mb-2 flex-1 overflow-y-auto">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between items-center text-xs p-2 bg-transparent hover:bg-neutral-600/5 border border-white/[0.06] hover:border-white/[0.12] rounded-lg mb-2 last:mb-0 transition-all duration-300 ease-out">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {/* Product Image */}
              <div className="w-6 h-6 relative overflow-hidden flex-shrink-0 rounded">
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
                      width={24}
                      height={24}
                      className="object-contain opacity-20"
                    />
                  </div>
                )}
              </div>
              
              {/* Product Details */}
              <div className="flex-1 min-w-0">
                <div className="text-neutral-400 truncate" style={{ fontFamily: 'Tiempos, serif', textShadow: '0 1px 2px rgba(0, 0, 0, 0.6), 0 0 4px rgba(0, 0, 0, 0.2)' }}>{item.name}</div>
                <div className="text-neutral-500">
                  ${item.price.toFixed(2)} × {item.quantity}
                </div>
                {/* Display pricing tier information if available */}
                {item.pricing_tier && (
                  <div className="text-xs text-neutral-400 mt-1">
                    {item.pricing_tier.tier_label}
                  </div>
                )}
              </div>
            </div>
            <div className="text-neutral-400 font-medium ml-2">
              ${(item.price * item.quantity).toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      {/* Totals - Fixed at bottom */}
        <div className="pt-2 pr-2 pb-2 border-t border-white/[0.06] space-y-1 flex-shrink-0">
        <div className="flex justify-between text-neutral-400 text-xs">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-neutral-400 text-xs">
          <span>{taxRate.name} ({(taxRate.rate * 100).toFixed(2)}%)</span>
          <span>${taxAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-neutral-400 text-sm font-semibold pt-1 border-t border-white/[0.06]">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};
