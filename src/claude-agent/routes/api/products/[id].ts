// Individual Product API Route Handler
import { NextRequest, NextResponse } from 'next/server'
import { executeTool } from '../../../tools'
import { ApiConfig } from '../../../types'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const apiConfig: ApiConfig = {
      baseUrl: process.env.NEXT_PUBLIC_WOO_API_URL || 'https://api.floradistro.com',
      consumerKey: process.env.WOO_CONSUMER_KEY || '',
      consumerSecret: process.env.WOO_CONSUMER_SECRET || ''
    }

    const result = await executeTool('get_product', { product_id: params.id }, apiConfig)
    
    return NextResponse.json({
      success: true,
      data: result.data
    })

  } catch (error) {
    console.error(`Product ${params.id} GET error:`, error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    const apiConfig: ApiConfig = {
      baseUrl: process.env.NEXT_PUBLIC_WOO_API_URL || 'https://api.floradistro.com',
      consumerKey: process.env.WOO_CONSUMER_KEY || '',
      consumerSecret: process.env.WOO_CONSUMER_SECRET || ''
    }

    const updateParams = {
      product_id: params.id,
      ...body
    }

    const result = await executeTool('update_product', updateParams, apiConfig)
    
    return NextResponse.json({
      success: true,
      data: result.data
    })

  } catch (error) {
    console.error(`Product ${params.id} PUT error:`, error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}