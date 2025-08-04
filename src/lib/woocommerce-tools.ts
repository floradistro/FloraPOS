// WooCommerce API Tools Configuration
export interface WooTool {
  name: string
  description: string
  endpoint: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  buildUrl: (params: any) => string
  buildBody?: (params: any) => any
}

// Define all available WooCommerce tools
export const wooTools: Record<string, WooTool> = {
  // Product Management
  get_products: {
    name: 'get_products',
    description: 'Retrieve products with inventory data',
    endpoint: '/wp-json/wc/v3/products',
    method: 'GET',
    buildUrl: (params) => {
      const queryParams = new URLSearchParams()
      if (params.per_page) queryParams.append('per_page', params.per_page)
      if (params.page) queryParams.append('page', params.page)
      if (params.search) queryParams.append('search', params.search)
      if (params.category) queryParams.append('category', params.category)
      if (params.status) queryParams.append('status', params.status)
      if (params.stock_status) queryParams.append('stock_status', params.stock_status)
      if (params.sku) queryParams.append('sku', params.sku)
      if (params.orderby) queryParams.append('orderby', params.orderby)
      if (params.order) queryParams.append('order', params.order)
      return queryParams.toString() ? `?${queryParams}` : ''
    }
  },

  get_product: {
    name: 'get_product',
    description: 'Get single product details',
    endpoint: '/wp-json/wc/v3/products',
    method: 'GET',
    buildUrl: (params) => `/${params.product_id}`
  },

  update_product: {
    name: 'update_product',
    description: 'Update product details',
    endpoint: '/wp-json/wc/v3/products',
    method: 'PUT',
    buildUrl: (params) => `/${params.product_id}`,
    buildBody: (params) => {
      const { product_id, ...data } = params
      return data
    }
  },

  // Order Management
  get_orders: {
    name: 'get_orders',
    description: 'Retrieve orders',
    endpoint: '/wp-json/wc/v3/orders',
    method: 'GET',
    buildUrl: (params) => {
      const queryParams = new URLSearchParams()
      if (params.per_page) queryParams.append('per_page', params.per_page)
      if (params.page) queryParams.append('page', params.page)
      if (params.status) queryParams.append('status', params.status)
      if (params.customer) queryParams.append('customer', params.customer)
      if (params.after) queryParams.append('after', params.after)
      if (params.before) queryParams.append('before', params.before)
      if (params.orderby) queryParams.append('orderby', params.orderby)
      if (params.order) queryParams.append('order', params.order)
      return queryParams.toString() ? `?${queryParams}` : ''
    }
  },

  get_order: {
    name: 'get_order',
    description: 'Get single order details',
    endpoint: '/wp-json/wc/v3/orders',
    method: 'GET',
    buildUrl: (params) => `/${params.order_id}`
  },

  create_order: {
    name: 'create_order',
    description: 'Create new order',
    endpoint: '/wp-json/wc/v3/orders',
    method: 'POST',
    buildUrl: () => '',
    buildBody: (params) => params
  },

  // Customer Management
  get_customers: {
    name: 'get_customers',
    description: 'Retrieve customers',
    endpoint: '/wp-json/wc/v3/customers',
    method: 'GET',
    buildUrl: (params) => {
      const queryParams = new URLSearchParams()
      if (params.per_page) queryParams.append('per_page', params.per_page)
      if (params.page) queryParams.append('page', params.page)
      if (params.search) queryParams.append('search', params.search)
      if (params.email) queryParams.append('email', params.email)
      if (params.role) queryParams.append('role', params.role)
      return queryParams.toString() ? `?${queryParams}` : ''
    }
  },

  get_customer: {
    name: 'get_customer',
    description: 'Get customer details',
    endpoint: '/wp-json/wc/v3/customers',
    method: 'GET',
    buildUrl: (params) => `/${params.customer_id}`
  },

  // Categories
  get_categories: {
    name: 'get_categories',
    description: 'Get product categories',
    endpoint: '/wp-json/wc/v3/products/categories',
    method: 'GET',
    buildUrl: (params) => {
      const queryParams = new URLSearchParams()
      if (params.per_page) queryParams.append('per_page', params.per_page || '100')
      if (params.page) queryParams.append('page', params.page)
      if (params.search) queryParams.append('search', params.search)
      if (params.parent) queryParams.append('parent', params.parent)
      if (params.hide_empty) queryParams.append('hide_empty', params.hide_empty)
      return queryParams.toString() ? `?${queryParams}` : ''
    }
  },

  // Addify Multi-Inventory Specific
  get_locations: {
    name: 'get_locations',
    description: 'Get all inventory locations',
    endpoint: '/wp-json/wc/v3/addify_headless_inventory/locations',
    method: 'GET',
    buildUrl: () => ''
  },

  get_location_stock: {
    name: 'get_location_stock',
    description: 'Get stock levels for a specific location by ID',
    endpoint: '/wp-json/wc/v3/addify_headless_inventory/locations',
    method: 'GET',
    buildUrl: (params) => `/${params.location_id}/stock`
  },

  get_product_locations: {
    name: 'get_product_locations',
    description: 'Get inventory levels for a product across all locations',
    endpoint: '/wp-json/wc/v3/addify_headless_inventory/products',
    method: 'GET',
    buildUrl: (params) => `/${params.product_id}/inventory`
  },

  update_stock: {
    name: 'update_stock',
    description: 'Update product stock',
    endpoint: '/wp-json/wc/v3/addify_headless_inventory/stock/update',
    method: 'POST',
    buildUrl: () => '',
    buildBody: (params) => ({
      inventory_id: params.inventory_id,
      quantity: params.quantity,
      operation: params.operation || 'set'
    })
  },

  transfer_stock: {
    name: 'transfer_stock',
    description: 'Transfer stock between locations',
    endpoint: '/wp-json/wc/v3/addify_headless_inventory/stock/transfer',
    method: 'POST',
    buildUrl: () => '',
    buildBody: (params) => params
  },

  // Reports & Analytics
  get_sales_report: {
    name: 'get_sales_report',
    description: 'Get sales report',
    endpoint: '/wp-json/wc/v3/reports/sales',
    method: 'GET',
    buildUrl: (params) => {
      const queryParams = new URLSearchParams()
      if (params.date_min) queryParams.append('date_min', params.date_min)
      if (params.date_max) queryParams.append('date_max', params.date_max)
      return queryParams.toString() ? `?${queryParams}` : ''
    }
  },

  get_low_stock: {
    name: 'get_low_stock',
    description: 'Get products with low stock levels',
    endpoint: '/wp-json/wc/v3/reports/products/low_in_stock',
    method: 'GET',
    buildUrl: () => ''
  },

  get_product_variations: {
    name: 'get_product_variations',
    description: 'Get all variations for a variable product',
    endpoint: '/wp-json/wc/v3/products',
    method: 'GET',
    buildUrl: (params) => `/${params.product_id}/variations`
  },

  get_system_status: {
    name: 'get_system_status',
    description: 'Get WooCommerce system status and store info',
    endpoint: '/wp-json/wc/v3/system_status',
    method: 'GET',
    buildUrl: () => ''
  },

  get_payment_gateways: {
    name: 'get_payment_gateways',
    description: 'Get available payment methods',
    endpoint: '/wp-json/wc/v3/payment_gateways',
    method: 'GET',
    buildUrl: () => ''
  },

  get_top_sellers: {
    name: 'get_top_sellers',
    description: 'Get top selling products',
    endpoint: '/wp-json/wc/v3/reports/top_sellers',
    method: 'GET',
    buildUrl: (params) => {
      const queryParams = new URLSearchParams()
      if (params.period) queryParams.append('period', params.period)
      if (params.date_min) queryParams.append('date_min', params.date_min)
      if (params.date_max) queryParams.append('date_max', params.date_max)
      return queryParams.toString() ? `?${queryParams}` : ''
    }
  },

  get_coupons: {
    name: 'get_coupons',
    description: 'Get available coupons',
    endpoint: '/wp-json/wc/v3/coupons',
    method: 'GET',
    buildUrl: (params) => {
      const queryParams = new URLSearchParams()
      if (params.per_page) queryParams.append('per_page', params.per_page)
      if (params.page) queryParams.append('page', params.page)
      if (params.search) queryParams.append('search', params.search)
      if (params.code) queryParams.append('code', params.code)
      return queryParams.toString() ? `?${queryParams}` : ''
    }
  }
}

