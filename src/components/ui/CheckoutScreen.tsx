'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api-fetch';
import { useAuth } from '../../contexts/AuthContext';
import { CustomerSelector } from './CustomerSelector';
import { WordPressUser } from '../../services/users-service';
import { CartItem, PaymentMethod, TaxRate } from '../../types';
import { LOCATION_MAPPINGS } from '../../constants';
import { PaymentMethodSelector, OrderSummary, SplitPayment } from './checkout';
import { AlertModal } from './';
import { ReloadDebugger } from '../../lib/debug-reload';
import { InventoryDeductionService } from '../../services/inventory-deduction-service';
import { ProductMappingService } from '../../services/product-mapping-service';
import { useUserPointsBalance } from '../../hooks/useRewards';

interface CheckoutScreenProps {
  items: CartItem[];
  selectedCustomer?: WordPressUser | null;
  onClose: () => void;
  onOrderComplete: () => void;
}

// Component to display customer points in selected customer bar
const CustomerPointsDisplay = ({ customerId }: { customerId: number }) => {
  const { data: pointsBalance, isLoading } = useUserPointsBalance(customerId);
  
  if (isLoading) {
    return <span className="text-xs font-mono text-neutral-500">loading...</span>;
  }
  
  if (!pointsBalance || customerId === 0) {
    return <span className="text-xs font-mono text-neutral-500">0 points</span>;
  }
  
  // Extract singular/plural form from points_label
  const balance = pointsBalance as any;
  const pointsLabel = balance.points_label || 'Point:Points';
  const [singular, plural] = pointsLabel.split(':');
  const pointsUnit = balance.balance === 1 ? (singular || 'Point') : (plural || 'Points');
  
  return (
    <span className="text-white text-xs font-mono bg-gradient-to-r from-purple-600 via-fuchsia-500 to-purple-600 px-2 py-0.5 rounded animate-pulse bg-[length:200%_100%]">
      {balance.balance.toLocaleString()} {pointsUnit.toLowerCase()}
    </span>
  );
};

