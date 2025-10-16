'use client';

import React, { useState, useEffect } from 'react';
import { posTerminalsService } from '../../services/pos-terminals-service';
import { useAuth } from '../../contexts/AuthContext';
import type { POSTerminal, PaymentProcessor } from '../../types/terminal';

export function TerminalSettingsPanel() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [terminals, setTerminals] = useState<POSTerminal[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'terminals' | 'processors'>('terminals');
  const [editingTerminal, setEditingTerminal] = useState<Partial<POSTerminal> | null>(null);
  const [testingTerminal, setTestingTerminal] = useState<number | null>(null);

  // Load terminals for current location
  const loadTerminals = async () => {
    if (!user?.location_id) return;
    
    setLoading(true);
    try {
      const locationId = parseInt(user.location_id);
      const data = await posTerminalsService.getLocationTerminals(locationId);
      setTerminals(data);
    } catch (error) {
      console.error('Failed to load terminals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showModal) {
      loadTerminals();
    }
  }, [showModal, user?.location_id]);

  const handleTestConnection = async (terminalId: number) => {
    setTestingTerminal(terminalId);
    try {
      const result = await posTerminalsService.testConnection(terminalId);
      if (result.success) {
        alert('✅ Terminal is online and responding!');
      } else {
        alert(`❌ Connection failed: ${result.error}`);
      }
    } catch (error) {
      alert(`❌ Connection test failed`);
    } finally {
      setTestingTerminal(null);
    }
  };

  const handleAddTerminal = () => {
    setEditingTerminal({
      terminal_name: '',
      terminal_serial: '',
      terminal_type: 'dejavoo',
      terminal_model: 'wizarpos_qz',
      location_id: parseInt(user?.location_id || '20'),
      workstation_name: '',
      processor_id: 1,
      status: 'active'
    });
  };

  const handleSaveTerminal = async () => {
    if (!editingTerminal || !editingTerminal.terminal_name || !editingTerminal.terminal_serial) {
      alert('Please fill in terminal name and serial number');
      return;
    }

    try {
      if (editingTerminal.id) {
        // Update
        await posTerminalsService.updateTerminal(editingTerminal.id, editingTerminal);
      } else {
        // Create
        await posTerminalsService.createTerminal(editingTerminal as any);
      }
      
      setEditingTerminal(null);
      loadTerminals();
    } catch (error) {
      console.error('Failed to save terminal:', error);
      alert('❌ Failed to save terminal');
    }
  };

  const handleDeleteTerminal = async (terminalId: number) => {
    if (!confirm('Delete this terminal?')) return;
    
    try {
      await posTerminalsService.deleteTerminal(terminalId);
      loadTerminals();
    } catch (error) {
      alert('❌ Failed to delete terminal');
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-1.5 px-2 h-[28px] text-xs transition-all duration-200 ease-out rounded border bg-transparent text-white border-purple-600/50 hover:bg-purple-600/10 hover:border-purple-500/70"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        Terminals
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999]" onClick={() => setShowModal(false)}>
          <div 
            className="rounded-2xl overflow-hidden shadow-2xl max-w-5xl w-full mx-4 max-h-[85vh] overflow-y-auto"
            style={{
              background: 'rgba(23, 23, 23, 0.85)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              filter: 'contrast(1.1) brightness(1.1)',
              fontFamily: 'Tiempos, serif'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/[0.06]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white">💳 Payment Terminals</h3>
                  <p className="text-xs text-neutral-400 mt-1">{user?.location || 'Current Location'} - Charlotte Central</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-neutral-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-6 pt-4 border-b border-white/[0.06]">
              <button
                onClick={() => setActiveTab('terminals')}
                className={`px-4 py-2 text-xs font-medium transition-all duration-200 rounded-t-lg ${
                  activeTab === 'terminals'
                    ? 'bg-white/10 text-white border-b-2 border-purple-500'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Terminals ({terminals.length})
              </button>
              <button
                onClick={() => setActiveTab('processors')}
                className={`px-4 py-2 text-xs font-medium transition-all duration-200 rounded-t-lg ${
                  activeTab === 'processors'
                    ? 'bg-white/10 text-white border-b-2 border-purple-500'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Processors
              </button>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="text-center py-12 text-neutral-400">Loading...</div>
              ) : activeTab === 'terminals' ? (
                <>
                  {/* Terminals List */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-medium text-white">Active Terminals</h4>
                      <button
                        onClick={handleAddTerminal}
                        className="flex items-center gap-2 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 hover:border-purple-500/50 rounded-lg text-purple-300 text-xs transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Terminal
                      </button>
                    </div>

                    {terminals.length === 0 ? (
                      <div className="text-center py-12 px-4 bg-white/[0.02] border border-white/[0.06] rounded-lg">
                        <svg className="w-12 h-12 mx-auto mb-3 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <p className="text-neutral-400 text-sm">No terminals configured</p>
                        <p className="text-neutral-500 text-xs mt-1">Add a terminal to start processing card payments</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {terminals.map((terminal) => (
                          <div
                            key={terminal.id}
                            className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg hover:bg-white/[0.04] transition-all"
                          >
                            <div className="flex items-start gap-4">
                              {/* Terminal Icon */}
                              <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
                                <svg className="w-7 h-7 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                              </div>

                              {/* Terminal Info */}
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <h5 className="text-sm font-medium text-white">{terminal.terminal_name}</h5>
                                    <p className="text-xs text-neutral-400 mt-0.5">{terminal.workstation_name}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                      terminal.status === 'active'
                                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                        : 'bg-neutral-500/20 text-neutral-400 border border-neutral-500/30'
                                    }`}>
                                      {terminal.status}
                                    </span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3 text-xs">
                                  <div>
                                    <span className="text-neutral-500">Serial:</span>
                                    <span className="text-neutral-300 ml-1 font-mono">{terminal.terminal_serial}</span>
                                  </div>
                                  <div>
                                    <span className="text-neutral-500">Model:</span>
                                    <span className="text-neutral-300 ml-1">{terminal.terminal_model}</span>
                                  </div>
                                  <div>
                                    <span className="text-neutral-500">TPN:</span>
                                    <span className="text-neutral-300 ml-1 font-mono">{terminal.dejavoo_register_id}</span>
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 mt-3">
                                  <button
                                    onClick={() => handleTestConnection(terminal.id)}
                                    disabled={testingTerminal === terminal.id}
                                    className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 hover:border-blue-500/50 rounded text-blue-300 text-xs transition-all disabled:opacity-50"
                                  >
                                    {testingTerminal === terminal.id ? '⏳ Testing...' : '🔌 Test Connection'}
                                  </button>
                                  <button
                                    onClick={() => setEditingTerminal(terminal)}
                                    className="px-3 py-1.5 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] rounded text-neutral-300 text-xs transition-all"
                                  >
                                    ✏️ Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTerminal(terminal.id)}
                                    className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 hover:border-red-500/50 rounded text-red-300 text-xs transition-all"
                                  >
                                    🗑️ Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Processor Info */}
                  <div className="mt-6 p-4 bg-blue-600/10 border border-blue-500/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h5 className="text-xs font-medium text-blue-300">Payment Processor</h5>
                    </div>
                    <div className="text-xs text-neutral-300 space-y-1">
                      <div><span className="text-neutral-500">Type:</span> Dejavoo iPOS Cloud</div>
                      <div><span className="text-neutral-500">Endpoint:</span> <span className="font-mono text-blue-400">api.ipospays.com</span></div>
                      <div><span className="text-neutral-500">Status:</span> <span className="text-green-400">✅ Active</span></div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Processors Tab */}
                  <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg">
                    <h4 className="text-sm font-medium text-white mb-3">Dejavoo iPOS Processor</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Processor Type:</span>
                        <span className="text-white">Dejavoo</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">API Endpoint:</span>
                        <span className="text-blue-400 font-mono">api.ipospays.com</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Mode:</span>
                        <span className="text-green-400">Production</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Features:</span>
                        <span className="text-neutral-300">Sale, Void, Return, Gift Cards</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-500">JWT Token:</span>
                        <span className="text-green-400">✅ Configured</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/[0.06] flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] rounded-lg text-white text-sm transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Terminal Modal */}
      {editingTerminal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[10000]" onClick={() => setEditingTerminal(null)}>
          <div 
            className="rounded-2xl overflow-hidden shadow-2xl max-w-2xl w-full mx-4"
            style={{
              background: 'rgba(23, 23, 23, 0.95)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08)',
              fontFamily: 'Tiempos, serif'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-white/[0.06]">
              <h3 className="text-lg font-semibold text-white">{editingTerminal.id ? 'Edit Terminal' : 'Add New Terminal'}</h3>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1.5">Terminal Name *</label>
                  <input
                    type="text"
                    value={editingTerminal.terminal_name || ''}
                    onChange={(e) => setEditingTerminal({ ...editingTerminal, terminal_name: e.target.value })}
                    className="w-full px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/50"
                    placeholder="Register 1"
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-400 mb-1.5">Serial Number *</label>
                  <input
                    type="text"
                    value={editingTerminal.terminal_serial || ''}
                    onChange={(e) => setEditingTerminal({ ...editingTerminal, terminal_serial: e.target.value })}
                    className="w-full px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-white text-sm font-mono focus:outline-none focus:border-purple-500/50"
                    placeholder="WP-123456789"
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-400 mb-1.5">Workstation Name</label>
                  <input
                    type="text"
                    value={editingTerminal.workstation_name || ''}
                    onChange={(e) => setEditingTerminal({ ...editingTerminal, workstation_name: e.target.value })}
                    className="w-full px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/50"
                    placeholder="Front Counter"
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-400 mb-1.5">Dejavoo TPN/Register ID</label>
                  <input
                    type="text"
                    value={editingTerminal.dejavoo_register_id || ''}
                    onChange={(e) => setEditingTerminal({ ...editingTerminal, dejavoo_register_id: e.target.value })}
                    className="w-full px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-white text-sm font-mono focus:outline-none focus:border-purple-500/50"
                    placeholder="01Q43200268"
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-400 mb-1.5">Terminal Model</label>
                  <select
                    value={editingTerminal.terminal_model || 'wizarpos_qz'}
                    onChange={(e) => setEditingTerminal({ ...editingTerminal, terminal_model: e.target.value })}
                    className="w-full px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/50"
                  >
                    <option value="wizarpos_qz">WizarPOS QZ</option>
                    <option value="wizarpos_q2">WizarPOS Q2</option>
                    <option value="wizarpos">WizarPOS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-neutral-400 mb-1.5">Status</label>
                  <select
                    value={editingTerminal.status || 'active'}
                    onChange={(e) => setEditingTerminal({ ...editingTerminal, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/50"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-white/[0.06] flex justify-end gap-3">
              <button
                onClick={() => setEditingTerminal(null)}
                className="px-4 py-2 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] rounded-lg text-white text-sm transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTerminal}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white text-sm transition-all"
              >
                {editingTerminal.id ? 'Update Terminal' : 'Add Terminal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

