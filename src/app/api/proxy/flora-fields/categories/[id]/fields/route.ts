import { NextRequest, NextResponse } from 'next/server';
import { getApiEnvironmentFromRequest, getApiBaseUrl, getApiCredentials } from '@/lib/server-api-config';

/**
 * Proxy for Flora Fields V3 Native API - Category Fields
 * GET /api/proxy/flora-fields/categories/{id}/fields
 * Proxies to: /wp-json/fd/v3/categories/{id}/fields
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = params.id;
    const apiEnv = getApiEnvironmentFromRequest(request);
    const baseUrl = getApiBaseUrl(apiEnv);
    const credentials = getApiCredentials(apiEnv);

    console.log(`🔄 [${apiEnv.toUpperCase()}] Proxying Flora Fields V3 request: /fd/v3/categories/${categoryId}/fields`);

    const url = `${baseUrl}/wp-json/fd/v3/categories/${categoryId}/fields?consumer_key=${credentials.consumerKey}&consumer_secret=${credentials.consumerSecret}&_t=${Date.now()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'POSV1/1.0'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Flora Fields V3 API error: ${response.status}`, errorText);
      return NextResponse.json(
        { 
          error: 'Flora Fields V3 API error',
          details: errorText,
          status: response.status
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`✅ [${apiEnv.toUpperCase()}] Flora Fields V3 response: ${data.field_count || 0} fields for category ${categoryId}`);

    return NextResponse.json(data);

  } catch (error) {
    console.error('Flora Fields V3 proxy error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch Flora Fields',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

