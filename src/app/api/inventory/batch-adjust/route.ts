import { getApiEnvironmentFromRequest, getApiBaseUrl, getApiCredentials } from '@/lib/server-api-config';
import { NextRequest, NextResponse } from 'next/server';


interface BatchAdjustment {
  product_id: number;
  variation_id?: number;
  adjustment_quantity: number;
  reason: string;
  location_id?: number;
}

interface BatchAdjustRequest {
  batch_name: string;
  batch_description?: string;
  location_id: number;
  user_id?: number;
  user_name?: string;
  adjustments: BatchAdjustment[];
}

export async function POST(request: NextRequest) {
  try {
    const apiEnv = getApiEnvironmentFromRequest(request);
    const credentials = getApiCredentials(apiEnv);
    const CONSUMER_KEY = credentials.consumerKey;
    const CONSUMER_SECRET = credentials.consumerSecret;
    const floraApiBase = 'https://api.floradistro.com';
    const FLORA_API_BASE = `${floraApiBase}/wp-json`;
    console.log(`🔄 [${apiEnv.toUpperCase()}] Processing batch adjustment...`);
    
    const body: BatchAdjustRequest = await request.json();
    const { batch_name, batch_description, location_id, user_id, user_name, adjustments } = body;

    if (!adjustments || !Array.isArray(adjustments) || adjustments.length === 0) {
      return NextResponse.json(
        { error: 'Invalid adjustments data - must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!batch_name || !location_id) {
      return NextResponse.json(
        { error: 'batch_name and location_id are required' },
        { status: 400 }
      );
    }

    console.log(`📦 Processing batch adjustment "${batch_name}" with ${adjustments.length} items`);

    // Step 1: Create audit batch
    const batchUrl = `${FLORA_API_BASE}/flora-im/v1/audit-batches?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
    
    const batchData = {
      batch_name,
      batch_description: batch_description || `Batch adjustment: ${batch_name}`,
      location_id,
      user_id: user_id || 1,
      user_name: user_name || 'System'
    };

    console.log('🔨 Creating audit batch:', batchData);

    const batchResponse = await fetch(batchUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batchData)
    });

    if (!batchResponse.ok) {
      const errorText = await batchResponse.text();
      console.error('❌ Failed to create audit batch:', errorText);
      return NextResponse.json(
        { error: 'Failed to create audit batch', details: errorText },
        { status: 500 }
      );
    }

    const batchResult = await batchResponse.json();
    const batchId = batchResult.batch_id;
    
    console.log(`✅ Created audit batch ID: ${batchId} (${batchResult.batch.audit_number})`);

    // Step 2: Start the batch
    const startUrl = `${FLORA_API_BASE}/flora-im/v1/audit-batches/${batchId}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
    
    await fetch(startUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start' })
    });

    // Step 3: Process all adjustments with batch_id
    const results = await Promise.all(
      adjustments.map(async (adjustment, index) => {
        const { product_id, variation_id, adjustment_quantity, reason, location_id: adj_location_id } = adjustment;
        
        try {
          const locationIdToUse = adj_location_id || location_id;
          
          console.log(`[${index + 1}/${adjustments.length}] Processing product ${product_id}${variation_id ? ` variant ${variation_id}` : ''}`);

          // Get current inventory
          const inventoryUrl = `${FLORA_API_BASE}/flora-im/v1/inventory?product_id=${product_id}${variation_id ? `&variation_id=${variation_id}` : ''}&location_id=${locationIdToUse}&consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
          
          const currentInventoryResponse = await fetch(inventoryUrl);
          
          let currentStock = 0;
          
          if (currentInventoryResponse.ok) {
            const inventoryData = await currentInventoryResponse.json();
            if (Array.isArray(inventoryData) && inventoryData.length > 0) {
              currentStock = parseFloat(inventoryData[0].quantity) || 0;
            }
          } else {
            console.log(`No existing inventory record found for product ${product_id}, starting from 0`);
          }

          const newStock = currentStock + adjustment_quantity;
          
          console.log(`Product ${product_id}: Current: ${currentStock}, Adjustment: ${adjustment_quantity}, New: ${newStock}`);

          // Update inventory
          const updateUrl = `${FLORA_API_BASE}/flora-im/v1/inventory?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
          
          const updateData = {
            product_id: product_id,
            variation_id: variation_id || null,
            location_id: locationIdToUse,
            quantity: newStock,
            batch_id: batchId, // Include batch_id for audit logging
            reason: reason,
            user_name: user_name || 'System'
          };

          console.log(`Updating inventory for product ${product_id}:`, updateData);

          const updateResponse = await fetch(updateUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
          });

          if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            console.error(`❌ Failed to update product ${product_id}:`, errorText);
            throw new Error(`Failed to update inventory: ${errorText}`);
          }

          const updateResult = await updateResponse.json();
          
          return {
            success: true,
            product_id,
            variation_id,
            old_quantity: currentStock,
            new_quantity: newStock,
            adjustment: adjustment_quantity,
            reason,
            result: updateResult
          };

        } catch (error) {
          console.error(`❌ Error processing product ${product_id}:`, error);
          return {
            success: false,
            product_id,
            variation_id,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    // Step 4: Complete the batch
    console.log('🏁 Completing audit batch...');
    
    const completeResponse = await fetch(startUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'complete' })
    });

    let batchSummary = null;
    if (completeResponse.ok) {
      const completeResult = await completeResponse.json();
      batchSummary = completeResult.batch;
    }

    // Calculate results summary
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;
    const totalAdjustment = results
      .filter(r => r.success)
      .reduce((sum, r) => sum + (r.adjustment || 0), 0);

    console.log(`✅ Batch adjustment completed: ${successCount} successful, ${failedCount} failed`);

    return NextResponse.json({
      success: true,
      message: `Batch adjustment "${batch_name}" completed`,
      batch_id: batchId,
      audit_number: batchResult.batch.audit_number,
      summary: {
        total_adjustments: adjustments.length,
        successful: successCount,
        failed: failedCount,
        total_adjustment: totalAdjustment
      },
      batch_summary: batchSummary,
      results
    });

  } catch (error) {
    console.error('❌ Batch adjustment error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: `Batch adjustment failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}
