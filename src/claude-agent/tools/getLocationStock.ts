import { WooCommerceTool } from '../types'

export const getLocationStock: WooCommerceTool = {
  name: 'get_location_stock',
  description: 'Get stock for a specific location',
  endpoint: '/wp-json/wc/v3/addify_headless_inventory/stock',
  method: 'GET',
  buildUrl: (params) => {
    const queryParams = new URLSearchParams()
    if (params.location_id) queryParams.append('location_id', params.location_id)
    if (params.per_page) queryParams.append('per_page', params.per_page)
    if (params.page) queryParams.append('page', params.page)
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