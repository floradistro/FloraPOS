/**
 * Menu Configuration Service
 * Handles all Supabase interactions for TV menu configurations
 */

export interface MenuConfig {
  id?: number;
  name: string;
  location_id?: number | null;
  config_data: MenuConfigData;
  config_type?: 'layout' | 'theme';
  is_active: boolean;
  display_order: number;
  created_by?: string;
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
  containerOpacity?: number;
  borderWidth?: number;
  borderOpacity?: number;
  imageOpacity?: number;
  blurIntensity?: number;
  customBackground?: string;
  singlePriceLocation?: 'none' | 'header' | 'inline';
  leftPriceLocation?: 'none' | 'header' | 'inline';
  rightPriceLocation?: 'none' | 'header' | 'inline';
  categoryColumnConfigs: Record<string, string[]>;
  headerTitleSize?: number;
  cardTitleSize?: number;
  priceSize?: number;
  categorySize?: number;
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
  /**
   * Get all menu configs via API route
   */
  async getAllConfigs(locationId?: number, isActive?: boolean): Promise<MenuConfig[]> {
    try {
      const params = new URLSearchParams();
      params.append('_t', Date.now().toString());
      
      if (locationId !== undefined) {
        params.append('location_id', locationId.toString());
      }
      
      if (isActive !== undefined) {
        params.append('is_active', isActive.toString());
      }

      const response = await fetch(`/api/menu-configs?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch menu configs: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch menu configs');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching menu configs:', error);
      throw error;
    }
  }

  /**
   * Get single menu config by ID via API route
   */
  async getConfig(configId: number): Promise<MenuConfig> {
    try {
      const response = await fetch(`/api/menu-configs/${configId}?_t=${Date.now()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch menu config: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch menu config');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching menu config:', error);
      throw error;
    }
  }

  /**
   * Get active config for a location via API route
   */
  async getActiveConfig(locationId?: number): Promise<MenuConfig> {
    try {
      const params = new URLSearchParams();
      params.append('is_active', 'true');
      params.append('_t', Date.now().toString());
      
      if (locationId !== undefined) {
        params.append('location_id', locationId.toString());
      }

      const response = await fetch(`/api/menu-configs?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch active config: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success || !result.data || result.data.length === 0) {
        throw new Error('No active menu config found');
      }

      return result.data[0];
    } catch (error) {
      console.error('Error fetching active menu config:', error);
      throw error;
    }
  }

  /**
   * Create new menu config via API route
   */
  async createConfig(config: Omit<MenuConfig, 'id' | 'created_at' | 'updated_at'>): Promise<MenuConfig> {
    try {
      console.log('📝 Creating menu config:', {
        name: config.name,
        config_type: config.config_type,
        location_id: config.location_id
      });

      const response = await fetch('/api/menu-configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error creating menu config:', errorData);
        throw new Error(errorData.error || `Failed to create menu config: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create menu config');
      }

      console.log('✅ Menu config created successfully:', result.data.id);
      return result.data;
    } catch (error) {
      console.error('Error creating menu config:', error);
      throw error;
    }
  }

  /**
   * Update menu config via API route
   */
  async updateConfig(configId: number, updates: Partial<Omit<MenuConfig, 'id' | 'created_at' | 'updated_at'>>): Promise<MenuConfig> {
    try {
      const response = await fetch(`/api/menu-configs/${configId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update menu config: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update menu config');
      }

      return result.data;
    } catch (error) {
      console.error('Error updating menu config:', error);
      throw error;
    }
  }

  /**
   * Delete menu config via API route
   */
  async deleteConfig(configId: number): Promise<void> {
    try {
      const response = await fetch(`/api/menu-configs/${configId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to delete menu config: ${response.statusText}`);
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
      // Get existing config
      const existing = await this.getConfig(configId);
      
      // Create duplicate with modified name
      const duplicate: Omit<MenuConfig, 'id' | 'created_at' | 'updated_at'> = {
        name: `${existing.name} (Copy)`,
        location_id: existing.location_id,
        config_data: existing.config_data,
        config_type: existing.config_type,
        is_active: false, // Duplicates are inactive by default
        display_order: existing.display_order,
      };

      return await this.createConfig(duplicate);
    } catch (error) {
      console.error('Error duplicating menu config:', error);
      throw error;
    }
  }

  /**
   * Log menu display (non-critical, failures won't throw)
   */
  async logDisplay(log: DisplayLog): Promise<void> {
    try {
      // Non-critical operation - just log to console for now
      console.log('📊 Menu display logged:', log);
      // Could implement API endpoint later if needed
    } catch (error) {
      console.warn('Error logging display:', error);
      // Don't throw - logging failures should not break the app
    }
  }

  /**
   * Get templates only via API route
   */
  async getTemplates(): Promise<MenuConfig[]> {
    try {
      // Templates are configs with is_template = true
      // For now, just return empty array - can implement if needed
      console.log('📋 Templates not yet implemented');
      return [];
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
      // Analytics not yet implemented via API route
      console.log('📊 Analytics not yet implemented');
      return [];
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const menuConfigService = new MenuConfigService();
