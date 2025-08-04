import { WooCommerceTool } from '../types'

export const updateProduct: WooCommerceTool = {
  name: 'update_product',
  description: 'Update product details',
  endpoint: '/wp-json/wc/v3/products',
  method: 'PUT',
  buildUrl: (params) => `/${params.product_id}`,
  buildBody: (params) => {
    const { product_id, ...data } = params
    return data
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
      count: 1
    }
  }
}