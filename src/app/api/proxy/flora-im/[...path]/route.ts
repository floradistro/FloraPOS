import { NextRequest, NextResponse } from 'next/server';

const FLORA_API_BASE = 'https://api.floradistro.com/wp-json';
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/');
    const searchParams = request.nextUrl.searchParams;
    
    // DEVELOPMENT MODE - Add cache busting
    if (process.env.NODE_ENV === 'development') {
      searchParams.set('_t', Date.now().toString());
    }
    
    // Build the API URL
    const apiUrl = new URL(`${FLORA_API_BASE}/flora-im/v1/${path}`);
    
    // Add authentication
    apiUrl.searchParams.append('consumer_key', CONSUMER_KEY);
    apiUrl.searchParams.append('consumer_secret', CONSUMER_SECRET);
    
    // Forward any other query parameters
    searchParams.forEach((value, key) => {
      if (key !== 'consumer_key' && key !== 'consumer_secret') {
        apiUrl.searchParams.append(key, value);
      }
    });
    
    console.log('Proxying Flora-IM request to:', apiUrl.toString());
    
    // Make the request to the Flora API
    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // DEVELOPMENT MODE - Disable caching
      ...(process.env.NODE_ENV === 'development' && { cache: 'no-store' })
    });
    
    if (!response.ok) {
      console.error('Flora-IM API error:', response.status, response.statusText);
      return NextResponse.json(
        { error: `Flora-IM API error: ${response.status}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    // Return the data with proper CORS headers and no-cache for development
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        // DEVELOPMENT MODE - NO CACHING
        ...(process.env.NODE_ENV === 'development' && {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        }),
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
  const path = params.path.join('/');
  
  // Enable inventory modifications for checkout process
  console.log(`📦 Processing Flora-IM POST request: ${path}`);

  try {
    const body = await request.json();
    
    // Build the API URL
    const apiUrl = new URL(`${FLORA_API_BASE}/flora-im/v1/${path}`);
    
    // Add authentication
    apiUrl.searchParams.append('consumer_key', CONSUMER_KEY);
    apiUrl.searchParams.append('consumer_secret', CONSUMER_SECRET);
    
    console.log('Proxying Flora-IM POST request to:', apiUrl.toString());
    
    // Make the request to the Flora API
    const response = await fetch(apiUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      console.error('Flora-IM API error:', response.status, response.statusText);
      return NextResponse.json(
        { error: `Flora-IM API error: ${response.status}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    // Return the data with proper CORS headers and no-cache for development
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        // DEVELOPMENT MODE - NO CACHING
        ...(process.env.NODE_ENV === 'development' && {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        }),
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