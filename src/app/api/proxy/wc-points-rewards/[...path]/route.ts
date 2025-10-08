import { NextRequest, NextResponse } from 'next/server';
import { getApiEnvironmentFromRequest, getApiBaseUrl, getApiCredentials } from '@/lib/server-api-config';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const apiEnv = getApiEnvironmentFromRequest(request);
    const credentials = getApiCredentials(apiEnv);
    const CONSUMER_KEY = credentials.consumerKey;
    const CONSUMER_SECRET = credentials.consumerSecret;
    const REWARDS_API_BASE = `${getApiBaseUrl(apiEnv)}/wp-json/wc-points-rewards/v1`;
    const path = params.path.join('/');
    const searchParams = request.nextUrl.searchParams;
    
    // Build the API URL
    const apiUrl = new URL(`${REWARDS_API_BASE}/${path}`);
    
    // Add authentication
    apiUrl.searchParams.append('consumer_key', CONSUMER_KEY);
    apiUrl.searchParams.append('consumer_secret', CONSUMER_SECRET);
    
    // Forward any other query parameters
    searchParams.forEach((value, key) => {
      if (key !== 'consumer_key' && key !== 'consumer_secret') {
        apiUrl.searchParams.append(key, value);
      }
    });
    
    console.log('Proxying WC Points & Rewards request to:', apiUrl.toString());
    
    // Make the request to the Flora API
    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('WC Points & Rewards API error:', response.status, response.statusText, errorText);
      return NextResponse.json(
        { error: `WC Points & Rewards API error: ${response.status}`, details: errorText },
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
    console.error('Rewards proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy rewards request', details: error instanceof Error ? error.message : 'Unknown error' },
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
    const REWARDS_API_BASE = `${getApiBaseUrl(apiEnv)}/wp-json/wc-points-rewards/v1`;
    const path = params.path.join('/');
    const body = await request.json();
    
    // Build the API URL
    const apiUrl = new URL(`${REWARDS_API_BASE}/${path}`);
    
    // Add authentication
    apiUrl.searchParams.append('consumer_key', CONSUMER_KEY);
    apiUrl.searchParams.append('consumer_secret', CONSUMER_SECRET);
    
    console.log('Proxying WC Points & Rewards POST request to:', apiUrl.toString());
    
    // Make the request to the Flora API
    const response = await fetch(apiUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('WC Points & Rewards API error:', response.status, response.statusText, errorText);
      return NextResponse.json(
        { error: `WC Points & Rewards API error: ${response.status}`, details: errorText },
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
    console.error('Rewards proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy rewards request', details: error instanceof Error ? error.message : 'Unknown error' },
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
