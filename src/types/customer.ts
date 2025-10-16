export interface CustomerHealthMetrics {
  healthScore: number; // 0-100
  segment: 'vip' | 'regular' | 'at-risk' | 'dormant';
  daysSinceLastOrder: number;
  ordersPerMonth: number;
  isActive: boolean;
}

export interface EnrichedCustomer {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  display_name: string;
  billing?: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    address_1?: string;
    address_2?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  avatar_url?: string;
  date_created?: string;
  // Calculated metrics
  lifetimeValue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalPoints: number;
  lastOrderDate?: string;
  monthsSinceJoined: number;
  // Health metrics
  health: CustomerHealthMetrics;
}

export interface CustomerDashboardMetrics {
  totalCustomers: number;
  activeCustomers: number;
  lifetimeValue: number;
  atRiskCount: number;
  dormantCount: number;
  averagePoints: number;
  averageHealth: number;
  vipCount: number;
}


