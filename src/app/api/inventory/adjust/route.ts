import { getApiEnvironmentFromRequest, getApiBaseUrl, getApiCredentials } from '@/lib/server-api-config';
import { NextRequest, NextResponse } from 'next/server';

const CONSUMER_KEY = process.env.NEXT_PUBLIC_WC_CONSUMER_KEY!;
const CONSUMER_SECRET = process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET!;

export async function POST(request: NextRequest) {
  try {
    // Get API environment from request
    const apiEnv = getApiEnvironmentFromRequest(request);
    const floraApiBase = 'https://api.floradistro.com';
    console.log(`🔄 [${apiEnv.toUpperCase()}] Adjusting inventory...`);
    
    const FLORA_API_BASE = `${floraApiBase}/wp-json`;
    const body = await request.json();
    const { adjustments } = body;

    if (!adjustments || !Array.isArray(adjustments)) {
      return NextResponse.json(
        { error: 'Invalid adjustments data' },
        { status: 400 }
      );
    }

    console.log(`📦 Processing ${adjustments.length} inventory adjustments`);

    // Process each adjustment directly through the Flora API
    const results = await Promise.all(
      adjustments.map(async (adjustment) => {
        const { product_id, variation_id, adjustment_quantity, reason, location_id } = adjustment;
        
        try {
          // Step 1: Get current inventory from Flora IM
          const locationIdToUse = location_id || 20; // Default to location 20 if not specified
          
          console.log(`Getting current inventory for product ${product_id}${variation_id ? ` variant ${variation_id}` : ''} at location ${locationIdToUse}`);
          
          const inventoryUrl = `${FLORA_API_BASE}/flora-im/v1/inventory?product_id=${product_id}${variation_id ? `&variation_id=${variation_id}` : ''}&location_id=${locationIdToUse}&consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
          
          const currentInventoryResponse = await fetch(inventoryUrl);
          
          let currentStock = 0;
          
          if (currentInventoryResponse.ok) {
            const inventoryData = await currentInventoryResponse.json();
            console.log(`Current inventory data:`, inventoryData);
            
            // Flora IM returns an array
            if (Array.isArray(inventoryData) && inventoryData.length > 0) {
              currentStock = parseFloat(inventoryData[0].quantity) || 0;
            }
          } else {
            console.log(`No existing inventory record found, starting from 0`);
          }

          const newStock = currentStock + adjustment_quantity;
          
          console.log(`Product ${product_id}: Current stock: ${currentStock}, Adjustment: ${adjustment_quantity}, New stock: ${newStock}`);

          // Step 2: Update inventory through Flora IM POST endpoint
          const updateUrl = `${FLORA_API_BASE}/flora-im/v1/inventory?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
          
          const updateData = {
            product_id: product_id,
            variation_id: variation_id || null,
            location_id: locationIdToUse,
            quantity: newStock, // Send the absolute new quantity, not the adjustment
            reason: reason || 'Inventory adjustment',
            action: reason?.includes('Restock via PO') ? 'restock' : 'manual_adjustment'
          };

          console.log(`Sending inventory update to Flora IM:`, updateData);

          const updateResponse = await fetch(updateUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData)
          });

          if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            console.error(`Failed to update inventory for product ${product_id}:`, errorText);
            throw new Error(`Failed to update inventory: ${updateResponse.status}`);
          }

          const updateResult = await updateResponse.json();
          console.log(`✅ Inventory updated for product ${product_id}:`, updateResult);
          console.log(`📝 Audit log entry should be automatically created by Flora IM`);
          
          // Also update WooCommerce if it's a variation (for consistency)
          if (variation_id) {
            try {
              const wooUrl = `${FLORA_API_BASE}/wc/v3/products/${product_id}/variations/${variation_id}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
              
              await fetch(wooUrl, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  stock_quantity: newStock,
                  manage_stock: true
                })
              });
              
              console.log(`✅ Also updated WooCommerce stock for consistency`);
            } catch (wooError) {
              // Non-critical, just log it
              console.log(`Note: Could not update WooCommerce stock (non-critical):`, wooError);
            }
          }
          
          return {
            success: true,
            product_id,
            variation_id,
            adjustment: adjustment_quantity,
            old_stock: currentStock,
            new_stock: newStock,
            message: `Stock adjusted from ${currentStock} to ${newStock}`
          };
        } catch (error) {
          console.error(`Error adjusting product ${product_id}:`, error);
          
          return {
            success: false,
            product_id,
            variation_id,
            adjustment: adjustment_quantity,
            message: `Failed to adjust stock`,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    // Check results
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ Successfully adjusted ${successful.length}/${adjustments.length} products`);
    if (failed.length > 0) {
      console.log(`❌ Failed to adjust ${failed.length} products:`, failed);
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${adjustments.length} adjustments`,
      results,
      successful: successful.length,
      failures: failed.length
    });

  } catch (error) {
    console.error('Error processing inventory adjustments:', error);
    return NextResponse.json(
      { error: 'Failed to process adjustments' },
      { status: 500 }
    );
  }
}