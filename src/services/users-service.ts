import { apiFetch } from '../lib/api-fetch';
/**
 * WordPress Users Service
 * Fetches WordPress users for location manager assignment
 */

export interface WordPressUser {
  id: number;
  name: string;
  username: string;
  email: string;
  roles: string[];
  display_name: string;
}

class UsersService {
  private baseUrl = '/api/users-matrix'; // Use WordPress Core API via proxy

  async getUsers(bustCache = false): Promise<WordPressUser[]> {
    try {
      const url = `${this.baseUrl}/users`;
      const params = new URLSearchParams();
      
      if (bustCache) {
        params.append('_', Date.now().toString());
      }
      
      const fullUrl = params.toString() ? `${url}?${params.toString()}` : url;
      
      
      const response = await apiFetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': bustCache ? 'no-cache' : 'default',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform WooCommerce customer format to our user format
      const users: WordPressUser[] = data.map((customer: any) => ({
        id: customer.id,
        name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.username || customer.email,
        username: customer.username || customer.email,
        email: customer.email || '',
        roles: [customer.role || 'customer'],
        display_name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.username || customer.email
      }));

      return users;
    } catch (error) {
      console.error('Failed to fetch users from API:', error);
      throw new Error(`Failed to fetch users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUserById(userId: number): Promise<WordPressUser | null> {
    try {
      // For now, get all users and find the one we want
      // We can optimize this later with a specific endpoint
      const users = await this.getUsers();
      const user = users.find(u => u.id === userId);
      
      if (user) {
        return user;
      } else {
        return null;
      }
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
      
      // Try to update customer with additional details if provided
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
          console.warn('Could not update customer details:', updateError);
        }
      }

      return newCustomer;
    } catch (error) {
      console.error('Failed to create customer:', error);
      throw new Error(`Failed to create customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const usersService = new UsersService();


