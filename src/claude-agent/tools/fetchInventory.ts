import { WooCommerceTool } from '../types'

export const fetchInventory: WooCommerceTool = {
  name: 'bulk_get_inventory',
  description: 'Get inventory data for multiple products efficiently using bulk API - much faster than individual calls',
  endpoint: '/wp-json/wc/v3/addify_headless_inventory/inventory/bulk',
  method: 'POST',
  buildUrl: () => '',
  buildBody: (params) => ({
    product_ids: params.product_ids,
    location_id: params.location_id || null
  }),
  
  async execute(params: any, apiConfig: any) {
    const url = `${apiConfig.baseUrl}${this.endpoint}`
    
    const response = await fetch(url, {
      method: this.method,
      headers: {
        'Authorization': `Basic ${Buffer.from(`${apiConfig.consumerKey}:${apiConfig.consumerSecret}`).toString('base64')}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Flora-AI-Assistant/1.0'
      },
      body: JSON.stringify(this.buildBody!(params)),
      signal: AbortSignal.timeout(30000)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API Error ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    
    // Calculate metrics for bulk operation
    const productCount = Object.keys(data).length
    const totalInventoryItems = Object.values(data).reduce((sum: number, inventories: any) => 
      sum + (Array.isArray(inventories) ? inventories.length : 0), 0)
    
    return {
      success: true,
      data: data,
      count: productCount,
      metrics: {
        products: productCount,
        inventoryItems: totalInventoryItems,
        locations: params.location_id ? 1 : 'all'
      }
    }
  }
}