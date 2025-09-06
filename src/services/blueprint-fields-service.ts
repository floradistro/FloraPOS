/**
 * Blueprint Fields Service
 * Handles fetching and managing blueprint field data for products
 */

export interface BlueprintField {
  id: number;
  blueprint_id: number;
  field_name: string;
  field_type: string;
  field_label: string;
  field_description: string;
  field_default_value: string;
  validation_rules: any[];
  display_options: any[];
  is_required: boolean;
  is_searchable: boolean;
  sort_order: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ProductBlueprintFields {
  product_id: number;
  product_name: string;
  blueprint_id: number;
  blueprint_name: string;
  fields: Array<{
    field_name: string;
    field_label: string;
    field_type: string;
    field_value: any;
    field_description?: string;
  }>;
}

export class BlueprintFieldsService {
  private static readonly BASE_URL = 'https://api.floradistro.com/wp-json/fd/v1';
  private static readonly CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
  private static readonly CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

  /**
   * Get blueprint fields for a specific blueprint
   */
  static async getBlueprintFields(blueprintId: number): Promise<BlueprintField[]> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/blueprints/${blueprintId}/fields?consumer_key=${this.CONSUMER_KEY}&consumer_secret=${this.CONSUMER_SECRET}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch blueprint fields: ${response.statusText}`);
      }

      const fields = await response.json();
      return fields || [];
    } catch (error) {
      console.error('Error fetching blueprint fields:', error);
      throw error;
    }
  }

  /**
   * Get product meta data with blueprint fields
   */
  static async getProductBlueprintFields(productId: number): Promise<ProductBlueprintFields | null> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/meta/product/${productId}?consumer_key=${this.CONSUMER_KEY}&consumer_secret=${this.CONSUMER_SECRET}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null; // No blueprint fields for this product
        }
        throw new Error(`Failed to fetch product blueprint fields: ${response.statusText}`);
      }

      const metaData = await response.json();
      return metaData || null;
    } catch (error) {
      console.error('Error fetching product blueprint fields:', error);
      return null;
    }
  }

  /**
   * Get all products with blueprint fields for a specific category
   */
  static async getCategoryProductsBlueprintFields(categoryId: number): Promise<ProductBlueprintFields[]> {
    try {
      // First get products in the category
      const productsResponse = await fetch(
        `https://api.floradistro.com/wp-json/wc/v3/products?category=${categoryId}&consumer_key=${this.CONSUMER_KEY}&consumer_secret=${this.CONSUMER_SECRET}&per_page=100`
      );

      if (!productsResponse.ok) {
        throw new Error(`Failed to fetch category products: ${productsResponse.statusText}`);
      }

      const products = await productsResponse.json();
      
      if (!Array.isArray(products) || products.length === 0) {
        return [];
      }

      // Get blueprint fields for each product
      const productFieldsPromises = products.map(async (product: any) => {
        const fields = await this.getProductBlueprintFields(product.id);
        if (fields) {
          return {
            ...fields,
            product_name: product.name
          };
        }
        return null;
      });

      const results = await Promise.all(productFieldsPromises);
      return results.filter((result): result is ProductBlueprintFields => result !== null);
    } catch (error) {
      console.error('Error fetching category products blueprint fields:', error);
      return [];
    }
  }

  /**
   * Get flower category blueprint fields (category ID 25)
   */
  static async getFlowerProductsBlueprintFields(): Promise<ProductBlueprintFields[]> {
    return this.getCategoryProductsBlueprintFields(25);
  }

  /**
   * Create mock blueprint fields data for products without real data
   */
  static createMockBlueprintFields(productId: number, productName: string): ProductBlueprintFields {
    const mockFields = [
      {
        field_name: 'strain_type',
        field_label: 'Type',
        field_type: 'text',
        field_value: ['Indica', 'Sativa', 'Hybrid'][Math.floor(Math.random() * 3)]
      },
      {
        field_name: 'thca_percentage',
        field_label: 'THCA %',
        field_type: 'number',
        field_value: (15 + Math.random() * 20).toFixed(1)
      },
      {
        field_name: 'effect',
        field_label: 'Effect',
        field_type: 'text',
        field_value: ['Relaxing', 'Energizing', 'Euphoric', 'Creative', 'Focused'][Math.floor(Math.random() * 5)]
      },
      {
        field_name: 'lineage',
        field_label: 'Lineage',
        field_type: 'text',
        field_value: ['OG Kush × Gelato', 'Purple Punch × Zkittlez', 'GSC × Sherbet', 'Wedding Cake × Gelato'][Math.floor(Math.random() * 4)]
      },
      {
        field_name: 'nose',
        field_label: 'Nose',
        field_type: 'text',
        field_value: ['Sweet & Fruity', 'Earthy & Pine', 'Citrus & Diesel', 'Berry & Vanilla'][Math.floor(Math.random() * 4)]
      },
      {
        field_name: 'terpene',
        field_label: 'Terpene',
        field_type: 'text',
        field_value: ['Myrcene', 'Limonene', 'Caryophyllene', 'Pinene', 'Linalool'][Math.floor(Math.random() * 5)]
      }
    ];

    return {
      product_id: productId,
      product_name: productName,
      blueprint_id: 39,
      blueprint_name: 'flower_blueprint',
      fields: mockFields
    };
  }

  /**
   * Get blueprint fields with fallback to mock data
   */
  static async getProductBlueprintFieldsWithFallback(productId: number, productName: string): Promise<ProductBlueprintFields> {
    try {
      const realFields = await this.getProductBlueprintFields(productId);
      if (realFields && realFields.fields && realFields.fields.length > 0) {
        return realFields;
      }
    } catch (error) {
      console.warn(`Failed to fetch real blueprint fields for product ${productId}, using mock data`);
    }

    // Return mock data as fallback
    return this.createMockBlueprintFields(productId, productName);
  }
}
