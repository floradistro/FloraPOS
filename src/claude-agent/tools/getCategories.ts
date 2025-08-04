import { WooCommerceTool } from '../types'

export const getCategories: WooCommerceTool = {
  name: 'get_categories',
  description: 'Get product categories',
  endpoint: '/wp-json/wc/v3/products/categories',
  method: 'GET',
  buildUrl: (params) => {
    const queryParams = new URLSearchParams()
    if (params.per_page) queryParams.append('per_page', params.per_page)
    if (params.page) queryParams.append('page', params.page)
    if (params.parent) queryParams.append('parent', params.parent)
    if (params.orderby) queryParams.append('orderby', params.orderby)
    if (params.order) queryParams.append('order', params.order)
    return queryParams.toString() ? `?${queryParams}` : ''
  },
  
  async execute(params: any, apiConfig: any) {
    const url = `${apiConfig.baseUrl}${this.endpoint}${this.buildUrl(params)}`
    
    const response = await fetch(url, {
      method: this.method,
      headers: {
        'Authorization': `Basic ${Buffer.from(`${apiConfig.consumerKey}:${apiConfig.consumerSecret}`).toString('base64')}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Flora-AI-Assistant/1.0'
      },
      signal: AbortSignal.timeout(30000)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API Error ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    
    return {
      success: true,
      data: data,
      count: data.length || 0
    }
  }
}