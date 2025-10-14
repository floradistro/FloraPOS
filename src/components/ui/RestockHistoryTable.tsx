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

interface RestockOperation {
  po_number: string;
  timestamp: string;
  user_id: number;
  user_name: string;
  location_id: number;
  products: Array<{
    product_id: number;
    variation_id: number | null;
    quantity: number;
    name: string;
  }>;
}

interface RestockBatch {
  po_number: string;
  timestamp: string;
  user_name: string;
  total_products: number;
  net_change: number;
  entries: AuditLogEntry[];
}

interface RestockHistoryTableProps {
  dateFilter: string;
  isActive?: boolean;
}

export const RestockHistoryTable: React.FC<RestockHistoryTableProps> = ({ dateFilter, isActive = true }) => {
  const { user } = useAuth();
  const [restockBatches, setRestockBatches] = useState<RestockBatch[]>([]);
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productNames, setProductNames] = useState<Map<number, string>>(new Map());
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    // Only fetch when tab is active and hasn't loaded yet, or when dateFilter changes
    if (isActive && (!hasLoaded || dateFilter)) {
      fetchRestockData();
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

  const fetchRestockData = async () => {
    if (!user?.location_id) return;

    try {
      setLoading(true);
      setError(null);

      // Build API URL with days parameter (not start_date)
      // Request high limit to get all data (not paginated)
      const apiUrl = `/api/audit-log?location_id=${user.location_id}&days=${dateFilter}&limit=5000&offset=0`;

      const response = await apiFetch(apiUrl);

      if (!response.ok) {
        throw new Error('Failed to fetch restock history');
      }

      const data = await response.json();
      const auditEntries: AuditLogEntry[] = data.data || [];

      // Extract product names from details field first
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

      // Try to get PO operations from localStorage
      const restockOps: RestockOperation[] = typeof window !== 'undefined' && window.localStorage
        ? JSON.parse(localStorage.getItem('restock_operations') || '[]')
        : [];

      let batches = processRestockOperations(restockOps, auditEntries);
      
      // If no PO-based restocks found, create batches from positive changes
      if (batches.length === 0) {
        batches = groupPositiveChangesAsRestocks(auditEntries);
      }
      
      setRestockBatches(batches);
    } catch (err) {
      console.error('Error fetching restock data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const processRestockOperations = (restockOps: RestockOperation[], auditEntries: AuditLogEntry[]): RestockBatch[] => {
    const restockBatches: RestockBatch[] = [];

    restockOps.forEach(restock => {
      const restockTime = new Date(restock.timestamp);
      const matchingEntries = auditEntries.filter(entry => {
        const entryTime = new Date(entry.created_at);
        const timeDiff = Math.abs(entryTime.getTime() - restockTime.getTime());
        const isWithinTimeWindow = timeDiff <= 10 * 60 * 1000;
        const matchesProduct = restock.products.some(p =>
          p.product_id === entry.product_id &&
          (p.variation_id || 0) === (entry.variation_id || 0)
        );
        return isWithinTimeWindow && matchesProduct && !entry.batch_id;
      });

      if (matchingEntries.length > 0) {
        const totalChange = matchingEntries.reduce((sum, entry) => {
          const change = parseFloat(entry.quantity_change?.toString() || '0');
          return sum + change;
        }, 0);

        restockBatches.push({
          po_number: restock.po_number,
          timestamp: restock.timestamp,
          user_name: restock.user_name,
          total_products: matchingEntries.length,
          net_change: totalChange,
          entries: matchingEntries
        });
      }
    });

    return restockBatches.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  };

  // Group positive changes as restocks by date
  const groupPositiveChangesAsRestocks = (auditEntries: AuditLogEntry[]): RestockBatch[] => {
    const positiveEntries = auditEntries.filter(entry => {
      const change = parseFloat(entry.quantity_change?.toString() || '0');
      return change > 0;
    });

    if (positiveEntries.length === 0) return [];

    // Group by date (same day)
    const groupedByDate = new Map<string, AuditLogEntry[]>();
    
    positiveEntries.forEach(entry => {
      const date = new Date(entry.created_at).toDateString();
      if (!groupedByDate.has(date)) {
        groupedByDate.set(date, []);
      }
      groupedByDate.get(date)!.push(entry);
    });

    const batches: RestockBatch[] = [];
    
    groupedByDate.forEach((entries, date) => {
      const totalChange = entries.reduce((sum, entry) => {
        return sum + parseFloat(entry.quantity_change?.toString() || '0');
      }, 0);

      // Use first entry's data for batch info
      const firstEntry = entries[0];
      
      batches.push({
        po_number: `Stock Increase - ${new Date(date).toLocaleDateString()}`,
        timestamp: firstEntry.created_at,
        user_name: firstEntry.user_name || 'System',
        total_products: entries.length,
        net_change: totalChange,
        entries: entries
      });
    });

    return batches.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  };

  const toggleBatchExpansion = (poNumber: string) => {
    setExpandedBatches(prev => {
      const newSet = new Set(prev);
      if (newSet.has(poNumber)) {
        newSet.delete(poNumber);
      } else {
        newSet.add(poNumber);
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
          <p className="text-neutral-400 text-sm" style={{ fontFamily: 'Tiempos, serif' }}>Loading restock history...</p>
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
            onClick={fetchRestockData}
            className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all duration-200 border border-white/10"
            style={{ fontFamily: 'Tiempos, serif' }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (restockBatches.length === 0) {
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
          <h3 className="text-lg font-medium text-white mb-3" style={{ fontFamily: 'Tiempos, serif' }}>No Restock History</h3>
          <p className="text-neutral-400 text-sm mb-4" style={{ fontFamily: 'Tiempos, serif' }}>
            No restock operations found for the selected period.
          </p>
          <div className="text-xs text-neutral-500 space-y-2 text-left bg-white/[0.02] rounded-lg p-4 border border-white/[0.06]" style={{ fontFamily: 'Tiempos, serif' }}>
            <p className="font-medium text-neutral-400 mb-2">To create restock entries:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Go to the <span className="text-neutral-300">Products</span> tab</li>
              <li>Click <span className="text-neutral-300">Restock</span> button</li>
              <li>Adjust product quantities</li>
              <li>Click <span className="text-neutral-300">Create Purchase Order</span></li>
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
            Restock History
          </h2>
          <span className="text-xs font-mono font-medium text-neutral-500 bg-white/5 px-2.5 py-1 rounded-lg">
            {restockBatches.length}
          </span>
        </div>
      </div>

      {/* List View Style Items */}
      <div className="space-y-1 px-3">
        {restockBatches.map((batch, index) => {
          const isExpanded = expandedBatches.has(batch.po_number);

          return (
            <div
              key={batch.po_number}
              className={`group transition-all duration-300 cursor-pointer border-l-[3px] rounded-xl ${
                isExpanded
                  ? 'bg-white/[0.04] border-l-white/40 shadow-lg'
                  : 'border-l-transparent hover:bg-white/[0.02] hover:border-l-neutral-600/30'
              }`}
              style={{
                animation: `slideInRight 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${index * 0.03}s both`,
              }}
              onClick={() => toggleBatchExpansion(batch.po_number)}
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

                {/* PO Number & Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-medium text-neutral-200 truncate" style={{ fontFamily: 'Tiempos, serif' }}>
                    {batch.po_number}
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5" style={{ fontFamily: 'Tiempos, serif' }}>
                    {batch.total_products} {batch.total_products === 1 ? 'product' : 'products'} • {batch.user_name}
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
                    {formatDateTime(batch.timestamp)}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && batch.entries.length > 0 && (
                <div className="px-4 pb-4 border-t border-white/[0.06]">
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
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

