import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useCustomerOrders } from '../../../hooks/useCustomerOrders';
import { customerOrdersService, CustomerOrder } from '../../../services/customer-orders-service';
import { CustomerOrderStats } from './CustomerOrderStats';
import { LoadingSpinner } from '../LoadingSpinner';

interface EnhancedCustomerOrderHistoryProps {
  userId: number;
  initialPerPage?: number;
}

interface OrderItemProps {
  order: CustomerOrder;
}

const OrderItem: React.FC<OrderItemProps> = ({ order }) => {

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTotal = (total: string, currency: string) => {
    return customerOrdersService.formatOrderTotal(total, currency);
  };

  // Generate items summary
  const itemsSummary = order.line_items.length > 0 
    ? order.line_items.slice(0, 2).map(item => `${item.quantity}x ${item.name}`).join(', ') +
      (order.line_items.length > 2 ? `, +${order.line_items.length - 2} more` : '')
    : 'No items';

  return (
    <tr className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
      {/* Order Number */}
      <td className="px-3 py-3 text-left align-top">
        <span className="text-neutral-300 text-xs font-medium">
          #{order.number || order.id}
        </span>
      </td>
      
      {/* Status */}
      <td className="px-3 py-3 align-top">
        <span className="text-xs text-neutral-400">
          {customerOrdersService.getOrderStatusLabel(order.status)}
        </span>
      </td>
      
      {/* Date */}
      <td className="px-3 py-3 text-neutral-400 text-xs align-top">
        {formatDate(order.date_created)}
      </td>
      
      {/* Items */}
      <td className="px-3 py-3 text-neutral-500 text-xs align-top">
        <div className="truncate leading-relaxed" title={itemsSummary}>
          {itemsSummary}
        </div>
        <div className="text-neutral-600 text-xs mt-1">
          {order.line_items.length} item{order.line_items.length !== 1 ? 's' : ''}
        </div>
      </td>
      
      {/* Payment Method */}
      <td className="px-3 py-3 text-neutral-500 text-xs align-top">
        <div className="truncate" title={order.payment_method_title || 'N/A'}>
          {order.payment_method_title || 'N/A'}
        </div>
      </td>
      
      {/* Total */}
      <td className="px-3 py-3 text-right align-top">
        <span className="text-neutral-300 text-xs font-semibold">
          {formatTotal(order.total, order.currency)}
        </span>
      </td>
    </tr>
  );
};

