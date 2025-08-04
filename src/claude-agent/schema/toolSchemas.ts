// Tool Schema Definitions for Claude Agent - Use the same schemas as working chat route
import { getToolDefinitions as getWooToolDefinitions } from '@/lib/woocommerce-tools'

export interface ToolSchema {
  name: string
  description: string
  input_schema: {
    type: 'object'
    properties: Record<string, any>
    required?: string[]
  }
}

// Get tool definitions from the working woocommerce-tools
export function getToolDefinitions(): ToolSchema[] {
  return getWooToolDefinitions()
}

// Legacy schemas (keeping for compatibility but using woocommerce-tools as source of truth)
export const toolSchemas: Record<string, ToolSchema> = {
  // Product Management
  get_products: {
    name: 'get_products',
    description: 'Retrieve products with inventory data',
    input_schema: {
      type: 'object',
      properties: {
        per_page: { type: 'integer', description: 'Products per page', default: 50 },
        page: { type: 'integer', description: 'Page number', default: 1 },
        search: { type: 'string', description: 'Search term' },
        category: { type: 'string', description: 'Product category' },
        status: { type: 'string', description: 'Product status' },
        stock_status: { type: 'string', description: 'Stock status' },
        sku: { type: 'string', description: 'Product SKU' },
        orderby: { type: 'string', description: 'Order by field' },
        order: { type: 'string', enum: ['asc', 'desc'], description: 'Order direction' }
      }
    }
  },

  get_product: {
    name: 'get_product',
    description: 'Get single product details',
    input_schema: {
      type: 'object',
      properties: {
        product_id: { type: 'integer', description: 'Product ID' }
      },
      required: ['product_id']
    }
  },

  update_product: {
    name: 'update_product',
    description: 'Update product details',
    input_schema: {
      type: 'object',
      properties: {
        product_id: { type: 'integer', description: 'Product ID' },
        name: { type: 'string', description: 'Product name' },
        description: { type: 'string', description: 'Product description' },
        price: { type: 'string', description: 'Product price' },
        stock_quantity: { type: 'integer', description: 'Stock quantity' }
      },
      required: ['product_id']
    }
  },

  // Location Management
  get_locations: {
    name: 'get_locations',
    description: 'Get all locations/warehouses',
    input_schema: {
      type: 'object',
      properties: {}
    }
  },

  get_location_stock: {
    name: 'get_location_stock',
    description: 'Get stock for a specific location',
    input_schema: {
      type: 'object',
      properties: {
        location_id: { type: 'integer', description: 'Location ID' },
        per_page: { type: 'integer', description: 'Items per page', default: 20 },
        page: { type: 'integer', description: 'Page number', default: 1 }
      },
      required: ['location_id']
    }
  },

  // BULK API ENDPOINTS - Enhanced Performance
  bulk_get_inventory: {
    name: 'bulk_get_inventory',
    description: 'Get inventory data for multiple products efficiently using bulk API - much faster than individual calls',
    input_schema: {
      type: 'object',
      properties: {
        product_ids: { 
          type: 'array', 
          items: { type: 'integer' },
          description: 'Array of product IDs to get inventory for (max 100 for performance)',
          maxItems: 100
        },
        location_id: { 
          type: 'integer', 
          description: 'Optional location ID to filter inventory by specific location' 
        }
      },
      required: ['product_ids']
    }
  },

  bulk_update_stock: {
    name: 'bulk_update_stock',
    description: 'Update stock quantities for multiple inventory items efficiently - supports decimal quantities',
    input_schema: {
      type: 'object',
      properties: {
        updates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              inventory_id: { type: 'integer', description: 'Inventory ID to update' },
              quantity: { type: 'number', description: 'New quantity (supports decimals)' },
              operation: { 
                type: 'string', 
                enum: ['set', 'add', 'subtract'],
                description: 'Operation type: set (replace), add (increase), subtract (decrease)',
                default: 'set'
              }
            },
            required: ['inventory_id', 'quantity']
          },
          description: 'Array of stock updates (max 50 for performance)',
          maxItems: 50
        }
      },
      required: ['updates']
    }
  },

  get_location_inventory_summary: {
    name: 'get_location_inventory_summary',
    description: 'Get comprehensive inventory summary for a specific location using bulk API',
    input_schema: {
      type: 'object',
      properties: {
        product_ids: { 
          type: 'array', 
          items: { type: 'integer' },
          description: 'Array of product IDs to check inventory for'
        },
        location_id: { 
          type: 'integer', 
          description: 'Location ID to get inventory summary for' 
        }
      },
      required: ['product_ids', 'location_id']
    }
  },

  get_multi_location_stock: {
    name: 'get_multi_location_stock',
    description: 'Get stock levels across all locations for specific products efficiently',
    input_schema: {
      type: 'object',
      properties: {
        product_ids: { 
          type: 'array', 
          items: { type: 'integer' },
          description: 'Array of product IDs to get stock across all locations'
        }
      },
      required: ['product_ids']
    }
  },

  // Order Management
  get_orders: {
    name: 'get_orders',
    description: 'Retrieve orders',
    input_schema: {
      type: 'object',
      properties: {
        per_page: { type: 'integer', description: 'Orders per page', default: 20 },
        page: { type: 'integer', description: 'Page number', default: 1 },
        status: { type: 'string', description: 'Order status' },
        customer: { type: 'integer', description: 'Customer ID' },
        after: { type: 'string', description: 'Start date (ISO 8601)' },
        before: { type: 'string', description: 'End date (ISO 8601)' },
        orderby: { type: 'string', description: 'Order by field' },
        order: { type: 'string', enum: ['asc', 'desc'], description: 'Order direction' }
      }
    }
  },

  get_order: {
    name: 'get_order',
    description: 'Get single order details',
    input_schema: {
      type: 'object',
      properties: {
        order_id: { type: 'integer', description: 'Order ID' }
      },
      required: ['order_id']
    }
  },

  // Customer Management
  get_customers: {
    name: 'get_customers',
    description: 'Retrieve customers',
    input_schema: {
      type: 'object',
      properties: {
        per_page: { type: 'integer', description: 'Customers per page', default: 20 },
        page: { type: 'integer', description: 'Page number', default: 1 },
        search: { type: 'string', description: 'Search term' },
        email: { type: 'string', description: 'Customer email' },
        orderby: { type: 'string', description: 'Order by field' },
        order: { type: 'string', enum: ['asc', 'desc'], description: 'Order direction' }
      }
    }
  },

  // Categories
  get_categories: {
    name: 'get_categories',
    description: 'Get product categories',
    input_schema: {
      type: 'object',
      properties: {
        per_page: { type: 'integer', description: 'Categories per page', default: 100 },
        page: { type: 'integer', description: 'Page number', default: 1 },
        parent: { type: 'integer', description: 'Parent category ID' },
        orderby: { type: 'string', description: 'Order by field' },
        order: { type: 'string', enum: ['asc', 'desc'], description: 'Order direction' }
      }
    }
  }
}

// Helper function to get schema for a specific tool (legacy)
export function getToolSchema(toolName: string): ToolSchema | null {
  return toolSchemas[toolName] || null
}