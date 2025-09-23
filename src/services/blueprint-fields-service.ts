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
   * Get product meta data with blueprint fields from WooCommerce API
   */
  static async getProductBlueprintFields(productId: number): Promise<ProductBlueprintFields | null> {
    try {
      const response = await fetch(
        `https://api.floradistro.com/wp-json/wc/v3/products/${productId}?consumer_key=${this.CONSUMER_KEY}&consumer_secret=${this.CONSUMER_SECRET}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null; // No product found
        }
        throw new Error(`Failed to fetch product: ${response.statusText}`);
      }

      const product = await response.json();
      
      if (!product.meta_data || !Array.isArray(product.meta_data)) {
        return null; // No meta data
      }

      // Extract real blueprint fields from meta_data
      const blueprintFieldKeys = [
        'effect', '_effect',
        'lineage', '_lineage', 
        'nose', '_nose',
        'terpene', '_terpene',
        'strain_type', '_strain_type',
        'thca_percentage', '_thca_percentage',
        'supplier', '_supplier',
        'cost_price', '_cost_price'
      ];
      
      const blueprintMetaData = product.meta_data.filter((meta: any) => 
        blueprintFieldKeys.includes(meta.key)
      );

      if (blueprintMetaData.length === 0) {
        return null; // No blueprint fields found
      }

      // Convert meta_data back to fields format
      const fields = blueprintMetaData.map((meta: any) => {
        let fieldName = meta.key.startsWith('_') ? meta.key.substring(1) : meta.key;
        
        return {
          field_name: fieldName,
          field_label: this.getFieldLabel(fieldName),
          field_type: this.getFieldType(fieldName),
          field_value: meta.value,
        };
      });

      return {
        product_id: productId,
        product_name: product.name,
        blueprint_id: 39, // Default blueprint ID
        blueprint_name: 'magic2_fields',
        fields
      };
    } catch (error) {
      console.error('Error fetching product blueprint fields:', error);
      return null;
    }
  }

  /**
   * Get field label based on field name
   */
  private static getFieldLabel(fieldName: string): string {
    const labelMap: Record<string, string> = {
      'supplier': 'Supplier',
      'cost': 'Cost',
      'cost_price': 'Cost Price',
      'strain_type': 'Type',
      'thca_percentage': 'THCA %',
      'effect': 'Effect',
      'lineage': 'Lineage',
      'nose': 'Nose',
      'terpene': 'Terpene'
    };
    return labelMap[fieldName] || fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
  }

  /**
   * Get field type based on field name
   */
  private static getFieldType(fieldName: string): string {
    const typeMap: Record<string, string> = {
      'cost': 'number',
      'cost_price': 'number',
      'thca_percentage': 'number',
      'supplier': 'text',
      'strain_type': 'text',
      'effect': 'text',
      'lineage': 'text',
      'nose': 'text',
      'terpene': 'text'
    };
    return typeMap[fieldName] || 'text';
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
   * Create mock fields data for products without real data
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
      },
      {
        field_name: 'supplier',
        field_label: 'Supplier',
        field_type: 'text',
        field_value: ''
      },
      {
        field_name: 'cost',
        field_label: 'Cost',
        field_type: 'number',
        field_value: ''
      }
    ];

    return {
      product_id: productId,
      product_name: productName,
      blueprint_id: 39,
      blueprint_name: 'magic2_fields',
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

  /**
   * Update product blueprint field values using WooCommerce API
   */
  static async updateProductBlueprintFields(
    productId: number, 
    fields: Array<{ field_name: string; field_value: any }>
  ): Promise<boolean> {
    try {
      console.log(`🔄 Updating blueprint fields for product ${productId}:`, fields);

      // Convert fields to magic2 plugin meta_data format
      const metaData = fields.map(field => {
        let metaKey;
        switch (field.field_name) {
          case 'supplier':
            metaKey = '_supplier'; // magic2 supplier meta key
            break;
          case 'cost':
            metaKey = '_cost_price'; // magic2 cost meta key
            break;
          default:
            metaKey = `_${field.field_name}`; // Standard underscore prefix
        }
        
        return {
          key: metaKey,
          value: field.field_value
        };
      });

      const response = await fetch(
        `https://api.floradistro.com/wp-json/wc/v3/products/${productId}?consumer_key=${this.CONSUMER_KEY}&consumer_secret=${this.CONSUMER_SECRET}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            meta_data: metaData
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to update product blueprint fields: ${response.status}`, errorText);
        throw new Error(`Failed to update product blueprint fields: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ Successfully updated blueprint fields for product ${productId}:`, result);
      return true;
    } catch (error) {
      console.error('Error updating product blueprint fields:', error);
      throw error;
    }
  }

  /**
   * Update a single blueprint field for a product
   */
  static async updateProductBlueprintField(
    productId: number, 
    fieldName: string, 
    fieldValue: any
  ): Promise<boolean> {
    return this.updateProductBlueprintFields(productId, [{ field_name: fieldName, field_value: fieldValue }]);
  }
}
