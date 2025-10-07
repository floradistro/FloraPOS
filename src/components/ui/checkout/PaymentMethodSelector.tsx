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
      <div className="bg-white/[0.02] hover:bg-white/[0.04] backdrop-blur-md border border-white/[0.08] hover:border-white/[0.12] rounded-xl p-3 relative transition-all duration-300 ease-out mb-3 shadow-lg">
        <div className="pt-2 pr-2 pb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-300" style={{ fontFamily: 'Tiempos, serif' }}>Split Payment</h3>
          <button
            onClick={handleDisableSplitMode}
            className="text-sm text-neutral-400 hover:text-neutral-200 font-medium transition-colors"
          >
            Cancel Split
          </button>
        </div>

        {/* Split Payments List */}
        {splitPayments.length > 0 && (
          <div className="px-2 mb-4 space-y-2">
            {splitPayments.map((payment, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/[0.05] border border-white/[0.1] rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-600/20 border border-green-500/30 flex items-center justify-center">
                    {payment.method === 'cash' ? (
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v2a2 2 0 002 2z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-neutral-200 capitalize">{payment.method}</div>
                    <div className="text-lg font-bold text-green-400">${payment.amount.toFixed(2)}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemovePayment(index)}
                  className="w-8 h-8 bg-red-600/10 hover:bg-red-600/20 border border-red-500/30 hover:border-red-500/50 rounded-lg flex items-center justify-center transition-all active:scale-95"
                >
                  <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Payment Progress */}
        <div className="px-2 mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-neutral-400">Paid</span>
            <span className="font-semibold text-green-400">${totalPaid.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-neutral-400">Remaining</span>
            <span className={`font-bold ${remaining > 0 ? 'text-orange-400' : 'text-green-400'}`}>
              ${remaining.toFixed(2)}
            </span>
          </div>
          <div className="w-full bg-white/[0.05] rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300"
              style={{ width: `${Math.min((totalPaid / total) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Add Payment Section */}
        {remaining > 0 && (
          <div className="px-2 pb-2 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setEditingPayment({ ...editingPayment, method: 'cash' })}
                className={`p-3 border rounded-xl transition-all duration-200 ${
                  editingPayment.method === 'cash'
                    ? 'border-white/[0.2] bg-white/[0.08] text-neutral-200'
                    : 'border-white/[0.08] hover:border-white/[0.15] text-neutral-400'
                }`}
              >
                <div className="flex items-center justify-center mb-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v2a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-xs font-semibold">Cash</div>
              </button>
              <button
                onClick={() => setEditingPayment({ ...editingPayment, method: 'card' })}
                className={`p-3 border rounded-xl transition-all duration-200 ${
                  editingPayment.method === 'card'
                    ? 'border-white/[0.2] bg-white/[0.08] text-neutral-200'
                    : 'border-white/[0.08] hover:border-white/[0.15] text-neutral-400'
                }`}
              >
                <div className="flex items-center justify-center mb-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div className="text-xs font-semibold">Card</div>
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
                placeholder={`Max: $${remaining.toFixed(2)}`}
                className="flex-1 px-4 py-3 bg-white/[0.03] border border-white/[0.1] rounded-xl text-neutral-200 text-base font-semibold focus:bg-white/[0.05] focus:border-white/[0.2] focus:outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                className="px-6 py-3 bg-gradient-to-r from-green-600/20 to-emerald-600/20 hover:from-green-600/30 hover:to-emerald-600/30 border border-green-500/40 hover:border-green-500/60 text-green-300 font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>

            <button
              onClick={() => {
                setEditingPayment({ ...editingPayment, amount: remaining.toFixed(2) });
              }}
              className="w-full py-2 text-sm text-neutral-400 hover:text-neutral-200 font-medium transition-colors"
            >
              Pay Remaining ${remaining.toFixed(2)}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white/[0.02] hover:bg-white/[0.04] backdrop-blur-md border border-white/[0.08] hover:border-white/[0.12] rounded-xl p-3 relative transition-all duration-300 ease-out mb-3 shadow-lg">
      <div className="pt-2 pr-2 pb-3">
        <h3 className="text-lg font-semibold text-neutral-300 mb-3" style={{ fontFamily: 'Tiempos, serif' }}>Payment Method</h3>
      </div>
      <div className="px-2 grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={() => onPaymentMethodChange('cash')}
          className={`p-4 border rounded-xl transition-all duration-300 ease-out shadow-md hover:shadow-lg ${
            paymentMethod === 'cash'
              ? 'border-white/[0.2] bg-white/[0.08] text-neutral-200 shadow-lg'
              : 'border-white/[0.08] hover:border-white/[0.15] text-neutral-400 hover:bg-white/[0.04] hover:text-neutral-300'
          }`}
        >
          <div className="flex items-center justify-center mb-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v2a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="text-sm font-semibold">Cash</div>
        </button>
        <button
          onClick={() => onPaymentMethodChange('card')}
          className={`p-4 border rounded-xl transition-all duration-300 ease-out shadow-md hover:shadow-lg ${
            paymentMethod === 'card'
              ? 'border-white/[0.2] bg-white/[0.08] text-neutral-200 shadow-lg'
              : 'border-white/[0.08] hover:border-white/[0.15] text-neutral-400 hover:bg-white/[0.04] hover:text-neutral-300'
          }`}
        >
          <div className="flex items-center justify-center mb-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div className="text-sm font-semibold">Card</div>
        </button>
      </div>

      {/* Split Payment Button */}
      <div className="px-2 mb-4">
        <button
          onClick={handleEnableSplitMode}
          className="w-full py-3 bg-gradient-to-r from-purple-600/20 to-blue-600/20 hover:from-purple-600/30 hover:to-blue-600/30 border border-purple-500/40 hover:border-purple-500/60 text-purple-300 font-semibold rounded-xl transition-all active:scale-98 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          <span>Split Payment</span>
        </button>
      </div>

      {/* Cash Payment Input */}
      {paymentMethod === 'cash' && (
        <div className="px-2 pb-2 space-y-3">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Cash Received</label>
            <input
              type="number"
              step="0.01"
              value={cashReceived}
              onChange={(e) => onCashReceivedChange(e.target.value)}
              className="w-full px-4 py-3 bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.1] hover:border-white/[0.15] rounded-xl text-neutral-200 text-base font-semibold focus:bg-white/[0.05] focus:border-white/[0.2] focus:outline-none transition-all duration-300 ease-out shadow-inner"
              placeholder="0.00"
              min="0"
            />
          </div>
          {parseFloat(cashReceived) > 0 && (
            <div className="flex justify-between items-center py-3 px-2 border-t border-white/[0.1] bg-gradient-to-r from-white/[0.02] to-transparent rounded-lg">
              <span className="text-neutral-300 text-sm font-medium">Change Due:</span>
              <span className={`text-lg font-bold ${
                change >= 0 ? 'text-green-400' : 'text-red-400'
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
          <div className="p-3 border border-white/[0.1] rounded-xl text-neutral-300 text-sm bg-white/[0.03] backdrop-blur-md shadow-inner">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">Process ${total.toFixed(2)} at terminal</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