// Helper to get tool definition for Claude
export function getToolDefinitions() {
  return Object.values(wooTools).map(tool => ({
    name: tool.name,
    description: tool.description,
    input_schema: getToolSchema(tool.name)
  }))
}

// Get schema for each tool
function getToolSchema(toolName: string): any {
  const schemas: Record<string, any> = {
    get_products: {
      type: 'object',
      properties: {
        per_page: { type: 'integer', description: 'Products per page (max 100)', default: 10 },
        page: { type: 'integer', description: 'Page number', default: 1 },
        search: { type: 'string', description: 'Search term' },
        category: { type: 'string', description: 'Category ID or slug' },
        status: { type: 'string', enum: ['draft', 'pending', 'private', 'publish'] },
        stock_status: { type: 'string', enum: ['instock', 'outofstock', 'onbackorder'] },
        sku: { type: 'string', description: 'Product SKU' },
        orderby: { type: 'string', enum: ['date', 'id', 'title', 'slug', 'price', 'popularity', 'rating'] },
        order: { type: 'string', enum: ['asc', 'desc'] }
      }
    },
    get_product: {
      type: 'object',
      properties: {
        product_id: { type: 'integer', description: 'Product ID' }
      },
      required: ['product_id']
    },
    update_product: {
      type: 'object',
      properties: {
        product_id: { type: 'integer', description: 'Product ID' },
        name: { type: 'string', description: 'Product name' },
        description: { type: 'string', description: 'Product description' },
        regular_price: { type: 'string', description: 'Regular price' },
        sale_price: { type: 'string', description: 'Sale price' },
        stock_quantity: { type: 'integer', description: 'Stock quantity' },
        manage_stock: { type: 'boolean', description: 'Enable stock management' },
        stock_status: { type: 'string', enum: ['instock', 'outofstock', 'onbackorder'] }
      },
      required: ['product_id']
    },
    get_orders: {
      type: 'object',
      properties: {
        per_page: { type: 'integer', description: 'Orders per page', default: 10 },
        page: { type: 'integer', description: 'Page number', default: 1 },
        status: { type: 'string', description: 'Order status' },
        customer: { type: 'integer', description: 'Customer ID' },
        after: { type: 'string', description: 'Orders after date (ISO8601)' },
        before: { type: 'string', description: 'Orders before date (ISO8601)' },
        orderby: { type: 'string', enum: ['date', 'id', 'title', 'slug'] },
        order: { type: 'string', enum: ['asc', 'desc'] }
      }
    },
    get_order: {
      type: 'object',
      properties: {
        order_id: { type: 'integer', description: 'Order ID' }
      },
      required: ['order_id']
    },
    create_order: {
      type: 'object',
      properties: {
        customer_id: { type: 'integer', description: 'Customer ID' },
        line_items: {
          type: 'array',
          description: 'Order line items',
          items: {
            type: 'object',
            properties: {
              product_id: { type: 'integer' },
              quantity: { type: 'integer' }
            }
          }
        },
        billing: { type: 'object', description: 'Billing address' },
        shipping: { type: 'object', description: 'Shipping address' },
        status: { type: 'string', description: 'Order status' }
      },
      required: ['line_items']
    },
    get_customers: {
      type: 'object',
      properties: {
        per_page: { type: 'integer', description: 'Customers per page', default: 20 },
        page: { type: 'integer', description: 'Page number', default: 1 },
        search: { type: 'string', description: 'Search term' },
        email: { type: 'string', description: 'Customer email' },
        role: { type: 'string', description: 'User role' }
      }
    },
    get_customer: {
      type: 'object',
      properties: {
        customer_id: { type: 'integer', description: 'Customer ID' }
      },
      required: ['customer_id']
    },
    get_categories: {
      type: 'object',
      properties: {
        per_page: { type: 'integer', description: 'Categories per page', default: 100 },
        page: { type: 'integer', description: 'Page number' },
        search: { type: 'string', description: 'Search term' },
        parent: { type: 'integer', description: 'Parent category ID' },
        hide_empty: { type: 'boolean', description: 'Hide empty categories' }
      }
    },
    get_locations: {
      type: 'object',
      properties: {}
    },
    get_location_stock: {
      type: 'object',
      properties: {
        location_id: { type: 'integer', description: 'Location ID' }
      },
      required: ['location_id']
    },
    get_product_locations: {
      type: 'object',
      properties: {
        product_id: { type: 'integer', description: 'Product ID' }
      },
      required: ['product_id']
    },
    update_stock: {
      type: 'object',
      properties: {
        inventory_id: { type: 'integer', description: 'Inventory ID' },
        quantity: { type: 'integer', description: 'Stock quantity' },
        operation: { type: 'string', enum: ['set', 'add', 'subtract'], default: 'set' }
      },
      required: ['inventory_id', 'quantity']
    },
    transfer_stock: {
      type: 'object',
      properties: {
        product_id: { type: 'integer', description: 'Product ID' },
        from_location_id: { type: 'integer', description: 'Source location ID' },
        to_location_id: { type: 'integer', description: 'Destination location ID' },
        quantity: { type: 'integer', description: 'Quantity to transfer' }
      },
      required: ['product_id', 'from_location_id', 'to_location_id', 'quantity']
    },
    get_sales_report: {
      type: 'object',
      properties: {
        date_min: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
        date_max: { type: 'string', description: 'End date (YYYY-MM-DD)' }
      }
    },
    get_top_sellers: {
      type: 'object',
      properties: {
        period: { type: 'string', enum: ['week', 'month', 'year'] },
        date_min: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
        date_max: { type: 'string', description: 'End date (YYYY-MM-DD)' }
      }
    },
    get_coupons: {
      type: 'object',
      properties: {
        per_page: { type: 'integer', description: 'Coupons per page', default: 20 },
        page: { type: 'integer', description: 'Page number', default: 1 },
        search: { type: 'string', description: 'Search term' },
        code: { type: 'string', description: 'Coupon code' }
      }
    },
    get_low_stock: {
      type: 'object',
      properties: {}
    },
    get_product_variations: {
      type: 'object',
      properties: {
        product_id: { type: 'integer', description: 'Parent product ID' }
      },
      required: ['product_id']
    },
    get_system_status: {
      type: 'object',
      properties: {}
    },
    get_payment_gateways: {
      type: 'object',
      properties: {}
    }
  }

  return schemas[toolName] || { type: 'object', properties: {} }
}