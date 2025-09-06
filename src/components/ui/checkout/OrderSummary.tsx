import React from 'react';
import { CartItem, TaxRate } from '../../../types';

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  taxRate: TaxRate;
  taxAmount: number;
  total: number;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  items,
  subtotal,
  taxRate,
  taxAmount,
  total
}) => {
  return (
    <div className="bg-transparent rounded-lg overflow-hidden p-2 relative transition-all duration-300 ease-out hover:bg-neutral-800/20 shadow-sm border border-white/[0.06] hover:border-white/[0.12] mb-2 flex flex-col flex-1">
      {/* Header - Fixed */}
      <div className="pt-2 pr-2 pb-2 flex-shrink-0">
        <h3 className="text-sm font-medium text-neutral-400 mb-2">Order Summary</h3>
      </div>
      
      {/* Products List - Scrollable */}
      <div className="pr-2 space-y-0 mb-2 flex-1 overflow-y-auto">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between items-center text-xs p-2 bg-neutral-800/20 rounded-lg mb-2 last:mb-0 transition-all duration-300 ease-out hover:bg-neutral-700/30 border border-white/[0.04] hover:border-white/[0.08]">
            <div className="flex-1 min-w-0">
              <div className="text-neutral-400 truncate">{item.name}</div>
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
