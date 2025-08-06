import { NextRequest, NextResponse } from 'next/server'
import { floraAPI } from '../../../lib/woocommerce'

export async function GET(request: NextRequest) {
  try {
    // Force rebuild - v2
    const searchParams = request.nextUrl.searchParams
    const storeId = searchParams.get('store_id')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const per_page = searchParams.get('per_page')
    const stock_status = searchParams.get('stock_status')
    
    console.log('📦 Fetching products with params:', {
      storeId,
      category,
      search,
      per_page,
      stock_status
    })
    
    // Try comprehensive endpoint first
    let products
    let isComprehensive = false
    
    try {
      console.log('🚀 Attempting comprehensive endpoint...')
      products = await floraAPI.getProductsComprehensive({
        storeId: storeId || undefined,
        category: category || undefined,
        search: search || undefined,
        per_page: per_page ? parseInt(per_page) : 50,
        stock_status: stock_status as any || undefined
      })
      isComprehensive = true
      console.log(`✅ Comprehensive endpoint returned ${products.products?.length || 0} products`)
    } catch (error) {
      console.log('⚠️ Comprehensive endpoint failed, using standard method:', error)
      products = await floraAPI.getProducts({
        storeId: storeId || undefined,
        category: category ? parseInt(category) : undefined,
        search: search || undefined,
        per_page: per_page ? parseInt(per_page) : 50,
        stock_status: stock_status || undefined
      })
      console.log(`✅ Standard endpoint returned ${products.products?.length || 0} products`)
    }
    
    // Extract products array from response
    const productsArray = products.products || products
    
    // Return products with metadata
    return NextResponse.json({
      success: true,
      method: isComprehensive ? 'comprehensive' : 'standard',
      count: productsArray.length,
      products: productsArray.map(product => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        price: product.price,
        regular_price: product.regular_price,
        sale_price: product.sale_price,
        stock_quantity: product.stock_quantity,
        in_stock: product.in_stock,
        categories: product.categories,
        images: product.images,
        // Location-specific data
        location_stock: product.location_stock,
        location_name: product.location_name,
        all_location_stock: product.all_location_stock,
        // ACF data
        acf: product.acf,
        acf_fields: product.acf_fields,
        // Inventory data
        inventory: product.inventory,
        multi_inventory_enabled: product.multi_inventory_enabled
      }))
    })
    
  } catch (error) {
    console.error('❌ Products API failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}