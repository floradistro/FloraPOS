import { NextRequest, NextResponse } from 'next/server';
import { ProductMappingService } from '../../../../services/product-mapping-service';

const WOOCOMMERCE_API_URL = 'https://api.floradistro.com';
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

export async function POST(request: NextRequest) {
  try {
    const { orderId, customerId } = await request.json();
    
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }
    
    console.log(`🔧 Fixing order ${orderId} for WooCommerce rewards system...`);
    
    // 1. Get the current order
    const orderResponse = await fetch(
      `${WOOCOMMERCE_API_URL}/wp-json/wc/v3/orders/${orderId}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`
    );
    
    if (!orderResponse.ok) {
      throw new Error(`Failed to fetch order: ${orderResponse.status}`);
    }
    
    const order = await orderResponse.json();
    console.log(`📋 Order ${orderId}: status=${order.status}, customer_id=${order.customer_id}`);
    
    // Skip if not a POSV1 order
    if (order.created_via !== 'posv1') {
      return NextResponse.json({ error: 'Not a POSV1 order' }, { status: 400 });
    }
    
    // Check if points were already processed
    const existingPoints = order.meta_data?.find((m: any) => m.key === '_wc_points_earned');
    if (existingPoints && existingPoints.value !== '0') {
      return NextResponse.json({
        success: true,
        message: 'Order already processed for rewards',
        pointsAwarded: parseInt(existingPoints.value) || 0,
        alreadyProcessed: true
      });
    }
    
    let needsUpdate = false;
    const fixes = [];
    
    // 2. Fix customer_id if needed (ensure registered customer for rewards)
    if (order.customer_id === 0 && customerId) {
      order.customer_id = customerId;
      needsUpdate = true;
      fixes.push(`Set customer_id to ${customerId}`);
      console.log(`✅ Setting customer_id to ${customerId} for rewards`);
    }
    
    // 3. Fix line items with proper WooCommerce product IDs
    let lineItemsFixed = false;
    for (let i = 0; i < order.line_items.length; i++) {
      const item = order.line_items[i];
      
      if (item.product_id === 0) {
        console.log(`🔍 Mapping product: "${item.name}"`);
        const wooCommerceProductId = await ProductMappingService.findWooCommerceProductId(item.name);
        
        if (wooCommerceProductId) {
          // Update the line item via WooCommerce API
          const lineItemUpdate = { product_id: wooCommerceProductId };
          
          const lineItemResponse = await fetch(
            `${WOOCOMMERCE_API_URL}/wp-json/wc/v3/orders/${orderId}/line_items/${item.id}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`,
            {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(lineItemUpdate)
            }
          );
          
          if (lineItemResponse.ok) {
            lineItemsFixed = true;
            fixes.push(`Mapped "${item.name}" to product ID ${wooCommerceProductId}`);
            console.log(`✅ Updated line item ${item.id} with product_id ${wooCommerceProductId}`);
          } else {
            console.warn(`⚠️ Failed to update line item ${item.id}`);
          }
        }
      }
    }
    
    // 4. Update order status and customer_id if needed
    if (needsUpdate || order.status !== 'completed') {
      const updateData: any = {
        status: 'completed',
        date_paid: new Date().toISOString(),
        date_completed: new Date().toISOString()
      };
      
      if (needsUpdate) {
        updateData.customer_id = customerId;
      }
      
      console.log(`🔄 Updating order ${orderId} to completed status...`);
      const updateResponse = await fetch(
        `${WOOCOMMERCE_API_URL}/wp-json/wc/v3/orders/${orderId}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        }
      );
      
      if (updateResponse.ok) {
        fixes.push('Updated order status to completed');
        console.log(`✅ Order ${orderId} updated to completed status`);
      } else {
        console.warn(`⚠️ Failed to update order status`);
      }
    }
    
    // 5. Give WooCommerce a moment to process the rewards hooks
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 6. Check if points were awarded by WooCommerce
    const finalOrderResponse = await fetch(
      `${WOOCOMMERCE_API_URL}/wp-json/wc/v3/orders/${orderId}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`
    );
    
    if (finalOrderResponse.ok) {
      const finalOrder = await finalOrderResponse.json();
      const finalPoints = finalOrder.meta_data?.find((m: any) => m.key === '_wc_points_earned');
      const pointsAwarded = finalPoints ? parseInt(finalPoints.value) || 0 : 0;
      
      return NextResponse.json({
        success: true,
        orderId,
        customerId: customerId || order.customer_id,
        fixes,
        pointsAwarded,
        message: pointsAwarded > 0 
          ? `WooCommerce awarded ${pointsAwarded} points according to plugin settings`
          : 'Order fixed but no points awarded (check WooCommerce rewards settings and customer registration)'
      });
    }
    
    return NextResponse.json({
      success: true,
      orderId,
      fixes,
      pointsAwarded: 0,
      message: 'Order fixed - points will be processed by WooCommerce rewards system'
    });
    
  } catch (error) {
    console.error('Error fixing order for rewards:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
