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
  private static readonly CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
  private static readonly CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

  /**
   * Get blueprint fields for a specific blueprint
   * Uses V2 API - fetches by field name/group instead of blueprint ID
   */
  static async getBlueprintFields(blueprintId: number): Promise<BlueprintField[]> {
    try {
      // V2 API uses field names instead of blueprint IDs
      // Map old blueprint IDs to new field group names
      const blueprintNameMap: Record<number, string> = {
        39: 'flower_blueprint',
        41: 'vape_blueprint',
        42: 'concentrate_blueprint',
        43: 'edible_blueprint',
        44: 'moonwater_blueprint'
      };
      
      const fieldName = blueprintNameMap[blueprintId] || `blueprint_${blueprintId}`;
      
      // Use Flora IM proxy with V2 endpoint
      const response = await apiFetch(
        `/api/proxy/flora-im/v2/fields?name=${fieldName}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch fields: ${response.statusText}`);
      }

      const result = await response.json();
      const fields = result.fields || [];
      
      // Transform V2 field structure to match old BlueprintField interface
      return fields.map((field: any) => ({
        id: field.id,
        blueprint_id: blueprintId,
        field_name: field.name,
        field_type: field.type,
        field_label: field.label,
        field_description: field.description || '',
        field_default_value: field.config?.default_value || '',
        validation_rules: field.config?.validation || [],
        display_options: field.config?.display || [],
        is_required: field.config?.required || false,
        is_searchable: field.config?.searchable || false,
        sort_order: field.sort_order,
        status: field.status,
        created_at: field.created_at,
        updated_at: field.updated_at
      }));
    } catch (error) {
      console.error('Error fetching blueprint fields:', error);
      throw error;
    }
  }

  /**
   * Get product meta data with blueprint fields from WooCommerce API
   * Uses proxy to respect environment toggle (production vs docker)
   */
  static async getProductBlueprintFields(productId: number): Promise<ProductBlueprintFields | null> {
    try {
      // Use proxy route instead of direct API call to avoid CORS and respect environment toggle
      const response = await apiFetch(
        `/api/proxy/woocommerce/products/${productId}`
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

      // Extract new Blueprints plugin fields from meta_data (_blueprint_ prefix)
      const blueprintMetaData = product.meta_data.filter((meta: any) => 
        meta.key.startsWith('_blueprint_')
      );

      if (blueprintMetaData.length === 0) {
        return null; // No blueprint fields found
      }

      // Convert meta_data back to fields format
      const fields = blueprintMetaData.map((meta: any) => {
        // New format: _blueprint_effect → effect
        let fieldName = meta.key.substring(11); // Remove '_blueprint_' prefix
        
        return {
          field_name: fieldName,
          field_label: this.getFieldLabel(fieldName),
          field_type: this.getFieldType(fieldName),
          field_value: meta.value,
          field_id: meta.key // Store original key for updates
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
   * Update product blueprint field values using WooCommerce API
   */
  static async updateProductBlueprintFields(
    productId: number, 
    fields: Array<{ field_name: string; field_value: any }>
  ): Promise<boolean> {
    try {
      console.log(`🔄 Updating blueprint fields for product ${productId}:`, fields);

      // Convert fields to new Blueprints plugin meta_data format (_blueprint_ prefix)
      const metaData = fields.map(field => ({
        key: `_blueprint_${field.field_name}`,
        value: field.field_value
      }));

      // Use proxy to respect environment toggle
      const response = await apiFetch(
        `/api/proxy/woocommerce/products/${productId}`,
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
