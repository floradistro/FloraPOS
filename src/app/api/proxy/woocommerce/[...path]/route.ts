import { NextRequest, NextResponse } from 'next/server';
import { getApiEnvironmentFromRequest, getApiBaseUrl as getBaseUrl, getApiCredentials } from '@/lib/server-api-config';

function getApiBaseUrl(request: NextRequest): string {
  const apiEnv = getApiEnvironmentFromRequest(request);
  return `${getBaseUrl(apiEnv)}/wp-json`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const apiEnv = getApiEnvironmentFromRequest(request);
    const credentials = getApiCredentials(apiEnv);
    const CONSUMER_KEY = credentials.consumerKey;
    const CONSUMER_SECRET = credentials.consumerSecret;
    
    if (!CONSUMER_KEY || !CONSUMER_SECRET) {
      return NextResponse.json(
        { error: 'Missing WooCommerce credentials in environment variables' },
        { status: 500 }
      );
    }
    
    const FLORA_API_BASE = getApiBaseUrl(request);
    const path = params.path.join('/');
    const searchParams = request.nextUrl.searchParams;
    
    // Build the API URL
    const apiUrl = new URL(`${FLORA_API_BASE}/wc/v3/${path}`);
    
    // Add authentication
    apiUrl.searchParams.append('consumer_key', CONSUMER_KEY);
    apiUrl.searchParams.append('consumer_secret', CONSUMER_SECRET);
    
    // Forward any other query parameters
    searchParams.forEach((value, key) => {
      if (key !== 'consumer_key' && key !== 'consumer_secret') {
        apiUrl.searchParams.append(key, value);
      }
    });
    
    console.log('Proxying WooCommerce request to:', apiUrl.toString());
    
    // Make the request to the Flora API
    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('WooCommerce API error:', response.status, response.statusText, errorText);
      console.error('Request URL:', apiUrl.toString());
      return NextResponse.json(
        { error: `WooCommerce API error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    // Return the data with proper CORS headers
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const apiEnv = getApiEnvironmentFromRequest(request);
    const credentials = getApiCredentials(apiEnv);
    const CONSUMER_KEY = credentials.consumerKey;
    const CONSUMER_SECRET = credentials.consumerSecret;
    
    if (!CONSUMER_KEY || !CONSUMER_SECRET) {
      return NextResponse.json(
        { error: 'Missing WooCommerce credentials in environment variables' },
        { status: 500 }
      );
    }
    
    const FLORA_API_BASE = getApiBaseUrl(request);
    const path = params.path.join('/');
    const body = await request.json();
    
    // BLOCK INVENTORY/STOCK MODIFICATIONS via WooCommerce
    if (path.includes('products') && (body.stock_quantity !== undefined || body.manage_stock !== undefined)) {
      console.log(`🚫 BLOCKED: Product stock modification attempt via WooCommerce proxy: ${path}`);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Product stock modifications are disabled in POSV1',
          message: 'All inventory/stock update operations have been blocked'
        },
        { status: 403 }
      );
    }
    
    // Build the API URL
    const apiUrl = new URL(`${FLORA_API_BASE}/wc/v3/${path}`);
    
    // Add authentication
    apiUrl.searchParams.append('consumer_key', CONSUMER_KEY);
    apiUrl.searchParams.append('consumer_secret', CONSUMER_SECRET);
    
    console.log('Proxying WooCommerce POST request to:', apiUrl.toString());
    
    // Make the request to the Flora API
    const response = await fetch(apiUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('WooCommerce API error:', response.status, response.statusText, errorText);
      console.error('Request URL:', apiUrl.toString());
      return NextResponse.json(
        { error: `WooCommerce API error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    // Return the data with proper CORS headers
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const apiEnv = getApiEnvironmentFromRequest(request);
    const credentials = getApiCredentials(apiEnv);
    const CONSUMER_KEY = credentials.consumerKey;
    const CONSUMER_SECRET = credentials.consumerSecret;
    
    if (!CONSUMER_KEY || !CONSUMER_SECRET) {
      return NextResponse.json(
        { error: 'Missing WooCommerce credentials in environment variables' },
        { status: 500 }
      );
    }
    
    const FLORA_API_BASE = getApiBaseUrl(request);
    const path = params.path.join('/');
    const body = await request.json();
    
    // Allow PUT requests for stock updates (inventory adjustments)
    console.log(`📦 Processing WooCommerce PUT request for stock update: ${path}`);
    
    // Build the API URL
    const apiUrl = new URL(`${FLORA_API_BASE}/wc/v3/${path}`);
    
    // Add authentication
    apiUrl.searchParams.append('consumer_key', CONSUMER_KEY);
    apiUrl.searchParams.append('consumer_secret', CONSUMER_SECRET);
    
    console.log('Proxying WooCommerce PUT request to:', apiUrl.toString());
    if (body.stock_quantity !== undefined) {
      console.log(`Updating stock to: ${body.stock_quantity}`);
    }
    
    // Make the request to the Flora API
    const response = await fetch(apiUrl.toString(), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('WooCommerce API error:', response.status, response.statusText, errorText);
      console.error('Request URL:', apiUrl.toString());
      return NextResponse.json(
        { error: `WooCommerce API error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log(`✅ Stock update successful for ${path}`);
    
    // Return the data with proper CORS headers
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
