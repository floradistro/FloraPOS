'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api-fetch';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateTime as formatDateTimeUtil } from '../../utils/date-utils';

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
  batch_id?: number | null;
}

interface AllHistoryTableProps {
  dateFilter: string;
  isActive?: boolean;
}

export const AllHistoryTable: React.FC<AllHistoryTableProps> = ({ dateFilter, isActive = true }) => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productNames, setProductNames] = useState<Map<number, string>>(new Map());
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    // Only fetch when tab is active and hasn't loaded yet, or when dateFilter changes
    if (isActive && (!hasLoaded || dateFilter)) {
      fetchAllHistory();
      setHasLoaded(true);
    }
  }, [dateFilter, user?.location_id, isActive]);

  const fetchAllHistory = async () => {
    if (!user?.location_id) return;

    try {
      setLoading(true);
      setError(null);

      // Build API URL with days parameter (not start_date)
      // Request high limit to get all data (not paginated)
      const apiUrl = `/api/audit-log?location_id=${user.location_id}&days=${dateFilter}&limit=5000&offset=0`;

      const response = await apiFetch(apiUrl);

      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }

      const data = await response.json();
      const auditEntries: AuditLogEntry[] = data.data || [];

      // Extract product names from details field
      const namesFromDetails = new Map<number, string>();
      auditEntries.forEach(entry => {
        try {
          const details = typeof entry.details === 'string' ? JSON.parse(entry.details) : entry.details;
          if (details.product_name) {
            namesFromDetails.set(entry.product_id, details.product_name);
          }
        } catch (e) {
          // Ignore parse errors
        }
      });

      setProductNames(namesFromDetails);
      setEntries(auditEntries);
    } catch (err) {
      console.error('Error fetching history:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return formatDateTimeUtil(dateString);
  };

  const getProductName = (productId: number, variationId: number | null, details?: string) => {
    if (details) {
      try {
        const parsedDetails = typeof details === 'string' ? JSON.parse(details) : details;
        if (parsedDetails.product_name) {
          return parsedDetails.product_name;
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
    
    const baseName = productNames.get(productId) || `Product #${productId}`;
    if (variationId) {
      const variantName = productNames.get(variationId);
      return variantName ? `${baseName} - ${variantName}` : `${baseName} (Variant #${variationId})`;
    }
    return baseName;
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'inventory_update': 'Stock Update',
      'sale': 'Sale',
      'adjustment': 'Adjustment',
      'restock': 'Restock',
      'audit': 'Audit',
      'transfer': 'Transfer',
    };
    return labels[action] || action;
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 relative">
            <img 
              src="/logo123.png" 
              alt="Flora" 
              className="w-full h-full object-contain opacity-40 animate-pulse"
            />
          </div>
          <p className="text-neutral-400 text-sm" style={{ fontFamily: 'Tiempos, serif' }}>Loading history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-24 h-24 mx-auto mb-6 relative">
            <img 
              src="/logo123.png" 
              alt="Flora" 
              className="w-full h-full object-contain opacity-20"
            />
          </div>
          <h3 className="text-lg font-medium text-white mb-2" style={{ fontFamily: 'Tiempos, serif' }}>Error Loading History</h3>
          <p className="text-neutral-400 text-sm mb-6" style={{ fontFamily: 'Tiempos, serif' }}>{error}</p>
          <button
            onClick={fetchAllHistory}
            className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all duration-200 border border-white/10"
            style={{ fontFamily: 'Tiempos, serif' }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 relative">
            <img 
              src="/logo123.png" 
              alt="Flora" 
              className="w-full h-full object-contain opacity-20"
            />
          </div>
          <h3 className="text-lg font-medium text-white mb-2" style={{ fontFamily: 'Tiempos, serif' }}>No History</h3>
          <p className="text-neutral-400 text-sm" style={{ fontFamily: 'Tiempos, serif' }}>
            No inventory changes found for the selected period.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto py-3">
      {/* Category-style Header */}
      <div className="px-6 py-4 backdrop-blur-xl bg-white/[0.02] rounded-xl mb-3 mx-3">
        <div className="flex items-center justify-center gap-4">
          <h2 className="text-2xl font-mono font-medium text-neutral-300 tracking-wider text-center lowercase" style={{ fontFamily: 'Tiempos, serif' }}>
            All History
          </h2>
          <span className="text-xs font-mono font-medium text-neutral-500 bg-white/5 px-2.5 py-1 rounded-lg">
            {entries.length}
          </span>
        </div>
      </div>

      {/* List View Style Items */}
      <div className="space-y-1 px-3">
        {entries.map((entry, index) => {
          const quantityChange = parseFloat(entry.quantity_change?.toString() || '0');
          
          return (
            <div
              key={entry.id}
              className="group transition-all duration-300 border-l-[3px] rounded-xl border-l-transparent hover:bg-white/[0.02] hover:border-l-neutral-600/30"
              style={{
                animation: `slideInRight 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${index * 0.02}s both`,
              }}
            >
              <div className="px-4 py-3 flex items-center gap-6">
                {/* Product Name */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-neutral-200 truncate" style={{ fontFamily: 'Tiempos, serif' }}>
                    {getProductName(entry.product_id, entry.variation_id, entry.details)}
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5" style={{ fontFamily: 'Tiempos, serif' }}>
                    {getActionLabel(entry.action)} • {entry.user_name || 'System'}
                  </p>
                </div>

                {/* Quantity Change */}
                <div className="flex-shrink-0 text-right">
                  <div className={`text-base font-medium ${
                    quantityChange > 0 ? 'text-green-400' : quantityChange < 0 ? 'text-red-400' : 'text-neutral-400'
                  }`} style={{ fontFamily: 'Tiempos, serif' }}>
                    {quantityChange > 0 ? '+' : ''}{quantityChange.toFixed(0)}
                  </div>
                  <div className="text-xs text-neutral-500 mt-0.5" style={{ fontFamily: 'Tiempos, serif' }}>
                    {entry.old_quantity !== null ? parseFloat(entry.old_quantity.toString()).toFixed(0) : '—'}
                    {' → '}
                    {entry.new_quantity !== null ? parseFloat(entry.new_quantity.toString()).toFixed(0) : '—'}
                  </div>
                </div>

                {/* Date */}
                <div className="flex-shrink-0 text-right w-32">
                  <div className="text-sm text-neutral-400" style={{ fontFamily: 'Tiempos, serif' }}>
                    {formatDateTime(entry.created_at)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

