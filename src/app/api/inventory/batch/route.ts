import { NextRequest, NextResponse } from 'next/server';

const FLORA_API_BASE = process.env.FLORA_API_BASE || 'https://api.floradistro.com/wp-json';
const CONSUMER_KEY = process.env.FLORA_CONSUMER_KEY || 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = process.env.FLORA_CONSUMER_SECRET || 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

interface InventoryRequest {
  product_id: number;
  variation_id?: number;
}

/**
 * Batch inventory endpoint to fetch inventory for multiple products/variants at once
 * This significantly reduces the number of API calls when loading variants
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, location_id } = body as { 
      items: InventoryRequest[]; 
      location_id?: number;
    };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Invalid items data - must be a non-empty array' },
        { status: 400 }
      );
    }

    console.log(`📦 Fetching batch inventory for ${items.length} items`);

    // Create a map to store results
    const inventoryMap: Record<string, any> = {};

    // Batch the requests to avoid overwhelming the API
    // Process in chunks of 10 items
    const chunkSize = 10;
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      
      await Promise.all(
        chunk.map(async (item) => {
          const key = `${item.product_id}_${item.variation_id || 0}`;
          
          try {
            const params = new URLSearchParams({
              product_id: item.product_id.toString(),
              ...(item.variation_id && { variation_id: item.variation_id.toString() }),
              ...(location_id && { location_id: location_id.toString() })
            });

            const url = `${FLORA_API_BASE}/flora-im/v1/inventory?${params}&consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
            
            const response = await fetch(url, {
              headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
              }
            });

            if (response.ok) {
              const data = await response.json();
              const inventoryArray = Array.isArray(data) ? data : [];
              
              // If location_id is specified, we're getting filtered inventory for that location
              // Otherwise, we get all locations
              const totalStock = inventoryArray.reduce((sum: number, inv: any) => {
                const quantity = Number(inv.quantity) || 0;
                return sum + quantity;
              }, 0);
              
              inventoryMap[key] = {
                product_id: item.product_id,
                variation_id: item.variation_id || 0,
                inventory: inventoryArray,
                total_stock: totalStock,
                success: true
              };
            } else {
              inventoryMap[key] = {
                product_id: item.product_id,
                variation_id: item.variation_id || 0,
                inventory: [],
                total_stock: 0,
                success: false,
                error: `Failed to fetch: ${response.status}`
              };
            }
          } catch (error) {
            inventoryMap[key] = {
              product_id: item.product_id,
              variation_id: item.variation_id || 0,
              inventory: [],
              total_stock: 0,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        })
      );
      
      // Add a small delay between chunks to avoid rate limiting
      if (i + chunkSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`✅ Batch inventory fetch complete`);

    return NextResponse.json({
      success: true,
      data: inventoryMap,
      total: items.length
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Batch inventory error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch batch inventory', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
