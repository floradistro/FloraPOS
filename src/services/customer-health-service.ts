import { apiFetch } from '../lib/api-fetch';
import { EnrichedCustomer, CustomerHealthMetrics, CustomerDashboardMetrics } from '../types/customer';
import { WordPressUser } from './users-service';
import { customerOrdersService, CustomerOrder } from './customer-orders-service';

export class CustomerHealthService {
  /**
   * Calculate customer health score (0-100)
   */
  static calculateHealthScore(customer: {
    daysSinceLastOrder: number;
    ordersPerMonth: number;
    lifetimeValue: number;
    totalPoints: number;
    totalOrders: number;
  }): number {
    let score = 50; // Base score
    
    // Recent activity (0-30 points)
    const { daysSinceLastOrder } = customer;
    if (daysSinceLastOrder <= 7) score += 30;
    else if (daysSinceLastOrder <= 30) score += 20;
    else if (daysSinceLastOrder <= 90) score += 10;
    else if (daysSinceLastOrder <= 180) score += 0;
    else score -= 20; // Penalty for severe dormancy
    
    // Order frequency (0-25 points)
    const { ordersPerMonth } = customer;
    if (ordersPerMonth >= 4) score += 25;
    else if (ordersPerMonth >= 2) score += 15;
    else if (ordersPerMonth >= 1) score += 5;
    
    // Lifetime value (0-25 points)
    const { lifetimeValue } = customer;
    if (lifetimeValue >= 5000) score += 25;
    else if (lifetimeValue >= 2000) score += 15;
    else if (lifetimeValue >= 1000) score += 10;
    else if (lifetimeValue >= 500) score += 5;
    
    // Rewards engagement (0-20 points)
    const { totalPoints, totalOrders } = customer;
    if (totalOrders > 0) {
      const pointsPerOrder = totalPoints / totalOrders;
      if (pointsPerOrder >= 50) score += 20;
      else if (pointsPerOrder >= 25) score += 10;
      else if (pointsPerOrder >= 10) score += 5;
    }
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Determine customer segment based on health score and metrics
   */
  static getCustomerSegment(
    healthScore: number,
    lifetimeValue: number,
    daysSinceLastOrder: number
  ): 'vip' | 'regular' | 'at-risk' | 'dormant' {
    if (daysSinceLastOrder > 180) return 'dormant';
    if (healthScore >= 90 && lifetimeValue >= 2000) return 'vip';
    if (healthScore >= 70) return 'regular';
    if (healthScore >= 50) return 'at-risk';
    return 'dormant';
  }

  /**
   * Calculate days since last order
   */
  static calculateDaysSinceLastOrder(lastOrderDate?: string): number {
    if (!lastOrderDate) return 999;
    const lastOrder = new Date(lastOrderDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastOrder.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Calculate months since customer joined
   */
  static calculateMonthsSinceJoined(dateCreated?: string): number {
    if (!dateCreated) return 1;
    const joined = new Date(dateCreated);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - joined.getTime());
    const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30);
    return Math.max(1, Math.round(diffMonths));
  }

  /**
   * Fetch customer orders and calculate stats
   */
  static async fetchCustomerStats(customerId: number): Promise<{
    lifetimeValue: number;
    totalOrders: number;
    averageOrderValue: number;
    lastOrderDate?: string;
  }> {
    try {
      // Fetch all customer orders
      let allOrders: CustomerOrder[] = [];
      let page = 1;
      let hasMore = true;
      
      while (hasMore && page <= 10) { // Safety limit of 10 pages
        const response = await customerOrdersService.getCustomerOrders(customerId, page, 100);
        
        if (!response.success || response.data.length === 0) {
          hasMore = false;
          break;
        }

        allOrders = [...allOrders, ...response.data];
        hasMore = page < response.meta.pages;
        page++;
      }

      // Filter completed/processing orders for lifetime value
      const completedOrders = allOrders.filter(order => 
        order.status === 'completed' || order.status === 'processing'
      );

      const lifetimeValue = completedOrders.reduce((sum, order) => {
        return sum + parseFloat(order.total || '0');
      }, 0);

      const averageOrderValue = completedOrders.length > 0 
        ? lifetimeValue / completedOrders.length 
        : 0;

      const lastOrderDate = allOrders.length > 0 
        ? allOrders[0].date_created 
        : undefined;

      return {
        lifetimeValue,
        totalOrders: allOrders.length,
        averageOrderValue,
        lastOrderDate
      };
    } catch (error) {
      console.error(`Failed to fetch stats for customer ${customerId}:`, error);
      return {
        lifetimeValue: 0,
        totalOrders: 0,
        averageOrderValue: 0
      };
    }
  }

  /**
   * Fetch customer points balance
   */
  static async fetchCustomerPoints(customerId: number): Promise<number> {
    try {
      const response = await apiFetch(`/api/proxy/wc-points-rewards/user/${customerId}/balance`);
      if (!response.ok) {
        console.warn(`Points API returned ${response.status} for customer ${customerId}`);
        return 0;
      }
      
      const data = await response.json();
      return data.balance || 0;
    } catch (error) {
      console.error(`Failed to fetch points for customer ${customerId}:`, error);
      return 0;
    }
  }

  /**
   * Enrich a customer with health metrics and stats
   */
  static async enrichCustomer(customer: WordPressUser): Promise<EnrichedCustomer> {
    // Fetch order stats and points in parallel
    const [stats, points] = await Promise.all([
      this.fetchCustomerStats(customer.id),
      this.fetchCustomerPoints(customer.id)
    ]);

    const monthsSinceJoined = this.calculateMonthsSinceJoined(customer.date_created);
    const ordersPerMonth = stats.totalOrders / monthsSinceJoined;
    const daysSinceLastOrder = this.calculateDaysSinceLastOrder(stats.lastOrderDate);

    const healthScore = this.calculateHealthScore({
      daysSinceLastOrder,
      ordersPerMonth,
      lifetimeValue: stats.lifetimeValue,
      totalPoints: points,
      totalOrders: stats.totalOrders
    });

    const segment = this.getCustomerSegment(
      healthScore,
      stats.lifetimeValue,
      daysSinceLastOrder
    );

    const health: CustomerHealthMetrics = {
      healthScore,
      segment,
      daysSinceLastOrder,
      ordersPerMonth,
      isActive: daysSinceLastOrder <= 30
    };

    return {
      id: customer.id,
      username: customer.username,
      email: customer.email,
      first_name: customer.first_name,
      last_name: customer.last_name,
      display_name: customer.display_name || customer.username,
      billing: customer.billing,
      avatar_url: customer.avatar_url,
      date_created: customer.date_created,
      lifetimeValue: stats.lifetimeValue,
      totalOrders: stats.totalOrders,
      averageOrderValue: stats.averageOrderValue,
      totalPoints: points,
      lastOrderDate: stats.lastOrderDate,
      monthsSinceJoined,
      health
    };
  }

  /**
   * Calculate dashboard-level metrics from enriched customers
   */
  static calculateDashboardMetrics(customers: EnrichedCustomer[]): CustomerDashboardMetrics {
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.health.isActive).length;
    const lifetimeValue = customers.reduce((sum, c) => sum + c.lifetimeValue, 0);
    const atRiskCount = customers.filter(c => c.health.segment === 'at-risk').length;
    const dormantCount = customers.filter(c => c.health.segment === 'dormant').length;
    const vipCount = customers.filter(c => c.health.segment === 'vip').length;
    
    const averagePoints = totalCustomers > 0
      ? customers.reduce((sum, c) => sum + c.totalPoints, 0) / totalCustomers
      : 0;

    const averageHealth = totalCustomers > 0
      ? customers.reduce((sum, c) => sum + c.health.healthScore, 0) / totalCustomers
      : 0;

    return {
      totalCustomers,
      activeCustomers,
      lifetimeValue,
      atRiskCount,
      dormantCount,
      averagePoints,
      averageHealth,
      vipCount
    };
  }
}

export const customerHealthService = CustomerHealthService;

