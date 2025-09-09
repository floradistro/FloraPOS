'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface AuditLogEntry {
  id: number;
  user_id: number;
  user_name: string;
  action: string;
  product_id: number;
  variation_id: number;
  object_type: string;
  object_id: number;
  location_id: number;
  old_quantity: number | string | null;
  new_quantity: number | string | null;
  quantity_change: number | string | null;
  details: string;
  created_at: string;
}

interface InventoryHistoryViewProps {
  onBack: () => void;
  dateFilter: string;
  actionFilter: string;
}

export const InventoryHistoryView: React.FC<InventoryHistoryViewProps> = ({ onBack, dateFilter, actionFilter }) => {
  const { user } = useAuth();
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const itemsPerPage = 50;

  useEffect(() => {
    fetchAuditLog();
  }, [currentPage, actionFilter, dateFilter, user?.location_id]);

  const fetchAuditLog = async () => {
    if (!user?.location_id) return;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        location_id: user.location_id.toString(),
        limit: itemsPerPage.toString(),
        offset: ((currentPage - 1) * itemsPerPage).toString(),
        action: actionFilter !== 'all' ? actionFilter : '',
        days: dateFilter
      });

      const response = await fetch(`/api/audit-log?${params}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch audit log: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setAuditLog(data.data || []);
        setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
      } else {
        throw new Error(data.error || 'Failed to fetch audit log');
      }
    } catch (err) {
      console.error('Error fetching audit log:', err);
      setError(err instanceof Error ? err.message : 'Failed to load audit log');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionBadge = (action: string) => {
    return (
      <span className="px-2 py-1 rounded text-xs font-medium bg-neutral-800/50 text-neutral-300 border border-neutral-700/50">
        {action.replace(/_/g, ' ').toUpperCase()}
      </span>
    );
  };

  const getQuantityChangeDisplay = (entry: AuditLogEntry) => {
    if (entry.quantity_change === null || entry.quantity_change === undefined) {
      return <span className="text-neutral-400">—</span>;
    }

    const change = parseFloat(entry.quantity_change.toString());
    if (isNaN(change)) {
      return <span className="text-neutral-400">—</span>;
    }

    const isPositive = change > 0;
    const sign = isPositive ? '+' : '';

    return (
      <span className="font-medium text-neutral-300">
        {sign}{change.toFixed(4)}
      </span>
    );
  };

  if (loading && auditLog.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/20 mx-auto mb-4"></div>
          <p className="text-neutral-400">Loading audit history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-transparent">
      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {error ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Error Loading History</h3>
              <p className="text-neutral-400 mb-4">{error}</p>
              <button
                onClick={fetchAuditLog}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : auditLog.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-800 flex items-center justify-center">
                <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No History Found</h3>
              <p className="text-neutral-400">No inventory adjustments found for the selected criteria.</p>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-neutral-900/95 backdrop-blur-sm z-10">
                <tr className="border-b border-white/[0.08]">
                  <th className="text-left py-4 px-6 text-xs font-medium text-neutral-400 uppercase tracking-wider">Date & Time</th>
                  <th className="text-left py-4 px-6 text-xs font-medium text-neutral-400 uppercase tracking-wider">Action</th>
                  <th className="text-left py-4 px-6 text-xs font-medium text-neutral-400 uppercase tracking-wider">Product</th>
                  <th className="text-center py-4 px-6 text-xs font-medium text-neutral-400 uppercase tracking-wider">Old Qty</th>
                  <th className="text-center py-4 px-6 text-xs font-medium text-neutral-400 uppercase tracking-wider">New Qty</th>
                  <th className="text-center py-4 px-6 text-xs font-medium text-neutral-400 uppercase tracking-wider">Change</th>
                  <th className="text-left py-4 px-6 text-xs font-medium text-neutral-400 uppercase tracking-wider">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {auditLog.map((entry) => (
                  <tr key={entry.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6">
                      <div className="text-sm text-neutral-300">
                        {formatDateTime(entry.created_at)}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {getActionBadge(entry.action)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-white">
                        Product #{entry.product_id}
                        {entry.variation_id > 0 && (
                          <span className="text-neutral-400 ml-1">
                            (Variant #{entry.variation_id})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="text-sm text-neutral-300">
                        {entry.old_quantity !== null && entry.old_quantity !== undefined 
                          ? parseFloat(entry.old_quantity.toString()).toFixed(4) 
                          : '—'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="text-sm text-neutral-300">
                        {entry.new_quantity !== null && entry.new_quantity !== undefined 
                          ? parseFloat(entry.new_quantity.toString()).toFixed(4) 
                          : '—'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {getQuantityChangeDisplay(entry)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-neutral-300">
                        {entry.user_name && entry.user_name !== 'System' && entry.user_name.trim() !== '' 
                          ? entry.user_name 
                          : user?.username || `User #${entry.user_id}`}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t border-white/[0.08] p-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-neutral-400">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 rounded-lg border border-white/[0.08] text-neutral-300 hover:text-white hover:bg-white/[0.08] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 rounded-lg border border-white/[0.08] text-neutral-300 hover:text-white hover:bg-white/[0.08] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {loading && auditLog.length > 0 && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <div className="bg-neutral-800 rounded-lg p-4 flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white/20"></div>
            <span className="text-neutral-300">Updating...</span>
          </div>
        </div>
      )}
    </div>
  );
};
