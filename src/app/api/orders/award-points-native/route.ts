import { getApiEnvironmentFromRequest, getApiBaseUrl, getApiCredentials } from '@/lib/server-api-config';
import { NextRequest, NextResponse } from 'next/server';

const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

/**
 * This endpoint replicates the exact WooCommerce Points & Rewards plugin logic
 * Based on class-wc-points-rewards-order.php and class-wc-points-rewards-manager.php
 */
export async function POST(request: NextRequest) {
  try {
    // Get API environment from request
    const apiEnv = getApiEnvironmentFromRequest(request);
    const WOOCOMMERCE_API_URL = getApiBaseUrl(apiEnv);
    console.log(`🔄 [${apiEnv.toUpperCase()}] Awarding points at ${WOOCOMMERCE_API_URL}...`);
    
    const { orderId, customerId } = await request.json();
    
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }
    
    console.log(`🎯 [Native Points] Processing order ${orderId} for customer ${customerId}...`);

    // 1. Get the order
    const orderResponse = await fetch(
      `${WOOCOMMERCE_API_URL}/wp-json/wc/v3/orders/${orderId}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`
    );
    
    if (!orderResponse.ok) {
      throw new Error(`Failed to fetch order: ${orderResponse.status}`);
    }
    
    const order = await orderResponse.json();
    console.log(`📋 Order ${orderId}: status=${order.status}, customer_id=${order.customer_id}, total=${order.total}`);
    
    // 2. Replicate WooCommerce Points & Rewards plugin checks
    
    // Check if order is paid or completed (from maybe_update_points)
    const paid = order.date_paid !== null && order.date_paid !== '';
    const completed = order.status === 'completed';
    
    if (!paid && !completed) {
      return NextResponse.json({
        success: false,
        error: 'Order must be paid or completed to earn points',
        orderStatus: order.status,
        datePaid: order.date_paid
      });
    }
    
    // Bail for guest user (from add_points_earned)
    if (!order.customer_id || order.customer_id === 0) {
      return NextResponse.json({
        success: false,
        error: 'Points cannot be awarded to guest orders',
        customerId: order.customer_id
      });
    }
    
    // Check if points have already been added (from add_points_earned)
    const existingPoints = order.meta_data?.find((m: any) => m.key === '_wc_points_earned');
    if (existingPoints && existingPoints.value !== '' && existingPoints.value !== '0') {
      return NextResponse.json({
        success: true,
        message: 'Points already awarded for this order',
        pointsAwarded: parseInt(existingPoints.value) || 0,
        alreadyProcessed: true
      });
    }
    
    // 3. Get WordPress options for points calculation
    console.log(`🔧 [Native Points] Getting WooCommerce Points & Rewards settings...`);
    
    // Get the earn points ratio (default is 1:1 based on plugin code)
    let earnPointsRatio = '1:1';
    try {
      // Try to get the actual setting from WordPress
      const optionsResponse = await fetch(
        `${WOOCOMMERCE_API_URL}/wp-json/wp/v2/settings?search=wc_points_rewards_earn_points_ratio`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64')}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (optionsResponse.ok) {
        const settings = await optionsResponse.json();
        const ratioSetting = settings.find((s: any) => s.key === 'wc_points_rewards_earn_points_ratio');
        if (ratioSetting) {
          earnPointsRatio = ratioSetting.value || '1:1';
        }
      }
    } catch (error) {
      console.warn('Could not fetch earn points ratio, using default 1:1');
    }
    
    console.log(`⚙️ [Native Points] Using earn points ratio: ${earnPointsRatio}`);
    
    // 4. Calculate points using WooCommerce Points & Rewards logic
    const pointsEarned = await calculatePointsForOrder(order, earnPointsRatio);
    
    console.log(`🧮 [Native Points] Calculated ${pointsEarned} points for order ${orderId}`);
    
    if (pointsEarned <= 0) {
      // Still update the meta to mark as processed
      await updateOrderMeta(orderId, pointsEarned, WOOCOMMERCE_API_URL);
      return NextResponse.json({
        success: true,
        pointsAwarded: 0,
        message: 'No points earned for this order based on WooCommerce settings'
      });
    }
    
    // 5. Award points using WC Points & Rewards Manager logic
    // Use direct API call instead of going through proxy for server-side calls
    const adjustResponse = await fetch(
      `${WOOCOMMERCE_API_URL}/wp-json/wc-points-rewards/v1/user/${order.customer_id}/adjust?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          points: pointsEarned,
          description: `Points earned for order #${orderId}`,
          event_type: 'order-placed',
          order_id: orderId
        })
      }
    );
    
    if (!adjustResponse.ok) {
      throw new Error(`Failed to award points: ${adjustResponse.status}`);
    }
    
    // 6. Update order meta (like the plugin does)
    await updateOrderMeta(orderId, pointsEarned, WOOCOMMERCE_API_URL);
    
    // 7. Add order note (like the plugin does)
    await addOrderNote(orderId, `Customer earned ${pointsEarned} points for purchase.`, WOOCOMMERCE_API_URL);
    
    return NextResponse.json({
      success: true,
      orderId,
      customerId: order.customer_id,
      pointsAwarded: pointsEarned,
      earnPointsRatio,
      orderTotal: parseFloat(order.total),
      message: `Successfully awarded ${pointsEarned} points using WooCommerce Points & Rewards logic`
    });
    
  } catch (error) {
    console.error('Error in native points calculation:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Calculate points for order using WooCommerce Points & Rewards plugin logic
 * Based on get_points_earned_for_purchase() method
 */
async function calculatePointsForOrder(order: any, earnPointsRatio: string): Promise<number> {
  let pointsEarned = 0;
  
  // Parse the ratio (e.g., "1:1" means 1 point per $1)
  const ratio = earnPointsRatio.split(':');
  const points = parseFloat(ratio[0]) || 1;
  const monetaryValue = parseFloat(ratio[1]) || 1;
  
  console.log(`🧮 [Native Points] Using ratio: ${points} points per $${monetaryValue}`);
  
  // Calculate points for each line item (like the plugin does)
  for (const item of order.line_items) {
    console.log(`📦 [Native Points] Processing item: ${item.name} (qty: ${item.quantity})`);
    
    // Get the item price (subtotal per item, excluding tax - like the plugin)
    // The plugin uses get_item_subtotal() which is subtotal / quantity
    const itemPrice = parseFloat(item.subtotal) / item.quantity;
    
    console.log(`💰 [Native Points] Item price: $${itemPrice.toFixed(2)} each`);
    
    // Calculate points using the ratio (like WC_Points_Rewards_Manager::calculate_points)
    const itemPoints = (itemPrice * (points / monetaryValue)) * item.quantity;
    
    console.log(`🎯 [Native Points] Item points: ${itemPoints.toFixed(2)} (${itemPrice} * ${points}/${monetaryValue} * ${item.quantity})`);
    
    pointsEarned += itemPoints;
  }
  
  // Reduce by any discounts (like the plugin does)
  const discount = parseFloat(order.discount_total) || 0;
  if (discount > 0) {
    const discountPoints = discount * (points / monetaryValue);
    pointsEarned = Math.max(0, pointsEarned - discountPoints);
    console.log(`💸 [Native Points] Applied discount: -${discountPoints.toFixed(2)} points`);
  }
  
  // Round the points (like WC_Points_Rewards_Manager::round_the_points)
  pointsEarned = Math.floor(pointsEarned);
  
  console.log(`✅ [Native Points] Final points calculation: ${pointsEarned}`);
  
  return pointsEarned;
}

/**
 * Update order meta data
 */
async function updateOrderMeta(orderId: number, points: number, apiUrl: string): Promise<void> {
  const updateResponse = await fetch(
    `${apiUrl}/wp-json/wc/v3/orders/${orderId}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meta_data: [
          {
            key: '_wc_points_earned',
            value: points.toString()
          }
        ]
      })
    }
  );
  
  if (!updateResponse.ok) {
    console.warn(`Failed to update order meta for order ${orderId}`);
  } else {
    console.log(`✅ [Native Points] Updated order meta: _wc_points_earned = ${points}`);
  }
}

/**
 * Add order note
 */
async function addOrderNote(orderId: number, note: string, apiUrl: string): Promise<void> {
  const noteResponse = await fetch(
    `${apiUrl}/wp-json/wc/v3/orders/${orderId}/notes?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        note,
        customer_note: false
      })
    }
  );
  
  if (!noteResponse.ok) {
    console.warn(`Failed to add order note for order ${orderId}`);
  } else {
    console.log(`✅ [Native Points] Added order note: "${note}"`);
  }
}
