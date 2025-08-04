import { WooCommerceTool } from '../types'

export const getProducts: WooCommerceTool = {
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
  },
  
  async execute(params: any, apiConfig: any) {
    const url = `${apiConfig.baseUrl}${this.endpoint}${this.buildUrl(params)}`
    
    try {
      const response = await fetch(url, {
        method: this.method,
        headers: {
          'Authorization': `Basic ${Buffer.from(`${apiConfig.consumerKey}:${apiConfig.consumerSecret}`).toString('base64')}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Flora-AI-Assistant/1.0'
        },
        signal: AbortSignal.timeout(60000) // Increased to 60 seconds
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API Error ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      
      // Validate that we got actual product data
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format: expected array of products')
      }
      
      return {
        success: true,
        data: data,
        count: data.length || 0,
        productIds: data.map((product: any) => product.id) // Extract IDs for bulk operations
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError') {
        throw new Error(`Request timeout after 60 seconds - API may be overloaded`)
      }
      throw error
    }
  }
}