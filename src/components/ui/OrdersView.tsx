import React, { useState, useEffect, useRef } from 'react';
import { IconButton } from './IconButton';
import { Button } from './Button';
import { OrdersGridHeader } from './OrdersGridHeader';
import { ConfirmModal, LoadingSpinner } from './';
import { useAuth } from '../../contexts/AuthContext';

export interface WooCommerceOrder {
  id: number;
  number: string;
  status: string;
  currency: string;
  total: string;
  subtotal: string;
  tax_total: string;
  shipping_total: string;
  date_created: string;
  date_modified: string;
  date_completed: string | null;
  customer_id: number;
  customer_note: string;
  created_via: string;
  billing: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  payment_method: string;
  payment_method_title: string;
  transaction_id: string;
  line_items: Array<{
    id: number;
    name: string;
    product_id: number;
    variation_id: number;
    quantity: number;
    price: number;
    subtotal: string;
    total: string;
    sku: string;
    meta_data: Array<{
      key: string;
      value: any;
    }>;
  }>;
  shipping_lines: Array<{
    method_title: string;
    total: string;
  }>;
  tax_lines: Array<any>;
  fee_lines: Array<any>;
  coupon_lines: Array<any>;
  refunds: Array<any>;
  meta_data: Array<{
    key: string;
    value: any;
  }>;
}

interface OrdersViewProps {
  onClose?: () => void;
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
  onClearSelection?: () => void;
  onSelectedOrdersChange?: (selected: Set<number>) => void;
  onTotalOrdersChange?: (total: number) => void;
  hideLoadingOverlay?: boolean;
}

export interface OrdersViewRef {
  handleRefresh: () => void;
}

type OrderTab = 'items' | 'customer' | 'shipping' | 'payment' | 'notes';

interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  required?: boolean;
}

