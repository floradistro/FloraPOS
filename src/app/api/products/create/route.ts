import { getApiEnvironmentFromRequest, getApiBaseUrl, getApiCredentials } from '@/lib/server-api-config';
import { NextRequest, NextResponse } from 'next/server';


export async function POST(request: NextRequest) {
  try {
    const apiEnv = getApiEnvironmentFromRequest(request);
    const credentials = getApiCredentials(apiEnv);
    const CONSUMER_KEY = credentials.consumerKey;
    const CONSUMER_SECRET = credentials.consumerSecret;
    const floraApiBase = 'https://api.floradistro.com';
    console.log(`🔄 [${apiEnv.toUpperCase()}] Creating products...`);
    
    const products = await request.json();
    
    if (!Array.isArray(products)) {
      return NextResponse.json(
        { error: 'Request body must be an array of products' },
        { status: 400 }
      );
    }

    console.log(`🔄 Creating ${products.length} products in WooCommerce...`);
    
    const results = [];
    
    for (const productData of products) {
      try {
        // Build the API URL for product creation
        const apiUrl = new URL(`${floraApiBase}/wp-json/wc/v3/products`);
        apiUrl.searchParams.append('consumer_key', CONSUMER_KEY);
        apiUrl.searchParams.append('consumer_secret', CONSUMER_SECRET);
        
        console.log(`🔄 Creating product: ${productData.name}`);
        
        // Make the request to create the product
        const response = await fetch(apiUrl.toString(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productData),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Failed to create product ${productData.name}:`, response.status, errorText);
          results.push({
            product: productData.name,
            success: false,
            error: `HTTP ${response.status}: ${errorText}`,
          });
          continue;
        }
        
        const createdProduct = await response.json();
        console.log(`✅ Successfully created product: ${productData.name} (ID: ${createdProduct.id})`);
        
        results.push({
          product: productData.name,
          success: true,
          data: createdProduct,
          id: createdProduct.id,
        });
        
        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Error creating product ${productData.name}:`, error);
        results.push({
          product: productData.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;
    
    console.log(`📊 Product creation summary: ${successCount} successful, ${failureCount} failed`);
    
    return NextResponse.json({
      success: successCount > 0,
      message: `Created ${successCount} products successfully${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount,
      },
    });
    
  } catch (error) {
    console.error('Product creation API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create products' 
      },
      { status: 500 }
    );
  }
}
