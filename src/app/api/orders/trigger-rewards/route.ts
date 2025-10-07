import { getApiEnvironmentFromRequest, getApiBaseUrl, getApiCredentials } from '@/lib/server-api-config';
import { NextRequest, NextResponse } from 'next/server';

const CONSUMER_KEY = process.env.NEXT_PUBLIC_WC_CONSUMER_KEY!;
const CONSUMER_SECRET = process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET!;

export async function POST(request: NextRequest) {
  try {
    // Get API environment from request
    const apiEnv = getApiEnvironmentFromRequest(request);
    const WOOCOMMERCE_API_URL = getApiBaseUrl(apiEnv);
    console.log(`🔄 [${apiEnv.toUpperCase()}] Triggering rewards...`);
    
    const { orderId, customerId } = await request.json();
    
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }
    
    console.log(`🎯 Triggering rewards for order ${orderId}, customer ${customerId}...`);

    // Get the current order
    const orderResponse = await fetch(
      `${WOOCOMMERCE_API_URL}/wp-json/wc/v3/orders/${orderId}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`
    );
    
    if (!orderResponse.ok) {
      throw new Error(`Failed to fetch order: ${orderResponse.status}`);
    }
    
    const order = await orderResponse.json();
    
    // Check if points were already awarded for this order
    const existingPoints = order.meta_data?.find((m: any) => m.key === '_wc_points_earned');
    if (existingPoints && existingPoints.value !== '0') {
      return NextResponse.json({
        success: false,
        error: `Points already awarded for this order: ${existingPoints.value} points`,
        pointsAwarded: existingPoints.value
      });
    }
    
    // Calculate points based on subtotal (pre-tax amount) - 1 point per dollar spent
    const orderSubtotal = order.line_items.reduce((sum: number, item: any) => {
      return sum + parseFloat(item.subtotal || item.total || '0');
    }, 0);
    const pointsToAward = Math.floor(orderSubtotal); // 1 point per dollar spent (pre-tax)
    
    if (pointsToAward <= 0) {
      return NextResponse.json({
        success: false,
        error: 'No points to award - order total is 0'
      });
    }
    
    if (!customerId || customerId === 0) {
      return NextResponse.json({
        success: false,
        error: 'Cannot award points to guest customers'
      });
    }
    
    console.log(`💰 Awarding ${pointsToAward} points to customer ${customerId} for $${orderSubtotal} subtotal (pre-tax)`);
    
    // Award points directly via the rewards API using correct environment
    const rewardsResponse = await fetch(
      `${WOOCOMMERCE_API_URL}/wp-json/wc-points-rewards/v1/user/${customerId}/adjust?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          points: pointsToAward,
          description: `Points earned for order #${order.number || orderId}`
        })
      }
    );
    
    if (!rewardsResponse.ok) {
      const errorText = await rewardsResponse.text();
      throw new Error(`Failed to award points: ${rewardsResponse.status} ${errorText}`);
    }
    
    const rewardsResult = await rewardsResponse.json();
    console.log(`✅ Points awarded successfully:`, rewardsResult);
    
    // Update the order with points metadata
    const updateResponse = await fetch(
      `${WOOCOMMERCE_API_URL}/wp-json/wc/v3/orders/${orderId}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          date_paid: new Date().toISOString(),
          date_completed: new Date().toISOString(),
          meta_data: [
            ...order.meta_data.filter((m: any) => m.key !== '_wc_points_earned'),
            {
              key: '_wc_points_earned',
              value: pointsToAward.toString()
            }
          ]
        })
      }
    );
    
    if (!updateResponse.ok) {
      console.warn('Failed to update order metadata, but points were awarded');
    }
    
    return NextResponse.json({
      success: true,
      orderId,
      customerId,
      pointsAwarded: pointsToAward,
      orderSubtotal,
      orderTotal: parseFloat(order.total || '0'),
      message: `Successfully awarded ${pointsToAward} points for $${orderSubtotal} subtotal (pre-tax)`
    });
    
  } catch (error) {
    console.error('Error triggering rewards:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
