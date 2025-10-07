/**
 * Menu Configuration Service
 * Handles all API interactions for TV menu configurations
 */

export interface MenuConfig {
  id?: number;
  name: string;
  location_id?: number | null;
  config_data: MenuConfigData;
  config_type?: 'layout' | 'theme'; // NEW: separate layouts from themes
  is_active: boolean;
  display_order: number;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}

export interface MenuConfigData {
  orientation: 'horizontal' | 'vertical';
  isDualMenu: boolean;
  singleMenu: {
    category: string | null;
    viewMode: 'table' | 'card' | 'auto';
    showImages: boolean;
    priceLocation?: 'none' | 'header' | 'inline';
  };
  dualMenu: {
    left: {
      category: string | null;
      viewMode: 'table' | 'card' | 'auto';
      showImages: boolean;
      priceLocation?: 'none' | 'header' | 'inline';
    };
    right: {
      category: string | null;
      viewMode: 'table' | 'card' | 'auto';
      showImages: boolean;
      priceLocation?: 'none' | 'header' | 'inline';
    };
    leftBottom: {
      category: string | null;
      viewMode: 'table' | 'card' | 'auto';
      showImages: boolean;
      priceLocation?: 'none' | 'header' | 'inline';
    } | null;
    rightBottom: {
      category: string | null;
      viewMode: 'table' | 'card' | 'auto';
      showImages: boolean;
      priceLocation?: 'none' | 'header' | 'inline';
    } | null;
    enableLeftStacking: boolean;
    enableRightStacking: boolean;
  };
  backgroundColor: string;
  fontColor: string;
  cardFontColor?: string;
  containerColor: string;
  imageBackgroundColor?: string;
  titleFont?: string;
  pricingFont?: string;
  cardFont?: string;
  singlePriceLocation?: 'none' | 'header' | 'inline';
  leftPriceLocation?: 'none' | 'header' | 'inline';
  rightPriceLocation?: 'none' | 'header' | 'inline';
  categoryColumnConfigs: Record<string, string[]>;
}

export interface DisplayLog {
  config_id: number;
  location_id?: number;
  duration?: number;
}

export interface AnalyticsQuery {
  config_id?: number;
  location_id?: number;
  start_date?: string;
  end_date?: string;
}

class MenuConfigService {
  private baseUrl = '/api/proxy/flora-im';

  /**
   * Get API environment from localStorage
   */
  private getApiEnvironment(): string {
    const DEFAULT_ENV = process.env.NEXT_PUBLIC_API_ENVIRONMENT || 'staging';
    if (typeof window === 'undefined') return DEFAULT_ENV;
    return localStorage.getItem('flora_pos_api_environment') || DEFAULT_ENV;
  }

  /**
   * Get common headers including API environment
   */
  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'x-api-environment': this.getApiEnvironment(),
      'Cache-Control': 'no-cache'
    };
  }

  /**
   * Build API URL with credentials
   */
  private buildUrl(endpoint: string, params?: Record<string, string>): string {
    const url = new URL(`${this.baseUrl}${endpoint}`, window.location.origin);
    
    // Add timestamp to prevent caching
    url.searchParams.append('_t', Date.now().toString());
    
    // Add any additional params
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    
    return url.toString();
  }

  /**
   * Get all menu configs
   */
  async getAllConfigs(locationId?: number, isActive?: boolean): Promise<MenuConfig[]> {
    try {
      const params: Record<string, string> = {};
      
      if (locationId !== undefined) {
        params.location_id = locationId.toString();
      }
      
      if (isActive !== undefined) {
        params.is_active = isActive.toString();
      }
      
      const url = this.buildUrl('/menus/configs', params);
      
      const response = await fetch(url, {
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch menu configs: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to fetch menu configs');
      }
    } catch (error) {
      console.error('Error fetching menu configs:', error);
      throw error;
    }
  }

  /**
   * Get single menu config by ID
   */
  async getConfig(configId: number): Promise<MenuConfig> {
    try {
      const url = this.buildUrl(`/menus/configs/${configId}`);
      
      const response = await fetch(url, {
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch menu config: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to fetch menu config');
      }
    } catch (error) {
      console.error('Error fetching menu config:', error);
      throw error;
    }
  }

  /**
   * Get active config for a location
   */
  async getActiveConfig(locationId?: number): Promise<MenuConfig> {
    try {
      const params: Record<string, string> = {};
      
      if (locationId !== undefined) {
        params.location_id = locationId.toString();
      }
      
      const url = this.buildUrl('/menus/active', params);
      
      const response = await fetch(url, {
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch active config: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || 'No active menu config found');
      }
    } catch (error) {
      console.error('Error fetching active menu config:', error);
      throw error;
    }
  }

  /**
   * Create new menu config
   */
  async createConfig(config: Omit<MenuConfig, 'id' | 'created_at' | 'updated_at'>): Promise<MenuConfig> {
    try {
      const url = this.buildUrl('/menus/configs');
      
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(config)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create menu config: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to create menu config');
      }
    } catch (error) {
      console.error('Error creating menu config:', error);
      throw error;
    }
  }

  /**
   * Update menu config
   */
  async updateConfig(configId: number, updates: Partial<Omit<MenuConfig, 'id' | 'created_at' | 'updated_at'>>): Promise<MenuConfig> {
    try {
      const url = this.buildUrl(`/menus/configs/${configId}`);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update menu config: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to update menu config');
      }
    } catch (error) {
      console.error('Error updating menu config:', error);
      throw error;
    }
  }

  /**
   * Delete menu config
   */
  async deleteConfig(configId: number): Promise<void> {
    try {
      const url = this.buildUrl(`/menus/configs/${configId}`);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete menu config: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete menu config');
      }
    } catch (error) {
      console.error('Error deleting menu config:', error);
      throw error;
    }
  }

  /**
   * Duplicate menu config
   */
  async duplicateConfig(configId: number): Promise<MenuConfig> {
    try {
      const url = this.buildUrl(`/menus/configs/${configId}/duplicate`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Failed to duplicate menu config: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to duplicate menu config');
      }
    } catch (error) {
      console.error('Error duplicating menu config:', error);
      throw error;
    }
  }

  /**
   * Log menu display
   */
  async logDisplay(log: DisplayLog): Promise<void> {
    try {
      const url = this.buildUrl('/menus/log-display');
      
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(log)
      });
      
      if (!response.ok) {
        console.warn('Failed to log display:', response.statusText);
        return; // Don't throw - logging is not critical
      }
      
      const result = await response.json();
      
      if (!result.success) {
        console.warn('Failed to log display:', result.error);
      }
    } catch (error) {
      console.warn('Error logging display:', error);
      // Don't throw - logging failures should not break the app
    }
  }

  /**
   * Get templates only
   */
  async getTemplates(): Promise<MenuConfig[]> {
    try {
      const url = this.buildUrl('/menus/templates');
      
      const response = await fetch(url, {
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch templates: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to fetch templates');
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw error;
    }
  }

  /**
   * Get analytics
   */
  async getAnalytics(query: AnalyticsQuery = {}): Promise<any[]> {
    try {
      const params: Record<string, string> = {};
      
      if (query.config_id !== undefined) {
        params.config_id = query.config_id.toString();
      }
      
      if (query.location_id !== undefined) {
        params.location_id = query.location_id.toString();
      }
      
      if (query.start_date) {
        params.start_date = query.start_date;
      }
      
      if (query.end_date) {
        params.end_date = query.end_date;
      }
      
      const url = this.buildUrl('/menus/analytics', params);
      
      const response = await fetch(url, {
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const menuConfigService = new MenuConfigService();

