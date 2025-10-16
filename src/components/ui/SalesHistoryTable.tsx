'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api-fetch';
import { useAuth } from '../../contexts/AuthContext';
import { formatOrderDateTime as formatDateTimeUtil } from '../../utils/date-utils';

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

interface SalesBatch {
  date: string;
  total_products: number;
  total_sold: number;
  entries: AuditLogEntry[];
}

interface SalesHistoryTableProps {
  dateFilter: string;
  isActive?: boolean;
}

export const SalesHistoryTable: React.FC<SalesHistoryTableProps> = ({ dateFilter, isActive = true }) => {
  const { user } = useAuth();
  const [salesBatches, setSalesBatches] = useState<SalesBatch[]>([]);
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productNames, setProductNames] = useState<Map<number, string>>(new Map());
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    // Only fetch when tab is active and hasn't loaded yet, or when dateFilter changes
    if (isActive && (!hasLoaded || dateFilter)) {
      fetchSalesData();
      setHasLoaded(true);
    }
  }, [dateFilter, user?.location_id, isActive]);

  const fetchSalesData = async () => {
    if (!user?.location_id) return;

    try {
      setLoading(true);
      setError(null);

      // Build API URL with days parameter (not start_date)
      // Request high limit to get all data (not paginated)
      const apiUrl = `/api/audit-log?location_id=${user.location_id}&days=${dateFilter}&limit=5000&offset=0`;

      const response = await apiFetch(apiUrl);

      if (!response.ok) {
        throw new Error('Failed to fetch sales history');
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

      // Group negative changes (sales) by date
      const batches = groupSalesByDate(auditEntries);
      console.log('💰 Sales batches found:', batches.length);
      
      setSalesBatches(batches);
    } catch (err) {
      console.error('Error fetching sales data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const groupSalesByDate = (auditEntries: AuditLogEntry[]): SalesBatch[] => {
    // Filter for negative changes (sales)
    const salesEntries = auditEntries.filter(entry => {
      const change = parseFloat(entry.quantity_change?.toString() || '0');
      return change < 0;
    });

    if (salesEntries.length === 0) return [];

    // Group by date (same day)
    const groupedByDate = new Map<string, AuditLogEntry[]>();
    
    salesEntries.forEach(entry => {
      const date = new Date(entry.created_at).toDateString();
      if (!groupedByDate.has(date)) {
        groupedByDate.set(date, []);
      }
      groupedByDate.get(date)!.push(entry);
    });

    const batches: SalesBatch[] = [];
    
    groupedByDate.forEach((entries, date) => {
      const totalSold = Math.abs(entries.reduce((sum, entry) => {
        return sum + parseFloat(entry.quantity_change?.toString() || '0');
      }, 0));

      batches.push({
        date: date,
        total_products: entries.length,
        total_sold: totalSold,
        entries: entries
      });
    });

    return batches.sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  const toggleBatchExpansion = (date: string) => {
    setExpandedBatches(prev => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
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
          <p className="text-neutral-400 text-sm" style={{ fontFamily: 'Tiempos, serif' }}>Loading sales history...</p>
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
            onClick={fetchSalesData}
            className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all duration-200 border border-white/10"
            style={{ fontFamily: 'Tiempos, serif' }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (salesBatches.length === 0) {
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
          <h3 className="text-lg font-medium text-white mb-2" style={{ fontFamily: 'Tiempos, serif' }}>No Sales History</h3>
          <p className="text-neutral-400 text-sm" style={{ fontFamily: 'Tiempos, serif' }}>
            No sales found for the selected period.
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
            Sales History
          </h2>
          <span className="text-xs font-mono font-medium text-neutral-500 bg-white/5 px-2.5 py-1 rounded-lg">
            {salesBatches.length} days
          </span>
        </div>
      </div>

      {/* List View Style Items */}
      <div className="space-y-1 px-3">
        {salesBatches.map((batch, index) => {
          const isExpanded = expandedBatches.has(batch.date);

          return (
            <div
              key={batch.date}
              className={`group transition-all duration-300 cursor-pointer border-l-[3px] rounded-xl ${
                isExpanded
                  ? 'bg-white/[0.04] border-l-white/40 shadow-lg'
                  : 'border-l-transparent hover:bg-white/[0.02] hover:border-l-neutral-600/30'
              }`}
              style={{
                animation: `slideInRight 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${index * 0.03}s both`,
              }}
              onClick={() => toggleBatchExpansion(batch.date)}
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

                {/* Date & Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-medium text-neutral-200 truncate" style={{ fontFamily: 'Tiempos, serif' }}>
                    {new Date(batch.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5" style={{ fontFamily: 'Tiempos, serif' }}>
                    {batch.total_products} {batch.total_products === 1 ? 'transaction' : 'transactions'}
                  </p>
                </div>

                {/* Total Sold */}
                <div className="flex-shrink-0">
                  <div className="text-base font-medium text-red-400" style={{ fontFamily: 'Tiempos, serif' }}>
                    -{batch.total_sold.toFixed(0)}
                  </div>
                  <div className="text-xs text-neutral-500 mt-0.5" style={{ fontFamily: 'Tiempos, serif' }}>
                    items sold
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
                          <div className="text-xs text-neutral-500 mt-0.5" style={{ fontFamily: 'Tiempos, serif' }}>
                            {formatDateTime(entry.created_at)}
                          </div>
                        </div>

                        {/* Quantity Sold */}
                        <div className="flex-shrink-0">
                          <div className="text-sm font-medium text-red-400" style={{ fontFamily: 'Tiempos, serif' }}>
                            {entry.quantity_change !== null && entry.quantity_change !== undefined
                              ? parseFloat(entry.quantity_change.toString()).toFixed(0)
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