export const EnhancedCustomerOrderHistory: React.FC<EnhancedCustomerOrderHistoryProps> = ({
  userId,
  initialPerPage = 20
}) => {
  const [page, setPage] = useState(1);
  const [allOrders, setAllOrders] = useState<CustomerOrder[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [perPage] = useState(initialPerPage);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef<number>(0);
  const isLoadingRef = useRef<boolean>(false);
  
  const { data: orders, isLoading, error } = useCustomerOrders(userId, page, perPage);

  // Update orders when new data comes in
  useEffect(() => {
    if (orders?.data) {
      if (page === 1) {
        // First page - orders should already be sorted by date desc
        setAllOrders(orders.data);
        setLoadingMore(false);
        isLoadingRef.current = false;
      } else {
        // Subsequent pages - preserve scroll position
        const scrollElement = scrollRef.current;
        if (scrollElement && isLoadingRef.current) {
          // Store current scroll position before adding new items
          lastScrollTop.current = scrollElement.scrollTop;
        }
        
        // Deduplicate new orders to prevent duplicate keys
        setAllOrders(prev => {
          const existingIds = new Set(prev.map(o => o.id));
          const newOrders = orders.data.filter(o => !existingIds.has(o.id));
          return [...prev, ...newOrders];
        });
      }
      setHasMore(page < orders.meta.pages);
    }
  }, [orders, page]);

  // Restore scroll position after DOM update for infinite loading
  useEffect(() => {
    if (page > 1 && isLoadingRef.current && scrollRef.current) {
      const scrollElement = scrollRef.current;
      // Use setTimeout to ensure all DOM updates are complete
      const timeoutId = setTimeout(() => {
        if (scrollElement && lastScrollTop.current > 0) {
          scrollElement.scrollTop = lastScrollTop.current;
        }
        setLoadingMore(false);
        isLoadingRef.current = false;
      }, 10);
      
      return () => clearTimeout(timeoutId);
    }
  }, [allOrders, page]);

  // Load more data
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && !isLoading) {
      // Store current scroll position before loading
      if (scrollRef.current) {
        lastScrollTop.current = scrollRef.current.scrollTop;
      }
      setLoadingMore(true);
      isLoadingRef.current = true;
      setPage(prev => prev + 1);
    }
  }, [loadingMore, hasMore, isLoading]);

  // Scroll handler for infinite scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    
    // Always track current scroll position
    lastScrollTop.current = scrollTop;
    
    // Load more when scrolled near bottom with proper checks
    if (
      scrollHeight - scrollTop <= clientHeight + 100 && 
      hasMore && 
      !loadingMore && 
      !isLoading
    ) {
      loadMore();
    }
  }, [loadMore, hasMore, loadingMore, isLoading]);

  if (isLoading && page === 1) {
    return (
      <div className="w-full h-full flex flex-col min-h-[700px]">
        {/* Customer Order Stats */}
        <div className="mb-6">
          <CustomerOrderStats userId={userId} />
        </div>
        
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.08]">
          <div className="text-neutral-400 font-medium text-xs mb-3">
            Order History
          </div>
        </div>
        
        <div className="flex-1 bg-neutral-900/40 rounded overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-sm text-neutral-400">Loading order history...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col min-h-[700px]">
        {/* Customer Order Stats */}
        <div className="mb-6">
          <CustomerOrderStats userId={userId} />
        </div>
        
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.08]">
          <div className="text-neutral-400 font-medium text-xs mb-3">
            Order History
          </div>
        </div>
        
        <div className="flex-1 bg-neutral-900/40 rounded overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-red-400">Failed to load order history</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col space-y-4">
      {/* Customer Order Stats */}
      <div>
        <h3 className="text-neutral-400 font-medium text-xs mb-2">Order & Transaction Stats</h3>
        <CustomerOrderStats userId={userId} />
      </div>

      {/* Order History */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-neutral-400 font-medium text-xs">Order History</h3>
          <div className="text-xs text-neutral-500">
            {orders?.meta.total || allOrders.length} total orders
          </div>
        </div>
        
        <div className="bg-neutral-900/40 rounded overflow-hidden flex-1 flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto scrollable-container" ref={scrollRef} onScroll={handleScroll}>
            {!isLoading && allOrders.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[300px]">
                <div className="text-center">
                  <svg className="w-8 h-8 mx-auto mb-2 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <p className="text-xs text-neutral-500">No orders available</p>
                </div>
              </div>
            ) : (
              <table className="w-full table-fixed">
                {/* Table Header */}
                <thead className="sticky top-0 bg-neutral-800/95 backdrop-blur-sm border-b border-white/[0.1] z-10">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-neutral-300 w-[15%]">Order #</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-neutral-300 w-[20%]">Status</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-neutral-300 w-[15%]">Date</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-neutral-300 w-[25%]">Items</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-neutral-300 w-[15%]">Payment</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-neutral-300 w-[10%]">Total</th>
                  </tr>
                </thead>
                
                {/* Table Body */}
                <tbody>
                  {allOrders.map((order, index) => (
                    <OrderItem key={`${order.id}-${index}`} order={order} />
                  ))}
                  
                  {/* Loading more indicator */}
                  {loadingMore && (
                    <tr>
                      <td colSpan={6} className="px-3 py-4 text-center">
                        <div className="flex items-center justify-center">
                          <LoadingSpinner size="sm" />
                          <span className="ml-2 text-xs text-neutral-500">Loading more...</span>
                        </div>
                      </td>
                    </tr>
                  )}
                  
                  {/* End of list indicator */}
                  {!hasMore && allOrders.length > 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-2 text-center">
                        <span className="text-xs text-neutral-600">End of order history</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
