'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { cashManagementService } from '../../services/cash-management-service';
import type { WeeklyDeposit, CashOnHand } from '../../types/cash';

interface WeeklyDepositsViewProps {
  onClose?: () => void;
}

export const WeeklyDepositsView: React.FC<WeeklyDepositsViewProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [deposits, setDeposits] = useState<WeeklyDeposit[]>([]);
  const [cashOnHand, setCashOnHand] = useState<CashOnHand | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState<WeeklyDeposit | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [pickupPerson, setPickupPerson] = useState('');
  const [depositSlip, setDepositSlip] = useState('');
  const [bankAmount, setBankAmount] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (user?.location_id) {
      fetchData();
    }
  }, [user?.location_id]);

  const fetchData = async () => {
    if (!user?.location_id) return;

    try {
      setLoading(true);
      setError(null);
      
      const locationId = typeof user.location_id === 'string' ? parseInt(user.location_id) : user.location_id;

      // Fetch deposits
      const depositsResponse = await cashManagementService.getWeeklyDeposits(locationId);
      if (depositsResponse.success && depositsResponse.data?.deposits) {
        setDeposits(depositsResponse.data.deposits);
      }

      // Fetch cash on hand
      const cashResponse = await cashManagementService.getCashOnHand(locationId);
      if (cashResponse.success && cashResponse.data) {
        setCashOnHand(cashResponse.data);
      }
    } catch (error) {
      console.error('Failed to fetch deposits:', error);
      setError('Failed to load deposits');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDeposit = async () => {
    if (!user?.location_id) return;

    setCreating(true);
    setError(null);

    try {
      const locationId = typeof user.location_id === 'string' ? parseInt(user.location_id) : user.location_id;
      const response = await cashManagementService.createWeeklyDeposit({
        location_id: locationId
      });

      if (response.success && response.data?.deposit) {
        await fetchData();
      } else {
        setError(response.error || 'Failed to create deposit');
      }
    } catch (error) {
      setError('Failed to create deposit');
      console.error(error);
    } finally {
      setCreating(false);
    }
  };

  const handleMarkPrepared = async (depositId: number) => {
    try {
      const response = await cashManagementService.markDepositPrepared(depositId, { notes });
      if (response.success) {
        await fetchData();
        setSelectedDeposit(null);
        setNotes('');
      } else {
        setError(response.error || 'Failed to mark prepared');
      }
    } catch (error) {
      setError('Failed to mark prepared');
    }
  };

  const handleMarkPickedUp = async (depositId: number) => {
    if (!pickupPerson) {
      setError('Pickup person name is required');
      return;
    }

    try {
      const response = await cashManagementService.markDepositPickedUp(depositId, {
        picked_up_by: pickupPerson,
        notes
      });
      
      if (response.success) {
        await fetchData();
        setSelectedDeposit(null);
        setPickupPerson('');
        setNotes('');
      } else {
        setError(response.error || 'Failed to mark picked up');
      }
    } catch (error) {
      setError('Failed to mark picked up');
    }
  };

  const handleMarkDeposited = async (depositId: number) => {
    try {
      const response = await cashManagementService.markDepositDeposited(depositId, {
        bank_deposit_slip: depositSlip,
        notes
      });
      
      if (response.success) {
        await fetchData();
        setSelectedDeposit(null);
        setDepositSlip('');
        setNotes('');
      } else {
        setError(response.error || 'Failed to mark deposited');
      }
    } catch (error) {
      setError('Failed to mark deposited');
    }
  };

  const handleVerifyDeposit = async (depositId: number) => {
    if (!bankAmount) {
      setError('Bank verified amount is required');
      return;
    }

    try {
      const response = await cashManagementService.verifyDeposit(depositId, {
        bank_verified_amount: parseFloat(bankAmount),
        notes
      });
      
      if (response.success) {
        await fetchData();
        setSelectedDeposit(null);
        setBankAmount('');
        setNotes('');
      } else {
        setError(response.error || 'Failed to verify deposit');
      }
    } catch (error) {
      setError('Failed to verify deposit');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
      case 'deposited': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'picked_up': return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
      case 'prepared': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      default: return 'bg-white/[0.05] text-neutral-400 border-white/10';
    }
  };

  const currentWeekCash = cashOnHand?.current_week_cash_accumulated || 0;
  const canCreateDeposit = currentWeekCash > 0;

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-5xl mx-auto px-12 pt-24 pb-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="text-4xl font-extralight text-white mb-2" style={{ fontFamily: 'Tiempos, serif' }}>
            weekly deposits
          </div>
          <div className="text-lg text-neutral-500 lowercase mt-4" style={{ fontFamily: 'Tiempos, serif' }}>
            current week: ${currentWeekCash.toLocaleString()}
          </div>
        </div>

        {/* Create New Deposit */}
        {canCreateDeposit && (
          <div className="mb-12 text-center">
            <button
              onClick={handleCreateDeposit}
              disabled={creating}
              className="bg-emerald-500/20 hover:bg-emerald-500/30 rounded-xl px-8 py-4 border border-emerald-500/50 transition-all disabled:opacity-50"
            >
              <div className="text-lg font-light text-white lowercase" style={{ fontFamily: 'Tiempos, serif' }}>
                {creating ? 'creating deposit...' : 'prepare new deposit'}
              </div>
            </button>
          </div>
        )}

        {/* Deposits List */}
        {loading ? (
          <div className="text-center text-neutral-500 py-12">loading...</div>
        ) : deposits.length > 0 ? (
          <div className="space-y-4">
            {deposits.map((deposit) => (
              <div key={deposit.id} className="bg-white/[0.02] backdrop-blur-xl rounded-2xl p-8 border border-white/5">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="text-xs text-neutral-600 lowercase mb-2" style={{ fontFamily: 'Tiempos, serif' }}>
                      week of {new Date(deposit.week_start_date).toLocaleDateString()}
                    </div>
                    <div className="text-3xl font-extralight text-white" style={{ fontFamily: 'Tiempos, serif' }}>
                      ${deposit.deposit_amount.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className={`px-4 py-2 rounded-full border ${getStatusColor(deposit.deposit_status)}`}>
                    <div className="text-sm lowercase" style={{ fontFamily: 'Tiempos, serif' }}>
                      {deposit.deposit_status}
                    </div>
                  </div>
                </div>

                {/* Deposit Timeline */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div>
                    <div className="text-xs text-neutral-600 lowercase mb-1" style={{ fontFamily: 'Tiempos, serif' }}>prepared</div>
                    <div className="text-sm text-white" style={{ fontFamily: 'Tiempos, serif' }}>
                      {deposit.prepared_at ? new Date(deposit.prepared_at).toLocaleDateString() : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-600 lowercase mb-1" style={{ fontFamily: 'Tiempos, serif' }}>picked up</div>
                    <div className="text-sm text-white" style={{ fontFamily: 'Tiempos, serif' }}>
                      {deposit.picked_up_at ? new Date(deposit.picked_up_at).toLocaleDateString() : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-600 lowercase mb-1" style={{ fontFamily: 'Tiempos, serif' }}>deposited</div>
                    <div className="text-sm text-white" style={{ fontFamily: 'Tiempos, serif' }}>
                      {deposit.deposited_at ? new Date(deposit.deposited_at).toLocaleDateString() : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-600 lowercase mb-1" style={{ fontFamily: 'Tiempos, serif' }}>verified</div>
                    <div className="text-sm text-white" style={{ fontFamily: 'Tiempos, serif' }}>
                      {deposit.bank_verified_at ? new Date(deposit.bank_verified_at).toLocaleDateString() : '—'}
                    </div>
                  </div>
                </div>

                {/* Actions based on status */}
                {selectedDeposit?.id === deposit.id ? (
                  <div className="space-y-4">
                    {deposit.deposit_status === 'pending' && (
                      <div className="space-y-3">
                        <textarea
                          placeholder="Notes (optional)"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="w-full bg-white/[0.02] rounded-xl px-4 py-3 border border-white/5 text-white resize-none"
                          style={{ fontFamily: 'Tiempos, serif' }}
                          rows={2}
                        />
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleMarkPrepared(deposit.id)}
                            className="flex-1 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-xl p-3 border border-yellow-500/50"
                          >
                            <div className="text-sm text-white lowercase" style={{ fontFamily: 'Tiempos, serif' }}>mark prepared</div>
                          </button>
                          <button
                            onClick={() => setSelectedDeposit(null)}
                            className="px-6 bg-white/[0.02] rounded-xl border border-white/5"
                          >
                            <div className="text-sm text-neutral-400 lowercase" style={{ fontFamily: 'Tiempos, serif' }}>cancel</div>
                          </button>
                        </div>
                      </div>
                    )}

                    {deposit.deposit_status === 'prepared' && (
                      <div className="space-y-3">
                        <input
                          placeholder="Courier/person name"
                          value={pickupPerson}
                          onChange={(e) => setPickupPerson(e.target.value)}
                          className="w-full bg-white/[0.02] rounded-xl px-4 py-3 border border-white/5 text-white"
                          style={{ fontFamily: 'Tiempos, serif' }}
                        />
                        <textarea
                          placeholder="Notes (optional)"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="w-full bg-white/[0.02] rounded-xl px-4 py-3 border border-white/5 text-white resize-none"
                          style={{ fontFamily: 'Tiempos, serif' }}
                          rows={2}
                        />
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleMarkPickedUp(deposit.id)}
                            className="flex-1 bg-purple-500/20 hover:bg-purple-500/30 rounded-xl p-3 border border-purple-500/50"
                          >
                            <div className="text-sm text-white lowercase" style={{ fontFamily: 'Tiempos, serif' }}>mark picked up</div>
                          </button>
                          <button
                            onClick={() => setSelectedDeposit(null)}
                            className="px-6 bg-white/[0.02] rounded-xl border border-white/5"
                          >
                            <div className="text-sm text-neutral-400 lowercase" style={{ fontFamily: 'Tiempos, serif' }}>cancel</div>
                          </button>
                        </div>
                      </div>
                    )}

                    {deposit.deposit_status === 'picked_up' && (
                      <div className="space-y-3">
                        <input
                          placeholder="Deposit slip number"
                          value={depositSlip}
                          onChange={(e) => setDepositSlip(e.target.value)}
                          className="w-full bg-white/[0.02] rounded-xl px-4 py-3 border border-white/5 text-white"
                          style={{ fontFamily: 'Tiempos, serif' }}
                        />
                        <textarea
                          placeholder="Notes (optional)"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="w-full bg-white/[0.02] rounded-xl px-4 py-3 border border-white/5 text-white resize-none"
                          style={{ fontFamily: 'Tiempos, serif' }}
                          rows={2}
                        />
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleMarkDeposited(deposit.id)}
                            className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 rounded-xl p-3 border border-blue-500/50"
                          >
                            <div className="text-sm text-white lowercase" style={{ fontFamily: 'Tiempos, serif' }}>mark deposited</div>
                          </button>
                          <button
                            onClick={() => setSelectedDeposit(null)}
                            className="px-6 bg-white/[0.02] rounded-xl border border-white/5"
                          >
                            <div className="text-sm text-neutral-400 lowercase" style={{ fontFamily: 'Tiempos, serif' }}>cancel</div>
                          </button>
                        </div>
                      </div>
                    )}

                    {deposit.deposit_status === 'deposited' && (
                      <div className="space-y-3">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Bank verified amount"
                          value={bankAmount}
                          onChange={(e) => setBankAmount(e.target.value)}
                          className="w-full bg-white/[0.02] rounded-xl px-4 py-3 border border-white/5 text-white"
                          style={{ fontFamily: 'Tiempos, serif' }}
                        />
                        <textarea
                          placeholder="Notes (optional)"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="w-full bg-white/[0.02] rounded-xl px-4 py-3 border border-white/5 text-white resize-none"
                          style={{ fontFamily: 'Tiempos, serif' }}
                          rows={2}
                        />
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleVerifyDeposit(deposit.id)}
                            className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-xl p-3 border border-emerald-500/50"
                          >
                            <div className="text-sm text-white lowercase" style={{ fontFamily: 'Tiempos, serif' }}>verify deposit</div>
                          </button>
                          <button
                            onClick={() => setSelectedDeposit(null)}
                            className="px-6 bg-white/[0.02] rounded-xl border border-white/5"
                          >
                            <div className="text-sm text-neutral-400 lowercase" style={{ fontFamily: 'Tiempos, serif' }}>cancel</div>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex gap-3">
                    {deposit.deposit_status !== 'verified' && (
                      <button
                        onClick={() => setSelectedDeposit(deposit)}
                        className="flex-1 bg-white/[0.02] hover:bg-white/[0.04] rounded-xl p-3 border border-white/5"
                      >
                        <div className="text-sm text-white lowercase" style={{ fontFamily: 'Tiempos, serif' }}>
                          {deposit.deposit_status === 'pending' ? 'mark prepared' :
                           deposit.deposit_status === 'prepared' ? 'record pickup' :
                           deposit.deposit_status === 'picked_up' ? 'record deposit' :
                           'verify amount'}
                        </div>
                      </button>
                    )}
                  </div>
                )}

                {/* Variance Display */}
                {deposit.variance !== 0 && deposit.bank_verified_amount && (
                  <div className="mt-4 bg-white/[0.05] rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-neutral-500 lowercase" style={{ fontFamily: 'Tiempos, serif' }}>
                        variance
                      </div>
                      <div className={`text-lg font-light ${
                        Math.abs(deposit.variance) > 10 ? 'text-red-400' : 'text-yellow-400'
                      }`} style={{ fontFamily: 'Tiempos, serif' }}>
                        {deposit.variance > 0 ? '+' : ''}{deposit.variance.toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : !loading && (
          <div className="text-center text-neutral-500 py-12" style={{ fontFamily: 'Tiempos, serif' }}>
            no deposits found
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
      </div>
    </div>
  );
};

