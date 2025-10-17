'use client';

import React, { useState, useEffect } from 'react';
import { usersService } from '../../services/users-service';
import { customerHealthService } from '../../services/customer-health-service';
import { EnrichedCustomer, CustomerDashboardMetrics } from '../../types/customer';
import { LoadingSpinner } from './LoadingSpinner';
import { CustomerDetailPanel } from './CustomerDetailPanel';

interface CustomerDashboardProps {
  onCustomerSelect?: (customer: EnrichedCustomer) => void;
  filterSegment?: 'all' | 'vip' | 'regular' | 'at-risk' | 'dormant';
  searchQuery?: string;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ 
  onCustomerSelect,
  filterSegment = 'all',
  searchQuery = ''
}) => {
  const [customers, setCustomers] = useState<EnrichedCustomer[]>([]);
  const [metrics, setMetrics] = useState<CustomerDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<EnrichedCustomer | null>(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);

  useEffect(() => {
    fetchCustomersWithHealth();
  }, []);

  const fetchCustomersWithHealth = async () => {
    try {
      setLoading(true);

      // Fetch all customers with stats ALREADY INCLUDED (bulk endpoint)
      const allCustomers = await usersService.getUsers();
      console.log(`⚡ Fetched ${allCustomers.length} customers from bulk API (stats included)`);

      // Filter to only actual customers (role = customer)
      const actualCustomers = allCustomers.filter(user => 
        user.roles?.includes('customer') || !user.roles || user.roles.length === 0
      );
      console.log(`📊 Filtered to ${actualCustomers.length} actual customers`);

      // Transform customers to EnrichedCustomer format WITHOUT individual API calls
      const enrichedCustomers: EnrichedCustomer[] = actualCustomers.map((customer: any) => {
        // Stats are already included from bulk endpoint
        const stats = customer.stats || {
          total_orders: 0,
          total_spent: 0,
          last_order_date: null,
          points_balance: 0
        };
        
        const monthsSinceJoined = customerHealthService.calculateMonthsSinceJoined(customer.date_created);
        const ordersPerMonth = stats.total_orders / (monthsSinceJoined || 1);
        const daysSinceLastOrder = customerHealthService.calculateDaysSinceLastOrder(stats.last_order_date);
        
        const healthScore = customerHealthService.calculateHealthScore({
          daysSinceLastOrder,
          ordersPerMonth,
          lifetimeValue: stats.total_spent,
          totalPoints: stats.points_balance,
          totalOrders: stats.total_orders
        });
        
        const segment = customerHealthService.getCustomerSegment(
          healthScore,
          stats.total_spent,
          daysSinceLastOrder
        );
        
        return {
          ...customer,
          totalOrders: stats.total_orders,
          lifetimeValue: stats.total_spent,
          averageOrderValue: stats.total_orders > 0 ? stats.total_spent / stats.total_orders : 0,
          lastOrderDate: stats.last_order_date,
          totalPoints: stats.points_balance,
          health: {
            healthScore,
            segment,
            daysSinceLastOrder,
            ordersPerMonth
          }
        };
      });
      
      console.log(`⚡ Processed ${enrichedCustomers.length} customers instantly (no individual API calls)`);

      // Sort by lifetime value (highest spenders first) - this is what matters for "top customers"
      enrichedCustomers.sort((a, b) => b.lifetimeValue - a.lifetimeValue);

      // Calculate dashboard metrics
      const dashboardMetrics = customerHealthService.calculateDashboardMetrics(enrichedCustomers);

      setCustomers(enrichedCustomers);
      setMetrics(dashboardMetrics);
      
      console.log('✅ Customer dashboard loaded:', {
        total: enrichedCustomers.length,
        active: dashboardMetrics.activeCustomers,
        lifetimeValue: `$${dashboardMetrics.lifetimeValue.toFixed(2)}`,
        avgHealth: dashboardMetrics.averageHealth.toFixed(1),
        vip: dashboardMetrics.vipCount,
        regular: enrichedCustomers.filter(c => c.health.segment === 'regular').length,
        atRisk: dashboardMetrics.atRiskCount,
        dormant: dashboardMetrics.dormantCount,
        avgPoints: dashboardMetrics.averagePoints.toFixed(1)
      });

    } catch (error) {
      console.error('Error fetching customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter customers based on search and segment
  const filteredCustomers = customers.filter(customer => {
    // Search filter
    const query = searchQuery.toLowerCase();
    const matchesSearch = !query || 
      customer.display_name.toLowerCase().includes(query) ||
      customer.email.toLowerCase().includes(query) ||
      customer.billing?.phone?.toLowerCase().includes(query);

    // Segment filter
    const matchesSegment = filterSegment === 'all' || customer.health.segment === filterSegment;

    return matchesSearch && matchesSegment;
  });

  if (loading || !metrics) {
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
          <p className="text-neutral-400 text-sm" style={{ fontFamily: 'Tiempos, serif' }}>Loading customer dashboard...</p>
        </div>
      </div>
    );
  }

  // Calculate health status
  const avgHealth = metrics.averageHealth;
  const healthColor = 'text-white'; // Single color, ultra minimal

  // Get top 3 customers by lifetime value (not health score)
  const topCustomers = [...customers]
    .sort((a, b) => b.lifetimeValue - a.lifetimeValue)
    .slice(0, 3);

  const handleCustomerClick = (customer: EnrichedCustomer) => {
    setSelectedCustomer(customer);
    setIsDetailPanelOpen(true);
    onCustomerSelect?.(customer);
  };

  const handleCloseDetailPanel = () => {
    setIsDetailPanelOpen(false);
    // Wait for animation to complete before clearing selection
    setTimeout(() => setSelectedCustomer(null), 400);
  };

  return (
    <>
    <div className="h-full overflow-auto">
      {/* Hero Insight - Customer Health */}
      <div className="max-w-6xl mx-auto px-12 pt-24 pb-12">
        <div 
          className="relative"
          style={{
            animation: 'fadeInUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0s both'
          }}
        >
          {/* Hero Number - iOS Clean */}
          <div className="text-center mb-8">
            <div className={`text-[140px] font-tiempo font-semibold leading-none tracking-tighter ${healthColor} mb-4`}>
              {Math.round(avgHealth)}
            </div>
            <div className="text-title-2 text-neutral-400 font-tiempo font-medium tracking-wide mb-2">
              customer health
            </div>
          </div>

          {/* Quick Stats Grid - iOS Clean */}
          <div className="grid grid-cols-5 gap-6 pt-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="text-title-1 font-tiempo font-medium text-white mb-1">
                {metrics.totalCustomers}
              </div>
              <div className="text-caption-1 font-tiempo text-neutral-500">
                total
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-title-1 font-tiempo font-medium text-white mb-1">
                {metrics.activeCustomers}
              </div>
              <div className="text-caption-1 font-tiempo text-neutral-500">
                active
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-title-1 font-tiempo font-medium text-white mb-1">
                ${(metrics.lifetimeValue / 1000).toFixed(0)}k
              </div>
              <div className="text-caption-1 font-tiempo text-neutral-500">
                lifetime value
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-title-1 font-tiempo font-medium text-neutral-400 mb-1">
                {metrics.atRiskCount}
              </div>
              <div className="text-caption-1 font-tiempo text-neutral-500">
                at-risk
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-title-1 font-tiempo font-medium text-neutral-400 mb-1">
                {Math.round(metrics.averagePoints)}
              </div>
              <div className="text-caption-1 font-tiempo text-neutral-500">
                avg points
              </div>
            </div>
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
        <div className="max-w-6xl mx-auto px-12 pb-12"
             style={{
               animation: 'fadeInUp 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0s both'
             }}>
          {/* Segment Breakdown */}
          <div className="grid grid-cols-2 gap-8 mb-12">
            {/* Customer Segments */}
            <div className="bg-surface-card border border-border-subtle rounded-ios-lg p-8">
            <div className="text-body-sm font-tiempo font-medium text-neutral-400 mb-6">
              Segments
            </div>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-neutral-600 font-light" style={{ fontFamily: 'Tiempos, serif' }}>
                      VIP Customers
                    </span>
                    <span className="text-xl font-extralight text-white" style={{ fontFamily: 'Tiempos, serif' }}>
                      {metrics.vipCount}
                    </span>
                  </div>
                  <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white/20 rounded-full transition-all duration-1000"
                      style={{ width: `${(metrics.vipCount / metrics.totalCustomers) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-neutral-600 font-light" style={{ fontFamily: 'Tiempos, serif' }}>
                      Regular Customers
                    </span>
                    <span className="text-xl font-extralight text-neutral-400" style={{ fontFamily: 'Tiempos, serif' }}>
                      {customers.filter(c => c.health.segment === 'regular').length}
                    </span>
                  </div>
                  <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white/20 rounded-full transition-all duration-1000"
                      style={{ width: `${(customers.filter(c => c.health.segment === 'regular').length / metrics.totalCustomers) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-neutral-600 font-light" style={{ fontFamily: 'Tiempos, serif' }}>
                      At-Risk
                    </span>
                    <span className="text-xl font-extralight text-neutral-500" style={{ fontFamily: 'Tiempos, serif' }}>
                      {metrics.atRiskCount}
                    </span>
                  </div>
                  <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white/20 rounded-full transition-all duration-1000"
                      style={{ width: `${(metrics.atRiskCount / metrics.totalCustomers) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-neutral-600 font-light" style={{ fontFamily: 'Tiempos, serif' }}>
                      Dormant
                    </span>
                    <span className="text-xl font-extralight text-neutral-600" style={{ fontFamily: 'Tiempos, serif' }}>
                      {metrics.dormantCount}
                    </span>
                  </div>
                  <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white/20 rounded-full transition-all duration-1000"
                      style={{ width: `${(metrics.dormantCount / metrics.totalCustomers) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Stats */}
            <div className="bg-surface-card border border-border-subtle rounded-ios-lg p-8">
            <div className="text-body-sm font-tiempo font-medium text-neutral-400 mb-6">
              Activity
            </div>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-600 font-light" style={{ fontFamily: 'Tiempos, serif' }}>
                    Active (Last 30 Days)
                  </span>
                  <span className="text-3xl font-extralight text-white" style={{ fontFamily: 'Tiempos, serif' }}>
                    {metrics.activeCustomers}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-600 font-light" style={{ fontFamily: 'Tiempos, serif' }}>
                    Total Lifetime Value
                  </span>
                  <span className="text-3xl font-extralight text-white" style={{ fontFamily: 'Tiempos, serif' }}>
                    ${(metrics.lifetimeValue / 1000).toFixed(1)}k
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-600 font-light" style={{ fontFamily: 'Tiempos, serif' }}>
                    Avg Lifetime Value
                  </span>
                  <span className="text-2xl font-extralight text-white" style={{ fontFamily: 'Tiempos, serif' }}>
                    ${(metrics.lifetimeValue / metrics.totalCustomers).toFixed(0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Required Section - Only show if there are at-risk or dormant customers */}
      {(metrics.atRiskCount > 0 || metrics.dormantCount > 0) && (
        <div className="max-w-6xl mx-auto px-12 pb-16">
          <div 
            className="bg-surface-card border border-border rounded-ios-lg p-8"
            style={{
              animation: 'fadeInUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.2s both'
            }}
          >
            <div className="flex items-center justify-between">
              <div>
              <div className="text-headline font-tiempo font-semibold text-white mb-1">
                {metrics.atRiskCount + metrics.dormantCount} customers need attention
              </div>
              <div className="text-body-sm font-tiempo text-neutral-500">
                Review at-risk and dormant accounts
              </div>
              </div>
              <button
                onClick={() => console.log('Filter customers by at-risk segment')}
                className="px-5 py-2.5 bg-white hover:bg-neutral-100 text-black rounded-ios text-body-sm font-tiempo font-semibold transition-all duration-200 active:scale-95"
              >
                Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Customers Section */}
      {topCustomers.length > 0 && (
        <div className="max-w-6xl mx-auto px-12 pb-16">
          <div 
            className="mb-8"
            style={{
              animation: 'fadeInUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.3s both'
            }}
          >
            <div className="text-body-sm font-tiempo font-medium text-neutral-400 mb-8">
              Top Customers
            </div>
          </div>

          {/* Top 3 Customers - Large Beautiful Cards */}
          <div className="grid grid-cols-3 gap-8"
               style={{
                 animation: 'fadeInUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.4s both'
               }}
          >
            {topCustomers.map((customer, idx) => {
              const segmentColor = customer.health.segment === 'vip' ? 'text-white' :
                                   customer.health.segment === 'regular' ? 'text-neutral-400' :
                                   customer.health.segment === 'at-risk' ? 'text-neutral-500' :
                                   'text-neutral-600';

              return (
                <button
                  key={customer.id}
                  onClick={() => handleCustomerClick(customer)}
                  className="bg-surface-card border border-border-subtle rounded-ios-lg overflow-hidden hover:bg-surface-elevated hover:border-border transition-all duration-200 group text-left"
                >
                  {/* Customer Info */}
                  <div className="p-6">
                    {/* Segment Badge */}
                    <div className={`text-caption-2 font-tiempo font-medium mb-3 ${segmentColor} uppercase tracking-wider`}>
                      {customer.health.segment}
                    </div>

                    <div className="text-headline font-tiempo font-semibold text-white mb-1 line-clamp-2">
                      {customer.display_name}
                    </div>
                    
                    <div className="text-caption-1 font-tiempo text-neutral-500 mb-4 truncate">
                      {customer.email}
                    </div>
                    
                    <div className="flex items-baseline gap-2 mb-3">
                      <div className="text-display font-tiempo font-semibold text-white tracking-tight">
                        ${(customer.lifetimeValue / 1000).toFixed(1)}k
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 text-caption-1 font-tiempo text-neutral-500">
                      <span>{customer.totalOrders} orders</span>
                      <span>•</span>
                      <span>{customer.totalPoints} pts</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Customer Cards Grid */}
      <div className="max-w-6xl mx-auto px-12 pb-24">
        <div className="grid grid-cols-1 gap-4">
          {filteredCustomers.map((customer) => {
            const segmentColor = customer.health.segment === 'vip' ? 'text-white' :
                                 customer.health.segment === 'regular' ? 'text-neutral-400' :
                                 customer.health.segment === 'at-risk' ? 'text-neutral-500' :
                                 'text-neutral-600';

            return (
              <button
                key={customer.id}
                onClick={() => handleCustomerClick(customer)}
                className="bg-surface-card border-b border-border-subtle hover:bg-surface-elevated transition-all duration-200 text-left group p-5"
              >
                <div className="flex items-center gap-6">
                  {/* Customer Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-body font-tiempo font-medium text-white">
                        {customer.display_name}
                      </span>
                      <span className={`text-caption-2 font-tiempo font-medium ${segmentColor} uppercase tracking-wider`}>
                        {customer.health.segment}
                      </span>
                    </div>
                    <div className="text-caption-1 font-tiempo text-neutral-500 truncate">
                      {customer.email}
                    </div>
                  </div>

                  {/* Customer Metrics - Minimal */}
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <div className="text-title-2 font-tiempo font-medium text-white">
                        ${(customer.lifetimeValue / 1000).toFixed(1)}k
                      </div>
                      <div className="text-caption-1 font-tiempo text-neutral-500">
                        lifetime
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-title-3 font-tiempo font-medium text-white">
                        {customer.totalOrders}
                      </div>
                      <div className="text-caption-1 font-tiempo text-neutral-500">
                        orders
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-title-3 font-tiempo font-medium text-neutral-400">
                        {customer.totalPoints}
                      </div>
                      <div className="text-caption-1 font-tiempo text-neutral-500">
                        points
                      </div>
                    </div>

                    {/* Arrow */}
                    <svg 
                      className="w-5 h-5 text-neutral-700 group-hover:text-neutral-500 transition-all" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredCustomers.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mb-4 mx-auto">
              <svg className="w-8 h-8 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className="text-neutral-500 text-sm" style={{ fontFamily: 'Tiempos, serif' }}>
              No customers found
            </p>
          </div>
        )}
      </div>
    </div>

    {/* Customer Detail Panel */}
    <CustomerDetailPanel
      customer={selectedCustomer}
      isOpen={isDetailPanelOpen}
      onClose={handleCloseDetailPanel}
    />
    </>
  );
};

