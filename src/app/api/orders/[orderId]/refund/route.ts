import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    console.log('🔄 Processing refund for order:', orderId)

    // First, get the current order details
    const orderResponse = await fetch(`https://api.floradistro.com/wp-json/wc/v3/orders/${orderId}`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(
          'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5:cs_38194e74c7ddc5d72b6c32c70485728e7e529678'
        ).toString('base64')}`,
        'Content-Type': 'application/json',
      },
    })

    if (!orderResponse.ok) {
      console.error('❌ Failed to fetch order:', orderResponse.status, orderResponse.statusText)
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const order = await orderResponse.json()
    console.log('📋 Current order status:', order.status)

    // Check if order can be refunded
    if (order.status === 'refunded') {
      return NextResponse.json(
        { error: 'Order is already refunded' },
        { status: 400 }
      )
    }

    if (order.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cannot refund a cancelled order' },
        { status: 400 }
      )
    }

    // Update order status to refunded
    const refundResponse = await fetch(`https://api.floradistro.com/wp-json/wc/v3/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${Buffer.from(
          'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5:cs_38194e74c7ddc5d72b6c32c70485728e7e529678'
        ).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'refunded',
        meta_data: [
          ...order.meta_data,
          {
            key: '_refund_processed_at',
            value: new Date().toISOString()
          },
          {
            key: '_refund_processed_by',
            value: 'pos_system'
          }
        ]
      })
    })

    if (!refundResponse.ok) {
      const errorText = await refundResponse.text()
      console.error('❌ Failed to update order status:', refundResponse.status, errorText)
      return NextResponse.json(
        { error: 'Failed to process refund' },
        { status: refundResponse.status }
      )
    }

    const refundedOrder = await refundResponse.json()
    console.log('✅ Order refunded successfully:', refundedOrder.id)

    // TODO: Handle points refund if customer had points
    // This would involve checking if points were earned and crediting them back
    const pointsEarned = order.meta_data?.find((meta: any) => meta.key === '_wc_points_earned')?.value
    if (pointsEarned && parseInt(pointsEarned) > 0) {
      console.log('💰 Points to refund:', pointsEarned)
      // In a real implementation, you would call the points API to credit back the points
      // For now, we'll just log it
    }

    return NextResponse.json({
      success: true,
      message: 'Order refunded successfully',
      order: {
        id: refundedOrder.id,
        status: refundedOrder.status,
        refund_processed_at: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Error processing refund:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 