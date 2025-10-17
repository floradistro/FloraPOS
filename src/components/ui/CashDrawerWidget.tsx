'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { cashManagementService } from '../../services/cash-management-service';
import type { DrawerSession, DenominationBreakdown } from '../../types/cash';

interface CashDrawerWidgetProps {
  onClose?: () => void;
}

export const CashDrawerWidget: React.FC<CashDrawerWidgetProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [currentSession, setCurrentSession] = useState<DrawerSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'status' | 'open' | 'close' | 'drop'>('status');
  
  // Form states
  const [registerName, setRegisterName] = useState('Register 1');
  const [openingFloat, setOpeningFloat] = useState('200.00');
  const [actualCash, setActualCash] = useState('');
  const [dropAmount, setDropAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [denominationMode, setDenominationMode] = useState(false);
  
  // Denomination states
  const [hundreds, setHundreds] = useState('');
  const [fifties, setFifties] = useState('');
  const [twenties, setTwenties] = useState('');
  const [tens, setTens] = useState('');
  const [fives, setFives] = useState('');
  const [ones, setOnes] = useState('');
  
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.location_id) {
      fetchCurrentSession();
    }
  }, [user?.location_id]);

  const fetchCurrentSession = async () => {
    if (!user?.location_id) return;

    try {
      setLoading(true);
      const locationId = typeof user.location_id === 'string' ? parseInt(user.location_id) : user.location_id;
      const response = await cashManagementService.getCurrentDrawer(locationId);
      
      if (response.success && response.data?.session) {
        setCurrentSession(response.data.session);
        setRegisterName(response.data.session.register_name);
      }
    } catch (error) {
      console.error('Failed to fetch drawer session:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDenominationTotal = () => {
    return (
      parseFloat(hundreds || '0') * 100 +
      parseFloat(fifties || '0') * 50 +
      parseFloat(twenties || '0') * 20 +
      parseFloat(tens || '0') * 10 +
      parseFloat(fives || '0') * 5 +
      parseFloat(ones || '0')
    );
  };

  const handleOpenDrawer = async () => {
    if (!user?.location_id) return;

    setProcessing(true);
    setError(null);

    try {
      const locationId = typeof user.location_id === 'string' ? parseInt(user.location_id) : user.location_id;
      const response = await cashManagementService.openDrawer({
        location_id: locationId,
        register_name: registerName,
        opening_float: parseFloat(openingFloat),
        notes: notes || undefined
      });

      if (response.success && response.data) {
        setCurrentSession(response.data.session);
        setView('status');
        setNotes('');
      } else {
        setError(response.error || 'Failed to open drawer');
      }
    } catch (error) {
      setError('Failed to open drawer');
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const handleCloseDrawer = async () => {
    if (!currentSession) return;

    setProcessing(true);
    setError(null);

    try {
      const countedAmount = denominationMode ? calculateDenominationTotal() : parseFloat(actualCash);
      
      const denominationBreakdown: DenominationBreakdown | undefined = denominationMode ? {
        hundreds: parseFloat(hundreds || '0'),
        fifties: parseFloat(fifties || '0'),
        twenties: parseFloat(twenties || '0'),
        tens: parseFloat(tens || '0'),
        fives: parseFloat(fives || '0'),
        ones: parseFloat(ones || '0')
      } : undefined;

      const response = await cashManagementService.closeDrawer({
        session_id: currentSession.id,
        actual_cash_counted: countedAmount,
        denomination_breakdown: denominationBreakdown,
        notes: notes || undefined
      });

      if (response.success && response.data) {
        setCurrentSession(response.data.session);
        setView('status');
        setActualCash('');
        setNotes('');
        resetDenominations();
      } else {
        setError(response.error || 'Failed to close drawer');
      }
    } catch (error) {
      setError('Failed to close drawer');
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const handleRecordDrop = async () => {
    if (!currentSession || !user?.location_id) return;

    setProcessing(true);
    setError(null);

    try {
      const locationId = typeof user.location_id === 'string' ? parseInt(user.location_id) : user.location_id;
      const response = await cashManagementService.recordCashDrop({
        drawer_session_id: currentSession.id,
        location_id: locationId,
        amount: parseFloat(dropAmount),
        drop_type: 'safe_drop',
        notes: notes || undefined
      });

      if (response.success) {
        // Refresh session data
        await fetchCurrentSession();
        setView('status');
        setDropAmount('');
        setNotes('');
      } else {
        setError(response.error || 'Failed to record cash drop');
      }
    } catch (error) {
      setError('Failed to record cash drop');
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const resetDenominations = () => {
    setHundreds('');
    setFifties('');
    setTwenties('');
    setTens('');
    setFives('');
    setOnes('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-neutral-400 lowercase" style={{ fontFamily: 'Tiempos, serif' }}>
          loading drawer...
        </div>
      </div>
    );
  }

  const hasOpenDrawer = currentSession?.session_status === 'open';
  const variance = currentSession ? currentSession.variance : 0;

  return (
    <div className="max-w-2xl mx-auto p-8">
      {view === 'status' && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <div className="text-4xl font-extralight text-white mb-2" 
                 style={{ fontFamily: 'Tiempos, serif' }}>
              cash drawer
            </div>
            <div className="text-sm text-neutral-500 lowercase" 
                 style={{ fontFamily: 'Tiempos, serif' }}>
              {hasOpenDrawer ? 'drawer is open' : 'drawer is closed'}
            </div>
          </div>

          {hasOpenDrawer && currentSession && (
            <div className="bg-white/[0.02] backdrop-blur-xl rounded-2xl p-8 border border-white/5 mb-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-xs text-neutral-600 lowercase mb-2" 
                       style={{ fontFamily: 'Tiempos, serif' }}>
                    register
                  </div>
                  <div className="text-2xl font-light text-white" 
                       style={{ fontFamily: 'Tiempos, serif' }}>
                    {currentSession.register_name}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-neutral-600 lowercase mb-2" 
                       style={{ fontFamily: 'Tiempos, serif' }}>
                    opened at
                  </div>
                  <div className="text-2xl font-light text-white" 
                       style={{ fontFamily: 'Tiempos, serif' }}>
                    {new Date(currentSession.opened_at).toLocaleTimeString('en-US', { 
                      hour: 'numeric', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-neutral-600 lowercase mb-2" 
                       style={{ fontFamily: 'Tiempos, serif' }}>
                    opening float
                  </div>
                  <div className="text-2xl font-light text-white" 
                       style={{ fontFamily: 'Tiempos, serif' }}>
                    ${Number(currentSession.opening_float).toFixed(2)}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-neutral-600 lowercase mb-2" 
                       style={{ fontFamily: 'Tiempos, serif' }}>
                    cash sales
                  </div>
                  <div className="text-2xl font-light text-emerald-400" 
                       style={{ fontFamily: 'Tiempos, serif' }}>
                    ${Number(currentSession.expected_cash_sales).toFixed(2)}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-neutral-600 lowercase mb-2" 
                       style={{ fontFamily: 'Tiempos, serif' }}>
                    drops to safe
                  </div>
                  <div className="text-2xl font-light text-yellow-400" 
                       style={{ fontFamily: 'Tiempos, serif' }}>
                    ${Number(currentSession.cash_drops_total).toFixed(2)}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-neutral-600 lowercase mb-2" 
                       style={{ fontFamily: 'Tiempos, serif' }}>
                    expected total
                  </div>
                  <div className="text-2xl font-light text-white" 
                       style={{ fontFamily: 'Tiempos, serif' }}>
                    ${Number(currentSession.expected_total).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentSession?.session_status === 'closed' && variance !== 0 && (
            <div className={`bg-white/[0.02] backdrop-blur-xl rounded-xl p-6 border ${
              Math.abs(variance) > 10 ? 'border-red-500/50' :
              Math.abs(variance) > 5 ? 'border-yellow-500/50' :
              'border-emerald-500/50'
            } mb-6`}>
              <div className="text-center">
                <div className="text-xs text-neutral-600 lowercase mb-2" 
                     style={{ fontFamily: 'Tiempos, serif' }}>
                  variance
                </div>
                <div className={`text-3xl font-light ${
                  Math.abs(variance) > 10 ? 'text-red-400' :
                  Math.abs(variance) > 5 ? 'text-yellow-400' :
                  'text-emerald-400'
                }`} 
                     style={{ fontFamily: 'Tiempos, serif' }}>
                  {variance > 0 ? '+' : ''}{Number(variance).toFixed(2)}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {hasOpenDrawer ? (
              <>
                <button
                  onClick={() => setView('drop')}
                  className="w-full bg-white/[0.02] backdrop-blur-xl rounded-xl p-4 border border-white/5 hover:bg-white/[0.04] hover:border-yellow-500/50 transition-all duration-300"
                >
                  <div className="text-lg font-light text-white lowercase" 
                       style={{ fontFamily: 'Tiempos, serif' }}>
                    record cash drop
                  </div>
                </button>

                <button
                  onClick={() => setView('close')}
                  className="w-full bg-white/[0.02] backdrop-blur-xl rounded-xl p-4 border border-white/5 hover:bg-white/[0.04] hover:border-red-500/50 transition-all duration-300"
                >
                  <div className="text-lg font-light text-white lowercase" 
                       style={{ fontFamily: 'Tiempos, serif' }}>
                    close drawer
                  </div>
                </button>
              </>
            ) : (
              <button
                onClick={() => setView('open')}
                className="w-full bg-white/[0.02] backdrop-blur-xl rounded-xl p-4 border border-white/5 hover:bg-white/[0.04] hover:border-emerald-500/50 transition-all duration-300"
              >
                <div className="text-lg font-light text-white lowercase" 
                     style={{ fontFamily: 'Tiempos, serif' }}>
                  open drawer
                </div>
              </button>
            )}

            {onClose && (
              <button
                onClick={onClose}
                className="w-full bg-white/[0.02] backdrop-blur-xl rounded-xl p-4 border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300"
              >
                <div className="text-lg font-light text-neutral-400 lowercase" 
                     style={{ fontFamily: 'Tiempos, serif' }}>
                  close
                </div>
              </button>
            )}
          </div>
        </div>
      )}

      {view === 'open' && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <div className="text-3xl font-extralight text-white mb-2" 
                 style={{ fontFamily: 'Tiempos, serif' }}>
              open drawer
            </div>
          </div>

          <div>
            <label className="text-sm text-neutral-500 lowercase block mb-2" 
                   style={{ fontFamily: 'Tiempos, serif' }}>
              register name
            </label>
            <input
              type="text"
              value={registerName}
              onChange={(e) => setRegisterName(e.target.value)}
              className="w-full bg-white/[0.02] backdrop-blur-xl rounded-xl px-4 py-3 border border-white/5 focus:border-emerald-500/50 focus:outline-none text-white"
              style={{ fontFamily: 'Tiempos, serif' }}
              placeholder="Register 1"
            />
          </div>

          <div>
            <label className="text-sm text-neutral-500 lowercase block mb-2" 
                   style={{ fontFamily: 'Tiempos, serif' }}>
              opening float
            </label>
            <input
              type="number"
              step="0.01"
              value={openingFloat}
              onChange={(e) => setOpeningFloat(e.target.value)}
              className="w-full bg-white/[0.02] backdrop-blur-xl rounded-xl px-4 py-3 border border-white/5 focus:border-emerald-500/50 focus:outline-none text-white"
              style={{ fontFamily: 'Tiempos, serif' }}
              placeholder="200.00"
            />
          </div>

          <div>
            <label className="text-sm text-neutral-500 lowercase block mb-2" 
                   style={{ fontFamily: 'Tiempos, serif' }}>
              notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full bg-white/[0.02] backdrop-blur-xl rounded-xl px-4 py-3 border border-white/5 focus:border-emerald-500/50 focus:outline-none text-white resize-none"
              style={{ fontFamily: 'Tiempos, serif' }}
              placeholder="Optional notes..."
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4">
              <div className="text-sm text-red-400" style={{ fontFamily: 'Tiempos, serif' }}>
                {error}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleOpenDrawer}
              disabled={processing || !openingFloat}
              className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-xl p-4 border border-emerald-500/50 transition-all duration-300 disabled:opacity-50"
            >
              <div className="text-lg font-light text-white lowercase" 
                   style={{ fontFamily: 'Tiempos, serif' }}>
                {processing ? 'opening...' : 'open drawer'}
              </div>
            </button>

            <button
              onClick={() => setView('status')}
              className="bg-white/[0.02] backdrop-blur-xl rounded-xl px-6 py-4 border border-white/5 hover:bg-white/[0.04] transition-all duration-300"
            >
              <div className="text-lg font-light text-neutral-400 lowercase" 
                   style={{ fontFamily: 'Tiempos, serif' }}>
                cancel
              </div>
            </button>
          </div>
        </div>
      )}

      {view === 'close' && currentSession && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <div className="text-3xl font-extralight text-white mb-2" 
                 style={{ fontFamily: 'Tiempos, serif' }}>
              close drawer
            </div>
            <div className="text-sm text-neutral-500 lowercase" 
                 style={{ fontFamily: 'Tiempos, serif' }}>
              expected: ${Number(currentSession.expected_total).toFixed(2)}
            </div>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => setDenominationMode(false)}
              className={`flex-1 rounded-xl p-3 border transition-all duration-300 ${
                !denominationMode 
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-white' 
                  : 'bg-white/[0.02] border-white/5 text-neutral-500'
              }`}
              style={{ fontFamily: 'Tiempos, serif' }}
            >
              total amount
            </button>
            <button
              onClick={() => setDenominationMode(true)}
              className={`flex-1 rounded-xl p-3 border transition-all duration-300 ${
                denominationMode 
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-white' 
                  : 'bg-white/[0.02] border-white/5 text-neutral-500'
              }`}
              style={{ fontFamily: 'Tiempos, serif' }}
            >
              count bills
            </button>
          </div>

          {!denominationMode ? (
            <div>
              <label className="text-sm text-neutral-500 lowercase block mb-2" 
                     style={{ fontFamily: 'Tiempos, serif' }}>
                actual cash counted
              </label>
              <input
                type="number"
                step="0.01"
                value={actualCash}
                onChange={(e) => setActualCash(e.target.value)}
                className="w-full bg-white/[0.02] backdrop-blur-xl rounded-xl px-4 py-3 border border-white/5 focus:border-emerald-500/50 focus:outline-none text-white text-2xl"
                style={{ fontFamily: 'Tiempos, serif' }}
                placeholder="0.00"
              />
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { label: '$100s', value: hundreds, setValue: setHundreds, mult: 100 },
                { label: '$50s', value: fifties, setValue: setFifties, mult: 50 },
                { label: '$20s', value: twenties, setValue: setTwenties, mult: 20 },
                { label: '$10s', value: tens, setValue: setTens, mult: 10 },
                { label: '$5s', value: fives, setValue: setFives, mult: 5 },
                { label: '$1s', value: ones, setValue: setOnes, mult: 1 }
              ].map((denom) => (
                <div key={denom.label} className="flex items-center gap-4">
                  <div className="w-16 text-sm text-neutral-500" 
                       style={{ fontFamily: 'Tiempos, serif' }}>
                    {denom.label}
                  </div>
                  <input
                    type="number"
                    value={denom.value}
                    onChange={(e) => denom.setValue(e.target.value)}
                    className="flex-1 bg-white/[0.02] backdrop-blur-xl rounded-xl px-4 py-2 border border-white/5 focus:border-emerald-500/50 focus:outline-none text-white"
                    style={{ fontFamily: 'Tiempos, serif' }}
                    placeholder="0"
                  />
                  <div className="w-24 text-right text-sm text-neutral-400" 
                       style={{ fontFamily: 'Tiempos, serif' }}>
                    ${((parseFloat(denom.value) || 0) * denom.mult).toFixed(2)}
                  </div>
                </div>
              ))}
              
              <div className="bg-white/[0.05] rounded-xl p-4 mt-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-neutral-500 lowercase" 
                       style={{ fontFamily: 'Tiempos, serif' }}>
                    total counted
                  </div>
                  <div className="text-2xl font-light text-white" 
                       style={{ fontFamily: 'Tiempos, serif' }}>
                    ${calculateDenominationTotal().toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="text-sm text-neutral-500 lowercase block mb-2" 
                   style={{ fontFamily: 'Tiempos, serif' }}>
              notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-white/[0.02] backdrop-blur-xl rounded-xl px-4 py-3 border border-white/5 focus:border-emerald-500/50 focus:outline-none text-white resize-none"
              style={{ fontFamily: 'Tiempos, serif' }}
              placeholder="Reason for variance..."
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4">
              <div className="text-sm text-red-400" style={{ fontFamily: 'Tiempos, serif' }}>
                {error}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleCloseDrawer}
              disabled={processing || (!denominationMode && !actualCash)}
              className="flex-1 bg-red-500/20 hover:bg-red-500/30 rounded-xl p-4 border border-red-500/50 transition-all duration-300 disabled:opacity-50"
            >
              <div className="text-lg font-light text-white lowercase" 
                   style={{ fontFamily: 'Tiempos, serif' }}>
                {processing ? 'closing...' : 'close drawer'}
              </div>
            </button>

            <button
              onClick={() => setView('status')}
              className="bg-white/[0.02] backdrop-blur-xl rounded-xl px-6 py-4 border border-white/5 hover:bg-white/[0.04] transition-all duration-300"
            >
              <div className="text-lg font-light text-neutral-400 lowercase" 
                   style={{ fontFamily: 'Tiempos, serif' }}>
                cancel
              </div>
            </button>
          </div>
        </div>
      )}

      {view === 'drop' && currentSession && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <div className="text-3xl font-extralight text-white mb-2" 
                 style={{ fontFamily: 'Tiempos, serif' }}>
              record cash drop
            </div>
            <div className="text-sm text-neutral-500 lowercase" 
                 style={{ fontFamily: 'Tiempos, serif' }}>
              move cash from drawer to safe
            </div>
          </div>

          <div>
            <label className="text-sm text-neutral-500 lowercase block mb-2" 
                   style={{ fontFamily: 'Tiempos, serif' }}>
              drop amount
            </label>
            <input
              type="number"
              step="0.01"
              value={dropAmount}
              onChange={(e) => setDropAmount(e.target.value)}
              className="w-full bg-white/[0.02] backdrop-blur-xl rounded-xl px-4 py-3 border border-white/5 focus:border-yellow-500/50 focus:outline-none text-white text-2xl"
              style={{ fontFamily: 'Tiempos, serif' }}
              placeholder="500.00"
            />
          </div>

          <div>
            <label className="text-sm text-neutral-500 lowercase block mb-2" 
                   style={{ fontFamily: 'Tiempos, serif' }}>
              notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-white/[0.02] backdrop-blur-xl rounded-xl px-4 py-3 border border-white/5 focus:border-yellow-500/50 focus:outline-none text-white resize-none"
              style={{ fontFamily: 'Tiempos, serif' }}
              placeholder="Lunch rush drop..."
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4">
              <div className="text-sm text-red-400" style={{ fontFamily: 'Tiempos, serif' }}>
                {error}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleRecordDrop}
              disabled={processing || !dropAmount}
              className="flex-1 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-xl p-4 border border-yellow-500/50 transition-all duration-300 disabled:opacity-50"
            >
              <div className="text-lg font-light text-white lowercase" 
                   style={{ fontFamily: 'Tiempos, serif' }}>
                {processing ? 'recording...' : 'record drop'}
              </div>
            </button>

            <button
              onClick={() => setView('status')}
              className="bg-white/[0.02] backdrop-blur-xl rounded-xl px-6 py-4 border border-white/5 hover:bg-white/[0.04] transition-all duration-300"
            >
              <div className="text-lg font-light text-neutral-400 lowercase" 
                   style={{ fontFamily: 'Tiempos, serif' }}>
                cancel
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

