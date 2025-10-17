import { apiFetch } from '../lib/api-fetch';
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
  private static readonly CONSUMER_KEY = process.env.NEXT_PUBLIC_WC_CONSUMER_KEY!;
  private static readonly CONSUMER_SECRET = process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET!;

  /**
   * Get blueprint fields for a specific category
   * Uses V3 Native API - reads from wp_termmeta
   */
  static async getBlueprintFields(categoryId: number): Promise<BlueprintField[]> {
    try {
      // V3 Native API reads directly from category term meta
      const baseUrl = process.env.NEXT_PUBLIC_WC_API_URL || 'https://api.floradistro.com';
      const response = await fetch(
        `${baseUrl}/wp-json/fd/v3/categories/${categoryId}/fields?consumer_key=${this.CONSUMER_KEY}&consumer_secret=${this.CONSUMER_SECRET}&_t=${Date.now()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'POSV1/1.0'
          },
          cache: 'no-store'
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch fields: ${response.statusText}`);
      }

      const result = await response.json();
      const assignedFields = result.assigned_fields || {};
      
      // Transform V3 native structure to BlueprintField interface
      return Object.entries(assignedFields).map(([fieldName, fieldConfig]: [string, any], index) => ({
        id: index + 1,
        blueprint_id: categoryId,
        field_name: fieldName,
        field_type: fieldConfig.type,
        field_label: fieldConfig.label,
        field_description: '',
        field_default_value: '',
        validation_rules: [],
        display_options: fieldConfig.config || [],
        is_required: fieldConfig.required || false,
        is_searchable: false,
        sort_order: fieldConfig.order || index,
        status: 'active',
        created_at: '',
        updated_at: ''
      }));
    } catch (error) {
      console.error('Error fetching blueprint fields:', error);
      throw error;
    }
  }

  /**
   * Get product fields from V3 Native API
   * Reads field values from wp_postmeta (_field_{name})
   */
  static async getProductBlueprintFields(productId: number): Promise<ProductBlueprintFields | null> {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_WC_API_URL || 'https://api.floradistro.com';
      const response = await fetch(
        `${baseUrl}/wp-json/fd/v3/products/${productId}/fields?consumer_key=${this.CONSUMER_KEY}&consumer_secret=${this.CONSUMER_SECRET}&_t=${Date.now()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'POSV1/1.0'
          },
          cache: 'no-store'
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch product fields: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.fields || Object.keys(result.fields).length === 0) {
        return null;
      }

      // Convert V3 native fields format
      const fields = Object.entries(result.fields).map(([fieldName, fieldData]: [string, any]) => ({
        field_name: fieldName,
        field_label: fieldData.label || this.getFieldLabel(fieldName),
        field_type: fieldData.type || this.getFieldType(fieldName),
        field_value: fieldData.value || '',
        field_description: fieldData.description || ''
      }));

      return {
        product_id: productId,
        product_name: result.product_name || '',
        blueprint_id: 0,
        blueprint_name: result.category_name || 'native_fields',
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
      // First get products in the category - use proxy to respect environment toggle
      const productsResponse = await apiFetch(
        `/api/proxy/woocommerce/products?category=${categoryId}&per_page=100`
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
   * Update product field values using V3 Native API
   * Stores in wp_postmeta as _field_{name}
   */
  static async updateProductBlueprintFields(
    productId: number, 
    fields: Array<{ field_name: string; field_value: any }>
  ): Promise<boolean> {
    try {
      console.log(`🔄 Updating fields for product ${productId}:`, fields);

      // Convert to V3 native format
      const fieldsObject = fields.reduce((acc, field) => {
        acc[field.field_name] = field.field_value;
        return acc;
      }, {} as Record<string, any>);

      const baseUrl = process.env.NEXT_PUBLIC_WC_API_URL || 'https://api.floradistro.com';
      const response = await fetch(
        `${baseUrl}/wp-json/fd/v3/products/${productId}/fields?consumer_key=${this.CONSUMER_KEY}&consumer_secret=${this.CONSUMER_SECRET}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fields: fieldsObject
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to update product fields: ${response.status}`, errorText);
        throw new Error(`Failed to update product fields: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ Successfully updated fields for product ${productId}:`, result);
      return true;
    } catch (error) {
      console.error('Error updating product fields:', error);
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
