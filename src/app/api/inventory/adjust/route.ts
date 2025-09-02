import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { product_id, variation_id, adjustment, reason, location_id } = body;

    console.log(`🔄 Processing inventory adjustment for product ${product_id}${variation_id ? ` variant ${variation_id}` : ''}: ${adjustment > 0 ? '+' : ''}${adjustment}`);

    // Validate required fields
    if (!product_id || typeof adjustment !== 'number' || adjustment === 0) {
      return NextResponse.json(
        { error: 'Invalid request: product_id and non-zero adjustment are required' },
        { status: 400 }
      );
    }

    // Build the adjustment request for Flora IM API
    const adjustmentData: {
      product_id: number;
      adjustment: number;
      reason: string;
      location_id: number | null;
      variation_id?: number;
    } = {
      product_id: parseInt(product_id),
      adjustment: adjustment,
      reason: reason || 'Manual adjustment',
      location_id: location_id ? parseInt(location_id) : null
    };

    // Add variation_id if provided
    if (variation_id) {
      adjustmentData.variation_id = parseInt(variation_id);
    }

    console.log('📤 Sending adjustment request to Flora IM:', adjustmentData);

    // Get current inventory to calculate new quantity
    const currentInventoryUrl = `/wp-json/flora-im/v1/inventory?product_id=${adjustmentData.product_id}&location_id=${adjustmentData.location_id || ''}${adjustmentData.variation_id ? `&variation_id=${adjustmentData.variation_id}` : ''}&consumer_key=${process.env.FLORA_CONSUMER_KEY}&consumer_secret=${process.env.FLORA_CONSUMER_SECRET}`;
    
    console.log('📤 Getting current inventory from Flora IM:', currentInventoryUrl);
    
    const currentResponse = await fetch(`${process.env.WORDPRESS_URL}${currentInventoryUrl}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!currentResponse.ok) {
      console.error('❌ Failed to get current inventory:', currentResponse.status);
      return NextResponse.json(
        { error: `Failed to get current inventory: ${currentResponse.statusText}` },
        { status: currentResponse.status }
      );
    }

    const currentInventory = await currentResponse.json();
    const currentQuantity = Array.isArray(currentInventory) && currentInventory.length > 0 
      ? parseFloat(currentInventory[0].quantity || 0) 
      : 0;
    
    const newQuantity = Math.max(0, currentQuantity + adjustmentData.adjustment);
    
    console.log(`📤 Updating inventory via Flora IM: Current: ${currentQuantity}, Adjustment: ${adjustmentData.adjustment}, New: ${newQuantity}`);

    // Call Flora IM API to update inventory
    const updateData: {
      product_id: number;
      location_id: number | null;
      quantity: number;
      reason: string;
      variation_id?: number;
    } = {
      product_id: adjustmentData.product_id,
      location_id: adjustmentData.location_id,
      quantity: newQuantity,
      reason: adjustmentData.reason || 'Manual adjustment via audit mode'
    };

    if (adjustmentData.variation_id) {
      updateData.variation_id = adjustmentData.variation_id;
    }

    const floraResponse = await fetch(`${process.env.WORDPRESS_URL}/wp-json/flora-im/v1/inventory?consumer_key=${process.env.FLORA_CONSUMER_KEY}&consumer_secret=${process.env.FLORA_CONSUMER_SECRET}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!floraResponse.ok) {
      const errorText = await floraResponse.text();
      console.error('❌ Flora IM API error:', floraResponse.status, errorText);
      return NextResponse.json(
        { error: `Flora IM API error: ${floraResponse.status} ${floraResponse.statusText}` },
        { status: floraResponse.status }
      );
    }

    const result = await floraResponse.json();

    console.log('✅ Inventory adjustment successful:', result);

    return NextResponse.json({
      success: true,
      data: result,
      message: `Inventory adjusted by ${adjustment > 0 ? '+' : ''}${adjustment}`
    });

  } catch (error) {
    console.error('❌ Inventory adjustment error:', error);
    return NextResponse.json(
      { error: 'Internal server error during inventory adjustment' },
      { status: 500 }
    );
  }
}
