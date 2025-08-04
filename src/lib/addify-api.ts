// Addify API utility functions
const API_BASE_URL = process.env.ADDIFY_API_BASE_URL || 'http://api.floradistro.com'
const CONSUMER_KEY = process.env.ADDIFY_CONSUMER_KEY || 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5'
const CONSUMER_SECRET = process.env.ADDIFY_CONSUMER_SECRET || 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678'

export interface AddifyApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  status: number
}

export class AddifyApiClient {
  private auth: string

  constructor() {
    this.auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64')
  }

  private async makeRequest(endpoint: string, method: string = 'GET', data?: any): Promise<AddifyApiResponse> {
    try {
      const options: RequestInit = {
        method,
        headers: {
          'Authorization': `Basic ${this.auth}`,
          'Content-Type': 'application/json',
        },
      }
      
      if (data && method !== 'GET') {
        options.body = JSON.stringify(data)
      }
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, options)
      const responseData = await response.json()
      
      return {
        success: response.ok,
        data: responseData,
        status: response.status,
        error: response.ok ? undefined : `API Error: ${response.status} ${response.statusText}`
      }
    } catch (error) {
      return {
        success: false,
        error: `Network Error: ${error}`,
        status: 0
      }
    }
  }

  // Product endpoints
  async getProducts(params?: { page?: number; per_page?: number; search?: string }) {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString())
    if (params?.search) queryParams.append('search', params.search)
    
    const endpoint = `/wp-json/addify/v1/products${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    return this.makeRequest(endpoint, 'GET')
  }

  async getProduct(productId: number) {
    return this.makeRequest(`/wp-json/addify/v1/products/${productId}`, 'GET')
  }

  // Inventory endpoints
  async getInventory(locationId?: number) {
    const endpoint = locationId 
      ? `/wp-json/addify/v1/inventory?location_id=${locationId}`
      : '/wp-json/addify/v1/inventory'
    return this.makeRequest(endpoint, 'GET')
  }

  async updateInventory(productId: number, locationId: number, quantity: number) {
    return this.makeRequest('/wp-json/addify/v1/inventory', 'POST', {
      product_id: productId,
      location_id: locationId,
      quantity: quantity
    })
  }

  // Location endpoints
  async getLocations() {
    return this.makeRequest('/wp-json/addify/v1/locations', 'GET')
  }

  async getLocation(locationId: number) {
    return this.makeRequest(`/wp-json/addify/v1/locations/${locationId}`, 'GET')
  }

  // Stock endpoints
  async getStock(productId?: number, locationId?: number) {
    const params = new URLSearchParams()
    if (productId) params.append('product_id', productId.toString())
    if (locationId) params.append('location_id', locationId.toString())
    
    const endpoint = `/wp-json/addify/v1/stock${params.toString() ? '?' + params.toString() : ''}`
    return this.makeRequest(endpoint, 'GET')
  }

  // Test connection
  async testConnection() {
    return this.makeRequest('/wp-json/addify/v1/test', 'GET')
  }
}

export const addifyApi = new AddifyApiClient()