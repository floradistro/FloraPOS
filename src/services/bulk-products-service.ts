import { apiFetch } from '../lib/api-fetch';

/**
 * Bulk Products Service
 * Uses optimized bulk endpoint to fetch products with inventory, pricing, and fields
 * Reduces 300+ API calls to 1 single call
 */

export interface BulkProduct {
  id: number;
  name: string;
  sku: string;
  type: string;
  status: string;
  regular_price: string;
  sale_price?: string;
  image?: string;
  categories: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  inventory: Array<{
    location_id: string;
    location_name: string;
    stock: number;
    quantity: number;
    manage_stock: boolean;
  }>;
  total_stock: number;
  meta_data?: Array<{
    key: string;
    value: any;
  }>;
}

export class BulkProductsService {
  
  /**
   * Fetch products in bulk with all associated data
   * This replaces ProductGrid's multiple fetches with ONE optimized call
   */
  static async getProductsBulk(params: {
    location_id?: number | string;
    category?: number;
    per_page?: number;
    page?: number;
  }): Promise<{
    success: boolean;
    data: BulkProduct[];
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
        per_page: (params.per_page || 1000).toString(),
        page: (params.page || 1).toString(),
      });
      
      if (params.location_id) {
        queryParams.append('location_id', params.location_id.toString());
      }
      
      if (params.category) {
        queryParams.append('category', params.category.toString());
      }
      
      // Use the new bulk endpoint
      const response = await apiFetch(
        `/api/proxy/flora-im/products/bulk?${queryParams}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Bulk products API error: ${response.status}`);
      }
      
      const result = await response.json();
      const loadTime = performance.now() - startTime;
      
      console.log(`⚡ Bulk API: Loaded ${result.data?.length || 0} products in ${loadTime.toFixed(0)}ms (${result.meta?.queries_executed || 'N/A'} DB queries)`);
      
      return result;
      
    } catch (error) {
      console.error('Error fetching bulk products:', error);
      throw error;
    }
  }
  
  /**
   * Prefetch products for faster perceived performance
   * Can be called on app initialization
   */
  static async prefetchProducts(location_id?: number | string) {
    try {
      const result = await this.getProductsBulk({
        location_id,
        per_page: 1000,
        page: 1
      });
      
      // Store in sessionStorage for instant access
      if (typeof window !== 'undefined' && result.success) {
        sessionStorage.setItem('bulk_products_cache', JSON.stringify({
          data: result.data,
          timestamp: Date.now(),
          location_id
        }));
      }
      
      return result;
    } catch (error) {
      console.error('Prefetch failed:', error);
      return null;
    }
  }
  
  /**
   * Get cached products if available and fresh (< 30s old)
   */
  static getCachedProducts(location_id?: number | string): BulkProduct[] | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const cached = sessionStorage.getItem('bulk_products_cache');
      if (!cached) return null;
      
      const { data, timestamp, location_id: cached_location } = JSON.parse(cached);
      
      // Check if cache is fresh (30 seconds)
      if (Date.now() - timestamp > 30000) {
        return null;
      }
      
      // Check if location matches
      if (location_id && cached_location !== location_id) {
        return null;
      }
      
      console.log('⚡ Using cached bulk products');
      return data;
      
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Clear cached products
   */
  static clearCache() {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('bulk_products_cache');
    }
  }
}

