import { WooCommerceTool } from '../types'

export const bulkUpdateStock: WooCommerceTool = {
  name: 'bulk_update_stock',
  description: 'Update stock quantities for multiple inventory items efficiently - supports decimal quantities',
  endpoint: '/wp-json/wc/v3/addify_headless_inventory/stock/bulk-update',
  method: 'POST',
  buildUrl: () => '',
  buildBody: (params) => ({
    updates: params.updates
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
    
    return {
      success: true,
      data: data,
      count: data.total_updates || 0,
      metrics: {
        totalUpdates: data.total_updates || 0,
        successfulUpdates: data.successful_updates || 0,
        failedUpdates: data.failed_updates || 0,
        errors: data.errors?.length || 0
      }
    }
  }
}