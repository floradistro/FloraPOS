import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const storeId = searchParams.get('store_id')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const per_page = searchParams.get('per_page')
    const stock_status = searchParams.get('stock_status')
    
    // Build the Flora API URL
    const floraUrl = new URL('https://api.floradistro.com/wp-json/wc/v3/products')
    if (storeId) floraUrl.searchParams.set('store_id', storeId)
    if (category) floraUrl.searchParams.set('category', category)
    if (search) floraUrl.searchParams.set('search', search)
    if (per_page) floraUrl.searchParams.set('per_page', per_page)
    if (stock_status) floraUrl.searchParams.set('stock_status', stock_status)
    
    // Add auth
    floraUrl.searchParams.set('consumer_key', process.env.NEXT_PUBLIC_WC_CONSUMER_KEY || '')
    floraUrl.searchParams.set('consumer_secret', process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET || '')
    
    console.log('🔄 Proxying request to:', floraUrl.toString())
    
    // Make the request from server-side (no CORS issues)
    const response = await fetch(floraUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    if (!response.ok) {
      throw new Error(`Flora API responded with ${response.status}`)
    }
    
    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      products: data,
      total: data.length,
      hasMore: false
    })
    
  } catch (error) {
    console.error('❌ Proxy API failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}