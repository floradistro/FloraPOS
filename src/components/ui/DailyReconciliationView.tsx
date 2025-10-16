'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { cashManagementService } from '../../services/cash-management-service';
import type { DailyReconciliation, DrawerSession } from '../../types/cash';

interface DailyReconciliationViewProps {
  onClose?: () => void;
}

export const DailyReconciliationView: React.FC<DailyReconciliationViewProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [reconciliation, setReconciliation] = useState<DailyReconciliation | null>(null);
  const [sessions, setSessions] = useState<DrawerSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.location_id) {
      fetchReconciliation();
    }
  }, [user?.location_id, selectedDate]);

  const fetchReconciliation = async () => {
    if (!user?.location_id) return;

    try {
      setLoading(true);
      setError(null);
      
      const locationId = typeof user.location_id === 'string' ? parseInt(user.location_id) : user.location_id;

      // Fetch reconciliation for selected date
      const reconResponse = await cashManagementService.getDailyReconciliation(
        locationId,
        selectedDate
      );

      if (reconResponse.success && reconResponse.data?.reconciliation) {
        setReconciliation(reconResponse.data.reconciliation);
      } else {
        setReconciliation(null);
      }

      // Fetch drawer sessions for this date
      const sessionsResponse = await cashManagementService.getDrawerSessions(
        locationId,
        selectedDate,
        selectedDate
      );

      if (sessionsResponse.success && sessionsResponse.data?.sessions) {
        setSessions(sessionsResponse.data.sessions);
      }
    } catch (error) {
      console.error('Failed to fetch reconciliation:', error);
      setError('Failed to load reconciliation data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReconciliation = async () => {
    if (!user?.location_id) return;

    setCreating(true);
    setError(null);

    try {
      const locationId = typeof user.location_id === 'string' ? parseInt(user.location_id) : user.location_id;
      const response = await cashManagementService.createDailyReconciliation({
        location_id: locationId,
        business_date: selectedDate
      });

      if (response.success && response.data?.reconciliation) {
        setReconciliation(response.data.reconciliation);
      } else {
        setError(response.error || 'Failed to create reconciliation');
      }
    } catch (error) {
      setError('Failed to create reconciliation');
      console.error(error);
    } finally {
      setCreating(false);
    }
  };

  const handleApprove = async () => {
    if (!reconciliation) return;

    try {
      const response = await cashManagementService.approveReconciliation(reconciliation.id);
      
      if (response.success) {
        // Refresh data
        await fetchReconciliation();
      } else {
        setError(response.error || 'Failed to approve reconciliation');
      }
    } catch (error) {
      setError('Failed to approve reconciliation');
      console.error(error);
    }
  };

  const canCreate = sessions.length > 0 && sessions.every(s => s.session_status !== 'open');

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-5xl mx-auto px-12 pt-24 pb-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="text-4xl font-extralight text-white mb-4" 
               style={{ fontFamily: 'Tiempos, serif' }}>
            daily reconciliation
          </div>
          
          {/* Date Selector */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => {
                const date = new Date(selectedDate);
                date.setDate(date.getDate() - 1);
                setSelectedDate(date.toISOString().split('T')[0]);
              }}
              className="px-4 py-2 bg-white/[0.02] backdrop-blur-xl rounded-xl border border-white/5 hover:bg-white/[0.04] transition-all"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 bg-white/[0.02] backdrop-blur-xl rounded-xl border border-white/5 text-white"
              style={{ fontFamily: 'Tiempos, serif' }}
            />
            
            <button
              onClick={() => {
                const date = new Date(selectedDate);
                date.setDate(date.getDate() + 1);
                setSelectedDate(date.toISOString().split('T')[0]);
              }}
              className="px-4 py-2 bg-white/[0.02] backdrop-blur-xl rounded-xl border border-white/5 hover:bg-white/[0.04] transition-all"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-neutral-500 py-12">loading...</div>
        ) : (
          <>
            {/* Reconciliation Summary */}
            {reconciliation ? (
              <div className="space-y-6">
                {/* Status Badge */}
                <div className="text-center mb-8">
                  <div className={`inline-block px-6 py-2 rounded-full ${
                    reconciliation.reconciliation_status === 'approved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' :
                    reconciliation.reconciliation_status === 'completed' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' :
                    'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                  }`} style={{ fontFamily: 'Tiempos, serif' }}>
                    {reconciliation.reconciliation_status}
                  </div>
                </div>

                {/* Main Stats */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                  <div className="bg-white/[0.02] backdrop-blur-xl rounded-2xl p-8 border border-white/5">
                    <div className="text-sm text-neutral-500 lowercase mb-2" style={{ fontFamily: 'Tiempos, serif' }}>
                      total sales
                    </div>
                    <div className="text-4xl font-extralight text-white" style={{ fontFamily: 'Tiempos, serif' }}>
                      ${reconciliation.total_sales.toLocaleString()}
                    </div>
                  </div>

                  <div className="bg-white/[0.02] backdrop-blur-xl rounded-2xl p-8 border border-white/5">
                    <div className="text-sm text-neutral-500 lowercase mb-2" style={{ fontFamily: 'Tiempos, serif' }}>
                      cash sales
                    </div>
                    <div className="text-4xl font-extralight text-emerald-400" style={{ fontFamily: 'Tiempos, serif' }}>
                      ${reconciliation.cash_sales.toLocaleString()}
                    </div>
                  </div>

                  <div className="bg-white/[0.02] backdrop-blur-xl rounded-2xl p-8 border border-white/5">
                    <div className="text-sm text-neutral-500 lowercase mb-2" style={{ fontFamily: 'Tiempos, serif' }}>
                      card sales
                    </div>
                    <div className="text-4xl font-extralight text-blue-400" style={{ fontFamily: 'Tiempos, serif' }}>
                      ${reconciliation.card_sales.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Cash Breakdown */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="bg-white/[0.02] backdrop-blur-xl rounded-2xl p-6 border border-white/5">
                    <div className="text-sm text-neutral-500 lowercase mb-4" style={{ fontFamily: 'Tiempos, serif' }}>
                      cash in safe
                    </div>
                    <div className="text-3xl font-extralight text-yellow-400 mb-2" style={{ fontFamily: 'Tiempos, serif' }}>
                      ${reconciliation.cash_in_safe.toLocaleString()}
                    </div>
                    <div className="text-xs text-neutral-600" style={{ fontFamily: 'Tiempos, serif' }}>
                      from {reconciliation.total_cash_drops.toLocaleString()} in drops
                    </div>
                  </div>

                  <div className="bg-white/[0.02] backdrop-blur-xl rounded-2xl p-6 border border-white/5">
                    <div className="text-sm text-neutral-500 lowercase mb-4" style={{ fontFamily: 'Tiempos, serif' }}>
                      cash in drawers
                    </div>
                    <div className="text-3xl font-extralight text-white mb-2" style={{ fontFamily: 'Tiempos, serif' }}>
                      ${reconciliation.cash_in_drawers.toLocaleString()}
                    </div>
                    <div className="text-xs text-neutral-600" style={{ fontFamily: 'Tiempos, serif' }}>
                      closing counts
                    </div>
                  </div>
                </div>

                {/* Variance */}
                {reconciliation.total_variance !== 0 && (
                  <div className={`bg-white/[0.02] backdrop-blur-xl rounded-2xl p-6 border ${
                    Math.abs(reconciliation.total_variance) > 20 ? 'border-red-500/50' :
                    Math.abs(reconciliation.total_variance) > 10 ? 'border-yellow-500/50' :
                    'border-emerald-500/50'
                  }`}>
                    <div className="text-center">
                      <div className="text-sm text-neutral-500 lowercase mb-2" style={{ fontFamily: 'Tiempos, serif' }}>
                        total variance
                      </div>
                      <div className={`text-4xl font-extralight ${
                        Math.abs(reconciliation.total_variance) > 20 ? 'text-red-400' :
                        Math.abs(reconciliation.total_variance) > 10 ? 'text-yellow-400' :
                        'text-emerald-400'
                      }`} style={{ fontFamily: 'Tiempos, serif' }}>
                        {reconciliation.total_variance > 0 ? '+' : ''}{reconciliation.total_variance.toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Drawer Sessions Breakdown */}
                {sessions.length > 0 && (
                  <div className="mt-8">
                    <div className="text-base text-neutral-500 lowercase mb-4" style={{ fontFamily: 'Tiempos, serif' }}>
                      drawer sessions ({sessions.length})
                    </div>
                    
                    <div className="space-y-3">
                      {sessions.map((session) => (
                        <div key={session.id} className="bg-white/[0.02] backdrop-blur-xl rounded-xl p-6 border border-white/5">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-light text-white mb-1" style={{ fontFamily: 'Tiempos, serif' }}>
                                {session.register_name}
                              </div>
                              <div className="text-xs text-neutral-600" style={{ fontFamily: 'Tiempos, serif' }}>
                                {new Date(session.opened_at).toLocaleTimeString()} - {session.closed_at ? new Date(session.closed_at).toLocaleTimeString() : 'open'}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-6">
                              <div className="text-right">
                                <div className="text-xs text-neutral-600 lowercase" style={{ fontFamily: 'Tiempos, serif' }}>expected</div>
                                <div className="text-sm text-white" style={{ fontFamily: 'Tiempos, serif' }}>${session.expected_total.toFixed(2)}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-neutral-600 lowercase" style={{ fontFamily: 'Tiempos, serif' }}>actual</div>
                                <div className="text-sm text-white" style={{ fontFamily: 'Tiempos, serif' }}>${session.actual_cash_counted?.toFixed(2) || '—'}</div>
                              </div>
                              {session.variance !== 0 && (
                                <div className="text-right">
                                  <div className="text-xs text-neutral-600 lowercase" style={{ fontFamily: 'Tiempos, serif' }}>variance</div>
                                  <div className={`text-sm ${
                                    Math.abs(session.variance) > 10 ? 'text-red-400' :
                                    Math.abs(session.variance) > 5 ? 'text-yellow-400' :
                                    'text-emerald-400'
                                  }`} style={{ fontFamily: 'Tiempos, serif' }}>
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

                {/* Actions */}
                {reconciliation.reconciliation_status === 'completed' && (
                  <div className="flex gap-4 mt-8">
                    <button
                      onClick={handleApprove}
                      className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-xl p-4 border border-emerald-500/50 transition-all"
                    >
                      <div className="text-lg font-light text-white lowercase" style={{ fontFamily: 'Tiempos, serif' }}>
                        approve reconciliation
                      </div>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                {canCreate ? (
                  <div className="space-y-6">
                    <div className="text-neutral-500 mb-6" style={{ fontFamily: 'Tiempos, serif' }}>
                      {sessions.length} drawer session(s) ready to reconcile
                    </div>
                    
                    <button
                      onClick={handleCreateReconciliation}
                      disabled={creating}
                      className="bg-emerald-500/20 hover:bg-emerald-500/30 rounded-xl px-8 py-4 border border-emerald-500/50 transition-all disabled:opacity-50"
                    >
                      <div className="text-lg font-light text-white lowercase" style={{ fontFamily: 'Tiempos, serif' }}>
                        {creating ? 'creating reconciliation...' : 'create daily reconciliation'}
                      </div>
                    </button>
                  </div>
                ) : (
                  <div className="text-neutral-500" style={{ fontFamily: 'Tiempos, serif' }}>
                    {sessions.length === 0 
                      ? 'no drawer sessions for this date'
                      : 'close all drawer sessions first'
                    }
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="mt-6 bg-red-500/10 border border-red-500/50 rounded-xl p-4">
                <div className="text-sm text-red-400" style={{ fontFamily: 'Tiempos, serif' }}>
                  {error}
                </div>
              </div>
            )}

            {onClose && (
              <div className="mt-8">
                <button
                  onClick={onClose}
                  className="w-full bg-white/[0.02] backdrop-blur-xl rounded-xl p-4 border border-white/5 hover:bg-white/[0.04] transition-all"
                >
                  <div className="text-lg font-light text-neutral-400 lowercase" style={{ fontFamily: 'Tiempos, serif' }}>
                    close
                  </div>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

