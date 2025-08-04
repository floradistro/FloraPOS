// Products API Route Handler
import { NextRequest, NextResponse } from 'next/server'
import { executeTool } from '../../../tools'
import { ApiConfig } from '../../../types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const apiConfig: ApiConfig = {
      baseUrl: process.env.NEXT_PUBLIC_WOO_API_URL || 'https://api.floradistro.com',
      consumerKey: process.env.WOO_CONSUMER_KEY || '',
      consumerSecret: process.env.WOO_CONSUMER_SECRET || ''
    }

    const params = {
      per_page: searchParams.get('per_page') || '50',
      page: searchParams.get('page') || '1',
      search: searchParams.get('search') || undefined,
      category: searchParams.get('category') || undefined,
      status: searchParams.get('status') || undefined,
      stock_status: searchParams.get('stock_status') || undefined
    }

    const result = await executeTool('get_products', params, apiConfig)
    
    return NextResponse.json({
      success: true,
      data: result.data,
      count: result.count,
      productIds: result.productIds
    })

  } catch (error) {
    console.error('Products API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const apiConfig: ApiConfig = {
      baseUrl: process.env.NEXT_PUBLIC_WOO_API_URL || 'https://api.floradistro.com',
      consumerKey: process.env.WOO_CONSUMER_KEY || '',
      consumerSecret: process.env.WOO_CONSUMER_SECRET || ''
    }

    // Create new product (if needed in the future)
    return NextResponse.json({
      success: false,
      error: 'Product creation not implemented yet'
    }, { status: 501 })

  } catch (error) {
    console.error('Products POST error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}