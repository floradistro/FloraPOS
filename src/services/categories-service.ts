import { Category } from '../components/ui/CategoryFilter';

export class CategoriesService {
  
  /**
   * Fetch all available product categories from the Flora IM API
   * Since Flora IM might not have a categories endpoint, let's extract categories from products
   * Optimized with caching headers for better performance
   */
  static async getCategories(): Promise<Category[]> {
    try {
      // Fetch products first to extract categories with optimized caching
      const response = await fetch('/api/proxy/flora-im/products?per_page=100&page=1', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Allow caching for categories as they change infrequently
          'Cache-Control': 'public, max-age=300', // 5 minutes cache
        },
      });

      if (!response.ok) {
        throw new Error(`Products API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error('Invalid response from Products API');
      }

      // Extract unique categories from products
      const categoryMap = new Map<string, Category>();
      
      result.data.forEach((product: any) => {
        if (product.categories && Array.isArray(product.categories)) {
          product.categories.forEach((cat: any) => {
            if (cat.id && cat.name && cat.slug) {
              const existing = categoryMap.get(cat.slug);
              categoryMap.set(cat.slug, {
                id: cat.id,
                name: cat.name,
                slug: cat.slug,
                count: (existing?.count || 0) + 1
              });
            }
          });
        }
      });

      const categories: Category[] = Array.from(categoryMap.values())
        .sort((a, b) => b.count! - a.count!); // Sort by count descending

      return categories;

    } catch (error) {
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  }
}
