import React, { useState } from 'react';
import { PaymentMethod } from '../../../types';

export interface SplitPayment {
  method: PaymentMethod;
  amount: number;
}

interface PaymentMethodSelectorProps {
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  total: number;
  cashReceived: string;
  onCashReceivedChange: (value: string) => void;
  change: number;
  splitPayments?: SplitPayment[];
  onSplitPaymentsChange?: (payments: SplitPayment[]) => void;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  paymentMethod,
  onPaymentMethodChange,
  total,
  cashReceived,
  onCashReceivedChange,
  change,
  splitPayments = [],
  onSplitPaymentsChange
}) => {
  const [isSplitMode, setIsSplitMode] = useState(splitPayments.length > 0);
  const [editingPayment, setEditingPayment] = useState<{ method: PaymentMethod; amount: string }>({ method: 'cash', amount: '' });

  const totalPaid = splitPayments.reduce((sum, p) => sum + p.amount, 0);
  // Round to 2 decimal places to avoid floating point precision issues
  const remaining = Math.round((total - totalPaid) * 100) / 100;

  const handleAddPayment = () => {
    const amount = Math.round(parseFloat(editingPayment.amount) * 100) / 100;
    // More lenient tolerance for floating point comparison
    if (amount > 0 && amount <= remaining + 0.02) {
      // Cap the amount at remaining to avoid over-payment
      const finalAmount = Math.min(amount, remaining);
      const roundedAmount = Math.round(finalAmount * 100) / 100;
      const newPayments = [...splitPayments, { method: editingPayment.method, amount: roundedAmount }];
      onSplitPaymentsChange?.(newPayments);
      setEditingPayment({ method: 'cash', amount: '' });
    }
  };

  const handleRemovePayment = (index: number) => {
    const newPayments = splitPayments.filter((_, i) => i !== index);
    onSplitPaymentsChange?.(newPayments);
    if (newPayments.length === 0) {
      setIsSplitMode(false);
    }
  };

  const handleEnableSplitMode = () => {
    setIsSplitMode(true);
    setEditingPayment({ method: 'cash', amount: '' });
  };

  const handleDisableSplitMode = () => {
    setIsSplitMode(false);
    onSplitPaymentsChange?.([]);
  };
  if (isSplitMode) {
    return (
      <div className="bg-surface-card border border-border-subtle rounded-ios p-4 relative transition-all duration-200 mb-3">
        <div className="pb-3 flex items-center justify-between">
          <h3 className="text-body-sm font-tiempo font-medium text-white">Split Payment</h3>
          <button
            onClick={handleDisableSplitMode}
            className="text-caption-1 font-tiempo text-neutral-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* Split Payments List */}
        {splitPayments.length > 0 && (
          <div className="mb-3 space-y-2">
            {splitPayments.map((payment, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    {payment.method === 'cash' ? (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v2a2 2 0 002 2z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-mono font-medium text-neutral-400 lowercase">{payment.method}</div>
                    <div className="text-base font-mono font-bold text-white">${payment.amount.toFixed(2)}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemovePayment(index)}
                  className="w-7 h-7 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center transition-all active:scale-95"
                >
                  <svg className="w-3.5 h-3.5 text-neutral-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Payment Progress */}
        <div className="mb-3 p-3 bg-white/5 rounded-xl">
          <div className="flex justify-between text-xs font-mono mb-2">
            <span className="text-neutral-400 lowercase">paid</span>
            <span className="font-bold text-white">${totalPaid.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs font-mono mb-3">
            <span className="text-neutral-400 lowercase">remaining</span>
            <span className={`font-bold ${remaining > 0 ? 'text-neutral-200' : 'text-white'}`}>
              ${remaining.toFixed(2)}
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-300"
              style={{ width: `${Math.min((totalPaid / total) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Add Payment Section */}
        {remaining > 0 && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setEditingPayment({ ...editingPayment, method: 'cash' })}
                className={`p-3 rounded-xl transition-all duration-200 ${
                  editingPayment.method === 'cash'
                    ? 'bg-white/10 text-white'
                    : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-center mb-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v2a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-xs font-mono font-medium lowercase">cash</div>
              </button>
              <button
                onClick={() => setEditingPayment({ ...editingPayment, method: 'card' })}
                className={`p-3 rounded-xl transition-all duration-200 ${
                  editingPayment.method === 'card'
                    ? 'bg-white/10 text-white'
                    : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-center mb-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div className="text-xs font-mono font-medium lowercase">card</div>
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                value={editingPayment.amount}
                onChange={(e) => setEditingPayment({ ...editingPayment, amount: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const amount = Math.round(parseFloat(editingPayment.amount) * 100) / 100;
                    if (amount > 0 && amount <= remaining + 0.02) {
                      handleAddPayment();
                    }
                  }
                }}
                placeholder={`max: $${remaining.toFixed(2)}`}
                className="flex-1 px-4 py-3 bg-white/5 rounded-xl text-white text-center font-mono font-bold focus:bg-white/10 focus:outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                max={remaining}
                min="0"
                autoFocus
              />
              <button
                onClick={handleAddPayment}
                disabled={
                  !editingPayment.amount || 
                  parseFloat(editingPayment.amount) <= 0 || 
                  Math.round(parseFloat(editingPayment.amount) * 100) / 100 > remaining + 0.02
                }
                className="px-6 py-3 bg-white/10 hover:bg-white/15 text-white font-mono font-bold rounded-xl transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed lowercase text-sm"
              >
                add
              </button>
            </div>

            <button
              onClick={() => {
                setEditingPayment({ ...editingPayment, amount: remaining.toFixed(2) });
              }}
              className="w-full py-2 text-xs font-mono text-neutral-400 hover:text-white transition-colors lowercase"
            >
              pay remaining ${remaining.toFixed(2)}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 pt-3 pb-4 border-t border-white/5">
      <div className="mb-3">
        <h3 className="text-xs font-mono text-neutral-500 lowercase tracking-wider">payment</h3>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <button
          onClick={() => onPaymentMethodChange('cash')}
          className={`p-3 rounded-xl transition-all duration-300 ${
            paymentMethod === 'cash'
              ? 'bg-white/10 text-white'
              : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-center mb-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v2a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="text-xs font-mono font-medium lowercase">cash</div>
        </button>
        <button
          onClick={() => onPaymentMethodChange('card')}
          className={`p-3 rounded-xl transition-all duration-300 ${
            paymentMethod === 'card'
              ? 'bg-white/10 text-white'
              : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-center mb-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div className="text-xs font-mono font-medium lowercase">card</div>
        </button>
        <button
          onClick={handleEnableSplitMode}
          className="p-3 rounded-xl transition-all duration-300 bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white"
        >
          <div className="flex items-center justify-center mb-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <div className="text-xs font-mono font-medium lowercase">split</div>
        </button>
      </div>

      {/* Cash Payment Input */}
      {paymentMethod === 'cash' && (
        <div className="space-y-2">
          <input
            type="number"
            step="0.01"
            value={cashReceived}
            onChange={(e) => onCashReceivedChange(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white text-center text-lg font-mono font-bold focus:bg-white/10 focus:outline-none transition-all duration-300"
            placeholder="0.00"
            min="0"
          />
          {parseFloat(cashReceived) > 0 && (
            <div className="flex justify-between items-center py-2 px-3 bg-white/[0.02] rounded-xl">
              <span className="text-xs font-mono text-neutral-400 lowercase">change</span>
              <span className={`text-base font-mono font-bold ${
                change >= 0 ? 'text-white' : 'text-red-400'
              }`}>
                ${change.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Card Payment Info */}
      {paymentMethod === 'card' && (
        <div className="p-3 bg-white/[0.02] rounded-xl">
          <p className="text-xs font-mono text-neutral-400 text-center lowercase">
            process ${total.toFixed(2)} at terminal
          </p>
        </div>
      )}
    </div>
  );
};
