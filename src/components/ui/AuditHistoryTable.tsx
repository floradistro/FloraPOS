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

interface AuditBatch {
  id: number;
  audit_number: string;
  batch_name: string;
  batch_description: string;
  location_id: number;
  user_id: number;
  user_name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  total_products: number;
  total_adjustments: number;
  total_increased: number;
  total_decreased: number;
  net_change: number;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  entries?: AuditLogEntry[];
}

interface AuditHistoryTableProps {
  dateFilter: string;
  isActive?: boolean;
}

export const AuditHistoryTable: React.FC<AuditHistoryTableProps> = ({ dateFilter, isActive = true }) => {
  const { user } = useAuth();
  const [auditBatches, setAuditBatches] = useState<AuditBatch[]>([]);
  const [expandedBatches, setExpandedBatches] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productNames, setProductNames] = useState<Map<number, string>>(new Map());
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    // Only fetch when tab is active and hasn't loaded yet, or when dateFilter changes
    if (isActive && (!hasLoaded || dateFilter)) {
      fetchAuditData();
      setHasLoaded(true);
    }
  }, [dateFilter, user?.location_id, isActive]);

  const fetchProductNames = async (productIds: number[]) => {
    if (productIds.length === 0) return;

    try {
      const uniqueIds = Array.from(new Set(productIds));
      const productPromises = uniqueIds.map(async (productId) => {
        try {
          const response = await apiFetch(`/api/proxy/woocommerce/products/${productId}`, {
            headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
          });

          if (response.ok) {
            const product = await response.json();
            if (product.error) {
              return { id: productId, name: `[Deleted] Product #${productId}` };
            }
            return { id: productId, name: product.name || `[No Name] Product #${productId}` };
          } else {
            return { id: productId, name: `[Missing] Product #${productId}` };
          }
        } catch (error) {
          return { id: productId, name: `[Error] Product #${productId}` };
        }
      });

      const productResults = await Promise.all(productPromises);
      setProductNames(prev => {
        const newMap = new Map(prev);
        productResults.forEach(product => {
          newMap.set(product.id, product.name);
        });
        return newMap;
      });
    } catch (error) {
      console.error('Error fetching product names:', error);
    }
  };

  const groupEntriesByBatchId = (auditEntries: AuditLogEntry[]): AuditBatch[] => {
    const batchMap = new Map<number, AuditLogEntry[]>();
    
    // Group entries by batch_id
    auditEntries.forEach(entry => {
      if (entry.batch_id) {
        const batchId = typeof entry.batch_id === 'string' ? parseInt(entry.batch_id) : entry.batch_id;
        if (!batchMap.has(batchId)) {
          batchMap.set(batchId, []);
        }
        batchMap.get(batchId)!.push(entry);
      }
    });

    const batches: AuditBatch[] = [];
    
    batchMap.forEach((entries, batchId) => {
      const totalAdjustments = entries.length;
      const netChange = entries.reduce((sum, entry) => {
        return sum + parseFloat(entry.quantity_change?.toString() || '0');
      }, 0);
      const totalIncreased = entries.filter(e => parseFloat(e.quantity_change?.toString() || '0') > 0).length;
      const totalDecreased = entries.filter(e => parseFloat(e.quantity_change?.toString() || '0') < 0).length;

      const firstEntry = entries[0];
      
      batches.push({
        id: batchId,
        audit_number: `AUDIT-${batchId}`,
        batch_name: `Audit Batch ${batchId}`,
        batch_description: `Inventory audit with ${totalAdjustments} adjustments`,
        location_id: parseInt(firstEntry.location_id?.toString() || '0'),
        user_id: parseInt(firstEntry.user_id?.toString() || '0'),
        user_name: firstEntry.user_name || 'System',
        status: 'completed',
        total_products: totalAdjustments,
        total_adjustments: totalAdjustments,
        total_increased: totalIncreased,
        total_decreased: totalDecreased,
        net_change: netChange,
        started_at: firstEntry.created_at,
        completed_at: entries[entries.length - 1].created_at,
        created_at: firstEntry.created_at,
        updated_at: entries[entries.length - 1].created_at,
        entries: entries
      });
    });

    return batches;
  };

  const fetchAuditData = async () => {
    if (!user?.location_id) return;

    try {
      setLoading(true);
      setError(null);

      const daysAgo = parseInt(dateFilter) || 30;
      const startDate = dateFilter === 'all' 
        ? new Date(0) // Beginning of time
        : (() => {
            const date = new Date();
            date.setDate(date.getDate() - daysAgo);
            return date;
          })();

      const response = await apiFetch(`/api/audit-sessions?location_id=${user.location_id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch audit history');
      }

      const data = await response.json();
      let batches: AuditBatch[] = data.sessions || data.data || [];

      // If no formal sessions found, try to fetch audit log and group by batch_id
      if (batches.length === 0) {
        // Build API URL with days parameter (not start_date)
        // Request high limit to get all data (not paginated)
        const auditApiUrl = `/api/audit-log?location_id=${user.location_id}&days=${dateFilter}&limit=5000&offset=0`;
        
        const auditResponse = await apiFetch(auditApiUrl);
        
        if (auditResponse.ok) {
          const auditData = await auditResponse.json();
          const auditEntries = auditData.data || [];
          
          // Group entries by batch_id
          batches = groupEntriesByBatchId(auditEntries);
        }
      }

      // Extract product names from details in all entries
      const namesFromDetails = new Map<number, string>();
      batches.forEach(batch => {
        if (batch.entries) {
          batch.entries.forEach(entry => {
            try {
              const details = typeof entry.details === 'string' ? JSON.parse(entry.details) : entry.details;
              if (details.product_name) {
                namesFromDetails.set(entry.product_id, details.product_name);
              }
            } catch (e) {
              // Ignore parse errors
            }
          });
        }
      });

      // Update product names with extracted names
      setProductNames(prev => {
        const newMap = new Map(prev);
        namesFromDetails.forEach((name, id) => {
          if (!newMap.has(id)) {
            newMap.set(id, name);
          }
        });
        return newMap;
      });

      // Filter by date
      const filteredBatches = batches.filter(batch => {
        const batchDate = new Date(batch.created_at);
        return batchDate >= startDate;
      });

      // Sort by most recent first
      filteredBatches.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setAuditBatches(filteredBatches);
    } catch (err) {
      console.error('Error fetching audit data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const toggleBatchExpansion = (batchId: number) => {
    setExpandedBatches(prev => {
      const newSet = new Set(prev);
      if (newSet.has(batchId)) {
        newSet.delete(batchId);
      } else {
        newSet.add(batchId);
      }
      return newSet;
    });
  };

  const formatDateTime = (dateString: string) => {
    return formatDateTimeUtil(dateString);
  };

  const getProductName = (productId: number, variationId: number | null, details?: string) => {
    // Try to get name from details first
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

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      in_progress: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      completed: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20',
      cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
    };

    return (
      <span className={`text-xs px-2 py-0.5 rounded border ${statusColors[status as keyof typeof statusColors] || 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20'}`}>
        {status}
      </span>
    );
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
          <p className="text-neutral-400 text-sm" style={{ fontFamily: 'Tiempos, serif' }}>Loading audit history...</p>
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
            onClick={fetchAuditData}
            className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all duration-200 border border-white/10"
            style={{ fontFamily: 'Tiempos, serif' }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (auditBatches.length === 0) {
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
          <h3 className="text-lg font-medium text-white mb-3" style={{ fontFamily: 'Tiempos, serif' }}>No Audit History</h3>
          <p className="text-neutral-400 text-sm mb-4" style={{ fontFamily: 'Tiempos, serif' }}>
            No audit sessions found for the selected period.
          </p>
          <div className="text-xs text-neutral-500 space-y-2 text-left bg-white/[0.02] rounded-lg p-4 border border-white/[0.06]" style={{ fontFamily: 'Tiempos, serif' }}>
            <p className="font-medium text-neutral-400 mb-2">To create audit sessions:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Go to the <span className="text-neutral-300">Products</span> tab</li>
              <li>Click <span className="text-neutral-300">Audit</span> button</li>
              <li>Adjust product quantities</li>
              <li>Click <span className="text-neutral-300">Create Audit Session</span></li>
            </ol>
          </div>
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
            Audit History
          </h2>
          <span className="text-xs font-mono font-medium text-neutral-500 bg-white/5 px-2.5 py-1 rounded-lg">
            {auditBatches.length}
          </span>
        </div>
      </div>

      {/* List View Style Items */}
      <div className="space-y-1 px-3">
        {auditBatches.map((batch, index) => {
          const isExpanded = expandedBatches.has(batch.id);

          return (
            <div
              key={batch.id}
              className={`group transition-all duration-300 cursor-pointer border-l-[3px] rounded-xl ${
                isExpanded
                  ? 'bg-white/[0.04] border-l-white/40 shadow-lg'
                  : 'border-l-transparent hover:bg-white/[0.02] hover:border-l-neutral-600/30'
              }`}
              style={{
                animation: `slideInRight 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${index * 0.03}s both`,
              }}
              onClick={() => toggleBatchExpansion(batch.id)}
            >
              {/* Main Batch Row */}
              <div className="px-4 py-4 flex items-center gap-6">
                {/* Expand Icon */}
                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-neutral-600">
                  <svg
                    className={`w-3 h-3 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                {/* Audit Name & Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-medium text-neutral-200 truncate" style={{ fontFamily: 'Tiempos, serif' }}>
                      {batch.batch_name}
                    </h3>
                    {getStatusBadge(batch.status)}
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5" style={{ fontFamily: 'Tiempos, serif' }}>
                    {batch.audit_number} • {batch.total_products} {batch.total_products === 1 ? 'product' : 'products'} • {batch.user_name}
                  </p>
                </div>

                {/* Net Change */}
                <div className="flex-shrink-0">
                  <div className={`text-base font-medium ${
                    batch.net_change > 0 ? 'text-green-400' : batch.net_change < 0 ? 'text-red-400' : 'text-neutral-400'
                  }`} style={{ fontFamily: 'Tiempos, serif' }}>
                    {batch.net_change > 0 ? '+' : ''}{batch.net_change.toFixed(0)}
                  </div>
                  <div className="text-xs text-neutral-500 mt-0.5" style={{ fontFamily: 'Tiempos, serif' }}>
                    items
                  </div>
                </div>

                {/* Date */}
                <div className="flex-shrink-0 text-right">
                  <div className="text-sm text-neutral-400" style={{ fontFamily: 'Tiempos, serif' }}>
                    {formatDateTime(batch.created_at)}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-white/[0.06]">
                  {/* Batch Description */}
                  {batch.batch_description && (
                    <div className="mt-3 px-4 py-2 bg-white/[0.02] rounded-lg border border-white/[0.06]">
                      <div className="text-xs text-neutral-500 mb-1" style={{ fontFamily: 'Tiempos, serif' }}>Description</div>
                      <div className="text-sm text-neutral-300" style={{ fontFamily: 'Tiempos, serif' }}>{batch.batch_description}</div>
                    </div>
                  )}

                  {/* Entries */}
                  {batch.entries && batch.entries.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {batch.entries.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center gap-4 px-4 py-3 bg-white/[0.02] rounded-lg border border-white/[0.06]"
                        >
                          {/* Product Name */}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-neutral-300 truncate" style={{ fontFamily: 'Tiempos, serif' }}>
                              {getProductName(entry.product_id, entry.variation_id, entry.details)}
                            </div>
                          </div>

                          {/* Quantity Change */}
                          <div className="flex-shrink-0">
                            <div className={`text-sm font-medium ${
                              parseFloat(entry.quantity_change?.toString() || '0') > 0
                                ? 'text-green-400'
                                : parseFloat(entry.quantity_change?.toString() || '0') < 0
                                ? 'text-red-400'
                                : 'text-neutral-400'
                            }`} style={{ fontFamily: 'Tiempos, serif' }}>
                              {entry.quantity_change !== null && entry.quantity_change !== undefined
                                ? (parseFloat(entry.quantity_change.toString()) > 0 ? '+' : '') + parseFloat(entry.quantity_change.toString()).toFixed(0)
                                : '—'}
                            </div>
                          </div>

                          {/* Old/New Stock */}
                          <div className="flex-shrink-0 text-xs text-neutral-500" style={{ fontFamily: 'Tiempos, serif' }}>
                            {entry.old_quantity !== null ? parseFloat(entry.old_quantity.toString()).toFixed(0) : '—'}
                            {' → '}
                            {entry.new_quantity !== null ? parseFloat(entry.new_quantity.toString()).toFixed(0) : '—'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

