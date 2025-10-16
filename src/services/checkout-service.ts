/**
 * Checkout Service - Clean, reliable checkout flow
 * Handles order creation with proper inventory deduction
 */

import { apiFetch } from '../lib/api-fetch';
import { CartItem } from '../types';

export interface CheckoutResult {
  success: boolean;
  orderId?: number;
  error?: string;
  details?: string;
}

export interface CheckoutData {
  cartItems: CartItem[];
  locationId: number;
  locationName: string;
  employeeId: number;
  employeeName: string;
  customerId?: number;
  paymentMethod: string;
  paymentMethodTitle: string;
  cashReceived?: number;
  changeGiven?: number;
  splitPayments?: Array<{ method: string; amount: number }>;
  taxRate: number;
  taxName: string;
  terminalId?: number;
  terminalName?: string;
  transactionRef?: string;
}

export class CheckoutService {
  
  /**
   * Process complete checkout - Creates order with inventory deduction
   */
  static async processCheckout(data: CheckoutData): Promise<CheckoutResult> {
    try {
      // Validate checkout data
      const validation = this.validateCheckoutData(data);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🛒 CHECKOUT SERVICE - Starting checkout');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📍 Location ID:', data.locationId);
      console.log('📍 Location Name:', data.locationName);
      console.log('👤 Employee:', data.employeeName, `(ID: ${data.employeeId})`);
      console.log('🛍️ Items:', data.cartItems.length);
      console.log('💰 Payment:', data.paymentMethod);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // Build order data
      const orderData = this.buildOrderData(data);
      
      // Log order payload
      console.log('📦 Order Payload:', JSON.stringify(orderData, null, 2));

      // Create order via API
      console.log('🔄 Creating order in WooCommerce...');
      const response = await apiFetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
        signal: AbortSignal.timeout(60000) // 60 second timeout
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Order creation failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success || !result.data?.id) {
        throw new Error('Order creation failed - no order ID returned');
      }

      const orderId = result.data.id;
      console.log('✅ Order created successfully:', orderId);
      
      // CRITICAL: WordPress hooks NOT deducting inventory reliably
      // We MUST deduct manually from frontend for now
      console.log('📦 STEP 2: Deducting inventory manually (WordPress hooks broken)...');
      
      try {
        // Import inventory service dynamically to avoid circular dependency
        const { InventoryDeductionService } = await import('./inventory-deduction-service');
        
        const inventoryResult = await InventoryDeductionService.deductInventoryForOrder(
          data.cartItems,
          data.locationId,
          orderId
        );
        
        if (!inventoryResult.success) {
          console.warn('⚠️ Inventory deduction failed:', inventoryResult.error);
          console.warn('Order created but inventory NOT deducted - manual adjustment required!');
        } else {
          console.log('✅ Inventory deducted successfully');
        }
      } catch (invError) {
        console.error('❌ Inventory deduction exception:', invError);
      }

      // Wait a moment for any async operations
      await new Promise(resolve => setTimeout(resolve, 500));

