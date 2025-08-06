import { NextRequest, NextResponse } from 'next/server'

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    },
  })
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const storeId = searchParams.get('store_id')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const per_page = searchParams.get('per_page')
    const stock_status = searchParams.get('stock_status')
    
    // Validate environment variables with fallback to working test credentials
    const apiBase = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://api.floradistro.com'
    const consumerKey = process.env.NEXT_PUBLIC_WC_CONSUMER_KEY || 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5'
    const consumerSecret = process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET || 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678'
    
    console.log('🔑 Using API credentials:', {
      apiBase,
      consumerKey: consumerKey.substring(0, 10) + '...',
      consumerSecret: consumerSecret.substring(0, 10) + '...'
    })
    
    // Build the Flora API URL
    const floraUrl = new URL(`${apiBase}/wp-json/wc/v3/products`)
    if (storeId) floraUrl.searchParams.set('store_id', storeId)
    if (category) floraUrl.searchParams.set('category', category)
    if (search) floraUrl.searchParams.set('search', search)
    if (per_page) floraUrl.searchParams.set('per_page', per_page)
    if (stock_status) floraUrl.searchParams.set('stock_status', stock_status)
    
    // Add auth
    floraUrl.searchParams.set('consumer_key', consumerKey)
    floraUrl.searchParams.set('consumer_secret', consumerSecret)
    
    console.log('🔄 Proxying request to:', floraUrl.toString())
    
    // Make the request from server-side (no CORS issues)
    const response = await fetch(floraUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Flora-POS/1.0',
      },
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Flora API error ${response.status}:`, errorText)
      throw new Error(`Flora API responded with ${response.status}: ${errorText}`)
    }
    
    const data = await response.json()
    
    // Add CORS headers for the response
    const corsResponse = NextResponse.json({
      success: true,
      products: data,
      total: data.length,
      hasMore: false
    })
    
    // Set CORS headers
    corsResponse.headers.set('Access-Control-Allow-Origin', '*')
    corsResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    corsResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    return corsResponse
    
  } catch (error) {
    console.error('❌ Proxy API failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}