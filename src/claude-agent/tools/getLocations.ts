import { WooCommerceTool } from '../types'

export const getLocations: WooCommerceTool = {
  name: 'get_locations',
  description: 'Get all locations/warehouses',
  endpoint: '/wp-json/wc/v3/addify_headless_inventory/locations',
  method: 'GET',
  buildUrl: () => '',
  
  async execute(params: any, apiConfig: any) {
    const url = `${apiConfig.baseUrl}${this.endpoint}`
    
    const response = await fetch(url, {
      method: this.method,
      headers: {
        'Authorization': `Basic ${Buffer.from(`${apiConfig.consumerKey}:${apiConfig.consumerSecret}`).toString('base64')}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Flora-AI-Assistant/1.0'
      },
      signal: AbortSignal.timeout(60000)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API Error ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    
    return {
      success: true,
      data: data,
      count: data.length || 0,
      locationIds: data.map((location: any) => location.id),
      locationNames: data.map((location: any) => location.name || `Location ${location.id}`)
    }
  }
}