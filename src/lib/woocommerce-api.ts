// WooCommerce API utility for Addify Multi Inventory Management
const WOO_API_BASE = 'https://api.floradistro.com'
const WOO_CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5'
const WOO_CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678'

// Create basic auth header
const createAuthHeader = () => {
  const credentials = Buffer.from(`${WOO_CONSUMER_KEY}:${WOO_CONSUMER_SECRET}`).toString('base64')
  return `Basic ${credentials}`
}

// Generic API request function
async function wooRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', data?: any) {
  const url = `${WOO_API_BASE}/wp-json/wc/v3/${endpoint}`
  
  const options: RequestInit = {
    method,
    headers: {
      'Authorization': createAuthHeader(),
      'Content-Type': 'application/json',
    },
  }

  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data)
  }

  try {
    const response = await fetch(url, options)
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API Error ${response.status}: ${errorText}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`WooCommerce API Error:`, error)
    throw error
  }
}

// Addify Multi Inventory API functions
export const addifyAPI = {
  // Locations Management
  async getLocations() {
    return wooRequest('addify_headless_inventory/locations')
  },

  async getLocation(locationId: number) {
    return wooRequest(`addify_headless_inventory/locations/${locationId}`)
  },

  async createLocation(locationData: {
    name: string
    description?: string
    address?: string
    manager?: string
    phone?: string
  }) {
    return wooRequest('addify_headless_inventory/locations', 'POST', locationData)
  },

  async updateLocation(locationId: number, locationData: any) {
    return wooRequest(`addify_headless_inventory/locations/${locationId}`, 'PUT', locationData)
  },

  async deleteLocation(locationId: number) {
    return wooRequest(`addify_headless_inventory/locations/${locationId}`, 'DELETE')
  },

  // Product Inventory Management
  async getProductInventory(productId: number) {
    return wooRequest(`addify_headless_inventory/products/${productId}/inventory`)
  },

  async createProductInventory(productId: number, inventoryData: {
    location_id: number
    quantity: number
    name?: string
  }) {
    return wooRequest(`addify_headless_inventory/products/${productId}/inventory`, 'POST', inventoryData)
  },

  async updateInventoryItem(productId: number, inventoryId: number, data: {
    quantity?: number
    location_id?: number
    name?: string
  }) {
    return wooRequest(`addify_headless_inventory/products/${productId}/inventory/${inventoryId}`, 'PUT', data)
  },

  async deleteInventoryItem(productId: number, inventoryId: number) {
    return wooRequest(`addify_headless_inventory/products/${productId}/inventory/${inventoryId}`, 'DELETE')
  },

  // Stock Management
  async updateStock(inventoryId: number, quantity: number, operation: 'set' | 'add' | 'subtract') {
    return wooRequest('addify_headless_inventory/stock/update', 'POST', {
      inventory_id: inventoryId,
      quantity,
      operation
    })
  },

  async bulkUpdateStock(updates: Array<{
    inventory_id: number
    quantity: number
    operation: 'set' | 'add' | 'subtract'
  }>) {
    return wooRequest('addify_headless_inventory/stock/bulk-update', 'POST', { updates })
  },

  async transferStock(productId: number, fromLocationId: number, toLocationId: number, quantity: number) {
    return wooRequest('addify_headless_inventory/stock/transfer', 'POST', {
      product_id: productId,
      from_location_id: fromLocationId,
      to_location_id: toLocationId,
      quantity
    })
  },

  async convertStock(fromProductId: number, toProductId: number, fromQuantity: number, toQuantity: number, locationId: number, notes?: string) {
    return wooRequest('addify_headless_inventory/stock/convert', 'POST', {
      from_product_id: fromProductId,
      to_product_id: toProductId,
      from_quantity: fromQuantity,
      to_quantity: toQuantity,
      location_id: locationId,
      notes
    })
  },

  // Reporting & Analytics
  async getLocationStock(locationId: number) {
    return wooRequest(`addify_headless_inventory/locations/${locationId}/stock`)
  },

  async getLowStockItems(threshold: number = 10) {
    return wooRequest(`addify_headless_inventory/stock/low-stock?threshold=${threshold}`)
  },

  // Standard WooCommerce Products API
  async getProducts(params?: {
    per_page?: number
    page?: number
    search?: string
    category?: string
    status?: string
  }) {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString())
        }
      })
    }
    const endpoint = queryParams.toString() ? `products?${queryParams}` : 'products'
    return wooRequest(endpoint)
  },

  async getProduct(productId: number) {
    return wooRequest(`products/${productId}`)
  },

  async updateProduct(productId: number, productData: any) {
    return wooRequest(`products/${productId}`, 'PUT', productData)
  },

  // Orders API
  async getOrders(params?: {
    per_page?: number
    page?: number
    status?: string
    customer?: number
  }) {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString())
        }
      })
    }
    const endpoint = queryParams.toString() ? `orders?${queryParams}` : 'orders'
    return wooRequest(endpoint)
  },

  async getOrder(orderId: number) {
    return wooRequest(`orders/${orderId}`)
  },

  async updateOrder(orderId: number, orderData: any) {
    return wooRequest(`orders/${orderId}`, 'PUT', orderData)
  }
}

// Helper function to format API responses for Claude
export function formatAPIResponse(data: any, context: string): string {
  if (Array.isArray(data)) {
    return `${context}: Found ${data.length} items:\n${JSON.stringify(data, null, 2)}`
  } else {
    return `${context}:\n${JSON.stringify(data, null, 2)}`
  }
}