const CheckoutScreenComponent = React.forwardRef<HTMLDivElement, CheckoutScreenProps>(function CheckoutScreen({ 
  items, 
  selectedCustomer: initialSelectedCustomer,
  onClose, 
  onOrderComplete 
}, ref) {
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [taxRate, setTaxRate] = useState<TaxRate>({ rate: 0.08, name: 'Sales Tax', location: user?.location || 'Default' });
  const [selectedCustomer, setSelectedCustomer] = useState<WordPressUser | null>(initialSelectedCustomer || null);
  const [splitPayments, setSplitPayments] = useState<SplitPayment[]>([]);
  
  // Alert state
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({ isOpen: false, title: '', message: '' });


  // Calculate totals with price overrides and discounts
  const subtotal = items.reduce((sum, item) => {
    let finalPrice = item.override_price !== undefined ? item.override_price : item.price;
    if (item.discount_percentage !== undefined && item.discount_percentage > 0) {
      finalPrice = finalPrice * (1 - item.discount_percentage / 100);
    }
    return sum + (finalPrice * item.quantity);
  }, 0);
  const taxAmount = Math.round(subtotal * taxRate.rate * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;
  const cashReceivedNum = parseFloat(cashReceived) || 0;
  const change = Math.round((cashReceivedNum - total) * 100) / 100;

  // Load tax rates for location
  useEffect(() => {
    loadTaxRates();
  }, [user?.location]);

  const loadTaxRates = async () => {
    try {
      // If user has a location_id, fetch tax rates from API
      if (user?.location_id) {
        console.log(`🔍 Fetching tax rates for location ${user.location_id}...`);
        
        const response = await apiFetch(`/api/proxy/flora-im/locations/${user.location_id}/taxes`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const taxRates = await response.json();
          
          if (Array.isArray(taxRates) && taxRates.length > 0) {
            // Use the default tax rate, or the first one if no default
            const defaultTax = taxRates.find(t => t.is_default === '1' || t.is_default === 1) || taxRates[0];
            const taxRateValue = parseFloat(defaultTax.tax_rate) / 100; // Convert from 8.0000 to 0.08
            
            console.log(`✅ Loaded tax rate for location ${user.location_id}: ${defaultTax.tax_rate_name} (${(taxRateValue * 100).toFixed(2)}%)`);
            
            setTaxRate({ 
              rate: taxRateValue, 
              name: defaultTax.tax_rate_name, 
              location: user?.location || 'Default' 
            });
            return;
          } else {
            console.warn(`⚠️ No tax rates found for location ${user.location_id}, using fallback`);
          }
        }
      }
      
      // Fallback to hardcoded mappings if API fails or no location_id
      const locationData = LOCATION_MAPPINGS[user?.location || 'Default'] || LOCATION_MAPPINGS['Default'];
      console.log(`📍 Using hardcoded tax rate for ${user?.location || 'Default'}: ${(locationData.rate * 100).toFixed(2)}%`);
      setTaxRate({ 
        rate: locationData.rate, 
        name: locationData.name, 
        location: user?.location || 'Default' 
      });
    } catch (error) {
      console.error('Failed to load tax rates:', error);
      // Use default tax rate
      setTaxRate({ rate: 0.08, name: 'Sales Tax', location: user?.location || 'Default' });
    }
  };

  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setPaymentMethod(method);
    if (method === 'card') {
      setCashReceived(total.toFixed(2));
    } else {
      setCashReceived('');
    }
  };



  const processOrder = async () => {
    // Validate cart has items
    if (!items || items.length === 0) {
      setAlertModal({
        isOpen: true,
        title: 'Empty Cart',
        message: 'Cannot process an empty order.'
      });
      return;
    }

    // Handle split payment validation with floating point tolerance
    if (splitPayments.length > 0) {
      const totalPaid = Math.round(splitPayments.reduce((sum, p) => sum + p.amount, 0) * 100) / 100;
      // Allow 2 cent tolerance for floating point precision
      if (totalPaid < total - 0.02) {
        setAlertModal({
          isOpen: true,
          title: 'Insufficient Payment',
          message: `Total paid ($${totalPaid.toFixed(2)}) is less than the order total ($${total.toFixed(2)}).`
        });
        return;
      }
    } else if (paymentMethod === 'cash' && cashReceivedNum < total) {
      setAlertModal({
        isOpen: true,
        title: 'Insufficient Payment',
        message: `Please provide at least $${total.toFixed(2)} to complete this transaction.`
      });
      return;
    }

    setIsProcessing(true);
    let orderCreated = false;
    let orderId: number | null = null;

    try {
      // Generate order number
      const orderNum = `POS-${Date.now()}`;
      
      // Get location ID from mapping
      const locationId = LOCATION_MAPPINGS[user?.location || 'Default']?.id || LOCATION_MAPPINGS['Default'].id;
      
      // Map cart items to include WooCommerce product IDs for rewards integration
      const mappedLineItems = await Promise.all(items.map(async item => {
        // CRITICAL FIX: Use item.product_id FIRST (set by CartService), not name search
        // ProductMappingService.findWooCommerceProductId is slow and unreliable
        let productId = item.product_id;
        
        // Only fallback to name search if product_id is missing
        if (!productId || productId <= 0) {
          console.warn(`⚠️ Cart item missing product_id, attempting name search for: ${item.name}`);
          const wooCommerceProductId = await ProductMappingService.findWooCommerceProductId(item.name);
          productId = wooCommerceProductId || undefined;
        }
        
        // CRITICAL VALIDATION: Ensure product_id is valid
        if (!productId || isNaN(productId) || productId <= 0) {
          console.error(`❌ Invalid product_id for item: ${item.name}`, {
            item_product_id: item.product_id,
            item_id: item.id,
            item_sku: item.sku,
            final_productId: productId,
            cart_item: item
          });
          throw new Error(`Invalid product ID for "${item.name}". Cannot create order with invalid product. Remove this item and try again.`);
        }
        
        // Calculate final price after overrides and discounts
        let finalPrice = item.override_price !== undefined ? item.override_price : item.price;
        if (item.discount_percentage !== undefined && item.discount_percentage > 0) {
          finalPrice = finalPrice * (1 - item.discount_percentage / 100);
        }
        
        // Ensure positive quantity
        const quantity = Math.max(0.01, item.quantity || 1);
        
        // Validate quantity is a valid number
        if (isNaN(quantity) || !isFinite(quantity)) {
          throw new Error(`Invalid quantity for "${item.name}": ${item.quantity}`);
        }
        
        // Validate price is a valid number
        if (isNaN(finalPrice) || !isFinite(finalPrice) || finalPrice < 0) {
          throw new Error(`Invalid price for "${item.name}": ${finalPrice}`);
        }
        
        const lineItem: any = {
          product_id: productId,
          quantity: quantity,
          subtotal: (finalPrice * quantity).toFixed(2),
          total: (finalPrice * quantity).toFixed(2),
          meta_data: [
            {
              key: '_actual_quantity',
              value: quantity.toString()
            },
            {
              key: '_actual_price',
              value: finalPrice.toString()
            },
            {
              key: '_original_price',
              value: item.price.toString()
            }
          ]
        };
        
        // Add optional fields only if they have valid values
        if (item.name && item.name.trim()) {
          lineItem.name = item.name.trim();
        }
        
        if (item.sku && item.sku.trim()) {
          lineItem.sku = item.sku.trim();
        }
          
          // Add variation_id for variants to enable proper inventory tracking
          if (item.is_variant && item.variation_id) {
            lineItem.variation_id = item.variation_id;
          }

          // Add override and discount information to metadata if present
          if (item.override_price !== undefined) {
            lineItem.meta_data.push({
              key: '_price_override',
              value: item.override_price.toString()
            });
          }
          
          if (item.discount_percentage !== undefined && item.discount_percentage > 0) {
            lineItem.meta_data.push({
              key: '_discount_percentage',
              value: item.discount_percentage.toString()
            });
          }
          
          // Add pricing tier information to line item metadata
          if (item.pricing_tier) {
            const tierMetadata = [
              {
                key: '_pricing_tier_label',
                value: item.pricing_tier.tier_label
              },
              {
                key: '_pricing_tier_rule_name',
                value: item.pricing_tier.tier_rule_name
              },
              {
                key: '_pricing_tier_price',
                value: item.pricing_tier.tier_price.toString()
              },
              {
                key: '_pricing_tier_quantity',
                value: item.pricing_tier.tier_quantity.toString()
              },
              {
                key: '_pricing_tier_category',
                value: item.pricing_tier.tier_category || ''
              }
            ];

            // Add conversion ratio metadata if present - with strict validation
            if (item.pricing_tier.conversion_ratio) {
              const cr = item.pricing_tier.conversion_ratio;
              // Only add if all required fields are valid
              if (cr.input_amount && cr.input_unit && cr.output_amount && cr.output_unit) {
                const conversionMetadata = [
                  {
                    key: '_conversion_ratio_input_amount',
                    value: cr.input_amount.toString()
                  },
                  {
                    key: '_conversion_ratio_input_unit',
                    value: cr.input_unit.toString()
                  },
                  {
                    key: '_conversion_ratio_output_amount',
                    value: cr.output_amount.toString()
                  },
                  {
                    key: '_conversion_ratio_output_unit',
                    value: cr.output_unit.toString()
                  },
                  {
                    key: '_conversion_ratio_description',
                    value: (cr.description || '').toString()
                  }
                ];
                tierMetadata.push(...conversionMetadata);
              }
            }
            
            lineItem.meta_data = [...lineItem.meta_data, ...tierMetadata];
          }
          
          return lineItem;
        }));
      
      // CRITICAL VALIDATION: Ensure line_items array is valid before sending to WooCommerce
      console.log(`📦 Line items validation (${mappedLineItems.length} items):`);
      
      // Validate each line item field individually
      const validationErrors: string[] = [];
      
      mappedLineItems.forEach((li, idx) => {
        console.log(`   Item ${idx + 1}:`, {
          name: li.name,
          product_id: li.product_id,
          variation_id: li.variation_id || 'none',
          quantity: li.quantity,
          subtotal: li.subtotal,
          total: li.total,
          sku: li.sku || 'none',
          meta_data_count: li.meta_data?.length || 0
        });
        
        // Check required fields
        if (!li.product_id || isNaN(li.product_id) || li.product_id <= 0) {
          validationErrors.push(`Item ${idx + 1} (${li.name}): Invalid product_id (${li.product_id})`);
        }
        if (!li.quantity || isNaN(li.quantity) || li.quantity <= 0) {
          validationErrors.push(`Item ${idx + 1} (${li.name}): Invalid quantity (${li.quantity})`);
        }
        if (li.subtotal === undefined || li.subtotal === null || isNaN(parseFloat(li.subtotal))) {
          validationErrors.push(`Item ${idx + 1} (${li.name}): Invalid subtotal (${li.subtotal})`);
        }
        if (li.total === undefined || li.total === null || isNaN(parseFloat(li.total))) {
          validationErrors.push(`Item ${idx + 1} (${li.name}): Invalid total (${li.total})`);
        }
        
        // Check for variation_id data type if present
        if (li.variation_id !== undefined && (isNaN(li.variation_id) || li.variation_id <= 0)) {
          validationErrors.push(`Item ${idx + 1} (${li.name}): Invalid variation_id (${li.variation_id})`);
        }
      });
      
      if (validationErrors.length > 0) {
        console.error('❌ Line items validation failed:', validationErrors);
        throw new Error(`Order validation failed:\n${validationErrors.join('\n')}`);
      }
      
      if (mappedLineItems.length === 0) {
        throw new Error('Order must contain at least one item');
      }
      
      console.log(`✅ All line items validated successfully`);
      
      // Prepare order data
      const isSplitPayment = splitPayments.length > 0;
      const primaryPaymentMethod = isSplitPayment ? 'split' : paymentMethod;
      const paymentTitle = isSplitPayment ? 
        `Split Payment (${splitPayments.map(p => `${p.method}: $${p.amount.toFixed(2)}`).join(', ')})` :
        paymentMethod === 'cash' ? 'Cash' : 'Credit Card';
      
      const orderData = {
        ...(selectedCustomer?.id ? { customer_id: selectedCustomer.id } : {}), // Only include customer_id if valid
        payment_method: primaryPaymentMethod,
        payment_method_title: paymentTitle,
        status: 'processing', // Use 'processing' to prevent automatic stock deduction
        currency: 'USD',
        line_items: mappedLineItems,
        tax_lines: [
          {
            rate_code: `${user?.location || 'NC'}-TAX`,
            rate_id: parseInt(locationId.toString()),
            label: taxRate.name,
            compound: false,
            tax_total: taxAmount.toFixed(2),
            shipping_tax_total: '0.00'
          }
        ],
        billing: {
          first_name: selectedCustomer?.name?.split(' ')[0] || 'POS',
          last_name: selectedCustomer?.name?.split(' ').slice(1).join(' ') || 'Customer',
          email: selectedCustomer?.email || `pos-${Date.now()}@floradistro.com`,
          country: 'US',
          state: 'NC',
          city: user?.location?.split(' ')[0] || 'Charlotte',
          postcode: '28105'
        },
        shipping: {
          first_name: selectedCustomer?.name?.split(' ')[0] || 'POS',
          last_name: selectedCustomer?.name?.split(' ').slice(1).join(' ') || 'Customer',
          country: 'US',
          state: 'NC',
          city: user?.location?.split(' ')[0] || 'Charlotte',
          postcode: '28105'
        },
        meta_data: [
          {
            key: '_pos_location_id',
            value: locationId.toString()
          },
          {
            key: '_pos_location_name',
            value: user?.location || 'Default'
          },
          {
            key: '_employee_id',
            value: user?.id ? parseInt(user.id) : null
          },
          {
            key: '_employee_name',
            value: user?.username || 'Unknown Staff'
          },
          {
            key: '_flora_location_id',
            value: locationId.toString()
          },
          {
            key: '_store_id',
            value: locationId.toString()
          },
          {
            key: '_created_via',
            value: 'posv1'
          },
          {
            key: '_pos_order',
            value: 'true'
          },
          {
            key: '_flora_inventory_processed',
            value: 'no' // Explicitly prevent automatic inventory deduction
          },
          {
            key: '_tax_rate',
            value: taxRate.rate.toString()
          },
          {
            key: '_tax_name',
            value: taxRate.name
          },
          {
            key: '_subtotal',
            value: subtotal.toFixed(2)
          },
          {
            key: '_tax_total',
            value: taxAmount.toFixed(2)
          },
          {
            key: '_total',
            value: total.toFixed(2)
          },
          ...(isSplitPayment ? [
            {
              key: '_split_payment',
              value: 'true'
            },
            {
              key: '_split_payment_details',
              value: JSON.stringify(splitPayments.map(p => ({
                method: p.method,
                amount: p.amount.toFixed(2)
              })))
            },
            {
              key: '_split_payment_count',
              value: splitPayments.length.toString()
            }
          ] : paymentMethod === 'cash' ? [
            {
              key: '_cash_received',
              value: cashReceivedNum.toFixed(2)
            },
            {
              key: '_change_given',
              value: change.toFixed(2)
            }
          ] : [])
        ],
        pos_order: true,
        location_id: locationId,
        set_paid: true, // Mark as paid since it's a POS transaction
        created_via: 'posv1' // Identify as POSV1 order for Magic2 integration
      };

      
      // EXTENSIVE LOGGING BEFORE ORDER CREATION
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📦 FULL ORDER PAYLOAD TO WOOCOMMERCE:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(JSON.stringify(orderData, null, 2));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Sanity check: Ensure line_items is an array
      if (!Array.isArray(orderData.line_items)) {
        console.error('❌ CRITICAL: line_items is not an array!', typeof orderData.line_items);
        throw new Error('Internal error: line_items must be an array');
      }
      
      // STEP 1: Create order via API with timeout
      console.log('🔄 STEP 1: Creating order...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      let response;
      try {
        response = await apiFetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderData),
          signal: controller.signal
        });
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Order creation timed out. Please try again.');
        }
        throw fetchError;
      }
      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `Failed to create order (${response.status})`;
        let errorDetails = null;
        
        try {
          const errorData = await response.json();
          errorDetails = errorData;
          errorMessage = errorData.error || errorData.details || errorData.message || errorMessage;
          
          // EXTENSIVE ERROR LOGGING: Log full context when order fails
          console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.error('❌ WOOCOMMERCE ORDER CREATION FAILED');
          console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.error('Status:', response.status, response.statusText);
          console.error('Error Data:', errorData);
          console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.error('Order Data Sent:');
          console.error('  Customer ID:', orderData.customer_id || 'none');
          console.error('  Payment:', orderData.payment_method);
          console.error('  Line Items Count:', orderData.line_items.length);
          console.error('  First Line Item:', orderData.line_items[0]);
          console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          
        } catch (jsonError) {
          const errorText = await response.text().catch(() => 'Unknown error');
          errorMessage = `Server error: ${errorText.substring(0, 200)}`;
          console.error('❌ Could not parse error response:', errorText);
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      if (!result.success || !result.data?.id) {
        throw new Error('Order creation failed - no order ID returned');
      }

      orderId = result.data.id;
      orderCreated = true;
      console.log(`✅ STEP 1 Complete: Order #${orderId} created`);

      // STEP 2: Deduct inventory BEFORE marking order complete
      console.log('🔄 STEP 2: Deducting inventory...');
      if (!orderId) {
        throw new Error('Cannot deduct inventory - order ID is missing');
      }
      
      let inventoryResult;
      try {
        inventoryResult = await InventoryDeductionService.deductInventoryForOrder(
          items,
          locationId,
          orderId
        );
        
        if (!inventoryResult.success) {
          throw new Error(inventoryResult.error || 'Inventory deduction failed');
        }
        console.log(`✅ STEP 2 Complete: Inventory deducted successfully`);
      } catch (inventoryError) {
        console.error('❌ Inventory deduction failed:', inventoryError);
        // Critical failure - don't complete the order
        throw new Error(`Inventory deduction failed: ${inventoryError instanceof Error ? inventoryError.message : 'Unknown error'}. Order created but not completed.`);
      }

      // STEP 3: Mark order as completed (only if inventory deduction succeeded)
      console.log('🔄 STEP 3: Marking order as completed...');
      try {
        const completeResponse = await apiFetch(`/api/orders/${orderId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'completed',
            date_paid: new Date().toISOString(),
            date_completed: new Date().toISOString()
          }),
        });
        
        if (!completeResponse.ok) {
          throw new Error(`Failed to complete order: ${completeResponse.status}`);
        }
        console.log(`✅ STEP 3 Complete: Order marked as completed`);
      } catch (completeError) {
        console.error('❌ Failed to mark order as completed:', completeError);
        throw new Error('Order created and inventory deducted, but failed to mark as completed. Please check order status manually.');
      }
      
      // STEP 4: Award points (non-critical - can fail without blocking)
      console.log('🔄 STEP 4: Awarding points...');
      if (selectedCustomer && selectedCustomer.id && selectedCustomer.id > 0) {
        try {
          const pointsResponse = await apiFetch('/api/orders/award-points-native', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderId: orderId,
              customerId: selectedCustomer.id
            }),
          });
          
          if (pointsResponse.ok) {
            const pointsData = await pointsResponse.json();
            console.log(`✅ STEP 4 Complete: ${pointsData.pointsAwarded || 0} points awarded`);
          } else {
            console.warn('⚠️ Points award failed but order is complete');
          }
        } catch (pointsError) {
          console.warn('⚠️ Error awarding points (non-critical):', pointsError);
        }
      } else {
        console.log('⚠️ STEP 4 Skipped: Guest customer - no points to award');
      }

      // STEP 5: Complete the UI flow
      console.log('✅ Order processing complete!');
      try {
        await onOrderComplete();
      } catch (error) {
        console.error('Error during order completion callback:', error);
      }
      
      onClose();

    } catch (error) {
      console.error('❌ Order processing failed:', error);
      
      // Provide context-specific error message
      let errorTitle = 'Order Failed';
      let errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (orderCreated && orderId) {
        errorTitle = 'Partial Order Failure';
        errorMessage = `Order #${orderId} was created but encountered an error: ${errorMessage}. Please check the order status in WooCommerce.`;
      }
      
      setAlertModal({
        isOpen: true,
        title: errorTitle,
        message: errorMessage
      });
    } finally {
      setIsProcessing(false);
    }
  };


  return (
    <div ref={ref} className="flex-1 backdrop-blur-xl flex flex-col h-full">
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-600/50 scrollbar-track-transparent hover:scrollbar-thumb-neutral-500/50">
        
        {/* Customer Card - Shows at top when customer is selected */}
        {selectedCustomer && selectedCustomer.id >= 0 && (
          <div className="sticky top-0 z-20 mx-4 mt-4 mb-3">
            <div className="bg-white/[0.02] backdrop-blur-xl rounded-2xl p-4 transition-all duration-300">
              <div className="flex items-center gap-3">
                {/* Customer Avatar */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neutral-700 to-neutral-800 flex items-center justify-center text-white font-mono font-bold text-lg flex-shrink-0">
                  {selectedCustomer.id === 0 ? '👤' : (selectedCustomer.display_name || selectedCustomer.name || 'U')[0].toUpperCase()}
                </div>
                
                {/* Customer Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    {selectedCustomer.id === 0 ? 'Guest' : (selectedCustomer.display_name || selectedCustomer.name || selectedCustomer.username)}
                  </div>
                  {selectedCustomer.id > 0 && (
                    <div className="text-xs text-neutral-500 font-mono mt-1">
                      <CustomerPointsDisplay customerId={selectedCustomer.id} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Order Summary - Now has more room */}
        <OrderSummary
          items={items}
          subtotal={subtotal}
          taxRate={taxRate}
          taxAmount={taxAmount}
          total={total}
          selectedCustomer={selectedCustomer}
        />
      </div>

      {/* Payment Method - Fixed at bottom */}
      <div className="flex-shrink-0">
        <PaymentMethodSelector
          paymentMethod={paymentMethod}
          onPaymentMethodChange={handlePaymentMethodChange}
          total={total}
          cashReceived={cashReceived}
          onCashReceivedChange={setCashReceived}
          change={change}
          splitPayments={splitPayments}
          onSplitPaymentsChange={setSplitPayments}
        />
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/5 space-y-2">
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="w-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white font-mono font-medium py-2.5 px-4 transition-all duration-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 text-xs lowercase"
        >
          cancel
        </button>
        <button
          onClick={processOrder}
          disabled={
            isProcessing || 
            (splitPayments.length > 0 
              ? Math.round(splitPayments.reduce((sum, p) => sum + p.amount, 0) * 100) / 100 < total - 0.02
              : paymentMethod === 'cash' && (cashReceivedNum < total || !cashReceived)
            )
          }
          className="w-full bg-neutral-200 text-neutral-900 hover:bg-neutral-100 font-mono font-bold py-4 px-5 transition-all duration-300 flex items-center justify-center gap-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:text-neutral-500 active:scale-95 text-sm lowercase"
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin"></div>
              <span>processing...</span>
            </>
          ) : (
            <>
              <span>pay</span>
              <span className="ml-auto text-lg">${total.toFixed(2)}</span>
            </>
          )}
        </button>
      </div>
      
      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
      />
      
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes slide-in-from-top-4 {
          from {
            opacity: 0;
            transform: translateY(-16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-in {
          animation-fill-mode: both;
        }
        
        .slide-in-from-top-4 {
          animation-name: slide-in-from-top-4;
        }
        
        .fade-in {
          animation-name: fadeIn;
        }
        
        .duration-500 {
          animation-duration: 500ms;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

    </div>
  );
});

CheckoutScreenComponent.displayName = 'CheckoutScreen';

// Export the component directly without any wrappers
// This avoids ref passing issues with lazy loading
export default CheckoutScreenComponent;
