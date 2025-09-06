import React, { useState, useEffect } from 'react';
import { customerOrdersService, CustomerOrder } from '../../../services/customer-orders-service';

interface CustomerOrderStatsProps {
  userId: number;
}

interface OrderStats {
  lifetimeValue: number;
  averageOrderValue: number;
  totalOrders: number;
  completedOrders: number;
  lastOrderDate: string | null;
}

export const CustomerOrderStats: React.FC<CustomerOrderStatsProps> = ({ userId }) => {
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all orders to calculate stats - we need to get all pages to calculate accurate totals
        let allOrders: CustomerOrder[] = [];
        let page = 1;
        let hasMore = true;
        
        while (hasMore) {
          const response = await customerOrdersService.getCustomerOrders(userId, page, 100);
          
          if (!response.success) {
            throw new Error('Failed to load order data');
          }

          allOrders = [...allOrders, ...response.data];
          
          // Check if there are more pages
          hasMore = page < response.meta.pages;
          page++;
          
          // Safety check to avoid infinite loops
          if (page > 50) break;
        }
        
        // Filter orders by status for different calculations
        const completedOrders = allOrders.filter(order => 
          order.status === 'completed' || order.status === 'processing'
        );
        const paidOrders = allOrders.filter(order => 
          ['completed', 'processing', 'refunded'].includes(order.status)
        );
        
        // Calculate lifetime value from completed/processing orders
        const lifetimeValue = completedOrders.reduce((sum, order) => {
          return sum + parseFloat(order.total || '0');
        }, 0);
        
        // Calculate average from paid orders (more accurate)
        const averageOrderValue = paidOrders.length > 0 
          ? paidOrders.reduce((sum, order) => sum + parseFloat(order.total || '0'), 0) / paidOrders.length 
          : 0;
        
        // Get most recent order date
        const lastOrderDate = allOrders.length > 0 
          ? allOrders[0].date_created  // Orders are already sorted desc by date
          : null;

        setStats({
          lifetimeValue,
          averageOrderValue,
          totalOrders: allOrders.length,
          completedOrders: completedOrders.length,
          lastOrderDate
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load order stats');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [userId]);

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="text-neutral-500 font-medium text-xs mb-2">Customer Statistics</div>
        <div className="text-neutral-400 text-xs">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <div className="text-neutral-500 font-medium text-xs mb-2">Customer Statistics</div>
        <div className="text-red-400 text-xs">Error loading stats</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-2">
        <div className="text-neutral-500 font-medium text-xs mb-2">Customer Statistics</div>
        <div className="text-neutral-400 text-xs">No data available</div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-3">
      <div className="text-neutral-500 font-medium text-xs mb-2">
        CUSTOMER STATISTICS
      </div>
      
      {/* Key Stats Grid */}
      <div className="grid grid-cols-4 gap-3">
        {/* Lifetime Value */}
        <div className="bg-neutral-900/40 rounded p-2">
          <div className="text-neutral-600 text-xs mb-1">Lifetime Value</div>
          <div className="text-white text-sm font-semibold">
            {formatCurrency(stats.lifetimeValue)}
          </div>
        </div>

        {/* Average Order Value */}
        <div className="bg-neutral-900/40 rounded p-2">
          <div className="text-neutral-600 text-xs mb-1">Avg Order Value</div>
          <div className="text-white text-sm font-semibold">
            {formatCurrency(stats.averageOrderValue)}
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-neutral-900/40 rounded p-2">
          <div className="text-neutral-600 text-xs mb-1">Total Orders</div>
          <div className="text-white text-sm font-semibold">
            {stats.totalOrders}
          </div>
          {stats.completedOrders !== stats.totalOrders && (
            <div className="text-neutral-500 text-xs">
              ({stats.completedOrders} completed)
            </div>
          )}
        </div>

        {/* Last Order */}
        <div className="bg-neutral-900/40 rounded p-2">
          <div className="text-neutral-600 text-xs mb-1">Last Order</div>
          <div className="text-white text-sm font-semibold">
            {formatDate(stats.lastOrderDate)}
          </div>
        </div>
      </div>
    </div>
  );
};


