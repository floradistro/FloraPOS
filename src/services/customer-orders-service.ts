import { apiFetch } from '../lib/api-fetch';
export interface CustomerOrder {
  id: number;
  number: string;
  status: string;
  currency: string;
  total: string;
  subtotal: string;
  tax_total: string;
  shipping_total: string;
  date_created: string;
  date_completed?: string;
  payment_method: string;
  payment_method_title: string;
  line_items: Array<{
    id: number;
    name: string;
    product_id: number;
    variation_id: number;
    quantity: number;
    price: string;
    total: string;
    sku: string;
  }>;
}

export interface CustomerOrdersResponse {
  success: boolean;
  data: CustomerOrder[];
  meta: {
    total: number;
    pages: number;
    page: number;
    per_page: number;
  };
}

class CustomerOrdersService {
  async getCustomerOrders(
    customerId: number,
    page = 1,
    perPage = 20
  ): Promise<CustomerOrdersResponse> {
    try {
      const url = `/api/orders?customer=${customerId}&page=${page}&per_page=${perPage}&orderby=date&order=desc`;
      
      const response = await apiFetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to fetch customer orders:', error);
      
      // Return empty result on error
      return {
        success: false,
        data: [],
        meta: {
          total: 0,
          pages: 1,
          page,
          per_page: perPage
        }
      };
    }
  }

  getOrderStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'processing':
        return 'text-blue-400';
      case 'pending':
        return 'text-yellow-400';
      case 'on-hold':
        return 'text-orange-400';
      case 'cancelled':
        return 'text-red-400';
      case 'refunded':
        return 'text-purple-400';
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-neutral-400';
    }
  }

  getOrderStatusLabel(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');
  }

  formatOrderTotal(total: string, currency = 'USD'): string {
    const amount = parseFloat(total);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }
}

export const customerOrdersService = new CustomerOrdersService();


