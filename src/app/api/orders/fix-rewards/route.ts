import { getApiEnvironmentFromRequest, getApiBaseUrl, getApiCredentials } from '@/lib/server-api-config';
import { NextRequest, NextResponse } from 'next/server';
import { ProductMappingService } from '../../../../services/product-mapping-service';

const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

export async function POST(request: NextRequest) {
  try {
    // Get API environment from request
    const apiEnv = getApiEnvironmentFromRequest(request);
    const WOOCOMMERCE_API_URL = getApiBaseUrl(apiEnv);
    console.log(`🔄 [${apiEnv.toUpperCase()}] Fixing rewards...`);
    
    const { orderId } = await request.json();
    
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }
    
    console.log(`🔧 Fixing rewards for order ${orderId}...`);

    // 1. Get the current order
    const orderResponse = await fetch(
      `${WOOCOMMERCE_API_URL}/wp-json/wc/v3/orders/${orderId}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`
    );
    
    if (!orderResponse.ok) {
      throw new Error(`Failed to fetch order: ${orderResponse.status}`);
    }
    
    const order = await orderResponse.json();
    console.log(`📋 Order ${orderId} current status: ${order.status}, customer_id: ${order.customer_id}`);
    
    // Skip if not a POSV1 order
    if (order.created_via !== 'posv1') {
      return NextResponse.json({ error: 'Not a POSV1 order' }, { status: 400 });
    }
    
    // Skip if guest customer (customer_id = 0) - rewards only work for registered customers
    if (order.customer_id === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Guest orders do not earn points - customer must be selected during checkout',
        message: 'Points are only awarded to registered customers'
      });
    }
    
    // Check if already processed
    const existingPoints = order.meta_data?.find((m: any) => m.key === '_wc_points_earned');
    if (existingPoints && existingPoints.value !== '0') {
      return NextResponse.json({ 
        success: true, 
        message: 'Order already has points awarded',
        points: existingPoints.value 
      });
    }
    
    let updatedLineItems = false;
    const fixes = [];
    
    // 2. Fix line items with proper WooCommerce product IDs
    for (let i = 0; i < order.line_items.length; i++) {
      const item = order.line_items[i];
      
      if (item.product_id === 0) {
        console.log(`🔍 Mapping product: "${item.name}"`);
        const wooCommerceProductId = await ProductMappingService.findWooCommerceProductId(item.name);
        
        if (wooCommerceProductId) {
          order.line_items[i].product_id = wooCommerceProductId;
          updatedLineItems = true;
          fixes.push(`Mapped "${item.name}" to product ID ${wooCommerceProductId}`);
          console.log(`✅ Mapped "${item.name}" to WooCommerce product ID ${wooCommerceProductId}`);
        } else {
          console.warn(`⚠️ Could not map product "${item.name}"`);
          fixes.push(`Could not map "${item.name}"`);
        }
      }
    }
    
    // 3. Update line items first if needed
    if (updatedLineItems) {
      console.log('🔄 Updating line items with proper product IDs...');
      
      // Update each line item individually to avoid validation issues
      for (let i = 0; i < order.line_items.length; i++) {
        const item = order.line_items[i];
        
        if (item.product_id !== 0) {
          const lineItemUpdate = {
            product_id: item.product_id
          };
          
          console.log(`🔄 Updating line item ${item.id} with product_id ${item.product_id}...`);
          
          const lineItemResponse = await fetch(
            `${WOOCOMMERCE_API_URL}/wp-json/wc/v3/orders/${orderId}/line_items/${item.id}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`,
            {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(lineItemUpdate)
            }
          );
          
          if (lineItemResponse.ok) {
            const updatedItem = await lineItemResponse.json();
            console.log(`✅ Updated line item ${item.id} with product_id ${updatedItem.product_id}`);
          } else {
            const errorText = await lineItemResponse.text();
            console.error(`❌ Failed to update line item ${item.id}:`, lineItemResponse.status, errorText);
          }
        }
      }
    }
    
    // 4. Update order status to completed
    const updateData = {
      status: 'completed',
      date_paid: new Date().toISOString(),
      date_completed: new Date().toISOString()
    };
    
    console.log(`🔄 Updating order ${orderId} with fixes...`);
    const updateResponse = await fetch(
      `${WOOCOMMERCE_API_URL}/wp-json/wc/v3/orders/${orderId}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      }
    );
    
    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Failed to update order: ${updateResponse.status} ${errorText}`);
    }
    
    const updatedOrder = await updateResponse.json();
    console.log(`✅ Order ${orderId} updated to status: ${updatedOrder.status}`);
    
    // 5. Check if points were awarded
    const finalPointsCheck = updatedOrder.meta_data?.find((m: any) => m.key === '_wc_points_earned');
    const pointsAwarded = finalPointsCheck ? finalPointsCheck.value : '0';
    
    return NextResponse.json({
      success: true,
      orderId,
      fixes,
      status: updatedOrder.status,
      pointsAwarded,
      message: pointsAwarded !== '0' 
        ? `Order fixed successfully! ${pointsAwarded} points awarded.`
        : 'Order updated but no points awarded (check customer_id and product mapping)'
    });
    
  } catch (error) {
    console.error('Error fixing order rewards:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
