'use client';

import React, { useState, useEffect, useMemo } from 'react';
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

interface InventoryHistoryViewProps {
  onBack: () => void;
  dateFilter: string;
  actionFilter: string;
}

export const InventoryHistoryView: React.FC<InventoryHistoryViewProps> = ({ onBack, dateFilter, actionFilter }) => {
  const { user } = useAuth();
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [auditBatches, setAuditBatches] = useState<AuditBatch[]>([]);
  const [expandedBatches, setExpandedBatches] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [productNames, setProductNames] = useState<Map<number, string>>(new Map());

  const itemsPerPage = 50;

  useEffect(() => {
    fetchAuditLog();
  }, [currentPage, actionFilter, dateFilter, user?.location_id]);

  // Debug: Log when productNames changes
  useEffect(() => {
    console.log('🔄 ProductNames state updated, size:', productNames.size, 'entries:', Array.from(productNames.entries()));
  }, [productNames]);

  const fetchProductNames = async (productIds: number[]) => {
    if (productIds.length === 0) return;

    try {
      // Get unique product IDs
      const uniqueIds = Array.from(new Set(productIds));
      console.log(`🔍 Fetching names for products:`, uniqueIds);

      // Fetch each product individually to ensure we get the data
      const productPromises = uniqueIds.map(async (productId) => {
        try {
          const response = await fetch(`/api/proxy/woocommerce/products/${productId}`, {
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
            }
          });

          if (response.ok) {
            const product = await response.json();
            
            // Check if the response contains an error (some APIs return 200 with error object)
            if (product.error) {
              console.warn(`❌ Product ${productId} not found: ${product.error}`);
              return { id: productId, name: `[Deleted] Product #${productId}` };
            }
            
            if (product.name) {
              console.log(`📦 Fetched product ${productId}: "${product.name}"`);
              return { id: productId, name: product.name };
            } else {
              console.warn(`❌ Product ${productId} has no name`);
              return { id: productId, name: `[No Name] Product #${productId}` };
            }
          } else {
            console.warn(`❌ Product ${productId} failed: HTTP ${response.status}`);
            return { id: productId, name: `[Missing] Product #${productId}` };
          }
        } catch (error) {
          console.error(`❌ Error fetching product ${productId}:`, error);
          return { id: productId, name: `[Error] Product #${productId}` };
        }
      });

      const productResults = await Promise.all(productPromises);
      
      // Update state with new product names
      setProductNames(prev => {
        const newMap = new Map(prev);
        productResults.forEach(product => {
          newMap.set(product.id, product.name);
          console.log(`✅ Added to cache: ${product.id} -> "${product.name}"`);
        });
        console.log(`🎯 Final cache state:`, Array.from(newMap.entries()));
        return newMap;
      });

    } catch (error) {
      console.error('Error in fetchProductNames:', error);
    }
  };

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

      // Fetch audit log entries
      const auditResponse = await fetch(`/api/audit-log?${params}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!auditResponse.ok) {
        throw new Error(`Failed to fetch audit log: ${auditResponse.statusText}`);
      }

      const auditData = await auditResponse.json();
      
      if (!auditData.success) {
        throw new Error(auditData.error || 'Failed to fetch audit log');
      }

      const entries = auditData.data || [];
      setAuditLog(entries);
      setTotalPages(Math.ceil((auditData.total || 0) / itemsPerPage));

      // Extract product IDs from entries and fetch their names
      const productIds = entries
        .map((entry: AuditLogEntry) => entry.product_id)
        .filter((id: number) => id && id > 0);
      
      await fetchProductNames(productIds);

      // Fetch audit batches for entries that have batch_id
      const batchIds = Array.from(new Set(entries.filter((entry: AuditLogEntry) => entry.batch_id).map((entry: AuditLogEntry) => entry.batch_id)));
      
      if (batchIds.length > 0) {
        try {
          const batchPromises = batchIds.map(async (batchId) => {
            const batchResponse = await fetch(`/api/proxy/flora-im/audit-batches/${batchId}`);
            if (batchResponse.ok) {
              const batchData = await batchResponse.json();
              return batchData;
            }
            return null;
          });

          const batches = await Promise.all(batchPromises);
          const validBatches = batches.filter(batch => batch !== null);
          
          // Group entries by batch
          const batchesWithEntries = validBatches.map(batch => {
            const batchIdNum = parseInt(batch.id);
            const batchEntries = entries.filter((entry: AuditLogEntry) => {
              const entryBatchId = typeof entry.batch_id === 'string' ? parseInt(entry.batch_id) : entry.batch_id;
              return entryBatchId === batchIdNum;
            });
            return {
              ...batch,
              entries: batchEntries
            };
          });

          setAuditBatches(batchesWithEntries);
        } catch (batchError) {
          console.warn('Failed to fetch batch details:', batchError);
          setAuditBatches([]);
        }
      } else {
        setAuditBatches([]);
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

  const getProductName = useMemo(() => {
    return (productId: number, variationId?: number) => {
      const productName = productNames.get(productId);
      const displayName = productName || `Product #${productId}`;
      
      if (variationId && variationId > 0) {
        return `${displayName} (Variant #${variationId})`;
      }
      
      return displayName;
    };
  }, [productNames]);

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

  // Group entries: batched entries and standalone entries
  const groupedEntries = () => {
    const batchedEntryIds = new Set();
    auditBatches.forEach(batch => {
      batch.entries?.forEach(entry => batchedEntryIds.add(entry.id));
    });

    const standaloneEntries = auditLog.filter(entry => !batchedEntryIds.has(entry.id));
    
    return {
      batches: auditBatches,
      standalone: standaloneEntries
    };
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
            {/* Table Header */}
            <div className="sticky top-0 bg-transparent backdrop-blur px-6 py-3 z-10">
              <div className="flex items-center gap-3 text-xs font-medium text-neutral-400">
                <div className="w-6"></div> {/* Space for expand icon */}
                <div className="flex-1">Product</div>
                <div className="w-24">Change</div>
                <div className="w-32">User</div>
                <div className="w-32">Date & Time</div>
              </div>
            </div>

            {/* Entries */}
            <div>
                {(() => {
                  const { batches, standalone } = groupedEntries();
                  const allItems = [
                    ...batches.map(batch => ({ type: 'batch' as const, data: batch })),
                    ...standalone.map(entry => ({ type: 'entry' as const, data: entry }))
                  ].sort((a, b) => {
                    const aDate = a.type === 'batch' ? a.data.created_at : a.data.created_at;
                    const bDate = b.type === 'batch' ? b.data.created_at : b.data.created_at;
                    return new Date(bDate).getTime() - new Date(aDate).getTime();
                  });

                  return allItems.map((item) => {
                    if (item.type === 'batch') {
                      const batch = item.data;
                      const batchId = typeof batch.id === 'string' ? parseInt(batch.id) : batch.id;
                      const isExpanded = expandedBatches.has(batchId);
                      
                      return (
                        <div 
                          key={`batch-${batch.id}`}
                          className={`group mb-2 rounded-lg relative overflow-visible border border-white/[0.06] bg-transparent hover:border-white/[0.12] hover:bg-white/[0.02] hover:shadow-md hover:shadow-neutral-700/10 transition-all duration-200 ease-out ${
                            isExpanded ? 'h-[calc(100vh-200px)] min-h-[600px]' : 'h-auto'
                          }`}
                          style={{
                            transition: 'height 0.4s cubic-bezier(0.25, 1, 0.5, 1), background-color 0.2s ease',
                            willChange: isExpanded ? 'height' : 'auto'
                          }}
                        >
                          {/* Batch Summary Row */}
                          <div 
                            className="flex items-center gap-3 px-6 py-3 cursor-pointer select-none relative bg-inherit"
                            style={{ zIndex: 2 }}
                            onClick={() => toggleBatchExpansion(batchId)}
                          >
                            {/* Expand/Collapse Icon */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleBatchExpansion(batchId);
                              }}
                              className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-neutral-600 hover:text-neutral-400 smooth-hover"
                            >
                              <svg
                                className={`w-3 h-3 transition-transform duration-300 ease-out ${isExpanded ? 'rotate-90' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                            
                            {/* Product */}
                            <div className="flex-1 text-sm truncate">
                              <div className="text-neutral-200 font-normal text-base" style={{ fontFamily: 'Tiempo, serif', textShadow: '0 1px 3px rgba(0, 0, 0, 0.8), 0 0 8px rgba(0, 0, 0, 0.3)' }}>
                                {batch.batch_name} • {batch.total_products} {batch.total_products === 1 ? 'product' : 'products'}
                              </div>
                              <div className="text-xs text-neutral-500" style={{ fontFamily: 'Tiempo, serif' }}>
                                {batch.audit_number}
                              </div>
                            </div>

                            {/* Change */}
                            <div className="w-24 text-sm font-medium text-neutral-300" style={{ fontFamily: 'Tiempo, serif' }}>
                              {batch.net_change > 0 ? '+' : ''}{parseFloat(batch.net_change.toString()).toFixed(4)}
                            </div>

                            {/* User */}
                            <div className="w-32 text-sm text-neutral-400" style={{ fontFamily: 'Tiempo, serif' }}>
                              {batch.user_name}
                            </div>

                            {/* Date & Time */}
                            <div className="w-32 text-sm text-neutral-400" style={{ fontFamily: 'Tiempo, serif' }}>
                              {formatDateTime(batch.created_at)}
                            </div>
                          </div>

                          {/* Expanded View */}
                          {isExpanded && (
                            <div 
                              className="absolute inset-x-0 top-[60px] bottom-0 bg-transparent border-t border-white/[0.06] overflow-y-auto p-4"
                              style={{
                                animation: 'expandTopDown 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards',
                                transformOrigin: 'top',
                              }}
                            >
                              <div className="space-y-2">
                                <div className="text-xs text-neutral-400 mb-4">
                                  Audit Entries for {batch.audit_number}
                                </div>
                                
                                {batch.entries && batch.entries.map((entry) => (
                                  <div 
                                    key={`entry-${entry.id}`}
                                    className="bg-transparent rounded p-3 border border-white/[0.06]"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="flex-1 text-neutral-500 text-sm truncate">
                                        <div className="text-neutral-500 text-sm">
                                          {getProductName(entry.product_id, entry.variation_id)}
                                        </div>
                                        <div className="text-xs text-neutral-600 truncate">
                                          {formatDateTime(entry.created_at)}
                                        </div>
                                      </div>
                                      
                                      <div className="w-24 text-neutral-500 text-xs">
                                        {entry.quantity_change !== null && entry.quantity_change !== undefined && !isNaN(parseFloat(entry.quantity_change.toString())) 
                                          ? (parseFloat(entry.quantity_change.toString()) > 0 ? '+' : '') + parseFloat(entry.quantity_change.toString()).toFixed(4)
                                          : '—'}
                                      </div>
                                      
                                      <div className="w-32 text-neutral-500 text-xs">
                                        {entry.user_name && entry.user_name !== 'System' && entry.user_name.trim() !== '' 
                                          ? entry.user_name 
                                          : user?.username || `User #${entry.user_id}`}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    } else {
                      // Standalone entry
                      const entry = item.data;
                      return (
                        <div 
                          key={`standalone-${entry.id}`}
                          className="group mb-2 rounded-lg relative overflow-visible border border-white/[0.06] bg-transparent hover:border-white/[0.12] hover:bg-white/[0.02] hover:shadow-md hover:shadow-neutral-700/10 transition-all duration-200 ease-out"
                        >
                          <div className="flex items-center gap-3 px-6 py-3">
                            {/* No expand icon for standalone */}
                            <div className="w-6"></div>
                            
                            {/* Product */}
                            <div className="flex-1 text-sm truncate">
                              <div className="text-neutral-200 font-normal text-base" style={{ fontFamily: 'Tiempo, serif', textShadow: '0 1px 3px rgba(0, 0, 0, 0.8), 0 0 8px rgba(0, 0, 0, 0.3)' }}>
                                {getProductName(entry.product_id, entry.variation_id)}
                              </div>
                              <div className="text-xs text-neutral-500" style={{ fontFamily: 'Tiempo, serif' }}>
                                Entry #{entry.id}
                              </div>
                            </div>

                            {/* Change */}
                            <div className="w-24 text-sm font-medium text-neutral-300" style={{ fontFamily: 'Tiempo, serif' }}>
                              {entry.quantity_change !== null && entry.quantity_change !== undefined && !isNaN(parseFloat(entry.quantity_change.toString())) 
                                ? (parseFloat(entry.quantity_change.toString()) > 0 ? '+' : '') + parseFloat(entry.quantity_change.toString()).toFixed(4)
                                : '—'}
                            </div>

                            {/* User */}
                            <div className="w-32 text-sm text-neutral-400" style={{ fontFamily: 'Tiempo, serif' }}>
                              {entry.user_name && entry.user_name !== 'System' && entry.user_name.trim() !== '' 
                                ? entry.user_name 
                                : user?.username || `User #${entry.user_id}`}
                            </div>

                            {/* Date & Time */}
                            <div className="w-32 text-sm text-neutral-400" style={{ fontFamily: 'Tiempo, serif' }}>
                              {formatDateTime(entry.created_at)}
                            </div>
                          </div>
                        </div>
                      );
                    }
                  });
                })()}
            </div>

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
        <div className="absolute inset-0 bg-transparent flex items-center justify-center">
          <div className="bg-transparent border border-white/[0.06] rounded-lg p-4 flex items-center gap-3 backdrop-blur-sm">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white/20"></div>
            <span className="text-neutral-300" style={{ fontFamily: 'Tiempo, serif' }}>Updating...</span>
          </div>
        </div>
      )}
    </div>
  );
};
