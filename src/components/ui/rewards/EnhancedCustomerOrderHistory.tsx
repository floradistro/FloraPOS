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

const OrderCard: React.FC<OrderItemProps> = ({ order }) => {

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      timeZone: 'America/New_York' // Force EST/EDT
    });
  };

  const formatTotal = (total: string, currency: string) => {
    return customerOrdersService.formatOrderTotal(total, currency);
  };

  // Generate items summary
  const itemsSummary = order.line_items.length > 0 
    ? order.line_items.slice(0, 2).map(item => {
        // Fix quantity display - divide by 1000 if it appears to be in thousands
        const displayQuantity = item.quantity >= 1000 && item.quantity % 1000 === 0 
          ? item.quantity / 1000 
          : item.quantity;
        return `${displayQuantity}x ${item.name}`;
      }).join(', ') +
      (order.line_items.length > 2 ? `, +${order.line_items.length - 2} more` : '')
    : 'No items';

  return (
    <div className="rounded-lg overflow-visible p-2 cursor-pointer transition-all duration-200 ease-out border border-white/[0.06] bg-transparent hover:border-white/[0.12] hover:bg-white/[0.02] hover:shadow-md hover:shadow-neutral-700/10">
      <div className="grid grid-cols-12 gap-4 items-center">
        {/* Order Number */}
        <div className="col-span-2">
          <span className="text-neutral-200 font-normal text-base" style={{ fontFamily: 'Tiempo, serif', textShadow: '0 1px 3px rgba(0, 0, 0, 0.8), 0 0 8px rgba(0, 0, 0, 0.3)' }}>
            #{order.number || order.id}
          </span>
        </div>
        
        {/* Status */}
        <div className="col-span-2">
          <span className="text-sm text-neutral-400" style={{ fontFamily: 'Tiempo, serif' }}>
            {customerOrdersService.getOrderStatusLabel(order.status)}
          </span>
        </div>
        
        {/* Date */}
        <div className="col-span-2">
          <span className="text-sm text-neutral-400" style={{ fontFamily: 'Tiempo, serif' }}>
            {formatDate(order.date_created)}
          </span>
        </div>
        
        {/* Items */}
        <div className="col-span-3">
          <div className="text-neutral-200 font-normal text-base mb-1 truncate" style={{ fontFamily: 'Tiempo, serif', textShadow: '0 1px 3px rgba(0, 0, 0, 0.8), 0 0 8px rgba(0, 0, 0, 0.3)' }} title={itemsSummary}>
            {itemsSummary}
          </div>
          <div className="text-xs text-neutral-500" style={{ fontFamily: 'Tiempo, serif' }}>
            {order.line_items.length} item{order.line_items.length !== 1 ? 's' : ''}
          </div>
        </div>
        
        {/* Payment Method */}
        <div className="col-span-2">
          <span className="text-sm text-neutral-400 truncate" style={{ fontFamily: 'Tiempo, serif' }} title={order.payment_method_title || 'N/A'}>
            {order.payment_method_title || 'N/A'}
          </span>
        </div>
        
        {/* Total */}
        <div className="col-span-1 text-right">
          <span className="text-sm font-medium text-neutral-300" style={{ fontFamily: 'Tiempo, serif' }}>
            {formatTotal(order.total, order.currency)}
          </span>
        </div>
      </div>
    </div>
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
          <div className="text-neutral-300 font-medium text-xs mb-3">
            Order History
          </div>
        </div>
        
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-sm text-neutral-400" style={{ fontFamily: 'Tiempo, serif' }}>Loading order history...</p>
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
          <div className="text-neutral-300 font-medium text-xs mb-3">
            Order History
          </div>
        </div>
        
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-red-400" style={{ fontFamily: 'Tiempo, serif' }}>Failed to load order history</p>
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
        <h3 className="text-neutral-300 font-medium text-xs mb-2" style={{ fontFamily: 'Tiempo, serif' }}>Order & Transaction Stats</h3>
        <CustomerOrderStats userId={userId} />
      </div>

      {/* Order History */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-neutral-300 font-medium text-xs" style={{ fontFamily: 'Tiempo, serif' }}>Order History</h3>
          <div className="text-xs text-neutral-500" style={{ fontFamily: 'Tiempo, serif' }}>
            {orders?.meta.total || allOrders.length} total orders
          </div>
        </div>
        
        <div className="flex-1 flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto scrollable-container" ref={scrollRef} onScroll={handleScroll}>
            {!isLoading && allOrders.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[300px]">
                <div className="text-center">
                  <svg className="w-8 h-8 mx-auto mb-2 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <p className="text-xs text-neutral-500" style={{ fontFamily: 'Tiempo, serif' }}>No orders available</p>
                </div>
              </div>
            ) : (
              <div className="h-full overflow-auto p-4">
                {/* Header */}
                <div className="mb-6">
                  <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-medium text-neutral-400 uppercase tracking-wider" style={{ fontFamily: 'Tiempo, serif' }}>
                    <div className="col-span-2 text-left">Order #</div>
                    <div className="col-span-2 text-left">Status</div>
                    <div className="col-span-2 text-left">Date</div>
                    <div className="col-span-3 text-left">Items</div>
                    <div className="col-span-2 text-left">Payment</div>
                    <div className="col-span-1 text-right">Total</div>
                  </div>
                </div>
                
                {/* Order Cards */}
                <div className="space-y-2">
                  {allOrders.map((order, index) => (
                    <OrderCard key={`${order.id}-${index}`} order={order} />
                  ))}
                  
                  {/* Loading more indicator */}
                  {loadingMore && (
                    <div className="py-4 text-center">
                      <div className="flex items-center justify-center">
                        <LoadingSpinner size="sm" />
                        <span className="ml-2 text-xs text-neutral-500" style={{ fontFamily: 'Tiempo, serif' }}>Loading more...</span>
                      </div>
                    </div>
                  )}
                  
                  {/* End of list indicator */}
                  {!hasMore && allOrders.length > 0 && (
                    <div className="py-2 text-center">
                      <span className="text-xs text-neutral-600" style={{ fontFamily: 'Tiempo, serif' }}>End of order history</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
