import { NextRequest, NextResponse } from 'next/server';
import { getApiEnvironmentFromRequest, getApiUrl, getApiCredentials } from '@/lib/server-api-config';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/');
    const searchParams = request.nextUrl.searchParams;
    
    // Get API environment from request
    const apiEnv = getApiEnvironmentFromRequest(request);
    const credentials = getApiCredentials();
    
    // Build the API URL using dynamic configuration for WordPress API
    const baseUrl = getApiUrl(`/wp/v2/${path}`, apiEnv);
    const apiUrl = new URL(baseUrl);
    
    // Add authentication
    apiUrl.searchParams.append('consumer_key', credentials.consumerKey);
    apiUrl.searchParams.append('consumer_secret', credentials.consumerSecret);
    
    // Forward any other query parameters
    searchParams.forEach((value, key) => {
      if (key !== 'consumer_key' && key !== 'consumer_secret') {
        apiUrl.searchParams.append(key, value);
      }
    });
    
    console.log(`[${'PROD'}] Proxying WordPress request to:`, apiUrl.toString());
    
    // Get Authorization header from request if present
    const authHeader = request.headers.get('Authorization');
    
    // Make the request to WordPress API
    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader }),
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('WordPress API error:', response.status, response.statusText, errorText);
      return NextResponse.json(
        { error: `WordPress API error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    // Return the data
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('WordPress proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy WordPress request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/');
    const body = await request.json();
    
    // Get API environment from request
    const apiEnv = getApiEnvironmentFromRequest(request);
    const credentials = getApiCredentials();
    
    // Build the API URL using dynamic configuration
    const baseUrl = getApiUrl(`/wp/v2/${path}`, apiEnv);
    const apiUrl = new URL(baseUrl);
    
    // Add authentication
    apiUrl.searchParams.append('consumer_key', credentials.consumerKey);
    apiUrl.searchParams.append('consumer_secret', credentials.consumerSecret);
    
    console.log(`[${'PROD'}] Proxying WordPress POST request to:`, apiUrl.toString());
    
    // Get Authorization header from request if present
    const authHeader = request.headers.get('Authorization');
    
    // Make the request to WordPress API
    const response = await fetch(apiUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader }),
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('WordPress API error:', response.status, response.statusText, errorText);
      return NextResponse.json(
        { error: `WordPress API error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    // Return the data
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('WordPress proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy WordPress request', details: error instanceof Error ? error.message : 'Unknown error' },
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




