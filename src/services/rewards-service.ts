import { apiFetch } from '../lib/api-fetch';
export interface UserPointsBalance {
  user_id: number;
  balance: number;
  points_label: string;
  formatted_balance: string;
  timestamp: string;
}

export interface PointsHistoryEvent {
  id: number;
  points: number;
  type: string;
  description: string;
  date: string;
  order_id?: number;
  formatted_date: string;
}

export interface UserPointsHistory {
  user_id: number;
  events: PointsHistoryEvent[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export interface RedemptionCalculation {
  user_id: number;
  points_to_redeem: number;
  discount_amount: number;
  formatted_discount: string;
  remaining_balance: number;
  can_redeem: boolean;
}

export interface RedemptionResult {
  user_id: number;
  points_redeemed: number;
  discount_amount: number;
  coupon_code: string;
  formatted_discount: string;
  expires_at: string;
}

export interface ProductPoints {
  product_id: number;
  points_earned: number;
  points_required: number;
  can_purchase_with_points: boolean;
  formatted_points_earned: string;
  formatted_points_required?: string;
}

export interface RewardsSettings {
  points_label: string;
  earn_ratio: string;
  redeem_ratio: string;
  min_redeem_points: number;
  max_redeem_discount: string;
  points_expiry: string;
}

export interface UserWithPoints {
  id: number;
  display_name: string;
  email: string;
  balance: number;
  formatted_balance: string;
}

export interface BulkUsersResponse {
  users: UserWithPoints[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

class RewardsService {
  private baseUrl = '/api/proxy/wc-points-rewards';

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await apiFetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      
      try {
        const error = JSON.parse(errorText);
        throw new Error(error.message || `HTTP ${response.status}`);
      } catch {
        throw new Error(errorText || `HTTP ${response.status}`);
      }
    }

    return response.json();
  }

  // Authentication
  async authenticateUser(username: string, password: string): Promise<{ token: string }> {
    return this.request('/auth/token', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async validateToken(token: string): Promise<{ valid: boolean }> {
    return this.request('/auth/validate', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // User Points
  async getUserBalance(userId: number, token?: string): Promise<UserPointsBalance> {
    return this.request(`/user/${userId}/balance`);
  }

  async getUserHistory(
    userId: number, 
    page = 1, 
    perPage = 20, 
    token?: string
  ): Promise<UserPointsHistory> {
    // Request data with order=desc to get newest first
    const response = await this.request<UserPointsHistory>(
      `/user/${userId}/history?page=${page}&per_page=${perPage}&order=desc`
    );
    
    // Sort events by date descending (newest first), then by ID descending as fallback
    const sortedEvents = [...response.events].sort((a, b) => {
      // First try to sort by date
      const aDate = new Date(a.date).getTime();
      const bDate = new Date(b.date).getTime();
      
      if (bDate !== aDate) {
        return bDate - aDate; // Newer dates first
      }
      
      // If dates are equal, sort by ID descending
      const aId = typeof a.id === 'string' ? parseInt(a.id) : a.id;
      const bId = typeof b.id === 'string' ? parseInt(b.id) : b.id;
      return bId - aId; // Higher IDs first
    });
    
    return {
      ...response,
      events: sortedEvents,
    };
  }

  async adjustUserPoints(
    userId: number,
    points: number,
    description: string,
    adminToken?: string
  ): Promise<{ success: boolean; new_balance: number }> {
    return this.request(`/user/${userId}/adjust`, {
      method: 'POST',
      body: JSON.stringify({ points, description }),
    });
  }

  // Points Redemption
  async calculateRedemption(
    userId: number,
    points: number,
    token?: string
  ): Promise<RedemptionCalculation> {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    return this.request('/redeem/calculate', {
      method: 'POST',
      headers,
      body: JSON.stringify({ user_id: userId, points }),
    });
  }

  async applyRedemption(
    userId: number,
    points: number,
    cartTotal: number,
    token?: string
  ): Promise<RedemptionResult> {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    return this.request('/redeem/apply', {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        user_id: userId, 
        points, 
        cart_total: cartTotal 
      }),
    });
  }

  // Product Information
  async getProductPoints(productId: number): Promise<ProductPoints> {
    return this.request(`/product/${productId}/points`);
  }

  // Settings
  async getSettings(): Promise<RewardsSettings> {
    return this.request('/settings');
  }

  // Admin Functions
  async getAllUsersWithPoints(
    page = 1,
    perPage = 50,
    search = '',
    adminToken: string
  ): Promise<BulkUsersResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      ...(search && { search }),
    });

    return this.request(`/bulk/users?${params}`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
  }
}

export const rewardsService = new RewardsService();
