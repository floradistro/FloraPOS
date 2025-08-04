import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test importing the tools
    const { executeTool } = await import('@/claude-agent/tools')
    return NextResponse.json({ 
      message: 'Test endpoint is working',
      toolImported: typeof executeTool === 'function'
    })
  } catch (error) {
    return NextResponse.json({ 
      message: 'Import failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🧪 Test endpoint received:', body)
    
    // Test calling executeTool
    const { executeTool } = await import('@/claude-agent/tools')
    
    const apiConfig = {
      baseUrl: process.env.NEXT_PUBLIC_WOO_API_URL || 'https://api.floradistro.com',
      consumerKey: process.env.WOO_CONSUMER_KEY || '',
      consumerSecret: process.env.WOO_CONSUMER_SECRET || ''
    }

    console.log('🧪 About to call executeTool with get_products...')
    
    // Test with get_products with small page size
    const result = await executeTool('get_products', { per_page: 5 }, apiConfig)
    
    console.log('🧪 executeTool completed:', result)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Tool execution successful',
      result
    })

  } catch (error) {
    console.error('Test endpoint error:', error)
    return NextResponse.json(
      { 
        error: 'Test failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}