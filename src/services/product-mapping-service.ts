import { apiFetch } from '../lib/api-fetch';
/**
 * Service to map Flora IM products to WooCommerce products for rewards integration
 */

export interface ProductMapping {
  floraId: number;
  wooCommerceId: number;
  name: string;
  sku?: string;
}

export class ProductMappingService {
  private static cache: Map<string, number> = new Map();
  private static cacheExpiry: number = 0;
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Find WooCommerce product ID by product name
   */
  static async findWooCommerceProductId(productName: string): Promise<number | null> {
    try {
      // Check cache first
      const cacheKey = productName.toLowerCase().trim();
      const now = Date.now();
      
      if (now < this.cacheExpiry && this.cache.has(cacheKey)) {
        console.log(`🔍 Using cached WooCommerce product ID for: "${productName}"`);
        return this.cache.get(cacheKey) || null;
      }

      console.log(`🔍 Looking up WooCommerce product ID for: "${productName}"`);

      // Search WooCommerce products by name
      const searchParams = new URLSearchParams({
        search: productName,
        per_page: '5',
        status: 'publish'
      });

      // Use full URL for server-side calls
      const baseUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '';
      const apiUrl = `${baseUrl}/api/proxy/woocommerce/products?${searchParams}`;
      
      console.log(`📡 Fetching: ${apiUrl}`);
      
      const response = await apiFetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to search WooCommerce products: ${response.status}`, errorText);
        return null;
      }

      const products = await response.json();
      
      if (!Array.isArray(products) || products.length === 0) {
        console.warn(`No WooCommerce product found for: "${productName}"`);
        this.cache.set(cacheKey, 0); // Cache negative result
        return null;
      }

      // Find exact match or closest match
      let bestMatch = products[0];
      const normalizedSearchName = productName.toLowerCase().trim();
      
      for (const product of products) {
        const normalizedProductName = product.name.toLowerCase().trim();
        
        // Exact match
        if (normalizedProductName === normalizedSearchName) {
          bestMatch = product;
          break;
        }
        
        // Check if search term is contained in product name
        if (normalizedProductName.includes(normalizedSearchName)) {
          bestMatch = product;
          break;
        }
      }

      console.log(`✅ Found WooCommerce product mapping: "${productName}" -> ID ${bestMatch.id} ("${bestMatch.name}")`);
      
      // Cache the result
      this.cache.set(cacheKey, bestMatch.id);
      this.cacheExpiry = now + this.CACHE_DURATION;

      return bestMatch.id;

    } catch (error) {
      console.error(`Error mapping product "${productName}":`, error);
      return null;
    }
  }

  /**
   * Map multiple cart items to include WooCommerce product IDs
   */
  static async mapCartItemsToWooCommerce(cartItems: any[]): Promise<any[]> {
    const mappedItems = [];

    for (const item of cartItems) {
      const wooCommerceId = await this.findWooCommerceProductId(item.name);
      
      mappedItems.push({
        ...item,
        woocommerce_product_id: wooCommerceId,
        // Keep original Flora IM product_id for inventory deduction
        flora_product_id: item.product_id
      });
    }

    return mappedItems;
  }

  /**
   * Clear the cache (useful for development/testing)
   */
  static clearCache(): void {
    this.cache.clear();
    this.cacheExpiry = 0;
    console.log('🗑️ Product mapping cache cleared');
  }
}
