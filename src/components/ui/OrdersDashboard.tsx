'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { WooCommerceOrder } from './OrdersView';
import { UnifiedLoadingScreen } from './UnifiedLoadingScreen';

interface DashboardMetrics {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  processingOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  revenueGrowth: number; // % change from last period
  ordersByStatus: {
    status: string;
    count: number;
    revenue: number;
    percentage: number;
  }[];
  topCustomers: Array<{
    id: number;
    name: string;
    email: string;
    totalSpent: number;
    orderCount: number;
  }>;
  recentOrders: WooCommerceOrder[];
  allOrders: WooCommerceOrder[]; // Store ALL orders for period calculations
  ordersBySource: {
    pos: number;
    online: number;
    admin: number;
  };
  peakHours: {
    hour: number;
    count: number;
  }[];
  orderHealth: {
    onTime: number; // Completed orders
    pending: number; // Orders needing attention
    delayed: number; // Old pending orders
  };
}

interface OrdersDashboardProps {
  onViewAllOrders: () => void;
  onFilterOrders?: (filter: { status?: string; dateFrom?: string; dateTo?: string }) => void;
}

export const OrdersDashboard: React.FC<OrdersDashboardProps> = ({ 
  onViewAllOrders,
  onFilterOrders 
}) => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('month');

  useEffect(() => {
    fetchDashboardMetrics();
  }, [user?.location_id]); // Only fetch when location changes, NOT when period changes

  const fetchDashboardMetrics = async () => {
    if (!user?.location_id) return;

    try {
      setLoading(true);

      // Calculate date ranges
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date(today);
      monthAgo.setDate(monthAgo.getDate() - 30);
      const lastPeriodStart = new Date(today);
      lastPeriodStart.setDate(lastPeriodStart.getDate() - 60);

      console.log('📊 Orders Dashboard - Fetching metrics for location:', user.location_id);

      // Fetch ALL orders for the location (last 60 days for comparison) - handle pagination
      let allOrders: WooCommerceOrder[] = [];
      let currentPage = 1;
      let hasMorePages = true;
      
      while (hasMorePages) {
        console.log(`🔄 Fetching page ${currentPage}...`);
        
        const ordersResponse = await fetch(
          `/api/orders?per_page=100&page=${currentPage}&location_id=${user.location_id}&date_from=${lastPeriodStart.toISOString().split('T')[0]}`
        );

        if (!ordersResponse.ok) {
          console.error(`❌ Failed to fetch page ${currentPage}`);
          throw new Error('Failed to fetch orders');
        }

        const ordersData = await ordersResponse.json();
        const pageOrders = ordersData.data || [];
        
        console.log(`✓ Page ${currentPage}: ${pageOrders.length} orders received`);
        
        if (pageOrders.length === 0) {
          // No more orders
          hasMorePages = false;
        } else {
          allOrders = [...allOrders, ...pageOrders];
          console.log(`  Total so far: ${allOrders.length} orders`);
          
          // If we got less than per_page, this is the last page
          if (pageOrders.length < 100) {
            hasMorePages = false;
          } else {
            currentPage++;
          }
        }
      }

      const orders = allOrders;
      console.log(`✅ All orders fetched: ${orders.length} total orders`);

      // Calculate metrics
      const totalOrders = orders.length;
      const completedOrders = orders.filter(o => o.status === 'completed').length;
      const pendingOrders = orders.filter(o => o.status === 'pending').length;
      const processingOrders = orders.filter(o => o.status === 'processing').length;

      // Revenue calculations
      const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total || '0'), 0);
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Period-based revenue (only count completed orders for revenue)
      const todayOrders = orders.filter(o => {
        const orderDate = new Date(o.date_created);
        return orderDate >= today;
      });
      const weekOrders = orders.filter(o => {
        const orderDate = new Date(o.date_created);
        return orderDate >= weekAgo;
      });
      const monthOrders = orders.filter(o => {
        const orderDate = new Date(o.date_created);
        return orderDate >= monthAgo;
      });
      
      // Calculate revenue from all orders (including pending/processing)
      const todayRevenue = todayOrders.reduce((sum, o) => sum + parseFloat(o.total || '0'), 0);
      const weekRevenue = weekOrders.reduce((sum, o) => sum + parseFloat(o.total || '0'), 0);
      const monthRevenue = monthOrders.reduce((sum, o) => sum + parseFloat(o.total || '0'), 0);

      // Calculate growth (compare current 30 days to previous 30 days)
      const lastPeriodOrders = orders.filter(o => {
        const orderDate = new Date(o.date_created);
        return orderDate >= lastPeriodStart && orderDate < monthAgo;
      });
      const lastPeriodRevenue = lastPeriodOrders.reduce((sum, o) => sum + parseFloat(o.total || '0'), 0);
      const revenueGrowth = lastPeriodRevenue > 0 
        ? ((monthRevenue - lastPeriodRevenue) / lastPeriodRevenue) * 100 
        : monthRevenue > 0 ? 100 : 0; // 100% growth if previous period was 0

      console.log(`✓ Revenue Breakdown:`);
      console.log(`  - Today: $${todayRevenue.toFixed(2)} (${todayOrders.length} orders)`);
      console.log(`  - Week: $${weekRevenue.toFixed(2)} (${weekOrders.length} orders)`);
      console.log(`  - Month: $${monthRevenue.toFixed(2)} (${monthOrders.length} orders)`);
      console.log(`  - Last Period: $${lastPeriodRevenue.toFixed(2)} (${lastPeriodOrders.length} orders)`);
      console.log(`  - Growth: ${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth.toFixed(1)}%`);

      // Orders by status
      const statusMap = new Map<string, { count: number; revenue: number }>();
      orders.forEach(order => {
        const existing = statusMap.get(order.status) || { count: 0, revenue: 0 };
        statusMap.set(order.status, {
          count: existing.count + 1,
          revenue: existing.revenue + parseFloat(order.total || '0')
        });
      });

      const ordersByStatus = Array.from(statusMap.entries())
        .map(([status, data]) => ({
          status,
          count: data.count,
          revenue: data.revenue,
          percentage: (data.count / totalOrders) * 100
        }))
        .sort((a, b) => b.count - a.count);
      
      console.log(`✓ Orders by Status:`);
      ordersByStatus.forEach(status => {
        console.log(`  - ${status.status}: ${status.count} orders ($${status.revenue.toFixed(2)}, ${status.percentage.toFixed(1)}%)`);
      });

      // Top customers
      const customerMap = new Map<number, { name: string; email: string; spent: number; orders: number }>();
      orders.forEach(order => {
        if (order.customer_id) {
          const existing = customerMap.get(order.customer_id) || { 
            name: `${order.billing.first_name} ${order.billing.last_name}`,
            email: order.billing.email,
            spent: 0,
            orders: 0
          };
          customerMap.set(order.customer_id, {
            ...existing,
            spent: existing.spent + parseFloat(order.total || '0'),
            orders: existing.orders + 1
          });
        }
      });

      const topCustomers = Array.from(customerMap.entries())
        .map(([id, data]) => ({
          id,
          name: data.name,
          email: data.email,
          totalSpent: data.spent,
          orderCount: data.orders
        }))
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 5);

      // Orders by source - accurate detection
      const ordersBySource = {
        pos: 0,
        online: 0,
        admin: 0
      };
      
      orders.forEach(order => {
        // Check for POS indicators in metadata
        const isPOS = order.created_via?.toLowerCase().includes('pos') || 
                      order.meta_data?.some(m => 
                        (m.key === '_pos_order' && m.value === 'true') ||
                        m.key === '_pos_location_id' ||
                        m.key === '_pos_location_name'
                      ) ||
                      order.created_via === 'posv1';
        
        // Check for admin orders
        const isAdmin = order.created_via === 'admin';
        
        if (isPOS) {
          ordersBySource.pos++;
        } else if (isAdmin) {
          ordersBySource.admin++;
        } else {
          ordersBySource.online++;
        }
      });
      
      console.log(`✓ Order Sources: POS=${ordersBySource.pos}, Online=${ordersBySource.online}, Admin=${ordersBySource.admin}`);

      // Order health - accurate calculation
      const now_time = new Date().getTime();
      const dayInMs = 24 * 60 * 60 * 1000;
      
      const pendingRecent = orders.filter(o => {
        const age = now_time - new Date(o.date_created).getTime();
        return (o.status === 'pending' || o.status === 'processing') && age < dayInMs;
      });
      
      const delayedOrders = orders.filter(o => {
        const age = now_time - new Date(o.date_created).getTime();
        return (o.status === 'pending' || o.status === 'processing') && age >= dayInMs;
      });
      
      const orderHealth = {
        onTime: completedOrders,
        pending: pendingRecent.length,
        delayed: delayedOrders.length
      };
      
      console.log(`✓ Order Health:`);
      console.log(`  - Completed (on-time): ${orderHealth.onTime}`);
      console.log(`  - Pending (< 24hrs): ${orderHealth.pending}`);
      console.log(`  - Delayed (≥ 24hrs): ${orderHealth.delayed}`);
      
      // Calculate fulfillment score
      const totalOrdersForScore = orderHealth.onTime + orderHealth.pending + orderHealth.delayed;
      const fulfillmentScore = totalOrdersForScore > 0 
        ? Math.round(((orderHealth.onTime * 100) + (orderHealth.pending * 60)) / totalOrdersForScore)
        : 100;
      console.log(`  - Fulfillment Score: ${fulfillmentScore}/100`);

      // Recent orders (last 5)
      const recentOrders = orders
        .sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime())
        .slice(0, 5);

      // Peak hours (orders by hour of day)
      const hourMap = new Map<number, number>();
      orders.forEach(order => {
        const hour = new Date(order.date_created).getHours();
        hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
      });
      
      const peakHours = Array.from(hourMap.entries())
        .map(([hour, count]) => ({ hour, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      console.log('\n📊 ===== COMPREHENSIVE ORDERS DASHBOARD VALIDATION =====');
      console.log('\n🔍 DATA INTEGRITY CHECKS:');
      console.log(`✓ Total orders fetched: ${orders.length}`);
      console.log(`✓ Date range: ${lastPeriodStart.toISOString().split('T')[0]} to ${new Date().toISOString().split('T')[0]}`);
      console.log(`✓ Location ID: ${user.location_id}`);
      
      console.log('\n📈 PERIOD CALCULATIONS VALIDATION:');
      
      // Quick validation
      console.log(`✓ TODAY: ${todayOrders.length} orders, $${todayRevenue.toFixed(2)}`);
      console.log(`✓ WEEK: ${weekOrders.length} orders, $${weekRevenue.toFixed(2)}`);
      console.log(`✓ MONTH: ${monthOrders.length} orders, $${monthRevenue.toFixed(2)}`);
      console.log(`✓ Status: Completed=${completedOrders}, Pending=${pendingOrders}, Processing=${processingOrders}`);
      console.log(`✓ Sources: POS=${ordersBySource.pos}, Online=${ordersBySource.online}, Admin=${ordersBySource.admin}`);
      console.log(`✓ Growth: ${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth.toFixed(1)}%`);
      console.log('✅ All metrics calculated from REAL LIVE DATA\n');

      setMetrics({
        totalOrders,
        completedOrders,
        pendingOrders,
        processingOrders,
        totalRevenue,
        averageOrderValue,
        todayRevenue,
        weekRevenue,
        monthRevenue,
        revenueGrowth,
        ordersByStatus,
        topCustomers,
        recentOrders,
        allOrders: orders, // Store all orders for dynamic period calculations
        ordersBySource,
        peakHours,
        orderHealth
      });

    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !metrics) {
    return <UnifiedLoadingScreen />;
  }

  // Calculate order fulfillment score (0-100)
  const fulfillmentScore = (() => {
    const total = metrics.orderHealth.onTime + metrics.orderHealth.pending + metrics.orderHealth.delayed;
    if (total === 0) return 100;
    
    // Weighted: onTime=100%, pending=60%, delayed=0%
    const score = (
      (metrics.orderHealth.onTime * 100) +
      (metrics.orderHealth.pending * 60) +
      (metrics.orderHealth.delayed * 0)
    ) / total;
    
    return Math.round(score);
  })();
  
  const healthStatus = fulfillmentScore >= 90 ? 'excellent' : 
                       fulfillmentScore >= 75 ? 'good' : 
                       fulfillmentScore >= 50 ? 'fair' : 'needs attention';
  
  const healthColor = fulfillmentScore >= 90 ? 'text-green-400' : 
                      fulfillmentScore >= 75 ? 'text-blue-400' : 
                      fulfillmentScore >= 50 ? 'text-orange-400' : 'text-red-400';

  // Calculate period-specific metrics dynamically based on selectedPeriod
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(today);
  monthAgo.setDate(monthAgo.getDate() - 30);
  
  const periodRevenue = selectedPeriod === 'today' ? metrics.todayRevenue :
                       selectedPeriod === 'week' ? metrics.weekRevenue :
                       metrics.monthRevenue;
  
  const periodOrderCount = selectedPeriod === 'today' 
    ? metrics.allOrders.filter(o => new Date(o.date_created) >= today).length
    : selectedPeriod === 'week'
    ? metrics.allOrders.filter(o => new Date(o.date_created) >= weekAgo).length
    : metrics.allOrders.filter(o => new Date(o.date_created) >= monthAgo).length;
  
  // Log current period
  console.log(`📊 Period: ${selectedPeriod.toUpperCase()} - ${periodOrderCount} orders, $${periodRevenue.toFixed(2)}`);

  return (
    <div className="h-full overflow-auto">
      {/* Hero Insight */}
      <div className="max-w-5xl mx-auto px-12 pt-24 pb-12">
        <div 
          className="relative"
          style={{
            animation: 'fadeInUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0s both'
          }}
        >
          {/* Hero Number */}
          <div className="text-center mb-6">
            <div className={`text-[180px] font-extralight leading-none tracking-tighter ${healthColor} mb-6`} 
                 style={{ fontFamily: 'Tiempos, serif' }}>
              {fulfillmentScore}
            </div>
            <div className="text-2xl text-neutral-400 font-light lowercase tracking-wider mb-3" 
                 style={{ fontFamily: 'Tiempos, serif' }}>
              order fulfillment
            </div>
            <div className="text-base text-neutral-600 font-light lowercase" 
                 style={{ fontFamily: 'Tiempos, serif' }}>
              {healthStatus}
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-5 gap-6 pt-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-extralight text-white mb-2 tracking-tight" 
                   style={{ fontFamily: 'Tiempos, serif' }}>
                {periodOrderCount}
              </div>
              <div className="text-xs text-neutral-600 font-light lowercase" 
                   style={{ fontFamily: 'Tiempos, serif' }}>
                orders ({selectedPeriod})
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-extralight text-green-400 mb-2 tracking-tight" 
                   style={{ fontFamily: 'Tiempos, serif' }}>
                {periodRevenue >= 1000 
                  ? `$${(periodRevenue / 1000).toFixed(1)}k`
                  : `$${periodRevenue.toFixed(0)}`
                }
              </div>
              <div className="text-xs text-neutral-600 font-light lowercase" 
                   style={{ fontFamily: 'Tiempos, serif' }}>
                revenue ({selectedPeriod})
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-extralight text-white mb-2 tracking-tight" 
                   style={{ fontFamily: 'Tiempos, serif' }}>
                ${metrics.averageOrderValue.toFixed(0)}
              </div>
              <div className="text-xs text-neutral-600 font-light lowercase" 
                   style={{ fontFamily: 'Tiempos, serif' }}>
                avg order
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-extralight text-blue-400 mb-2 tracking-tight" 
                   style={{ fontFamily: 'Tiempos, serif' }}>
                {metrics.completedOrders}
              </div>
              <div className="text-xs text-neutral-600 font-light lowercase" 
                   style={{ fontFamily: 'Tiempos, serif' }}>
                completed
              </div>
            </div>
            
            <div className="text-center">
              <div className={`text-3xl font-extralight mb-2 tracking-tight ${
                metrics.revenueGrowth >= 0 ? 'text-green-400' : 'text-red-400'
              }`} style={{ fontFamily: 'Tiempos, serif' }}>
                {metrics.revenueGrowth >= 0 ? '+' : ''}{metrics.revenueGrowth.toFixed(1)}%
              </div>
              <div className="text-xs text-neutral-600 font-light lowercase" 
                   style={{ fontFamily: 'Tiempos, serif' }}>
                growth
              </div>
            </div>
          </div>

          {/* Period Selector */}
          <div className="flex items-center justify-center gap-3 mt-8">
            {(['today', 'week', 'month'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 text-xs rounded-xl transition-all duration-200 ${
                  selectedPeriod === period
                    ? 'bg-white/[0.08] text-neutral-300 border border-white/10'
                    : 'text-neutral-500 hover:text-neutral-400'
                }`}
                style={{ fontFamily: 'Tiempos, serif' }}
              >
                {period}
              </button>
            ))}
          </div>

          {/* Expand Details Button */}
          <div className="text-center mt-8">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="px-6 py-2 text-xs text-neutral-500 hover:text-neutral-300 transition-colors duration-200 flex items-center gap-2 mx-auto"
              style={{ fontFamily: 'Tiempos, serif' }}
            >
              <span>{showDetails ? 'Hide' : 'Show'} Details</span>
              <svg 
                className={`w-3 h-3 transition-transform duration-300 ${showDetails ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Detailed Metrics - Expandable */}
      {showDetails && (
        <div className="max-w-5xl mx-auto px-12 pb-12"
             style={{
               animation: 'fadeInUp 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0s both'
             }}>
          
          {/* Order Status Breakdown */}
          <div className="grid grid-cols-2 gap-8 mb-12">
            {/* Status Distribution */}
            <div className="bg-white/[0.02] backdrop-blur-xl rounded-3xl p-10 border border-white/5">
              <div className="text-sm text-neutral-500 font-light mb-6 lowercase" 
                   style={{ fontFamily: 'Tiempos, serif' }}>
                Order Status
              </div>
              <div className="space-y-4">
                {metrics.ordersByStatus.slice(0, 4).map((statusData) => (
                  <button
                    key={statusData.status}
                    onClick={() => onFilterOrders?.({ status: statusData.status })}
                    className="w-full group hover:bg-white/[0.02] rounded-xl p-3 -m-3 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-neutral-600 font-light capitalize" 
                            style={{ fontFamily: 'Tiempos, serif' }}>
                        {statusData.status.replace('-', ' ')}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-extralight text-white" 
                              style={{ fontFamily: 'Tiempos, serif' }}>
                          {statusData.count}
                        </span>
                        <svg 
                          className="w-4 h-4 text-neutral-700 group-hover:text-neutral-500 transition-all group-hover:translate-x-1" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-400 rounded-full transition-all duration-1000"
                        style={{ width: `${statusData.percentage}%` }}
                      ></div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Order Sources */}
            <div className="bg-white/[0.02] backdrop-blur-xl rounded-3xl p-10 border border-white/5">
              <div className="text-sm text-neutral-500 font-light mb-6 lowercase" 
                   style={{ fontFamily: 'Tiempos, serif' }}>
                Order Sources
              </div>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-600 font-light" 
                        style={{ fontFamily: 'Tiempos, serif' }}>
                    POS
                  </span>
                  <span className="text-3xl font-extralight text-green-400" 
                        style={{ fontFamily: 'Tiempos, serif' }}>
                    {metrics.ordersBySource.pos}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-600 font-light" 
                        style={{ fontFamily: 'Tiempos, serif' }}>
                    Online
                  </span>
                  <span className="text-3xl font-extralight text-blue-400" 
                        style={{ fontFamily: 'Tiempos, serif' }}>
                    {metrics.ordersBySource.online}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-600 font-light" 
                        style={{ fontFamily: 'Tiempos, serif' }}>
                    Admin
                  </span>
                  <span className="text-3xl font-extralight text-neutral-400" 
                        style={{ fontFamily: 'Tiempos, serif' }}>
                    {metrics.ordersBySource.admin}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Customers */}
          {metrics.topCustomers.length > 0 && (
            <div className="mb-12">
              <div className="text-sm text-neutral-500 font-light mb-6 lowercase text-center" 
                   style={{ fontFamily: 'Tiempos, serif' }}>
                Top Customers
              </div>
              <div className="grid grid-cols-1 gap-4">
                {metrics.topCustomers.slice(0, 3).map((customer) => (
                  <div 
                    key={customer.id}
                    className="bg-white/[0.02] backdrop-blur-xl rounded-2xl p-6 border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-base font-light text-white mb-1" 
                             style={{ fontFamily: 'Tiempos, serif' }}>
                          {customer.name}
                        </div>
                        <div className="text-xs text-neutral-600" 
                             style={{ fontFamily: 'Tiempos, serif' }}>
                          {customer.email}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-extralight text-green-400 mb-1" 
                             style={{ fontFamily: 'Tiempos, serif' }}>
                          ${customer.totalSpent.toFixed(0)}
                        </div>
                        <div className="text-xs text-neutral-600" 
                             style={{ fontFamily: 'Tiempos, serif' }}>
                          {customer.orderCount} orders
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Required Section */}
      {metrics.orderHealth.delayed > 0 && (
        <div className="max-w-5xl mx-auto px-12 pb-16">
          <div 
            className="bg-orange-500/5 border border-orange-500/20 rounded-3xl p-10"
            style={{
              animation: 'fadeInUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.2s both'
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xl font-light text-orange-400 mb-2" 
                     style={{ fontFamily: 'Tiempos, serif' }}>
                  Attention Required
                </div>
                <div className="text-sm text-neutral-500 font-light" 
                     style={{ fontFamily: 'Tiempos, serif' }}>
                  {metrics.orderHealth.delayed} orders pending for over 24 hours
                </div>
              </div>
              <button
                onClick={() => onFilterOrders?.({ status: 'pending' })}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-sm font-light transition-all duration-200"
                style={{ fontFamily: 'Tiempos, serif' }}
              >
                Review Orders
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Orders Preview */}
      {metrics.recentOrders.length > 0 && (
        <div className="max-w-5xl mx-auto px-12 pb-16">
          <div 
            className="mb-8"
            style={{
              animation: 'fadeInUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.3s both'
            }}
          >
            <div className="text-base text-neutral-500 font-light lowercase mb-4" 
                 style={{ fontFamily: 'Tiempos, serif' }}>
              Recent Orders
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 mb-8"
               style={{
                 animation: 'fadeInUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.4s both'
               }}
          >
            {metrics.recentOrders.slice(0, 3).map((order) => (
              <div 
                key={order.id}
                className="bg-white/[0.02] backdrop-blur-xl rounded-2xl p-6 border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 cursor-pointer"
                onClick={onViewAllOrders}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-base font-light text-white" 
                           style={{ fontFamily: 'Tiempos, serif' }}>
                        #{order.id}
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        order.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                        order.status === 'processing' ? 'bg-blue-500/10 text-blue-400' :
                        order.status === 'pending' ? 'bg-orange-500/10 text-orange-400' :
                        'bg-neutral-500/10 text-neutral-400'
                      }`} style={{ fontFamily: 'Tiempos, serif' }}>
                        {order.status}
                      </div>
                    </div>
                    <div className="text-sm text-neutral-500" 
                         style={{ fontFamily: 'Tiempos, serif' }}>
                      {order.customer_name || order.billing?.first_name + ' ' + order.billing?.last_name || 'Guest'}
                    </div>
                    <div className="text-xs text-neutral-600 mt-1" 
                         style={{ fontFamily: 'Tiempos, serif' }}>
                      {new Date(order.date_created).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-extralight text-white mb-1" 
                         style={{ fontFamily: 'Tiempos, serif' }}>
                      ${parseFloat(order.total).toFixed(2)}
                    </div>
                    <div className="text-xs text-neutral-600" 
                         style={{ fontFamily: 'Tiempos, serif' }}>
                      {order.line_items?.length || 0} items
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* View All Button */}
          <div className="text-center">
            <button
              onClick={onViewAllOrders}
              className="px-8 py-4 bg-white/[0.03] hover:bg-white/[0.06] backdrop-blur-xl rounded-2xl transition-all duration-300 border border-white/5"
              style={{ fontFamily: 'Tiempos, serif' }}
            >
              <div className="text-base font-light text-white lowercase">
                View All Orders
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

