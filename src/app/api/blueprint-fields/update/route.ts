import { NextRequest, NextResponse } from 'next/server';
import { getApiEnvironmentFromRequest, getApiBaseUrl, getApiCredentials } from '@/lib/server-api-config';

export async function POST(request: NextRequest) {
  try {
    const apiEnv = getApiEnvironmentFromRequest(request);
    const FLORA_API_BASE = getApiBaseUrl(apiEnv);
    const credentials = getApiCredentials(apiEnv);
    const CONSUMER_KEY = credentials.consumerKey;
    const CONSUMER_SECRET = credentials.consumerSecret;

    const { productId, fields } = await request.json();

    if (!productId || !fields || !Array.isArray(fields)) {
      return NextResponse.json({
        success: false,
        error: 'productId and fields array are required'
      }, { status: 400 });
    }

    console.log(`🔄 API: Updating fields for product ${productId}:`, fields);

    // Convert fields array to V3 native fields object format
    const fieldsObject = fields.reduce((acc, field) => {
      acc[field.field_name] = field.field_value;
      return acc;
    }, {} as Record<string, any>);

    console.log(`🔄 Converting to V3 native fields format:`, fieldsObject);

    // Update product using V3 Native Flora Fields API
    const response = await fetch(
      `${FLORA_API_BASE}/wp-json/fd/v3/products/${productId}/fields?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: fieldsObject
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to update product fields: ${response.status}`, errorText);
      return NextResponse.json({
        success: false,
        error: `Failed to update product fields: ${response.statusText}`,
        details: errorText
      }, { status: response.status });
    }

    const result = await response.json();
    console.log(`✅ API: Successfully updated product fields for product ${productId}:`, result);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Product fields update error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update product fields',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
