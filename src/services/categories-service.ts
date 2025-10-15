import { apiFetch } from '../lib/api-fetch';
import { Category } from '../components/ui/CategoryFilter';

export class CategoriesService {
  
  /**
   * Fetch all available product categories from WooCommerce API
   * Uses dedicated categories endpoint for better performance
   */
  static async getCategories(): Promise<Category[]> {
    try {
      // Fetch categories from dedicated API endpoint
      const response = await apiFetch('/api/products/categories', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Categories API error: ${response.status} ${response.statusText}`);
      }

      const categories: Category[] = await response.json();
      
      console.log('✅ CategoriesService: Loaded', categories.length, 'categories');
      
      return categories;

    } catch (error) {
      console.error('❌ CategoriesService error:', error);
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  }
}
