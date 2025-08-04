// Tool Registry - Centralized tool management
import { wooTools } from '@/lib/woocommerce-tools'

// Simple tool execution using the same tools as the working chat route
export async function executeTool(
  toolName: string, 
  params: any, 
  apiConfig: any,
  retryCount = 0
): Promise<any> {
  const tool = wooTools[toolName]
  if (!tool) {
    throw new Error(`Unknown tool: ${toolName}`)
  }

  const auth = Buffer.from(`${apiConfig.consumerKey}:${apiConfig.consumerSecret}`).toString('base64')
  const headers = {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/json',
    'User-Agent': 'Flora-AI-Assistant/1.0'
  }

  try {
    // Build the full URL
    const urlSuffix = tool.buildUrl(params)
    const url = `${apiConfig.baseUrl}${tool.endpoint}${urlSuffix}`
    
    // Build request options with shorter timeout for better responsiveness
    const options: RequestInit = {
      method: tool.method,
      headers,
      signal: AbortSignal.timeout(30000) // 30 second timeout
    }

    // Add body for POST/PUT requests
    if (tool.buildBody && (tool.method === 'POST' || tool.method === 'PUT')) {
      options.body = JSON.stringify(tool.buildBody(params))
    }

    console.log(`🔄 Claude Agent executing ${toolName}: ${tool.method} ${url}`)
    console.log(`📋 Claude Agent params:`, JSON.stringify(params, null, 2))
    
    const response = await fetch(url, options)
    const responseText = await response.text()

    if (!response.ok) {
      console.error(`❌ API Error ${response.status}: ${responseText}`)
      
      // Parse error details if possible
      let errorDetails = responseText
      try {
        const errorJson = JSON.parse(responseText)
        errorDetails = errorJson.message || errorJson.error || responseText
      } catch (e) {
        // Keep original text if not JSON
      }

      return {
        error: true,
        status: response.status,
        message: `${response.status} ${response.statusText}`,
        details: errorDetails
      }
    }

    // Parse successful response
    const data = JSON.parse(responseText)
    const itemCount = Array.isArray(data) ? data.length : (data ? 1 : 0)
    console.log(`✅ Claude Agent Success: Received ${itemCount} item(s)`)
    
    // Format response with metadata for Claude agent
    const result: any = {
      success: true,
      data,
      count: itemCount
    }

    // Add specific metadata for different tool types
    if (toolName === 'get_products' && Array.isArray(data)) {
      result.productIds = data.map(p => p.id)
      result.locationNames = data.map(p => p.name)
    } else if (toolName === 'get_locations' && Array.isArray(data)) {
      result.locationNames = data.map(loc => loc.name || `Location ${loc.id}`)
    } else if (toolName === 'bulk_get_inventory' && data) {
      result.metrics = {
        products: Object.keys(data).length,
        inventoryItems: Object.values(data).reduce((sum: number, inventories: any) => 
          sum + (Array.isArray(inventories) ? inventories.length : 0), 0),
        locations: params.location_id ? 1 : 'all'
      }
    } else if (toolName === 'bulk_update_stock' && data) {
      result.metrics = {
        successfulUpdates: data.successful_updates || 0,
        totalUpdates: data.total_updates || 0,
        errors: data.errors?.length || 0
      }
    }
    
    return result

  } catch (error) {
    console.error(`Claude Agent tool execution error for ${toolName}:`, error)
    
    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        // Retry on timeout with reduced parameters
        if (retryCount < 1 && toolName === 'get_products') {
          console.log(`⏱️ Timeout occurred, retrying with fewer items...`)
          const reducedParams = { ...params, per_page: 10 }
          return executeTool(toolName, reducedParams, apiConfig, retryCount + 1)
        }
        
        return {
          error: true,
          message: 'Request timeout',
          details: 'The API is responding slowly. Try requesting fewer items or narrowing your search.'
        }
      }
      
      return {
        error: true,
        message: 'Request failed',
        details: error.message
      }
    }
    
    return {
      error: true,
      message: 'Unknown error occurred'
    }
  }
}

// executeTool is already exported above as the main function