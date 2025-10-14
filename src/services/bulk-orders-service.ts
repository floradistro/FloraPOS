import { apiFetch } from '../lib/api-fetch';

/**
 * Bulk Orders Service
 * Uses optimized bulk endpoint to fetch orders with line items and customer data
 * Reduces 200+ API calls to 1
 */

export interface BulkOrderLineItem {
  id: number;
  name: string;
  quantity: number;
  total: number;
  product_id: number;
  variation_id: number;
}

export interface BulkOrder {
  id: number;
  date_created: string;
  status: string;
  total: number;
  payment_method: string;
  transaction_id: string;
  customer_id: number;
  customer_name: string;
  customer_email: string;
  line_items: BulkOrderLineItem[];
  pos_data: {
    location_id: number;
    employee_id: number;
    payment_method: string;
    is_split_payment: boolean;
    cash_received: number | null;
    change_given: number | null;
  } | null;
}

export class BulkOrdersService {
  
  /**
   * Fetch orders in bulk with line items and customer data
   */
  static async getOrdersBulk(params: {
    status?: string;
    location_id?: number;
    customer_id?: number;
    date_from?: string;
    date_to?: string;
    per_page?: number;
    page?: number;
  } = {}): Promise<{
    success: boolean;
    data: BulkOrder[];
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
        status: params.status || 'any',
        per_page: (params.per_page || 50).toString(),
        page: (params.page || 1).toString(),
      });
      
      if (params.location_id) {
        queryParams.append('location_id', params.location_id.toString());
      }
      
      if (params.customer_id) {
        queryParams.append('customer_id', params.customer_id.toString());
      }
      
      if (params.date_from) {
        queryParams.append('date_from', params.date_from);
      }
      
      if (params.date_to) {
        queryParams.append('date_to', params.date_to);
      }
      
      const response = await apiFetch(
        `/api/proxy/flora-im/orders/bulk?${queryParams}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Bulk orders API error: ${response.status}`);
      }
      
      const result = await response.json();
      const loadTime = performance.now() - startTime;
      
      console.log(`⚡ Bulk Orders: ${result.data?.length || 0} orders in ${loadTime.toFixed(0)}ms (${result.meta?.queries_executed || 'N/A'} queries)`);
      
      return result;
      
    } catch (error) {
      console.error('Error fetching bulk orders:', error);
      throw error;
    }
  }
}

