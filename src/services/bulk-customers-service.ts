import { apiFetch } from '../lib/api-fetch';
import { WordPressUser } from './users-service';

/**
 * Bulk Customers Service
 * Uses optimized bulk endpoint to fetch customers with stats
 * Reduces 100+ API calls to 1
 */

export interface BulkCustomer extends WordPressUser {
  stats: {
    total_orders: number;
    total_spent: number;
    last_order_date: string | null;
    points_balance: number;
  };
}

export class BulkCustomersService {
  
  /**
   * Fetch customers in bulk with stats
   */
  static async getCustomersBulk(params: {
    role?: string;
    search?: string;
    per_page?: number;
    page?: number;
    include_stats?: boolean;
  } = {}): Promise<{
    success: boolean;
    data: BulkCustomer[];
    meta: {
      page: number;
      per_page: number;
      total: number;
      load_time_ms: number;
      queries_executed: number;
    };
  }> {
    try {
      const startTime = performance.now();
      
      const queryParams = new URLSearchParams({
        role: params.role || 'customer',
        per_page: (params.per_page || 100).toString(),
        page: (params.page || 1).toString(),
        include_stats: (params.include_stats !== false).toString()
      });
      
      if (params.search) {
        queryParams.append('search', params.search);
      }
      
      const response = await apiFetch(
        `/api/proxy/flora-im/customers/bulk?${queryParams}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Bulk customers API error: ${response.status}`);
      }
      
      const result = await response.json();
      const loadTime = performance.now() - startTime;
      
      console.log(`⚡ Bulk Customers: ${result.data?.length || 0} customers in ${loadTime.toFixed(0)}ms (${result.meta?.queries_executed || 'N/A'} queries)`);
      
      return result;
      
    } catch (error) {
      console.error('Error fetching bulk customers:', error);
      throw error;
    }
  }
}

