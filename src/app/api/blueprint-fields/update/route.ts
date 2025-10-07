import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { productId, fields } = await request.json();

    if (!productId || !fields || !Array.isArray(fields)) {
      return NextResponse.json({
        success: false,
        error: 'productId and fields array are required'
      }, { status: 400 });
    }

    console.log(`🔄 API: Updating blueprint fields for product ${productId}:`, fields);

    const FLORA_API_BASE = 'https://api.floradistro.com';
    const CONSUMER_KEY = process.env.NEXT_PUBLIC_WC_CONSUMER_KEY!;
    const CONSUMER_SECRET = process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET!;

    // Convert fields to magic2 plugin meta_data format
    const metaData = fields.map(field => {
      let metaKey;
      switch (field.field_name) {
        case 'supplier':
          metaKey = '_supplier'; // magic2 supplier meta key
          break;
        case 'cost':
          metaKey = '_cost_price'; // magic2 cost meta key
          break;
        default:
          metaKey = `_${field.field_name}`; // Standard underscore prefix
      }
      
      return {
        key: metaKey,
        value: field.field_value
      };
    });

    console.log(`🔄 Converting to WooCommerce meta_data format:`, metaData);

    // Update product using WooCommerce API with meta_data
    const response = await fetch(
      `${FLORA_API_BASE}/wp-json/wc/v3/products/${productId}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meta_data: metaData
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to update product meta_data: ${response.status}`, errorText);
      return NextResponse.json({
        success: false,
        error: `Failed to update product meta_data: ${response.statusText}`,
        details: errorText
      }, { status: response.status });
    }

    const result = await response.json();
    console.log(`✅ API: Successfully updated product meta_data for product ${productId}:`, result);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Product meta_data update error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update product meta_data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
