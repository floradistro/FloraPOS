import React, { useState, useEffect, useRef } from 'react';
import { IconButton } from './IconButton';
import { Button } from './Button';
import { ConfirmModal, LoadingSpinner } from './';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { WordPressUser } from '../../services/users-service';
import { UnifiedLoadingScreen } from './UnifiedLoadingScreen';
import { formatOrderDate, formatOrderDateTime } from '../../utils/date-utils';

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
  customer_name?: string;
  customer_email?: string;
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
  // Filter props from Header
  dateFrom?: string;
  dateTo?: string;
  onDateFromChange?: (date: string) => void;
  onDateToChange?: (date: string) => void;
  showSelectedOnly?: boolean;
  onShowSelectedOnlyChange?: (show: boolean) => void;
  onSelectedOrdersCountChange?: (count: number) => void;
  hideLoadingOverlay?: boolean;
  // Customer filter
  selectedCustomer?: WordPressUser | null;
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
  onTotalOrdersChange,
  // Filter props from Header
  dateFrom = '',
  dateTo = '',
  onDateFromChange,
  onDateToChange,
  showSelectedOnly = false,
  onShowSelectedOnlyChange,
  onSelectedOrdersCountChange,
  // Customer filter
  selectedCustomer
}, ref) => {
  // State declarations MUST come before useQuery
  const [orders, setOrders] = useState<WooCommerceOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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
  
  // Refund processing state
  const [refundingOrders, setRefundingOrders] = useState<Set<number>>(new Set());

  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Use React Query for optimized orders fetching
  const {
    data: ordersData,
    isLoading: loading,
    error: queryError,
    refetch: refetchOrders
  } = useQuery({
    queryKey: ['orders', currentPage, statusFilter, selectedEmployee, dateFrom, dateTo, user?.location_id, selectedCustomer?.id],
    queryFn: async () => {
      console.log('🔄 Fetching orders with params:', {
        page: currentPage,
        per_page: 50,
        status: statusFilter,
        location_id: user?.location_id,
        dateFrom,
        dateTo,
        customer: selectedCustomer?.id
      });
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: '50',
        status: statusFilter,
        orderby: 'date',
        order: 'desc',
      });

      if (user?.location_id) {
        params.append('location_id', user.location_id);
      }

      // Add date filters if provided
      if (dateFrom) {
        params.append('date_from', dateFrom);
      }
      if (dateTo) {
        params.append('date_to', dateTo);
      }

      // Add employee filter if provided
      if (selectedEmployee) {
        params.append('employee', selectedEmployee);
      }

      // Add customer filter if provided
      if (selectedCustomer?.id) {
        params.append('customer', selectedCustomer.id.toString());
      }

      // Use /api/orders with cache busting
      const url = `/api/orders?${params}&_t=${Date.now()}`;
      console.log('🌐 Fetching from:', url);
      const response = await fetch(url, {
        cache: 'no-store', // Force no cache
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (!response.ok) {
        console.error('❌ Orders fetch failed:', response.status, response.statusText);
        throw new Error('Failed to fetch orders');
      }
      const data = await response.json();
      console.log('✅ Orders response:', {
        success: data.success,
        count: data.data?.length,
        total: data.meta?.total
      });
      return data;
    },
    enabled: true, // Always fetch orders - backend handles filtering
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache at all
    refetchOnMount: 'always', // Always refetch on mount
    refetchOnWindowFocus: true, // Refetch when window focused
    retry: (failureCount, error) => {
      // Don't retry if it's a 404 or 401 error
      if (error instanceof Error && error.message.includes('404')) return false;
      if (error instanceof Error && error.message.includes('401')) return false;
      // Retry up to 3 times for network errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
  
  // Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

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

  // Handle React Query data updates
  useEffect(() => {
    console.log('📊 Orders Data Update:', {
      hasData: !!ordersData,
      success: ordersData?.success,
      dataLength: ordersData?.data?.length,
      meta: ordersData?.meta,
      userLocationId: user?.location_id
    });
    
    if (ordersData?.success) {
      setOrders(ordersData.data || []);
      setTotalOrders(ordersData.meta?.total || 0);
      setTotalPages(ordersData.meta?.pages || 1);
      
      if (onTotalOrdersChange) {
        onTotalOrdersChange(ordersData.meta?.total || 0);
      }
      if (onSelectedOrdersCountChange) {
        onSelectedOrdersCountChange(selectedOrders.size);
      }
    } else if (!user?.location_id) {
      // Handle case where user has no location_id
      setOrders([]);
      setTotalOrders(0);
      setTotalPages(1);
      if (onTotalOrdersChange) {
        onTotalOrdersChange(0);
      }
    }
  }, [ordersData, user?.location_id, onTotalOrdersChange]);

  // Handle query errors
  useEffect(() => {
    if (queryError) {
      let errorMessage = 'Failed to load orders';
      if (queryError instanceof Error) {
        if (queryError.message.includes('timeout') || queryError.message.includes('fetch failed')) {
          errorMessage = 'Connection timeout - please check your internet connection and try again';
        } else {
          errorMessage = queryError.message;
        }
      }
      setError(errorMessage);
    } else {
      setError(null); // Clear error when query succeeds
    }
  }, [queryError]);



  // Handle status filter changes from parent
  const handleStatusFilterChange = (status: string) => {
    if (onStatusFilterChange) {
      onStatusFilterChange(status);
    }
    setCurrentPage(1); // Reset to first page when filter changes
  };

  // Handle date filter changes - use props from Header
  const handleDateFromChange = (date: string) => {
    onDateFromChange?.(date);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleDateToChange = (date: string) => {
    onDateToChange?.(date);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  // Handle employee filter changes
  const handleEmployeeChange = (employee: string) => {
    setSelectedEmployee(employee);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  // Handle clear selection
  const handleClearSelection = () => {
    const emptySet = new Set<number>();
    setSelectedOrders(emptySet);
    if (onSelectedOrdersChange) {
      onSelectedOrdersChange(emptySet);
    }
    if (onSelectedOrdersCountChange) {
      onSelectedOrdersCountChange(0);
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
    if (onSelectedOrdersCountChange) {
      onSelectedOrdersCountChange(newSelected.size);
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
        const errorData = await response.json().catch(() => ({ error: 'Server error' }));
        throw new Error(errorData.error || 'Failed to update order status');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error('Update failed - invalid response from server');
      }

      // Update local state immediately
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus, date_modified: new Date().toISOString() } : order
      ));
      
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

  // Refund order - Simple and clean
  const refundOrder = (orderId: number) => {
    setConfirmModal({
      isOpen: true,
      title: 'Refund Order',
      message: 'Refund this order? This updates the status to "refunded" and cannot be undone.',
      onConfirm: async () => {
        try {
          setError(null);
          setRefundingOrders(prev => new Set(prev).add(orderId));
          
          // Call API to update status
          const res = await fetch('/api/orders', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, status: 'refunded' })
          });

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({ error: 'Server error' }));
            throw new Error(errorData.error || 'Failed to refund order');
          }

          const result = await res.json();
          
          // Update UI with successful refund
          setOrders(prev => prev.map(o => 
            o.id === orderId ? { ...o, status: 'refunded', date_modified: new Date().toISOString() } : o
          ));
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Refund failed');
        } finally {
          setRefundingOrders(prev => {
            const next = new Set(prev);
            next.delete(orderId);
            return next;
          });
        }
      },
      confirmText: 'Refund',
      variant: 'danger'
    });
  };

  // Use imported date formatting utility
  const formatDate = formatOrderDateTime;

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
    handleRefresh: () => refetchOrders()
  }));

  return (
    <div className="h-full bg-transparent flex flex-col">
      {/* Content Area - Header removed, filters now in main Header */}
      <div className="flex-1 overflow-y-auto bg-transparent relative">
        {/* Loading Overlay */}
        {loading && !hideLoadingOverlay && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 relative">
                <img 
                  src="/logo123.png" 
                  alt="Flora" 
                  className="w-full h-full object-contain opacity-40 animate-pulse"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Success Display */}
        {successMessage && (
          <div className="max-w-5xl mx-auto px-12 pt-12">
            <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-green-300 text-sm" style={{ fontFamily: 'Tiempos, serif' }}>{successMessage}</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Error Display */}
        {error && (
          <div className="max-w-5xl mx-auto px-12 pt-12">
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-red-300 text-sm" style={{ fontFamily: 'Tiempos, serif' }}>{error}</span>
              </div>
            </div>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <>
            {/* Modern Card Grid View */}
            <div className="max-w-6xl mx-auto px-12 pt-12 pb-24">
              {/* View Controls */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-neutral-500 font-light lowercase" style={{ fontFamily: 'Tiempos, serif' }}>
                    {totalOrders} orders found
                  </div>
                  
                  {/* Quick Filter: Show Refunded Orders */}
                  {statusFilter === 'refunded' && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                      <svg className="w-3.5 h-3.5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                      </svg>
                      <span className="text-xs text-orange-400 font-light" style={{ fontFamily: 'Tiempos, serif' }}>
                        refund history
                      </span>
                      <button
                        onClick={() => onStatusFilterChange?.('any')}
                        className="ml-2 text-orange-400 hover:text-orange-300"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Refund History Button */}
                  <button
                    onClick={() => onStatusFilterChange?.('refunded')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-ios transition text-caption-1 font-tiempo font-medium ${
                      statusFilter === 'refunded'
                        ? 'bg-white/10 text-white border border-border'
                        : 'bg-surface-elevated text-neutral-400 hover:bg-surface-elevated-hover border border-border-subtle'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                    </svg>
                    <span>refund history</span>
                  </button>
                
                  {/* Column Selector */}
                  <div className="relative" ref={columnSelectorRef}>
                  <button
                    onClick={() => setIsColumnSelectorOpen(!isColumnSelectorOpen)}
                    className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] text-neutral-400 rounded-xl hover:bg-white/[0.06] transition text-xs"
                    style={{ fontFamily: 'Tiempos, serif' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    <span>customize view</span>
                  </button>

                  {/* Column Selector Dropdown */}
                  {isColumnSelectorOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-neutral-900/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl" style={{ zIndex: 99999 }}>
                      <div className="p-4">
                        <div className="text-xs font-medium text-neutral-400 mb-4 lowercase" style={{ fontFamily: 'Tiempos, serif' }}>
                          configure columns
                        </div>
                        
                        <div className="space-y-3">
                          {columns.map(column => (
                            <label key={column.id} className="flex items-center gap-3 text-xs text-neutral-400 cursor-pointer hover:text-neutral-300 transition">
                              <input
                                type="checkbox"
                                checked={column.visible}
                                onChange={() => toggleColumn(column.id)}
                                disabled={column.required}
                                className="rounded text-white bg-neutral-800 border-neutral-700 focus:ring-white focus:ring-1 disabled:opacity-30"
                              />
                              <span className={column.required ? 'text-neutral-600' : ''} style={{ fontFamily: 'Tiempos, serif' }}>
                                {column.label.toLowerCase()}
                              </span>
                            </label>
                          ))}
                        </div>

                        <div className="mt-4 pt-4 border-t border-white/[0.08] flex gap-2">
                          <button
                            onClick={() => {
                              setColumns(prev => prev.map(col => ({ ...col, visible: true })));
                            }}
                            className="flex-1 text-xs text-neutral-500 hover:text-neutral-300 px-3 py-2 rounded-xl hover:bg-white/[0.05] transition"
                            style={{ fontFamily: 'Tiempos, serif' }}
                          >
                            show all
                          </button>
                          <button
                            onClick={() => {
                              setColumns(prev => prev.map(col => ({ ...col, visible: col.required || false })));
                            }}
                            className="flex-1 text-xs text-neutral-500 hover:text-neutral-300 px-3 py-2 rounded-xl hover:bg-white/[0.05] transition"
                            style={{ fontFamily: 'Tiempos, serif' }}
                          >
                            hide all
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                </div>
              </div>

              {/* Orders Grid */}
              <div className="space-y-2">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className={`group transition-all duration-200 rounded-ios overflow-hidden ${
                      selectedOrders.has(order.id)
                        ? 'bg-surface-elevated border border-border'
                        : 'bg-surface-card border border-border-subtle hover:border-border hover:bg-surface-elevated'
                    }`}
                  >
                    {/* Modern Order Card */}
                    <div 
                      className="p-6 cursor-pointer select-none"
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
                      <div className="flex items-center justify-between">
                        {/* Left Side - Main Info */}
                        <div className="flex items-center gap-6 flex-1">
                          {/* Expand Icon */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(order.id);
                            }}
                            className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-neutral-600 hover:text-neutral-400 transition-all rounded-lg hover:bg-white/[0.05]"
                          >
                            <svg
                              className={`w-4 h-4 transition-transform duration-300 ${expandedCards.has(order.id) ? 'rotate-90' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>

                          {/* Order Number */}
                          {columns.find(c => c.id === 'order')?.visible && (
                            <div className="flex items-center gap-3">
                              <div className="text-title-1 font-tiempo font-medium text-white">
                                #{order.id}
                              </div>
                              {/* Status Badge - Monochrome */}
                              <div className="px-2 py-1 bg-surface-elevated border border-border-subtle rounded-ios-sm">
                                <span className="text-caption-1 font-tiempo font-medium text-neutral-400">
                                  {formatStatus(order.status)}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Customer */}
                          {columns.find(c => c.id === 'customer')?.visible && (
                            <div className="flex-1 min-w-0">
                              <div className="text-body font-tiempo font-medium text-white mb-0.5">
                                {order.billing?.first_name || 'Guest'} {order.billing?.last_name || ''}
                              </div>
                              <div className="text-caption-1 font-tiempo text-neutral-500 truncate">
                                {order.billing?.email || 'No email'}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Right Side - Metadata */}
                        <div className="flex items-center gap-8">
                          {/* Status - Aligned with other metadata */}
                          {columns.find(c => c.id === 'status')?.visible && (
                            <div className="text-right">
                              <div className="text-caption-1 font-tiempo text-neutral-500 mb-1">
                                status
                              </div>
                              <div className="text-body-sm font-tiempo font-medium text-white">
                                {formatStatus(order.status)}
                              </div>
                            </div>
                          )}
                          
                          {/* Date */}
                          {columns.find(c => c.id === 'date')?.visible && (
                            <div className="text-right">
                              <div className="text-caption-1 font-tiempo text-neutral-500 mb-1">
                                date
                              </div>
                              <div className="text-body-sm font-tiempo text-neutral-400">
                                {formatOrderDate(order.date_created)}
                              </div>
                            </div>
                          )}

                          {/* Location */}
                          {columns.find(c => c.id === 'location')?.visible && (
                            <div className="text-right">
                              <div className="text-caption-1 font-tiempo text-neutral-500 mb-1">
                                location
                              </div>
                              <div className="text-body-sm font-tiempo text-neutral-400">
                                {getOrderLocation(order)}
                              </div>
                            </div>
                          )}

                          {/* Source */}
                          {columns.find(c => c.id === 'source')?.visible && (
                            <div className="text-right">
                              <div className="text-caption-1 font-tiempo text-neutral-500 mb-1">
                                source
                              </div>
                              <div className="text-body-sm font-tiempo text-neutral-400">
                                {getOrderSource(order)}
                              </div>
                            </div>
                          )}

                          {/* Items Count */}
                          {columns.find(c => c.id === 'items')?.visible && (
                            <div className="text-right">
                              <div className="text-caption-1 font-tiempo text-neutral-500 mb-1">
                                items
                              </div>
                              <div className="text-body-sm font-tiempo text-neutral-400">
                                {order.line_items?.length || 0}
                              </div>
                            </div>
                          )}

                          {/* Total - Always visible and prominent */}
                          {columns.find(c => c.id === 'total')?.visible && (
                            <div className="text-right">
                              <div className="text-caption-1 font-tiempo text-neutral-500 mb-1">
                                total
                              </div>
                              <div className="text-title-1 font-tiempo font-semibold text-white">
                                ${parseFloat(order.total).toFixed(2)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                {/* Expanded View */}
                {expandedCards.has(order.id) && (
                  <div className="px-6 pb-6 pt-4 border-t border-border-subtle">
                    {/* Tab Controls - Clean */}
                    <div className="flex items-center gap-2 mb-6">
                      {[
                        { id: 'items', label: 'items' },
                        { id: 'customer', label: 'customer' },
                        { id: 'shipping', label: 'shipping' },
                        { id: 'payment', label: 'payment' },
                        { id: 'notes', label: 'notes' }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setOrderTab(order.id, tab.id as OrderTab)}
                          className={`px-4 py-2 text-caption-1 font-tiempo font-medium rounded-ios transition-all duration-200 ${
                            (activeOrderTab[order.id] === tab.id || (!activeOrderTab[order.id] && tab.id === 'items'))
                              ? 'bg-surface-elevated text-white border border-border'
                              : 'text-neutral-500 hover:text-neutral-400 hover:bg-surface-card border border-transparent'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Tab Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {/* Items Tab */}
                      {(activeOrderTab[order.id] === 'items' || !activeOrderTab[order.id]) && (
                        <>
                          <div className="lg:col-span-2 space-y-2">
                            <div className="text-neutral-300 text-sm font-medium mb-2">
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
                                <div key={item.id} className="bg-transparent border border-white/[0.06] rounded p-2">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <div className="text-neutral-300 text-sm">{item.name}</div>
                                      <div className="text-neutral-600 text-xs">SKU: {item.sku || 'N/A'}</div>
                                      
                                      {/* Display pricing tier information if available */}
                                      {tierLabel && (
                                        <div className="text-caption-1 font-tiempo text-neutral-500 mt-1">
                                          {tierLabel}
                                          {tierRuleName && <span className="text-neutral-600"> ({tierRuleName})</span>}
                                        </div>
                                      )}
                                      
                            </div>
                            <div className="text-right">
                              <div className="text-neutral-600 text-xs mb-1" style={{ fontFamily: 'Tiempos, serif' }}>
                                qty: {item.quantity}
                              </div>
                              <div className="text-neutral-300 text-base font-light" style={{ fontFamily: 'Tiempos, serif' }}>
                                ${parseFloat(item.total).toFixed(2)}
                              </div>
                              {tierPrice && parseFloat(tierPrice) !== item.price && (
                                <div className="text-neutral-600 text-xs mt-1" style={{ fontFamily: 'Tiempos, serif' }}>
                                  ${parseFloat(tierPrice).toFixed(2)}/unit
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                              );
                            })}
                          </div>
                          <div className="space-y-2">
                            <div className="text-neutral-300 font-medium text-xs mb-2">
                              Order Summary
                            </div>
                            <div className="bg-transparent border border-white/[0.06] rounded p-2">
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-600 text-xs">Subtotal:</span>
                                <span className="text-neutral-400 text-xs">{order.currency} {order.subtotal}</span>
                              </div>
                            </div>
                            {order.shipping_lines?.length > 0 && (
                              <div className="bg-transparent border border-white/[0.06] rounded p-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-neutral-600 text-xs">Shipping:</span>
                                  <span className="text-neutral-400 text-xs">{order.currency} {order.shipping_lines[0].total}</span>
                                </div>
                              </div>
                            )}
                            <div className="bg-transparent border border-white/[0.06] rounded p-2">
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
                            <div className="text-neutral-300 font-medium text-xs mb-2">
                              Customer Information
                            </div>
                            <div className="bg-transparent border border-white/[0.06] rounded p-2">
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-600 text-xs">Name:</span>
                                <span className="text-neutral-500 text-xs">{order.billing.first_name} {order.billing.last_name}</span>
                              </div>
                            </div>
                            <div className="bg-transparent border border-white/[0.06] rounded p-2">
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-600 text-xs">Email:</span>
                                <span className="text-neutral-500 text-xs">{order.billing.email}</span>
                              </div>
                            </div>
                            <div className="bg-transparent border border-white/[0.06] rounded p-2">
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-600 text-xs">Phone:</span>
                                <span className="text-neutral-500 text-xs">{order.billing.phone || 'Not provided'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-neutral-300 font-medium text-xs mb-2">
                              Billing Address
                            </div>
                            <div className="bg-transparent border border-white/[0.06] rounded p-2">
                              <div className="text-neutral-500 text-xs">
                                {order.billing.address_1}<br />
                                {order.billing.address_2 && <>{order.billing.address_2}<br /></>}
                                {order.billing.city}, {order.billing.state} {order.billing.postcode}<br />
                                {order.billing.country}
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-neutral-300 font-medium text-xs mb-2">
                              Customer ID
                            </div>
                            <div className="bg-transparent border border-white/[0.06] rounded p-2">
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
                            <div className="text-neutral-300 font-medium text-xs mb-2">
                              Shipping Address
                            </div>
                            <div className="bg-transparent border border-white/[0.06] rounded p-2">
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
                            <div className="text-neutral-300 font-medium text-xs mb-2">
                              Shipping Method
                            </div>
                            {order.shipping_lines?.map((shipping, index) => (
                              <div key={index} className="bg-transparent border border-white/[0.06] rounded p-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-neutral-500 text-xs">{shipping.method_title}</span>
                                  <span className="text-neutral-400 text-xs">{order.currency} {shipping.total}</span>
                                </div>
                              </div>
                            ))}
                            {(!order.shipping_lines || order.shipping_lines.length === 0) && (
                              <div className="bg-transparent border border-white/[0.06] rounded p-2">
                                <div className="text-neutral-500 text-xs">No shipping method selected</div>
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <div className="text-neutral-300 font-medium text-xs mb-2">
                              Tracking
                            </div>
                            <div className="bg-transparent border border-white/[0.06] rounded p-2">
                              <div className="text-neutral-500 text-xs">No tracking information available</div>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Payment Tab */}
                      {activeOrderTab[order.id] === 'payment' && (
                        <>
                          <div className="space-y-2">
                            <div className="text-neutral-300 font-medium text-xs mb-2">
                              Payment Method
                            </div>
                            <div className="bg-transparent border border-white/[0.06] rounded p-2">
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-600 text-xs">Method:</span>
                                <span className="text-neutral-500 text-xs">{order.payment_method_title || 'Not specified'}</span>
                              </div>
                            </div>
                            <div className="bg-transparent border border-white/[0.06] rounded p-2">
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-600 text-xs">Transaction ID:</span>
                                <span className="text-neutral-500 text-xs">{order.transaction_id || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-neutral-300 font-medium text-xs mb-2">
                              Payment Status
                            </div>
                            <div className="bg-transparent border border-white/[0.06] rounded p-2">
                              <div className="flex justify-between items-center">
                                <span className="text-caption-1 font-tiempo text-neutral-500">Status:</span>
                                <span className="text-caption-1 font-tiempo font-medium text-white">
                                  {formatStatus(order.status)}
                                </span>
                              </div>
                            </div>
                            
                            {/* Refund Information */}
                            {order.status === 'refunded' && (
                              <div className="bg-surface-elevated border border-border rounded-ios-sm p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                                  </svg>
                                  <span className="text-caption-1 font-tiempo font-medium text-white">Refund Issued</span>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex justify-between items-center">
                                    <span className="text-caption-1 font-tiempo text-neutral-500">Amount:</span>
                                    <span className="text-caption-1 font-tiempo font-medium text-white">${parseFloat(order.total).toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-caption-1 font-tiempo text-neutral-500">Date:</span>
                                    <span className="text-caption-1 font-tiempo text-neutral-400">{formatDate(order.date_modified)}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <div className="text-neutral-300 font-medium text-xs mb-2">
                              Actions
                            </div>
                            <div className="bg-transparent border border-white/[0.06] rounded p-2">
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
                              
                              {/* Refund Button - Only show for completed orders (not refunded/cancelled) */}
                              {(order.status === 'completed' || order.status === 'processing') && (
                                <button
                                  onClick={() => refundOrder(order.id)}
                                  disabled={refundingOrders.has(order.id)}
                                  className="w-full mt-2 px-3 py-2 bg-white hover:bg-neutral-100 text-black rounded-ios text-caption-1 font-tiempo font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                                >
                                  {refundingOrders.has(order.id) ? 'Processing Refund...' : 'Refund Order'}
                                </button>
                              )}
                              
                              {/* Already Refunded Message */}
                              {order.status === 'refunded' && (
                                <div className="w-full mt-2 px-3 py-2 bg-surface-elevated border border-border-subtle rounded-ios text-caption-1 font-tiempo text-neutral-400 text-center">
                                  Order Already Refunded
                                </div>
                              )}
                              
                              <button
                                onClick={() => deleteOrder(order.id)}
                                className="w-full mt-2 px-2 py-1 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] rounded text-neutral-400 hover:text-neutral-300 text-xs"
                                style={{ fontFamily: 'Tiempos, serif' }}
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
                            <div className="text-neutral-300 font-medium text-xs mb-2">
                              Order Notes
                            </div>
                            <div className="bg-transparent border border-white/[0.06] rounded p-2">
                              <div className="text-neutral-500 text-xs">
                                {order.customer_note || 'No notes available for this order'}
                              </div>
                            </div>
                            <div className="text-neutral-300 font-medium text-xs mb-2 mt-4">
                              Order Metadata
                            </div>
                            <div className="bg-transparent border border-white/[0.06] rounded p-2">
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-border-subtle">
                  <div className="text-caption-1 font-tiempo text-neutral-500">
                    page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-5 py-2 text-caption-1 font-tiempo font-medium bg-surface-elevated hover:bg-surface-elevated-hover disabled:bg-transparent disabled:text-neutral-600 disabled:cursor-not-allowed text-white rounded-ios transition-all duration-200 border border-border-subtle disabled:border-transparent active:scale-95"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-5 py-2 text-caption-1 font-tiempo font-medium bg-surface-elevated hover:bg-surface-elevated-hover disabled:bg-transparent disabled:text-neutral-600 disabled:cursor-not-allowed text-white rounded-ios transition-all duration-200 border border-border-subtle disabled:border-transparent active:scale-95"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Empty State */}
        {!loading && orders.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-24 h-24 mx-auto mb-6 relative">
                <svg className="w-full h-full text-neutral-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-extralight text-neutral-400 mb-3 tracking-tight" style={{ fontFamily: 'Tiempos, serif' }}>
                no orders found
              </h3>
              <p className="text-sm text-neutral-600 font-light lowercase" style={{ fontFamily: 'Tiempos, serif' }}>
                {user?.location_id ? `no orders for this location` : 'adjust filters to see orders'}
              </p>
            </div>
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