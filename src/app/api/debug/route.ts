import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Collect environment information
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      vercel: {
        region: process.env.VERCEL_REGION,
        url: process.env.VERCEL_URL,
      },
      headers: {
        host: request.headers.get('host'),
        'x-forwarded-proto': request.headers.get('x-forwarded-proto'),
        'user-agent': request.headers.get('user-agent'),
      },
      envVars: {
        NEXT_PUBLIC_WORDPRESS_URL: process.env.NEXT_PUBLIC_WORDPRESS_URL || 'NOT_SET',
        NEXT_PUBLIC_WC_CONSUMER_KEY: process.env.NEXT_PUBLIC_WC_CONSUMER_KEY ? 'SET' : 'NOT_SET',
        NEXT_PUBLIC_WC_CONSUMER_SECRET: process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET ? 'SET' : 'NOT_SET',
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT_SET',
        JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT_SET',
      },
      api: {
        baseUrl: process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://api.floradistro.com',
        endpoints: {
          products: '/wp-json/wc/v3/products',
          auth: '/wp-json/addify-mli/v1/auth/login',
          stores: '/wp-json/addify-mli/v1/stores/public',
        }
      }
    }

    // Test API connectivity
    let apiTest = null
    try {
      const testUrl = `${debugInfo.api.baseUrl}/wp-json/wc/v3/products`
      const testParams = new URLSearchParams({
        consumer_key: process.env.NEXT_PUBLIC_WC_CONSUMER_KEY || '',
        consumer_secret: process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET || '',
        per_page: '1'
      })
      
      const testResponse = await fetch(`${testUrl}?${testParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Flora-POS-Debug/1.0',
        },
      })
      
      if (testResponse.ok) {
        const testData = await testResponse.json()
        apiTest = {
          status: testResponse.status,
          ok: testResponse.ok,
          url: testUrl,
          headers: Object.fromEntries(testResponse.headers.entries()),
          dataReceived: Array.isArray(testData) ? testData.length : 'Not an array'
        }
      } else {
        const errorText = await testResponse.text()
        apiTest = {
          status: testResponse.status,
          ok: testResponse.ok,
          url: testUrl,
          headers: Object.fromEntries(testResponse.headers.entries()),
          error: errorText
        }
      }
    } catch (error) {
      apiTest = {
        error: error instanceof Error ? error.message : 'Unknown error',
        type: 'fetch_error'
      }
    }

    return NextResponse.json({
      success: true,
      debug: debugInfo,
      apiConnectivity: apiTest
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    })
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}