import { NextRequest, NextResponse } from 'next/server';
import { getApiEnvironmentFromRequest, getApiBaseUrl, getApiCredentials } from '@/lib/server-api-config';

/**
 * Debug endpoint to check what field data exists for a product
 * GET /api/debug/check-fields?product_id=XXX
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id') || '41212'; // Default to a known product
    
    const apiEnv = getApiEnvironmentFromRequest(request);
    const baseUrl = getApiBaseUrl(apiEnv);
    const credentials = getApiCredentials(apiEnv);

    console.log(`🔍 [DEBUG] Checking field data for product ${productId}`);

    // Get product from WooCommerce API to see ALL meta_data
    const url = `${baseUrl}/wp-json/wc/v3/products/${productId}?consumer_key=${credentials.consumerKey}&consumer_secret=${credentials.consumerSecret}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'POSV1/1.0'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch product: ${response.status}`);
    }

    const product = await response.json();

    // Extract ALL meta_data
    const allMeta = product.meta_data || [];
    
    // Filter for potential field data
    const fieldMeta = allMeta.filter((m: any) => 
      m.key && (
        m.key.startsWith('_field_') ||
        m.key.startsWith('_blueprint_') ||
        m.key.startsWith('blueprint_') ||
        m.key.startsWith('_fd_field_') ||
        ['effect', 'lineage', 'nose', 'terpene', 'strain_type', 'thca_percentage'].includes(m.key) ||
        ['_effect', '_lineage', '_nose', '_terpene', '_strain_type', '_thca_percentage'].includes(m.key)
      )
    );

    // Get categories
    const categories = product.categories || [];

    // Try to get category field definitions
    let categoryFields: any = {};
    if (categories.length > 0) {
      const categoryId = categories[0].id;
      try {
        const catResponse = await fetch(
          `${baseUrl}/wp-json/fd/v3/categories/${categoryId}/fields?consumer_key=${credentials.consumerKey}&consumer_secret=${credentials.consumerSecret}`,
          { cache: 'no-store' }
        );
        if (catResponse.ok) {
          categoryFields = await catResponse.json();
        }
      } catch (err) {
        console.error('Failed to fetch category fields:', err);
      }
    }

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        categories: categories.map((c: any) => ({ id: c.id, name: c.name }))
      },
      meta_data: {
        total_meta_keys: allMeta.length,
        field_related_meta: fieldMeta.length,
        all_keys_sample: allMeta.map((m: any) => m.key).slice(0, 50),
        field_meta: fieldMeta
      },
      category_field_definitions: categoryFields,
      analysis: {
        has_v3_fields: fieldMeta.some((m: any) => m.key.startsWith('_field_')),
        has_blueprint_fields: fieldMeta.some((m: any) => m.key.startsWith('_blueprint_')),
        has_fd_fields: fieldMeta.some((m: any) => m.key.startsWith('_fd_field_')),
        has_direct_fields: fieldMeta.some((m: any) => !m.key.startsWith('_'))
      }
    });

  } catch (error) {
    console.error('Debug check fields error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

