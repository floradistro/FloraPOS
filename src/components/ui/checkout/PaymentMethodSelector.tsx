import React from 'react';
import { PaymentMethod } from '../../../types';

interface PaymentMethodSelectorProps {
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  total: number;
  cashReceived: string;
  onCashReceivedChange: (value: string) => void;
  change: number;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  paymentMethod,
  onPaymentMethodChange,
  total,
  cashReceived,
  onCashReceivedChange,
  change
}) => {
  return (
    <div className="bg-neutral-900/80 hover:bg-neutral-800/90 border border-neutral-700/50 hover:border-neutral-600/60 rounded-lg overflow-hidden p-2 relative transition-all duration-300 ease-out mb-2">
      <div className="pt-2 pr-2 pb-2">
        <h3 className="text-sm font-medium text-neutral-400 mb-2">Payment Method</h3>
      </div>
      <div className="px-2 grid grid-cols-2 gap-2 mb-3">
        <button
          onClick={() => onPaymentMethodChange('cash')}
          className={`p-3 border rounded-lg transition-all duration-300 ease-out ${
            paymentMethod === 'cash'
              ? 'border-neutral-500 bg-neutral-800/90 text-neutral-200'
              : 'border-neutral-700/50 hover:border-neutral-600/60 text-neutral-300 hover:bg-neutral-800/90 hover:text-neutral-200'
          }`}
        >
          <div className="flex items-center justify-center mb-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v2a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="text-xs font-medium">Cash</div>
        </button>
        <button
          onClick={() => onPaymentMethodChange('card')}
          className={`p-3 border rounded-lg transition-all duration-300 ease-out ${
            paymentMethod === 'card'
              ? 'border-neutral-500 bg-neutral-800/90 text-neutral-200'
              : 'border-neutral-700/50 hover:border-neutral-600/60 text-neutral-300 hover:bg-neutral-800/90 hover:text-neutral-200'
          }`}
        >
          <div className="flex items-center justify-center mb-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div className="text-xs font-medium">Card</div>
        </button>
      </div>

      {/* Cash Payment Input */}
      {paymentMethod === 'cash' && (
        <div className="px-2 pb-2 space-y-2">
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Cash Received</label>
            <input
              type="number"
              step="0.01"
              value={cashReceived}
              onChange={(e) => onCashReceivedChange(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-900/80 hover:bg-neutral-800/90 border border-neutral-700/50 hover:border-neutral-600/60 rounded-lg text-neutral-200 focus:bg-neutral-800/90 focus:border-neutral-500 focus:outline-none text-sm transition-all duration-300 ease-out"
              placeholder="0.00"
              min="0"
            />
          </div>
          {parseFloat(cashReceived) > 0 && (
            <div className="flex justify-between items-center py-2 border-t border-neutral-700/50">
              <span className="text-neutral-400 text-xs">Change Due:</span>
              <span className={`text-sm font-semibold ${
                change >= 0 ? 'text-neutral-400' : 'text-neutral-500'
              }`}>
                ${change.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Card Payment Info */}
      {paymentMethod === 'card' && (
        <div className="px-2 pb-4 pt-2">
          <div className="p-2 border border-neutral-700/50 rounded-lg text-neutral-300 text-xs bg-neutral-900/80">
            <div className="flex items-center gap-2">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Process ${total.toFixed(2)} at terminal</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
