/**
 * Store Configuration Service
 * Manages physical TV setup per location
 */

export interface TVConfig {
  tv_number: number;
  display_name: string;
  orientation: 'horizontal' | 'vertical';
  
  // Layout assignment (what to show)
  layout_id?: number | null;
  layout_name?: string;
  
  // Theme assignment (how it looks)
  theme_id?: number | null;
  theme_name?: string;
  
  auto_launch: boolean;
  enabled: boolean;
}

export interface StoreConfig {
  id?: number;
  location_id: number;
  store_name: string;
  tvs: TVConfig[];
  created_at?: string;
  updated_at?: string;
}

class StoreConfigService {
  private baseUrl = '/api/proxy/flora-im';

  private getApiEnvironment(): string {
    const DEFAULT_ENV = process.env.NEXT_PUBLIC_API_ENVIRONMENT || 'staging';
    if (typeof window === 'undefined') return DEFAULT_ENV;
    return localStorage.getItem('flora_pos_api_environment') || DEFAULT_ENV;
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'x-api-environment': this.getApiEnvironment(),
      'Cache-Control': 'no-cache'
    };
  }

  private buildUrl(endpoint: string): string {
    const url = new URL(`${this.baseUrl}${endpoint}`, window.location.origin);
    url.searchParams.append('_t', Date.now().toString());
    return url.toString();
  }

  /**
   * Get store config for a location (uses database)
   */
  async getStoreConfig(locationId: number): Promise<StoreConfig | null> {
    try {
      const url = this.buildUrl(`/store-configs/${locationId}`);
      
      console.log(`🔍 [GET] Fetching store config from API: ${url}`);
      
      const response = await fetch(url, {
        headers: this.getHeaders()
      });
      
      if (response.status === 404) {
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch store config: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // Parse config_data if it's a string
        if (typeof result.data.config_data === 'string') {
          result.data.config_data = JSON.parse(result.data.config_data);
        }
        // Flatten config_data.tvs to top level
        return {
          ...result.data,
          tvs: result.data.config_data?.tvs || []
        };
      } else {
        console.log(`❌ [GET] API returned success=false`);
        return null;
      }
    } catch (error) {
      console.error('❌ [GET] Error fetching store config:', error);
      return null;
    }
  }

  /**
   * Save store config (uses database)
   */
  async saveStoreConfig(config: Omit<StoreConfig, 'id' | 'created_at' | 'updated_at'>): Promise<StoreConfig> {
    try {
      const url = this.buildUrl('/store-configs');
      
      // Prepare data for API
      const payload = {
        location_id: config.location_id,
        store_name: config.store_name,
        tvs: config.tvs
      };
      
      console.log(`💾 [SAVE] Saving to database API: ${url}`);
      console.log(`📊 [SAVE] Payload:`, payload);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [SAVE] API error:`, errorText);
        throw new Error(`Failed to save store config: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        console.log(`✅ [SAVE] Successfully saved to database!`, result.data);
        // Parse and flatten
        if (typeof result.data.config_data === 'string') {
          result.data.config_data = JSON.parse(result.data.config_data);
        }
        return {
          ...result.data,
          tvs: result.data.config_data?.tvs || []
        };
      } else {
        throw new Error(result.error || 'Failed to save store config');
      }
    } catch (error) {
      console.error('❌ [SAVE] Error saving store config:', error);
      throw error;
    }
  }

  /**
   * Update store config (uses database)
   */
  async updateStoreConfig(locationId: number, updates: Partial<StoreConfig>): Promise<StoreConfig> {
    try {
      const url = this.buildUrl(`/store-configs/${locationId}`);
      
      // Prepare data for API
      const payload = {
        location_id: locationId,
        store_name: updates.store_name,
        tvs: updates.tvs
      };
      
      console.log(`💾 [UPDATE] Updating via database API: ${url}`);
      console.log(`📊 [UPDATE] Payload:`, payload);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [UPDATE] API error:`, errorText);
        throw new Error(`Failed to update store config: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        console.log(`✅ [UPDATE] Successfully updated in database!`, result.data);
        // Parse and flatten
        if (typeof result.data.config_data === 'string') {
          result.data.config_data = JSON.parse(result.data.config_data);
        }
        return {
          ...result.data,
          tvs: result.data.config_data?.tvs || []
        };
      } else {
        throw new Error(result.error || 'Failed to update store config');
      }
    } catch (error) {
      console.error('❌ [UPDATE] Error updating store config:', error);
      throw error;
    }
  }
}

export const storeConfigService = new StoreConfigService();