const OrdersViewComponent = React.forwardRef<OrdersViewRef, OrdersViewProps>(({ 
  onClose, 
  hideLoadingOverlay = false,
  statusFilter = 'any',
  onStatusFilterChange,
  onClearSelection,
  onSelectedOrdersChange,
  onTotalOrdersChange 
}, ref) => {
  const [orders, setOrders] = useState<WooCommerceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [activeOrderTab, setActiveOrderTab] = useState<{ [orderId: number]: OrderTab }>({});
  const [isColumnSelectorOpen, setIsColumnSelectorOpen] = useState(false);
  const columnSelectorRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  
  // Additional filter states to match portal2
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  

  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  
  const { user } = useAuth();

  // Column configuration
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { id: 'order', label: 'Order', visible: true, required: true },
    { id: 'customer', label: 'Customer', visible: true },
    { id: 'location', label: 'Location', visible: true },
    { id: 'source', label: 'Source', visible: true },
    { id: 'date', label: 'Date', visible: true },
    { id: 'status', label: 'Status', visible: true },
    { id: 'total', label: 'Total', visible: true },
    { id: 'payment', label: 'Payment Method', visible: false },
    { id: 'shipping', label: 'Shipping Method', visible: false },
    { id: 'items', label: 'Items Count', visible: false },
  ]);

  // Toggle column visibility
  const toggleColumn = (columnId: string) => {
    setColumns(prev => prev.map(col => 
      col.id === columnId ? { ...col, visible: !col.visible } : col
    ));
  };

  // Close column selector when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (columnSelectorRef.current && !columnSelectorRef.current.contains(event.target as Node)) {
        setIsColumnSelectorOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load orders data with location filtering
  const loadData = async (page: number = 1, status: string = 'any') => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '50',
        status,
        orderby: 'date',
        order: 'desc',
      });

      // Add location filter based on logged-in user's location ID
      if (user?.location_id) {
        params.append('location_id', user.location_id);
        console.log(`🏢 [OrdersView] Filtering orders for location ID: ${user.location_id} (${user.location})`);
        console.log(`🏢 [OrdersView] Full user object:`, user);
      } else {
        console.warn('⚠️ [OrdersView] User has no location_id assigned, cannot filter orders by location');
        console.log('🏢 [OrdersView] Current user object:', user);
      }

      // If user has no location_id, don't make the request - return empty results
      if (!user?.location_id) {
        console.log(`🚫 [OrdersView] User has no location_id, returning empty results for security`);
        setOrders([]);
        setTotalOrders(0);
        setTotalPages(1);
        setCurrentPage(1);
        
        if (onTotalOrdersChange) {
          onTotalOrdersChange(0);
        }
        return;
      }

      console.log(`📞 [OrdersView] Making API request with params:`, params.toString());
      const response = await fetch(`/api/orders?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const result = await response.json();
      
      if (result.success) {
        // CRITICAL: Client-side location filtering as backup security measure
        let filteredOrders = result.data;
        if (user?.location_id) {
          const userLocationId = user.location_id;
          console.log(`🔒 [OrdersView Security] Applying client-side location filter for location_id: ${userLocationId}`);
          
          filteredOrders = result.data.filter((order: any) => {
            // Check all possible location metadata keys
            const posLocationId = order.meta_data?.find((m: any) => m.key === '_pos_location_id')?.value;
            const floraLocationId = order.meta_data?.find((m: any) => m.key === '_flora_location_id')?.value;
            const storeId = order.meta_data?.find((m: any) => m.key === '_store_id')?.value;
            
            // Order passes if ANY of the location metadata matches the user's location
            const hasMatchingLocation = (
              posLocationId === userLocationId ||
              floraLocationId === userLocationId ||
              storeId === userLocationId
            );
            
            if (!hasMatchingLocation) {
              console.log(`🚫 [Security] Filtering out Order #${order.id} - pos_loc=${posLocationId}, flora_loc=${floraLocationId}, store=${storeId} (user needs ${userLocationId})`);
            }
            
            return hasMatchingLocation;
          });
          
          console.log(`🔒 [Security] Filtered ${result.data.length} orders down to ${filteredOrders.length} orders for location ${userLocationId}`);
        }
        
        setOrders(filteredOrders);
        setTotalOrders(filteredOrders.length); // Use filtered count
        setTotalPages(Math.ceil(filteredOrders.length / 50)); // Recalculate pages
        setCurrentPage(result.meta.current_page);
        
        // Debug: Log the orders we're displaying after filtering
        console.log(`🔍 [OrdersView] Displaying ${filteredOrders.length} filtered orders:`);
        filteredOrders.slice(0, 5).forEach((order: any) => {
          const locationMeta = order.meta_data?.filter((meta: any) => 
            meta.key.includes('location') || meta.key.includes('store') || meta.key.includes('pos')
          ) || [];
          const orderLocation = getOrderLocation(order);
          console.log(`  Order #${order.id} - Detected Location: "${orderLocation}" - Meta:`, locationMeta);
        });
        
        // Update parent with filtered orders count
        if (onTotalOrdersChange) {
          onTotalOrdersChange(filteredOrders.length);
        }
        
      } else {
        throw new Error(result.error || 'Failed to fetch orders');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(currentPage, statusFilter);
  }, [currentPage, statusFilter, user?.location_id]);

  // Handle status filter changes from parent
  const handleStatusFilterChange = (status: string) => {
    if (onStatusFilterChange) {
      onStatusFilterChange(status);
    }
    setCurrentPage(1); // Reset to first page when filter changes
  };

  // Handle clear selection
  const handleClearSelection = () => {
    const emptySet = new Set<number>();
    setSelectedOrders(emptySet);
    if (onSelectedOrdersChange) {
      onSelectedOrdersChange(emptySet);
    }
    if (onClearSelection) {
      onClearSelection();
    }
  };

  // Toggle expand card
  const toggleExpand = (id: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
      // Set default tab if not set
      if (!activeOrderTab[id]) {
        setActiveOrderTab(prev => ({ ...prev, [id]: 'items' }));
      }
    }
    setExpandedCards(newExpanded);
  };

  // Toggle selection
  const toggleOrderSelection = (id: number) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedOrders(newSelected);
    
    // Update parent with selected orders
    if (onSelectedOrdersChange) {
      onSelectedOrdersChange(newSelected);
    }
  };

  // Set active tab for an order
  const setOrderTab = (orderId: number, tab: OrderTab) => {
    setActiveOrderTab(prev => ({ ...prev, [orderId]: tab }));
  };

  // Update order status
  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      setError(null);
      
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId, status: newStatus })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update order status');
      }

      const result = await response.json();
      if (result.success) {
        // Update local state
        setOrders(prev => prev.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        ));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order status');
    }
  };

  // Delete order
  const deleteOrder = async (orderId: number) => {
    // Show confirm modal instead of browser confirm
    setConfirmModal({
      isOpen: true,
      title: 'Delete Order',
      message: 'Are you sure you want to delete this order? This action cannot be undone.',
      onConfirm: () => performDeleteOrder(orderId)
    });
  };
  
  const performDeleteOrder = async (orderId: number) => {

    try {
      setError(null);
      
      const response = await fetch(`/api/orders?id=${orderId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete order');
      }

      setOrders(prev => prev.filter(order => order.id !== orderId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete order');
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format status text
  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');
  };

  // Get location info from order metadata
  const getOrderLocation = (order: WooCommerceOrder) => {
    // Try to get location ID first
    const locationIdMeta = order.meta_data?.find(meta => 
      meta.key === '_pos_location_id' || 
      meta.key === '_flora_location_id' || 
      meta.key === '_store_id'
    );
    
    // Try to get location name
    const locationNameMeta = order.meta_data?.find(meta => 
      meta.key === '_pos_location_name' || 
      meta.key === '_pos_location'
    );

    // Map location IDs to names
    const locationIdToName: { [key: number]: string } = {
      19: 'Charlotte Monroe',
      20: 'Charlotte Central',
      21: 'Blowing Rock',
      23: 'Warehouse',
      25: 'Main Location'
    };

    if (locationIdMeta) {
      const locationId = parseInt(locationIdMeta.value);
      return locationIdToName[locationId] || `Location ID: ${locationId}`;
    }
    
    if (locationNameMeta) {
      return locationNameMeta.value;
    }

    // Check if it's a POS order without location metadata
    const posOrder = order.meta_data?.some(meta => 
      meta.key === '_created_via' && (meta.value?.includes('pos') || meta.value === 'posv1')
    );
    
    return posOrder ? 'POS (Legacy)' : 'Online';
  };

  // Get order source with detailed identification
  const getOrderSource = (order: WooCommerceOrder) => {
    // Check for explicit order source metadata
    const orderSourceMeta = order.meta_data?.find(meta => 
      meta.key === '_order_source' || meta.key === '_order_source_system'
    );
    
    if (orderSourceMeta) {
      return orderSourceMeta.value;
    }

    // Check created_via field
    if (order.created_via) {
      switch (order.created_via) {
        case 'posv1':
          return 'POS V1';
        case 'pos':
          return 'POS';
        case 'admin':
          return 'WooCommerce Admin';
        case 'rest-api':
          // Check if it's actually from a POS system
          const posOrder = order.meta_data?.some(meta => 
            meta.key === '_pos_order' && meta.value === 'true'
          );
          return posOrder ? 'POS (API)' : 'REST API';
        case 'checkout':
          return 'Online Store';
        default:
          return order.created_via;
      }
    }

    // Fallback: check metadata for POS indicators
    const posOrder = order.meta_data?.some(meta => 
      meta.key === '_pos_order' || 
      meta.key === '_created_via' && meta.value?.includes('pos')
    );

    return posOrder ? 'POS (Unknown)' : 'Online Store';
  };

  // Expose methods to parent component
  React.useImperativeHandle(ref, () => ({
    handleRefresh: () => loadData(currentPage, statusFilter)
  }));

  return (
    <div className="h-full bg-neutral-900 flex flex-col">
      {/* Orders Header */}
      <OrdersGridHeader
        statusFilter={statusFilter}
        onStatusFilterChange={onStatusFilterChange || handleStatusFilterChange}
        totalOrders={totalOrders}
        selectedOrdersCount={selectedOrders.size}
        onClearSelection={handleClearSelection}
        selectedEmployee={selectedEmployee}
        onEmployeeChange={setSelectedEmployee}
        employeeOptions={[]} // Employee options can be loaded later if needed
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        showSelectedOnly={showSelectedOnly}
        onShowSelectedOnlyChange={setShowSelectedOnly}
      />
      
      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-neutral-900 relative">
        {/* Loading Overlay */}
        {loading && !hideLoadingOverlay && (
          <LoadingSpinner 
            overlay 
            size="lg" 
            text="Loading orders..."
          />
        )}
        
        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-red-300">{error}</span>
            </div>
          </div>
        )}



        {/* Table View */}
        <div className="w-full">
          {/* Table Header */}
          <div className="sticky top-0 bg-neutral-900 backdrop-blur border-b border-white/[0.08] px-6 py-3 z-10">
            <div className="flex items-center gap-3 text-xs md:text-base font-medium text-neutral-400 relative">
              <div className="w-6"></div> {/* Space for expand icon */}
              {columns.find(c => c.id === 'order')?.visible && (
                <div className="w-32">Order</div>
              )}
              {columns.find(c => c.id === 'customer')?.visible && (
                <div className="flex-1">Customer</div>
              )}
              {columns.find(c => c.id === 'location')?.visible && (
                <div className="w-32">Location</div>
              )}
              {columns.find(c => c.id === 'source')?.visible && (
                <div className="w-24">Source</div>
              )}
              {columns.find(c => c.id === 'date')?.visible && (
                <div className="w-40">Date</div>
              )}
              {columns.find(c => c.id === 'status')?.visible && (
                <div className="w-32">Status</div>
              )}
              {columns.find(c => c.id === 'total')?.visible && (
                <div className="w-32">Total</div>
              )}
              {columns.find(c => c.id === 'payment')?.visible && (
                <div className="w-40">Payment</div>
              )}
              {columns.find(c => c.id === 'shipping')?.visible && (
                <div className="w-40">Shipping</div>
              )}
              {columns.find(c => c.id === 'items')?.visible && (
                <div className="w-24">Items</div>
              )}

              {/* Column Selector Icon - Far Right */}
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2" ref={columnSelectorRef}>
                <button
                  onClick={() => setIsColumnSelectorOpen(!isColumnSelectorOpen)}
                  className="flex items-center gap-2 px-2 py-1.5 bg-white/[0.05] text-neutral-300 rounded-lg hover:bg-white/[0.08] transition text-xs relative"
                  title="Configure table columns"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>

                {/* Column Selector Dropdown */}
                {isColumnSelectorOpen && (
                  <div className="absolute right-0 top-full mt-1 w-64 bg-neutral-800 border border-white/[0.08] rounded-lg shadow-lg" style={{ zIndex: 99999 }}>
                    <div className="p-3">
                      <div className="text-xs font-medium text-neutral-300 mb-3">Configure Table Columns</div>
                      
                      <div className="space-y-2">
                        {columns.map(column => (
                          <label key={column.id} className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer hover:text-neutral-200">
                            <input
                              type="checkbox"
                              checked={column.visible}
                              onChange={() => toggleColumn(column.id)}
                              disabled={column.required}
                              className="rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500 focus:ring-1 disabled:opacity-50"
                            />
                            <span className={column.required ? 'text-neutral-500' : ''}>
                              {column.label}
                            </span>
                            {column.required && (
                              <span className="text-neutral-600 text-[10px]">(required)</span>
                            )}
                          </label>
                        ))}
                      </div>

                      <div className="mt-3 pt-3 border-t border-white/[0.08] flex gap-2">
                        <button
                          onClick={() => {
                            setColumns(prev => prev.map(col => ({ ...col, visible: true })));
                          }}
                          className="flex-1 text-xs text-neutral-400 hover:text-neutral-300 px-2 py-1 rounded hover:bg-white/[0.05]"
                        >
                          Show All
                        </button>
                        <button
                          onClick={() => {
                            setColumns(prev => prev.map(col => ({ ...col, visible: col.required || false })));
                          }}
                          className="flex-1 text-xs text-neutral-400 hover:text-neutral-300 px-2 py-1 rounded hover:bg-white/[0.05]"
                        >
                          Hide All
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Table Rows */}
          <div>
            {orders.map((order) => (
              <div
                key={order.id}
                className={`group transition-all mb-2 rounded-lg border-b border-white/[0.02] ${
                  selectedOrders.has(order.id)
                    ? 'bg-neutral-800/50 hover:bg-neutral-800/70 border-l-4 border-l-neutral-400'
                    : 'bg-neutral-900/40 hover:bg-neutral-800/60'
                }`}
              >
                {/* Order Row - Single Line */}
                <div 
                  className="flex items-center gap-3 px-6 py-3 cursor-pointer select-none"
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    const isButton = target.closest('button');
                    if (!isButton) {
                      toggleOrderSelection(order.id);
                    }
                  }}
                  onDoubleClick={(e) => {
                    const target = e.target as HTMLElement;
                    const isButton = target.closest('button');
                    if (!isButton) {
                      e.stopPropagation();
                      toggleExpand(order.id);
                    }
                  }}
                >
                  {/* Expand/Collapse Icon */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(order.id);
                    }}
                    className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-neutral-600 hover:text-neutral-400 transition-colors"
                  >
                    <svg
                      className={`w-3 h-3 transition-transform duration-300 ease-out ${expandedCards.has(order.id) ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  
                  {/* Order Number */}
                  {columns.find(c => c.id === 'order')?.visible && (
                    <div className="w-32">
                      <div className="text-neutral-500 text-sm">
                        #{order.id}
                      </div>
                    </div>
                  )}

                  {/* Customer */}
                  {columns.find(c => c.id === 'customer')?.visible && (
                    <div className="flex-1 min-w-0">
                      <div className="text-neutral-500 text-sm">
                        {order.billing.first_name} {order.billing.last_name}
                      </div>
                      <div className="text-xs text-neutral-600 truncate">
                        {order.billing.email}
                      </div>
                    </div>
                  )}

                  {/* Location */}
                  {columns.find(c => c.id === 'location')?.visible && (
                    <div className="w-32 text-neutral-500 text-xs">
                      {getOrderLocation(order)}
                    </div>
                  )}

                  {/* Source */}
                  {columns.find(c => c.id === 'source')?.visible && (
                    <div className="w-24 text-neutral-500 text-xs">
                      {getOrderSource(order)}
                    </div>
                  )}

                  {/* Date */}
                  {columns.find(c => c.id === 'date')?.visible && (
                    <div className="w-40 text-neutral-500 text-xs">
                      {formatDate(order.date_created)}
                    </div>
                  )}

                  {/* Status */}
                  {columns.find(c => c.id === 'status')?.visible && (
                    <div className="w-32 text-neutral-500 text-xs">
                      {formatStatus(order.status)}
                    </div>
                  )}

                  {/* Total */}
                  {columns.find(c => c.id === 'total')?.visible && (
                    <div className="w-32 text-neutral-400 text-sm">
                      {order.currency} {order.total}
                    </div>
                  )}

                  {/* Payment Method */}
                  {columns.find(c => c.id === 'payment')?.visible && (
                    <div className="w-40 text-neutral-500 text-xs">
                      {order.payment_method_title || 'N/A'}
                    </div>
                  )}

                  {/* Shipping Method */}
                  {columns.find(c => c.id === 'shipping')?.visible && (
                    <div className="w-40 text-neutral-500 text-xs">
                      {order.shipping_lines?.[0]?.method_title || 'N/A'}
                    </div>
                  )}

                  {/* Items Count */}
                  {columns.find(c => c.id === 'items')?.visible && (
                    <div className="w-24 text-neutral-500 text-xs">
                      {order.line_items?.length || 0} items
                    </div>
                  )}
                </div>

                {/* Expanded View */}
                {expandedCards.has(order.id) && (
                  <div className="mx-6 mb-2 rounded p-4 bg-neutral-800/30 hover:bg-neutral-800/50 border-t border-white/[0.02]">
                    {/* Tab Controls */}
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/[0.08]">
                      <Button
                        onClick={() => setOrderTab(order.id, 'items')}
                        size="sm"
                        variant={activeOrderTab[order.id] === 'items' || !activeOrderTab[order.id] ? 'primary' : 'ghost'}
                        className="text-xs"
                      >
                        Items
                      </Button>
                      <Button
                        onClick={() => setOrderTab(order.id, 'customer')}
                        size="sm"
                        variant={activeOrderTab[order.id] === 'customer' ? 'primary' : 'ghost'}
                        className="text-xs"
                      >
                        Customer
                      </Button>
                      <Button
                        onClick={() => setOrderTab(order.id, 'shipping')}
                        size="sm"
                        variant={activeOrderTab[order.id] === 'shipping' ? 'primary' : 'ghost'}
                        className="text-xs"
                      >
                        Shipping
                      </Button>
                      <Button
                        onClick={() => setOrderTab(order.id, 'payment')}
                        size="sm"
                        variant={activeOrderTab[order.id] === 'payment' ? 'primary' : 'ghost'}
                        className="text-xs"
                      >
                        Payment
                      </Button>
                      <Button
                        onClick={() => setOrderTab(order.id, 'notes')}
                        size="sm"
                        variant={activeOrderTab[order.id] === 'notes' ? 'primary' : 'ghost'}
                        className="text-xs"
                      >
                        Notes
                      </Button>
                    </div>

                    {/* Tab Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {/* Items Tab */}
                      {(activeOrderTab[order.id] === 'items' || !activeOrderTab[order.id]) && (
                        <>
                          <div className="lg:col-span-2 space-y-2">
                            <div className="text-neutral-500 font-medium text-xs mb-2">
                              Order Items
                            </div>
                            {order.line_items?.map((item) => {
                              // Extract pricing tier information from line item metadata
                              const tierLabel = item.meta_data?.find(m => m.key === '_pricing_tier_label')?.value;
                              const tierRuleName = item.meta_data?.find(m => m.key === '_pricing_tier_rule_name')?.value;
                              const tierPrice = item.meta_data?.find(m => m.key === '_pricing_tier_price')?.value;
                              const tierCategory = item.meta_data?.find(m => m.key === '_pricing_tier_category')?.value;
                              
                              // Debug: Log the actual line item structure to console (only for development)
                              if (process.env.NODE_ENV === 'development') {
                                console.log(`🔍 [OrdersView] Line item ${item.id} pricing tier data:`, {
                                  name: item.name,
                                  has_tier_data: !!tierLabel,
                                  tier_label: tierLabel,
                                  tier_rule: tierRuleName,
                                  tier_price: tierPrice,
                                  tier_category: tierCategory,
                                  meta_data_keys: item.meta_data?.map(m => m.key) || []
                                });
                              }
                              
                              return (
                                <div key={item.id} className="bg-neutral-900/40 rounded p-2">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <div className="text-neutral-300 text-sm">{item.name}</div>
                                      <div className="text-neutral-600 text-xs">SKU: {item.sku || 'N/A'}</div>
                                      
                                      {/* Display pricing tier information if available */}
                                      {tierLabel ? (
                                        <div className="text-xs text-neutral-500 mt-1">
                                          <div className="text-blue-400">{tierLabel}</div>
                                          {tierRuleName && (
                                            <div className="text-neutral-600">({tierRuleName})</div>
                                          )}
                                        </div>
                                      ) : (
                                        /* Fallback: Show category information if no tier data */
                                        tierCategory && (
                                          <div className="text-xs text-orange-400 mt-1">
                                            Category: {tierCategory}
                                          </div>
                                        )
                                      )}
                                      
                                      {/* Debug: Show if we have any metadata */}
                                      {!tierLabel && item.meta_data && item.meta_data.length > 0 && (
                                        <div className="text-xs text-red-400 mt-1">
                                          📊 Has metadata but no tier info
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <div className="text-neutral-500 text-xs">Qty: {item.quantity}</div>
                                      <div className="text-neutral-400 text-sm">{order.currency} {item.total}</div>
                                      {tierPrice && parseFloat(tierPrice) !== item.price && (
                                        <div className="text-neutral-600 text-xs">
                                          Tier price: ${parseFloat(tierPrice).toFixed(2)}/unit
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <div className="space-y-2">
                            <div className="text-neutral-500 font-medium text-xs mb-2">
                              Order Summary
                            </div>
                            <div className="bg-neutral-900/40 rounded p-2">
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-600 text-xs">Subtotal:</span>
                                <span className="text-neutral-400 text-xs">{order.currency} {order.subtotal}</span>
                              </div>
                            </div>
                            {order.shipping_lines?.length > 0 && (
                              <div className="bg-neutral-900/40 rounded p-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-neutral-600 text-xs">Shipping:</span>
                                  <span className="text-neutral-400 text-xs">{order.currency} {order.shipping_lines[0].total}</span>
                                </div>
                              </div>
                            )}
                            <div className="bg-neutral-900/40 rounded p-2">
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-600 text-xs font-medium">Total:</span>
                                <span className="text-neutral-400 text-sm font-medium">{order.currency} {order.total}</span>
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Customer Tab */}
                      {activeOrderTab[order.id] === 'customer' && (
                        <>
                          <div className="space-y-2">
                            <div className="text-neutral-500 font-medium text-xs mb-2">
                              Customer Information
                            </div>
                            <div className="bg-neutral-900/40 rounded p-2">
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-600 text-xs">Name:</span>
                                <span className="text-neutral-500 text-xs">{order.billing.first_name} {order.billing.last_name}</span>
                              </div>
                            </div>
                            <div className="bg-neutral-900/40 rounded p-2">
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-600 text-xs">Email:</span>
                                <span className="text-neutral-500 text-xs">{order.billing.email}</span>
                              </div>
                            </div>
                            <div className="bg-neutral-900/40 rounded p-2">
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-600 text-xs">Phone:</span>
                                <span className="text-neutral-500 text-xs">{order.billing.phone || 'Not provided'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-neutral-500 font-medium text-xs mb-2">
                              Billing Address
                            </div>
                            <div className="bg-neutral-900/40 rounded p-2">
                              <div className="text-neutral-500 text-xs">
                                {order.billing.address_1}<br />
                                {order.billing.address_2 && <>{order.billing.address_2}<br /></>}
                                {order.billing.city}, {order.billing.state} {order.billing.postcode}<br />
                                {order.billing.country}
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-neutral-500 font-medium text-xs mb-2">
                              Customer ID
                            </div>
                            <div className="bg-neutral-900/40 rounded p-2">
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-600 text-xs">User ID:</span>
                                <span className="text-neutral-500 text-xs">{order.customer_id || 'Guest'}</span>
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Shipping Tab */}
                      {activeOrderTab[order.id] === 'shipping' && (
                        <>
                          <div className="space-y-2">
                            <div className="text-neutral-500 font-medium text-xs mb-2">
                              Shipping Address
                            </div>
                            <div className="bg-neutral-900/40 rounded p-2">
                              <div className="text-neutral-500 text-xs">
                                {order.shipping.first_name} {order.shipping.last_name}<br />
                                {order.shipping.address_1}<br />
                                {order.shipping.address_2 && <>{order.shipping.address_2}<br /></>}
                                {order.shipping.city}, {order.shipping.state} {order.shipping.postcode}<br />
                                {order.shipping.country}
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-neutral-500 font-medium text-xs mb-2">
                              Shipping Method
                            </div>
                            {order.shipping_lines?.map((shipping, index) => (
                              <div key={index} className="bg-neutral-900/40 rounded p-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-neutral-500 text-xs">{shipping.method_title}</span>
                                  <span className="text-neutral-400 text-xs">{order.currency} {shipping.total}</span>
                                </div>
                              </div>
                            ))}
                            {(!order.shipping_lines || order.shipping_lines.length === 0) && (
                              <div className="bg-neutral-900/40 rounded p-2">
                                <div className="text-neutral-500 text-xs">No shipping method selected</div>
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <div className="text-neutral-500 font-medium text-xs mb-2">
                              Tracking
                            </div>
                            <div className="bg-neutral-900/40 rounded p-2">
                              <div className="text-neutral-500 text-xs">No tracking information available</div>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Payment Tab */}
                      {activeOrderTab[order.id] === 'payment' && (
                        <>
                          <div className="space-y-2">
                            <div className="text-neutral-500 font-medium text-xs mb-2">
                              Payment Method
                            </div>
                            <div className="bg-neutral-900/40 rounded p-2">
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-600 text-xs">Method:</span>
                                <span className="text-neutral-500 text-xs">{order.payment_method_title || 'Not specified'}</span>
                              </div>
                            </div>
                            <div className="bg-neutral-900/40 rounded p-2">
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-600 text-xs">Transaction ID:</span>
                                <span className="text-neutral-500 text-xs">{order.transaction_id || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-neutral-500 font-medium text-xs mb-2">
                              Payment Status
                            </div>
                            <div className="bg-neutral-900/40 rounded p-2">
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-600 text-xs">Status:</span>
                                <span className="text-neutral-500 text-xs">
                                  {formatStatus(order.status)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-neutral-500 font-medium text-xs mb-2">
                              Actions
                            </div>
                            <div className="bg-neutral-900/40 rounded p-2">
                              <select
                                value={order.status}
                                onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                className="w-full px-2 py-1 bg-neutral-900/60 border border-white/[0.1] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-xs"
                              >
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="on-hold">On Hold</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="refunded">Refunded</option>
                                <option value="failed">Failed</option>
                              </select>
                              <button
                                onClick={() => deleteOrder(order.id)}
                                className="w-full mt-2 px-2 py-1 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] rounded text-neutral-400 hover:text-neutral-300 text-xs"
                              >
                                Delete Order
                              </button>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Notes Tab */}
                      {activeOrderTab[order.id] === 'notes' && (
                        <>
                          <div className="lg:col-span-3 space-y-2">
                            <div className="text-neutral-500 font-medium text-xs mb-2">
                              Order Notes
                            </div>
                            <div className="bg-neutral-900/40 rounded p-2">
                              <div className="text-neutral-500 text-xs">
                                {order.customer_note || 'No notes available for this order'}
                              </div>
                            </div>
                            <div className="text-neutral-500 font-medium text-xs mb-2 mt-4">
                              Order Metadata
                            </div>
                            <div className="bg-neutral-900/40 rounded p-2">
                              <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-neutral-600 text-xs">Order ID:</span>
                                  <span className="text-neutral-500 text-xs">#{order.id}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-neutral-600 text-xs">Location:</span>
                                  <span className="text-neutral-500 text-xs">{getOrderLocation(order)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-neutral-600 text-xs">Source:</span>
                                  <span className="text-neutral-500 text-xs">{getOrderSource(order)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-neutral-600 text-xs">Created Via:</span>
                                  <span className="text-neutral-500 text-xs">{order.created_via || 'Unknown'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-neutral-600 text-xs">Created:</span>
                                  <span className="text-neutral-500 text-xs">{formatDate(order.date_created)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-neutral-600 text-xs">Modified:</span>
                                  <span className="text-neutral-500 text-xs">{formatDate(order.date_modified)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="sticky bottom-0 bg-neutral-900 border-t border-white/[0.08] px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="text-xs text-neutral-400">
                Page {currentPage} of {totalPages} ({totalOrders} orders)
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-xs bg-neutral-700 hover:bg-neutral-600 disabled:bg-neutral-800 disabled:text-neutral-500 text-neutral-300 rounded transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-xs bg-neutral-700 hover:bg-neutral-600 disabled:bg-neutral-800 disabled:text-neutral-500 text-neutral-300 rounded transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-neutral-300 mb-2">No orders found</h3>
            <p className="text-sm text-neutral-500 text-center mb-6 max-w-sm">
              {user?.location_id ? `No orders found for location: ${user.location}` : 'No orders found'}
            </p>
          </div>
        )}
      </div>
      
      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant="danger"
        confirmText="Delete"
      />
      

    </div>
  );
});

OrdersViewComponent.displayName = 'OrdersView';

// Export the component directly without any wrappers
// This avoids ref passing issues with lazy loading
export default OrdersViewComponent;