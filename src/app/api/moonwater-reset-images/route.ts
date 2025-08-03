import { NextRequest, NextResponse } from 'next/server'

const FLORA_API_URL = 'https://api.floradistro.com'
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5'
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678'

// Helper function to make WooCommerce API calls
async function makeWooCommerceRequest(endpoint: string, method: string = 'GET', data?: any) {
  const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64')
  
  const options: RequestInit = {
    method,
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
  }
  
  if (data && method !== 'GET') {
    options.body = JSON.stringify(data)
  }
  
  const response = await fetch(`${FLORA_API_URL}/wp-json/wc/v3/${endpoint}`, options)
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`WooCommerce API Error: ${response.status} ${response.statusText} - ${errorText}`)
  }
  
  return response.json()
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const log: string[] = []
  
  try {
    log.push('🧹 MOONWATER IMAGE RESET SCRIPT STARTED')
    log.push(`⏱️ Start time: ${new Date().toISOString()}`)
    log.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    // Fetch moonwater products
    log.push('📦 Fetching moonwater products...')
    const moonwaterProducts = await makeWooCommerceRequest('products?category=16&per_page=100&status=publish')
    log.push(`📦 Found ${moonwaterProducts.length} moonwater products`)
    
    const results = {
      total_products: moonwaterProducts.length,
      reset: 0,
      errors: 0
    }
    
    for (const product of moonwaterProducts) {
      try {
        log.push(`🧹 Resetting images for: "${product.name}"`)
        
        // Remove all images
        const updateData = {
          images: []
        }
        
        await makeWooCommerceRequest(`products/${product.id}`, 'PUT', updateData)
        
        log.push(`   ✅ Reset product ${product.id}`)
        results.reset++
        
      } catch (error) {
        log.push(`   ❌ Failed to reset product ${product.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        results.errors++
      }
    }
    
    const executionTime = Date.now() - startTime
    log.push('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    log.push('🎯 RESET SUMMARY:')
    log.push(`   Total Products: ${results.total_products}`)
    log.push(`   Successfully Reset: ${results.reset}`)
    log.push(`   Errors: ${results.errors}`)
    log.push(`   Execution Time: ${executionTime}ms`)
    log.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    return NextResponse.json({
      success: true,
      message: `Successfully reset ${results.reset} moonwater products`,
      results,
      log,
      execution_time: executionTime,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    const executionTime = Date.now() - startTime
    log.push(`\n❌ RESET FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        log,
        execution_time: executionTime
      },
      { status: 500 }
    )
  }
} 