import { NextRequest, NextResponse } from 'next/server';
import { InventoryVisibilityService } from '@/services/inventory-visibility-service';
import { getApiEnvironmentFromRequest, getApiBaseUrl as getBaseUrl } from '@/lib/server-api-config';

const CONSUMER_KEY = process.env.NEXT_PUBLIC_WC_CONSUMER_KEY!;
const CONSUMER_SECRET = process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET!;

function getApiBaseUrl(request: NextRequest): string {
  const apiEnv = getApiEnvironmentFromRequest(request);
  return `${getBaseUrl(apiEnv)}/wp-json`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const FLORA_API_BASE = getApiBaseUrl(request);
    const path = params.path.join('/');
    const searchParams = request.nextUrl.searchParams;
    
    // Check if this is an inventory-related request that needs fresh data
    const isInventoryRequest = path.includes('inventory') || path.includes('products');
    
    // ALWAYS ADD CACHE BUSTING - NO CACHING AT ALL
    searchParams.set('_t', Date.now().toString());
    searchParams.set('_nocache', 'true');
    
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
      // NO CACHING AT ALL
      cache: 'no-store'
    });
    
    if (!response.ok) {
      console.error('Flora-IM API error:', response.status, response.statusText);
      return NextResponse.json(
        { error: `Flora-IM API error: ${response.status}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    // DISABLED: Stock filtering - show all products with accurate inventory
    // This prevents hiding products that have been sold out
    // Frontend will show "0" stock instead of hiding the product
    if (path === 'products' && data.success && data.data) {
      const locationId = searchParams.get('location_id');
      if (locationId) {
        console.log(`📍 Returning all ${data.data.length} products for location ${locationId} with real-time inventory`);
      }
    }
    
    // Return the data with proper CORS headers and no-cache for development
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        // NO CACHING AT ALL
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
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
  const FLORA_API_BASE = getApiBaseUrl(request);
  const path = params.path.join('/');
  const searchParams = request.nextUrl.searchParams;
  
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
      cache: 'no-store' // NO CACHING
    });
    
    if (!response.ok) {
      console.error('Flora-IM API error:', response.status, response.statusText);
      return NextResponse.json(
        { error: `Flora-IM API error: ${response.status}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    // DISABLED: Stock filtering - show all products with accurate inventory
    // This prevents hiding products that have been sold out
    // Frontend will show "0" stock instead of hiding the product
    if (path === 'products' && data.success && data.data) {
      const locationId = searchParams.get('location_id');
      if (locationId) {
        console.log(`📍 Returning all ${data.data.length} products for location ${locationId} with real-time inventory`);
      }
    }
    
    // Return the data with proper CORS headers and no-cache for development
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        // NO CACHING AT ALL
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
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
  const FLORA_API_BASE = getApiBaseUrl(request);
  const path = params.path.join('/');
  
  console.log(`📦 Processing Flora-IM PUT request: ${path}`);

  try {
    const body = await request.json();
    
    // Build the API URL
    const apiUrl = new URL(`${FLORA_API_BASE}/flora-im/v1/${path}`);
    
    // Add authentication
    apiUrl.searchParams.append('consumer_key', CONSUMER_KEY);
    apiUrl.searchParams.append('consumer_secret', CONSUMER_SECRET);
    
    console.log('Proxying Flora-IM PUT request to:', apiUrl.toString());
    
    // Make the request to the Flora API
    const response = await fetch(apiUrl.toString(), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store' // NO CACHING
    });
    
    if (!response.ok) {
      console.error('Flora-IM API error:', response.status, response.statusText);
      return NextResponse.json(
        { error: `Flora-IM API error: ${response.status}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    // Return the data with proper CORS headers and no caching
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        // NO CACHING AT ALL
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
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