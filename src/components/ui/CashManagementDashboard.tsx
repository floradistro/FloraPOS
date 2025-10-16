'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { cashManagementService } from '../../services/cash-management-service';
import { UnifiedLoadingScreen } from './UnifiedLoadingScreen';
import type { CashOnHand, DrawerSession, DailyReconciliation } from '../../types/cash';

interface CashManagementDashboardProps {
  onOpenDrawer?: () => void;
  onViewReconciliation?: () => void;
  onViewDeposits?: () => void;
}

export const CashManagementDashboard: React.FC<CashManagementDashboardProps> = ({
  onOpenDrawer,
  onViewReconciliation,
  onViewDeposits
}) => {
  const { user } = useAuth();
  const [cashOnHand, setCashOnHand] = useState<CashOnHand | null>(null);
  const [currentSession, setCurrentSession] = useState<DrawerSession | null>(null);
  const [recentSessions, setRecentSessions] = useState<DrawerSession[]>([]);
  const [todayReconciliation, setTodayReconciliation] = useState<DailyReconciliation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (user?.location_id) {
      fetchDashboardData();
    }
  }, [user?.location_id]);

  const fetchDashboardData = async () => {
    if (!user?.location_id) return;

    try {
      setLoading(true);

      // Fetch cash on hand
      const cashResponse = await cashManagementService.getCashOnHand(user.location_id);
      if (cashResponse.success && cashResponse.data) {
        setCashOnHand(cashResponse.data);
      }

      // Fetch current drawer session
      const drawerResponse = await cashManagementService.getCurrentDrawer(user.location_id);
      if (drawerResponse.success && drawerResponse.data?.session) {
        setCurrentSession(drawerResponse.data.session);
      }

      // Fetch recent sessions (last 7 days)
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const sessionsResponse = await cashManagementService.getDrawerSessions(
        user.location_id,
        weekAgo.toISOString().split('T')[0],
        today.toISOString().split('T')[0]
      );
      
      if (sessionsResponse.success && sessionsResponse.data?.sessions) {
        setRecentSessions(sessionsResponse.data.sessions.slice(0, 5));
      }

      // Fetch today's reconciliation
      const todayDate = today.toISOString().split('T')[0];
      const reconResponse = await cashManagementService.getDailyReconciliation(
        user.location_id,
        todayDate
      );
      
      if (reconResponse.success && reconResponse.data?.reconciliation) {
        setTodayReconciliation(reconResponse.data.reconciliation);
      }

    } catch (error) {
      console.error('Failed to fetch cash management data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <UnifiedLoadingScreen message="loading cash data..." />;
  }

  const totalCashOnHand = cashOnHand?.total_cash_on_hand || 0;
  const cashInDrawers = cashOnHand?.cash_in_drawers || 0;
  const cashInSafe = cashOnHand?.cash_in_safe || 0;
  const weekAccumulated = cashOnHand?.current_week_cash_accumulated || 0;
  const pendingDeposit = cashOnHand?.pending_deposit_amount || 0;

  // Calculate health color
  const getHealthColor = (amount: number) => {
    if (amount > 10000) return 'text-red-400';
    if (amount > 5000) return 'text-yellow-400';
    return 'text-emerald-400';
  };

  const healthColor = getHealthColor(totalCashOnHand);

  // Calculate drawer variance if session is open
  const drawerVariance = currentSession 
    ? (currentSession.expected_total - currentSession.opening_float - currentSession.expected_cash_sales + currentSession.cash_drops_total)
    : 0;

  const hasOpenDrawer = currentSession?.session_status === 'open';

  return (
    <div className="h-full overflow-auto">
      {/* Hero Insight - Cash on Hand */}
      <div className="max-w-5xl mx-auto px-12 pt-24 pb-12">
        <div 
          className="relative"
          style={{
            animation: 'fadeInUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0s both'
          }}
        >
          {/* Hero Number */}
          <div className="text-center mb-6">
            <div className={`text-[180px] font-extralight leading-none tracking-tighter ${healthColor} mb-6`} 
                 style={{ fontFamily: 'Tiempos, serif' }}>
              ${(totalCashOnHand / 1000).toFixed(1)}k
            </div>
            <div className="text-2xl text-neutral-400 font-light lowercase tracking-wider mb-3" 
                 style={{ fontFamily: 'Tiempos, serif' }}>
              total cash on hand
            </div>
            <div className="text-base text-neutral-600 font-light lowercase" 
                 style={{ fontFamily: 'Tiempos, serif' }}>
              {hasOpenDrawer ? 'drawer open' : 'all drawers closed'}
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-4 gap-6 pt-8 max-w-4xl mx-auto">
            {/* Cash in Drawers */}
            <div 
              className="bg-white/[0.02] backdrop-blur-xl rounded-2xl p-6 border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300"
              style={{
                animation: 'fadeInUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.1s both'
              }}
            >
              <div className="text-sm text-neutral-500 font-light lowercase mb-2" 
                   style={{ fontFamily: 'Tiempos, serif' }}>
                in drawers
              </div>
              <div className="text-4xl font-extralight text-white mb-1" 
                   style={{ fontFamily: 'Tiempos, serif' }}>
                ${cashInDrawers.toLocaleString()}
              </div>
              <div className="text-xs text-neutral-600 lowercase" 
                   style={{ fontFamily: 'Tiempos, serif' }}>
                {hasOpenDrawer ? 'current session' : 'closed'}
              </div>
            </div>

            {/* Cash in Safe */}
            <div 
              className="bg-white/[0.02] backdrop-blur-xl rounded-2xl p-6 border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300"
              style={{
                animation: 'fadeInUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.2s both'
              }}
            >
              <div className="text-sm text-neutral-500 font-light lowercase mb-2" 
                   style={{ fontFamily: 'Tiempos, serif' }}>
                in safe
              </div>
              <div className="text-4xl font-extralight text-white mb-1" 
                   style={{ fontFamily: 'Tiempos, serif' }}>
                ${cashInSafe.toLocaleString()}
              </div>
              <div className="text-xs text-neutral-600 lowercase" 
                   style={{ fontFamily: 'Tiempos, serif' }}>
                ready for deposit
              </div>
            </div>

            {/* Week Accumulated */}
            <div 
              className="bg-white/[0.02] backdrop-blur-xl rounded-2xl p-6 border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300"
              style={{
                animation: 'fadeInUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.3s both'
              }}
            >
              <div className="text-sm text-neutral-500 font-light lowercase mb-2" 
                   style={{ fontFamily: 'Tiempos, serif' }}>
                this week
              </div>
              <div className="text-4xl font-extralight text-white mb-1" 
                   style={{ fontFamily: 'Tiempos, serif' }}>
                ${weekAccumulated.toLocaleString()}
              </div>
              <div className="text-xs text-neutral-600 lowercase" 
                   style={{ fontFamily: 'Tiempos, serif' }}>
                accumulated
              </div>
            </div>

            {/* Pending Deposit */}
            <div 
              className="bg-white/[0.02] backdrop-blur-xl rounded-2xl p-6 border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300"
              style={{
                animation: 'fadeInUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.4s both'
              }}
            >
              <div className="text-sm text-neutral-500 font-light lowercase mb-2" 
                   style={{ fontFamily: 'Tiempos, serif' }}>
                pending
              </div>
              <div className="text-4xl font-extralight text-white mb-1" 
                   style={{ fontFamily: 'Tiempos, serif' }}>
                ${pendingDeposit.toLocaleString()}
              </div>
              <div className="text-xs text-neutral-600 lowercase" 
                   style={{ fontFamily: 'Tiempos, serif' }}>
                to deposit
              </div>
            </div>
          </div>

          {/* Detail Toggle */}
          <div className="text-center mt-12">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-neutral-500 hover:text-neutral-300 lowercase tracking-wide transition-colors"
              style={{ fontFamily: 'Tiempos, serif' }}
            >
              {showDetails ? 'hide details' : 'show details'}
            </button>
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      {showDetails && (
        <div className="max-w-5xl mx-auto px-12 pb-16">
          {/* Current Drawer Session */}
          {currentSession && (
            <div 
              className="mb-12"
              style={{
                animation: 'fadeInUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.2s both'
              }}
            >
              <div className="text-base text-neutral-500 font-light lowercase mb-6" 
                   style={{ fontFamily: 'Tiempos, serif' }}>
                current drawer session
              </div>
              
              <div className="bg-white/[0.02] backdrop-blur-xl rounded-2xl p-8 border border-white/5">
                <div className="grid grid-cols-3 gap-8">
                  <div>
                    <div className="text-xs text-neutral-600 lowercase mb-2" 
                         style={{ fontFamily: 'Tiempos, serif' }}>
                      register
                    </div>
                    <div className="text-xl font-light text-white" 
                         style={{ fontFamily: 'Tiempos, serif' }}>
                      {currentSession.register_name}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-neutral-600 lowercase mb-2" 
                         style={{ fontFamily: 'Tiempos, serif' }}>
                      opening float
                    </div>
                    <div className="text-xl font-light text-white" 
                         style={{ fontFamily: 'Tiempos, serif' }}>
                      ${currentSession.opening_float.toFixed(2)}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-neutral-600 lowercase mb-2" 
                         style={{ fontFamily: 'Tiempos, serif' }}>
                      expected cash
                    </div>
                    <div className="text-xl font-light text-white" 
                         style={{ fontFamily: 'Tiempos, serif' }}>
                      ${currentSession.expected_total.toFixed(2)}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-neutral-600 lowercase mb-2" 
                         style={{ fontFamily: 'Tiempos, serif' }}>
                      cash sales
                    </div>
                    <div className="text-xl font-light text-emerald-400" 
                         style={{ fontFamily: 'Tiempos, serif' }}>
                      ${currentSession.expected_cash_sales.toFixed(2)}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-neutral-600 lowercase mb-2" 
                         style={{ fontFamily: 'Tiempos, serif' }}>
                      drops to safe
                    </div>
                    <div className="text-xl font-light text-yellow-400" 
                         style={{ fontFamily: 'Tiempos, serif' }}>
                      ${currentSession.cash_drops_total.toFixed(2)}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-neutral-600 lowercase mb-2" 
                         style={{ fontFamily: 'Tiempos, serif' }}>
                      opened at
                    </div>
                    <div className="text-xl font-light text-white" 
                         style={{ fontFamily: 'Tiempos, serif' }}>
                      {new Date(currentSession.opened_at).toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Sessions */}
          {recentSessions.length > 0 && (
            <div 
              className="mb-12"
              style={{
                animation: 'fadeInUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.3s both'
              }}
            >
              <div className="text-base text-neutral-500 font-light lowercase mb-6" 
                   style={{ fontFamily: 'Tiempos, serif' }}>
                recent sessions
              </div>

              <div className="space-y-3">
                {recentSessions.map((session) => (
                  <div 
                    key={session.id}
                    className="bg-white/[0.02] backdrop-blur-xl rounded-xl p-6 border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div className="text-sm font-light text-white" 
                               style={{ fontFamily: 'Tiempos, serif' }}>
                            {session.register_name}
                          </div>
                          <div className={`text-xs px-2 py-1 rounded-full ${
                            session.session_status === 'open' ? 'bg-emerald-500/20 text-emerald-400' :
                            session.session_status === 'closed' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {session.session_status}
                          </div>
                        </div>
                        <div className="text-xs text-neutral-600 mt-1" 
                             style={{ fontFamily: 'Tiempos, serif' }}>
                          {new Date(session.opened_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <div className="text-xs text-neutral-600 lowercase mb-1" 
                               style={{ fontFamily: 'Tiempos, serif' }}>
                            expected
                          </div>
                          <div className="text-sm font-light text-white" 
                               style={{ fontFamily: 'Tiempos, serif' }}>
                            ${session.expected_total.toFixed(2)}
                          </div>
                        </div>
                        
                        {session.actual_cash_counted !== null && (
                          <div className="text-right">
                            <div className="text-xs text-neutral-600 lowercase mb-1" 
                                 style={{ fontFamily: 'Tiempos, serif' }}>
                              actual
                            </div>
                            <div className="text-sm font-light text-white" 
                                 style={{ fontFamily: 'Tiempos, serif' }}>
                              ${session.actual_cash_counted.toFixed(2)}
                            </div>
                          </div>
                        )}
                        
                        {session.variance !== 0 && (
                          <div className="text-right">
                            <div className="text-xs text-neutral-600 lowercase mb-1" 
                                 style={{ fontFamily: 'Tiempos, serif' }}>
                              variance
                            </div>
                            <div className={`text-sm font-light ${
                              Math.abs(session.variance) > 10 ? 'text-red-400' :
                              Math.abs(session.variance) > 5 ? 'text-yellow-400' :
                              'text-emerald-400'
                            }`} 
                                 style={{ fontFamily: 'Tiempos, serif' }}>
                              {session.variance > 0 ? '+' : ''}{session.variance.toFixed(2)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div 
            className="grid grid-cols-3 gap-4"
            style={{
              animation: 'fadeInUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.4s both'
            }}
          >
            <button
              onClick={onOpenDrawer}
              className="bg-white/[0.02] backdrop-blur-xl rounded-xl p-6 border border-white/5 hover:bg-white/[0.04] hover:border-emerald-500/50 transition-all duration-300"
            >
              <div className="text-lg font-light text-white lowercase" 
                   style={{ fontFamily: 'Tiempos, serif' }}>
                {hasOpenDrawer ? 'close drawer' : 'open drawer'}
              </div>
            </button>

            <button
              onClick={onViewReconciliation}
              className="bg-white/[0.02] backdrop-blur-xl rounded-xl p-6 border border-white/5 hover:bg-white/[0.04] hover:border-blue-500/50 transition-all duration-300"
            >
              <div className="text-lg font-light text-white lowercase" 
                   style={{ fontFamily: 'Tiempos, serif' }}>
                reconciliation
              </div>
            </button>

            <button
              onClick={onViewDeposits}
              className="bg-white/[0.02] backdrop-blur-xl rounded-xl p-6 border border-white/5 hover:bg-white/[0.04] hover:border-yellow-500/50 transition-all duration-300"
            >
              <div className="text-lg font-light text-white lowercase" 
                   style={{ fontFamily: 'Tiempos, serif' }}>
                deposits
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

