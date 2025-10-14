import { apiFetch } from '../lib/api-fetch';

/**
 * WordPress Users Service
 * Fetches WordPress users for location manager assignment
 * OPTIMIZED with bulk endpoint
 */

export interface WordPressUser {
  id: number;
  name: string;
  username: string;
  email: string;
  roles: string[];
  display_name: string;
  first_name?: string;
  last_name?: string;
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
  shipping?: {
    first_name?: string;
    last_name?: string;
    address_1?: string;
    address_2?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  avatar_url?: string;
  date_created?: string;
  is_paying_customer?: boolean;
  stats?: {
    total_orders: number;
    total_spent: number;
    last_order_date: string | null;
    points_balance: number;
  };
}

class UsersService {
  private baseUrl = '/api/users-matrix';

  async getUsers(bustCache = false): Promise<WordPressUser[]> {
    try {
      console.log('⚡ Fetching customers via bulk endpoint...');
      
      // Use the bulk customers endpoint WITH STATS for CustomerDashboard
      const response = await apiFetch(`/api/proxy/flora-im/customers/bulk?per_page=500&include_stats=true`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error('Invalid response from bulk customers API');
      }

      console.log(`⚡ Loaded ${result.data.length} customers in ${result.meta?.load_time_ms || 0}ms (${result.meta?.queries_executed || 0} queries)`);
      
      // Transform to WordPressUser format - KEEP STATS!
      const users: WordPressUser[] = result.data.map((customer: any) => ({
        id: customer.id,
        name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.username || customer.email,
        username: customer.username,
        email: customer.email || '',
        roles: [customer.role || 'customer'],
        display_name: customer.display_name,
        first_name: customer.first_name,
        last_name: customer.last_name,
        billing: customer.billing,
        shipping: customer.shipping || {},
        avatar_url: customer.avatar_url,
        date_created: customer.date_created,
        is_paying_customer: (customer.stats?.total_orders || 0) > 0,
        stats: customer.stats // CRITICAL: Include stats from bulk endpoint!
      }));

      return users;
    } catch (error) {
      console.error('Failed to fetch users from bulk API:', error);
      throw new Error(`Failed to fetch users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUserById(userId: number): Promise<WordPressUser | null> {
    try {
      const users = await this.getUsers();
      const user = users.find(u => u.id === userId);
      return user || null;
    } catch (error) {
      return null;
    }
  }

  async createCustomer(customerData: {
    email: string;
    first_name: string;
    last_name: string;
    username?: string;
    billing?: any;
    shipping?: any;
  }): Promise<WordPressUser> {
    try {
      const response = await apiFetch(`${this.baseUrl}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...customerData,
          roles: ['customer']
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to create customer: ${response.status}`);
      }

      const newCustomer = await response.json();
      
      if (customerData.billing || customerData.shipping) {
        try {
          await apiFetch(`${this.baseUrl}/customers/${newCustomer.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              billing: customerData.billing,
              shipping: customerData.shipping
            })
          });
        } catch (updateError) {
          console.warn('Failed to update customer billing/shipping:', updateError);
        }
      }
      
      return newCustomer;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  async updateCustomer(userId: number, updates: Partial<WordPressUser>): Promise<WordPressUser> {
    try {
      const response = await apiFetch(`${this.baseUrl}/customers/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update customer: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  }

  async deleteCustomer(userId: number): Promise<void> {
    try {
      const response = await apiFetch(`${this.baseUrl}/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete customer: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  }
}

export const usersService = new UsersService();
