import { getApiEnvironmentFromRequest, getApiBaseUrl, getApiCredentials } from '@/lib/server-api-config';
import { NextRequest, NextResponse } from 'next/server';

const FLORA_API_BASE = 'https://api.floradistro.com';

export async function POST(request: NextRequest) {
  try {
    const apiEnv = getApiEnvironmentFromRequest(request);
    const credentials = getApiCredentials(apiEnv);
    const CONSUMER_KEY = credentials.consumerKey;
    const CONSUMER_SECRET = credentials.consumerSecret;

    const { updates } = await request.json();
    
    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Request body must contain an array of product updates' },
        { status: 400 }
      );
    }

    console.log(`🔄 Updating blueprint fields for ${updates.length} products...`);
    
    const results = [];
    
    for (const update of updates) {
      try {
        const { productId, fields } = update;
        
        if (!productId || !fields) {
          results.push({
            productId,
            success: false,
            error: 'Missing productId or fields',
          });
          continue;
        }

        console.log(`🔄 Updating product ${productId} with blueprint fields...`);
        
        // Convert fields to WooCommerce meta_data format
        const metaData = Object.entries(fields).map(([key, value]) => ({
          key: `_${key}`, // Add underscore prefix for custom fields
          value: value
        }));

        // Update product using WooCommerce API
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
          console.error(`❌ Failed to update product ${productId}:`, response.status, errorText);
          results.push({
            productId,
            success: false,
            error: `HTTP ${response.status}: ${errorText}`,
          });
          continue;
        }
        
        const updatedProduct = await response.json();
        console.log(`✅ Successfully updated product ${productId} with blueprint fields`);
        
        results.push({
          productId,
          success: true,
          data: {
            id: updatedProduct.id,
            name: updatedProduct.name,
            meta_data_count: updatedProduct.meta_data?.length || 0
          },
        });
        
        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`❌ Error updating product ${update.productId}:`, error);
        results.push({
          productId: update.productId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;
    
    console.log(`📊 Blueprint fields update summary: ${successCount} successful, ${failureCount} failed`);
    
    return NextResponse.json({
      success: successCount > 0,
      message: `Updated ${successCount} products successfully${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount,
      },
    });
    
  } catch (error) {
    console.error('Blueprint fields update API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update blueprint fields' 
      },
      { status: 500 }
    );
  }
}
