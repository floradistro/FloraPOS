'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { cashManagementService } from '../../services/cash-management-service';
import type { CashOnHand } from '../../types/cash';

interface CashOnHandWidgetProps {
  onClick?: () => void;
  autoRefresh?: boolean;
  refreshInterval?: number; // seconds
}

export const CashOnHandWidget: React.FC<CashOnHandWidgetProps> = ({
  onClick,
  autoRefresh = true,
  refreshInterval = 30
}) => {
  const { user } = useAuth();
  const [cashOnHand, setCashOnHand] = useState<CashOnHand | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.location_id) {
      fetchCashOnHand();
      
      if (autoRefresh) {
        const interval = setInterval(fetchCashOnHand, refreshInterval * 1000);
        return () => clearInterval(interval);
      }
    }
  }, [user?.location_id, autoRefresh, refreshInterval]);

  const fetchCashOnHand = async () => {
    if (!user?.location_id) return;

    try {
      const response = await cashManagementService.getCashOnHand(user.location_id);
      
      if (response.success && response.data) {
        setCashOnHand(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch cash on hand:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !cashOnHand) {
    return (
      <div className="bg-white/[0.02] backdrop-blur-xl rounded-2xl p-6 border border-white/5 h-full flex items-center justify-center">
        <div className="text-sm text-neutral-500 lowercase" style={{ fontFamily: 'Tiempos, serif' }}>
          loading...
        </div>
      </div>
    );
  }

  const totalCash = cashOnHand.total_cash_on_hand;
  const getHealthColor = (amount: number) => {
    if (amount > 10000) return 'text-red-400';
    if (amount > 5000) return 'text-yellow-400';
    return 'text-emerald-400';
  };

  const healthColor = getHealthColor(totalCash);

  return (
    <div 
      onClick={onClick}
      className={`bg-white/[0.02] backdrop-blur-xl rounded-2xl p-6 border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="text-sm text-neutral-500 font-light lowercase mb-4" 
           style={{ fontFamily: 'Tiempos, serif' }}>
        💰 cash on hand
      </div>

      <div className={`text-5xl font-extralight leading-none tracking-tighter ${healthColor} mb-6`} 
           style={{ fontFamily: 'Tiempos, serif' }}>
        ${(totalCash / 1000).toFixed(1)}k
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs text-neutral-600 lowercase" 
               style={{ fontFamily: 'Tiempos, serif' }}>
            in drawers
          </div>
          <div className="text-sm font-light text-white" 
               style={{ fontFamily: 'Tiempos, serif' }}>
            ${cashOnHand.cash_in_drawers.toLocaleString()}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-neutral-600 lowercase" 
               style={{ fontFamily: 'Tiempos, serif' }}>
            in safe
          </div>
          <div className="text-sm font-light text-white" 
               style={{ fontFamily: 'Tiempos, serif' }}>
            ${cashOnHand.cash_in_safe.toLocaleString()}
          </div>
        </div>

        <div className="h-px bg-white/5 my-2"></div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-neutral-600 lowercase" 
               style={{ fontFamily: 'Tiempos, serif' }}>
            this week
          </div>
          <div className="text-sm font-light text-emerald-400" 
               style={{ fontFamily: 'Tiempos, serif' }}>
            ${cashOnHand.current_week_cash_accumulated.toLocaleString()}
          </div>
        </div>

        {cashOnHand.pending_deposit_amount > 0 && (
          <div className="flex items-center justify-between">
            <div className="text-xs text-neutral-600 lowercase" 
                 style={{ fontFamily: 'Tiempos, serif' }}>
              pending deposit
            </div>
            <div className="text-sm font-light text-yellow-400" 
                 style={{ fontFamily: 'Tiempos, serif' }}>
              ${cashOnHand.pending_deposit_amount.toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