      return {
        success: true,
        orderId: orderId
      };

    } catch (error) {
      console.error('❌ Checkout failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown checkout error',
        details: error instanceof Error ? error.stack : undefined
      };
    }
  }

  /**
   * Validate checkout data
   */
  private static validateCheckoutData(data: CheckoutData): { valid: boolean; error?: string } {
    if (!data.cartItems || data.cartItems.length === 0) {
      return { valid: false, error: 'Cart is empty' };
    }

    if (!data.locationId || data.locationId <= 0) {
      return { valid: false, error: 'Invalid location ID' };
    }

    if (!data.employeeId || data.employeeId <= 0) {
      return { valid: false, error: 'Invalid employee ID' };
    }

    if (!data.paymentMethod) {
      return { valid: false, error: 'Payment method is required' };
    }

    // Validate each cart item
    for (const item of data.cartItems) {
      if (!item.product_id || item.product_id <= 0) {
        return { valid: false, error: `Invalid product ID for ${item.name}` };
      }
      if (!item.quantity || item.quantity <= 0) {
        return { valid: false, error: `Invalid quantity for ${item.name}` };
      }
      if (item.price < 0) {
        return { valid: false, error: `Invalid price for ${item.name}` };
      }
    }

    return { valid: true };
  }

  /**
   * Build WooCommerce order data
   */
  private static buildOrderData(data: CheckoutData): any {
    // Calculate totals
    const subtotal = data.cartItems.reduce((sum, item) => {
      const finalPrice = item.override_price !== undefined ? item.override_price : item.price;
      const discountedPrice = item.discount_percentage 
        ? finalPrice * (1 - item.discount_percentage / 100)
        : finalPrice;
      return sum + (discountedPrice * item.quantity);
    }, 0);

    const taxAmount = Math.round(subtotal * data.taxRate * 100) / 100;
    const total = Math.round((subtotal + taxAmount) * 100) / 100;

    // Build line items with proper typing
    const lineItems = data.cartItems.map(item => {
      const finalPrice = item.override_price !== undefined ? item.override_price : item.price;
      const discountedPrice = item.discount_percentage 
        ? finalPrice * (1 - item.discount_percentage / 100)
        : finalPrice;
      
      const lineTotal = discountedPrice * item.quantity;

      const lineItem: any = {
        product_id: parseInt(item.product_id.toString()),
        quantity: parseFloat(item.quantity.toString()),
        subtotal: lineTotal.toFixed(2),
        total: lineTotal.toFixed(2),
        name: item.name,
        meta_data: [
          { key: '_actual_quantity', value: item.quantity.toString() },
          { key: '_actual_price', value: discountedPrice.toString() },
          { key: '_original_price', value: item.price.toString() }
        ]
      };

      // Add SKU if available
      if (item.sku) {
        lineItem.sku = item.sku;
      }

      // Add variation_id for variants
      if (item.is_variant && item.variation_id) {
        lineItem.variation_id = parseInt(item.variation_id.toString());
      }

      // Add override/discount metadata
      if (item.override_price !== undefined) {
        lineItem.meta_data.push({ key: '_price_override', value: item.override_price.toString() });
      }
      if (item.discount_percentage && item.discount_percentage > 0) {
        lineItem.meta_data.push({ key: '_discount_percentage', value: item.discount_percentage.toString() });
      }

      // Add pricing tier metadata (CRITICAL for conversion ratios)
      if (item.pricing_tier) {
        lineItem.meta_data.push(
          { key: '_pricing_tier_label', value: item.pricing_tier.tier_label },
          { key: '_pricing_tier_rule_name', value: item.pricing_tier.tier_rule_name },
          { key: '_pricing_tier_price', value: item.pricing_tier.tier_price.toString() },
          { key: '_pricing_tier_quantity', value: item.pricing_tier.tier_quantity.toString() },
          { key: '_pricing_tier_category', value: item.pricing_tier.tier_category || '' }
        );

        // Add conversion ratio if present
        if (item.pricing_tier.conversion_ratio) {
          const cr = item.pricing_tier.conversion_ratio;
          lineItem.meta_data.push(
            { key: '_conversion_ratio_input_amount', value: cr.input_amount.toString() },
            { key: '_conversion_ratio_input_unit', value: cr.input_unit },
            { key: '_conversion_ratio_output_amount', value: cr.output_amount.toString() },
            { key: '_conversion_ratio_output_unit', value: cr.output_unit },
            { key: '_conversion_ratio_description', value: cr.description || '' }
          );
        }
      }

      return lineItem;
    });

    // Build metadata
    const metadata: any[] = [
      { key: '_pos_location_id', value: data.locationId.toString() },
      { key: '_pos_location_name', value: data.locationName },
      { key: '_flora_location_id', value: data.locationId.toString() },
      { key: '_store_id', value: data.locationId.toString() },
      { key: '_employee_id', value: data.employeeId },
      { key: '_employee_name', value: data.employeeName },
      { key: '_created_via', value: 'posv1' },
      { key: '_pos_order', value: 'true' },
      { key: '_flora_inventory_processed', value: 'yes' }, // Mark as processed to prevent WordPress double deduction
      { key: '_tax_rate', value: data.taxRate.toString() },
      { key: '_tax_name', value: data.taxName },
      { key: '_subtotal', value: subtotal.toFixed(2) },
      { key: '_tax_total', value: taxAmount.toFixed(2) },
      { key: '_total', value: total.toFixed(2) }
    ];

    // Add terminal info if present
    if (data.terminalId && data.terminalName) {
      metadata.push(
        { key: '_payment_terminal_id', value: data.terminalId.toString() },
        { key: '_payment_terminal_name', value: data.terminalName }
      );
    }

    // Add transaction reference if present
    if (data.transactionRef) {
      metadata.push({ key: '_dejavoo_transaction_ref', value: data.transactionRef });
    }

    // Add split payment or cash details
    if (data.splitPayments && data.splitPayments.length > 0) {
      metadata.push(
        { key: '_split_payment', value: 'true' },
        { key: '_split_payment_details', value: JSON.stringify(data.splitPayments) },
        { key: '_split_payment_count', value: data.splitPayments.length.toString() }
      );
    } else if (data.paymentMethod === 'cash' && data.cashReceived) {
      metadata.push(
        { key: '_cash_received', value: data.cashReceived.toFixed(2) },
        { key: '_change_given', value: (data.changeGiven || 0).toFixed(2) }
      );
    }

    // Build order - Let WooCommerce calculate tax using the correct 8% NC rate
    const order: any = {
      status: 'processing', // WordPress hook will auto-complete for POS orders
      payment_method: data.paymentMethod,
      payment_method_title: data.paymentMethodTitle,
      currency: 'USD',
      line_items: lineItems,
      billing: {
        first_name: 'POS',
        last_name: 'Customer',
        email: `pos-${Date.now()}@floradistro.com`,
        country: 'US',
        state: 'NC',
        city: data.locationName.split(' ')[0] || 'Charlotte',
        postcode: '28105'
      },
      shipping: {
        first_name: 'POS',
        last_name: 'Customer',
        country: 'US',
        state: 'NC',
        city: data.locationName.split(' ')[0] || 'Charlotte',
        postcode: '28105'
      },
      meta_data: metadata,
      pos_order: true,
      location_id: data.locationId,
      set_paid: true,
      created_via: 'posv1'
    };

    // Add customer ID if present
    if (data.customerId && data.customerId > 0) {
      order.customer_id = data.customerId;
    }

    return order;
  }

  /**
   * Refresh inventory after checkout
   * Returns updated inventory quantities for all products in cart
   */
  static async refreshInventory(productIds: number[], locationId: number): Promise<Map<number, number>> {
    const inventoryMap = new Map<number, number>();

    try {
      console.log('🔄 Refreshing inventory for', productIds.length, 'products at location', locationId);

      // Fetch updated inventory for all products
      const promises = productIds.map(async (productId) => {
        try {
          const response = await apiFetch(
            `/api/proxy/flora-im/inventory?product_id=${productId}&location_id=${locationId}`,
            { method: 'GET' }
          );

          if (response.ok) {
            const data = await response.json();
            let quantity = 0;

            if (Array.isArray(data) && data.length > 0) {
              quantity = parseFloat(data[0].quantity || 0);
            } else if (data.success && data.data) {
              quantity = parseFloat(data.data.quantity || 0);
            }

            inventoryMap.set(productId, quantity);
            console.log(`  ✓ Product ${productId}: ${quantity} units`);
          }
        } catch (error) {
          console.error(`  ✗ Failed to fetch inventory for product ${productId}:`, error);
        }
      });

      await Promise.all(promises);

      console.log('✅ Inventory refresh complete:', inventoryMap.size, 'products updated');
      return inventoryMap;

    } catch (error) {
      console.error('❌ Inventory refresh failed:', error);
      return inventoryMap;
    }
  }
}

