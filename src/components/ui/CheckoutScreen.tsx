'use client';

import React, { useState, useEffect } from 'react';

import { useAuth } from '../../contexts/AuthContext';
import { CustomerSelector } from './CustomerSelector';
import { WordPressUser } from '../../services/users-service';
import { CartItem, PaymentMethod, TaxRate } from '../../types';
import { LOCATION_MAPPINGS } from '../../constants';
import { PaymentMethodSelector, OrderSummary } from './checkout';
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
    return <span className="text-xs text-neutral-500">Loading...</span>;
  }
  
  if (!pointsBalance || customerId === 0) {
    return <span className="text-xs text-neutral-500">0 Points</span>;
  }
  
  // Extract singular/plural form from points_label
  const [singular, plural] = pointsBalance.points_label.split(':') || ['Point', 'Points'];
  const pointsUnit = pointsBalance.balance === 1 ? singular : plural;
  
  return (
    <span className="text-xs text-white font-medium">
      {pointsBalance.balance.toLocaleString()} {pointsUnit}
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
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<WordPressUser | null>(initialSelectedCustomer || null);
  
  // Alert state
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({ isOpen: false, title: '', message: '' });


  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const taxAmount = subtotal * taxRate.rate;
  const total = subtotal + taxAmount;
  const cashReceivedNum = parseFloat(cashReceived) || 0;
  const change = cashReceivedNum - total;

  // Load tax rates for location
  useEffect(() => {
    loadTaxRates();
  }, [user?.location]);

  const loadTaxRates = async () => {
    try {
      const locationData = LOCATION_MAPPINGS[user?.location || 'Default'] || LOCATION_MAPPINGS['Default'];
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
    if (paymentMethod === 'cash' && cashReceivedNum < total) {
      setAlertModal({
        isOpen: true,
        title: 'Insufficient Payment',
        message: `Please provide at least $${total.toFixed(2)} to complete this transaction.`
      });
      return;
    }

    // Start debugging to catch any reloads during checkout
    ReloadDebugger.startCheckoutDebug();
    ReloadDebugger.logCheckoutStep('Starting order processing');

    setIsProcessing(true);

    try {
      // Generate order number
      const orderNum = `POS-${Date.now()}`;
      
      // Get location ID from mapping
      const locationId = LOCATION_MAPPINGS[user?.location || 'Default']?.id || LOCATION_MAPPINGS['Default'].id;
      
      // Map cart items to include WooCommerce product IDs for rewards integration
      console.log('🔄 Mapping cart items to WooCommerce products for rewards...');
      const mappedLineItems = await Promise.all(items.map(async item => {
        // Map Flora IM product to WooCommerce product for rewards integration
        console.log(`🔍 Mapping product: "${item.name}"`);
        const wooCommerceProductId = await ProductMappingService.findWooCommerceProductId(item.name);
        const productId = wooCommerceProductId || item.product_id || parseInt(item.id);
        
        console.log(`📦 Creating line item for ${item.name}:`, {
          item_id: item.id,
          flora_product_id: item.product_id,
          woocommerce_product_id: wooCommerceProductId,
          final_product_id: productId,
          variation_id: item.variation_id,
          mapping_success: !!wooCommerceProductId
        });
        
        if (!wooCommerceProductId) {
          console.error(`❌ Failed to map product "${item.name}" to WooCommerce - points may not be awarded!`);
        } else {
          console.log(`✅ Successfully mapped "${item.name}" to WooCommerce product ID ${wooCommerceProductId}`);
        }
        
        const lineItem: any = {
          product_id: productId,
          name: item.name,
          quantity: Math.floor(item.quantity * 1000), // Convert to milligrams/milliunit for integer quantity
          price: (item.price / 1000), // Adjust price per milliunit
          total: (item.price * item.quantity).toFixed(2),
          sku: item.sku || item.id, // Use proper SKU or fallback to ID
          meta_data: [
            {
              key: '_actual_quantity',
              value: item.quantity.toString() // Store the actual quantity (e.g., 3.5g)
            },
            {
              key: '_actual_price',
              value: item.price.toString() // Store the actual price per unit
            }
          ], // Initialize meta_data array for line item
        };
          
          // Add variation_id for variants to enable proper inventory tracking
          if (item.is_variant && item.variation_id) {
            lineItem.variation_id = item.variation_id;
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

            // Add conversion ratio metadata if present
            if (item.pricing_tier.conversion_ratio) {
              const conversionMetadata = [
                {
                  key: '_conversion_ratio_input_amount',
                  value: item.pricing_tier.conversion_ratio.input_amount.toString()
                },
                {
                  key: '_conversion_ratio_input_unit',
                  value: item.pricing_tier.conversion_ratio.input_unit
                },
                {
                  key: '_conversion_ratio_output_amount',
                  value: item.pricing_tier.conversion_ratio.output_amount.toString()
                },
                {
                  key: '_conversion_ratio_output_unit',
                  value: item.pricing_tier.conversion_ratio.output_unit
                },
                {
                  key: '_conversion_ratio_description',
                  value: item.pricing_tier.conversion_ratio.description || ''
                }
              ];
              tierMetadata.push(...conversionMetadata);
            }
            
            lineItem.meta_data = [...lineItem.meta_data, ...tierMetadata];
          }
          
          return lineItem;
        }));
      
      // Prepare order data
      const orderData = {
        ...(selectedCustomer?.id ? { customer_id: selectedCustomer.id } : {}), // Only include customer_id if valid
        payment_method: paymentMethod,
        payment_method_title: paymentMethod === 'cash' ? 'Cash' : 'Credit Card',
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
          ...(paymentMethod === 'cash' ? [
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


      
      // Create order via API
      ReloadDebugger.logCheckoutStep('Making API call to create order');
      ReloadDebugger.logApiCall('/api/orders', 'POST');
      
      console.log('🔍 [DEBUG v2.3] Order data being sent:', JSON.stringify(orderData, null, 2));
      
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        let errorMessage = `Failed to process order (${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          console.error('❌ [DEBUG] Order creation failed:', errorData);
          console.error('❌ [DEBUG] Response status:', response.status);
          console.error('❌ [DEBUG] Response headers:', Object.fromEntries(response.headers.entries()));
        } catch (jsonError) {
          // If we can't parse JSON, get the raw text
          try {
            const errorText = await response.text();
            console.error('Non-JSON error response:', errorText);
            errorMessage = `Server error: ${errorText.substring(0, 200)}...`;
          } catch (textError) {
            console.error('Could not read error response:', textError);
          }
        }
        throw new Error(errorMessage);
      }

      let result;
      try {
        ReloadDebugger.logCheckoutStep('Parsing order creation response');
        result = await response.json();

      } catch (jsonError) {
        console.error('Failed to parse success response as JSON:', jsonError);
        ReloadDebugger.logError('JSON parsing', jsonError);
        throw new Error('Server returned invalid response format');
      }



      ReloadDebugger.logCheckoutStep('Order created successfully, processing inventory deduction');
      
      console.log('🏪 Order location info:', {
        userLocation: user?.location,
        locationId: locationId,
        locationName: LOCATION_MAPPINGS[user?.location || 'Default']?.name,
        cartItems: items.length
      });
      
      // Complete the order and award points using native WooCommerce Points & Rewards logic
      if (result.data?.id) {
        try {
          // First, mark the order as completed and paid (POS transactions are immediate)
          console.log(`🔧 [POINTS SYSTEM v2.0] Completing order ${result.data.id} for POS transaction...`);
          const completeResponse = await fetch(`/api/orders/${result.data.id}`, {
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
            console.warn('⚠️ Failed to complete order status, but continuing with points...');
          } else {
            console.log('✅ Order marked as completed');
          }
          
          // Now award points using native WooCommerce logic
          console.log(`🎯 Awarding points for order ${result.data.id} using native WooCommerce logic...`);
          const pointsResponse = await fetch('/api/orders/award-points-native', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderId: result.data.id,
              customerId: selectedCustomer?.id || null
            }),
          });
          
          if (pointsResponse.ok) {
            const pointsResult = await pointsResponse.json();
            console.log('✅ Native points result:', pointsResult);
            
            if (pointsResult.success && pointsResult.pointsAwarded > 0) {
              console.log(`🎉 ${pointsResult.pointsAwarded} points awarded using WooCommerce Points & Rewards settings!`);
            } else if (!selectedCustomer?.id) {
              console.warn('⚠️ No customer selected - points only awarded to registered customers');
            } else if (pointsResult.pointsAwarded === 0) {
              console.log('ℹ️ No points awarded based on WooCommerce Points & Rewards settings');
            } else {
              console.warn('⚠️ Points calculation failed:', pointsResult);
            }
          } else {
            const errorText = await pointsResponse.text();
            console.error('❌ Failed to award points:', pointsResponse.status, errorText);
          }
        } catch (pointsError) {
          console.error('❌ Error in points/completion process:', pointsError);
        }
      }
      
      // Deduct inventory using Magic2 with conversion ratios
      let inventoryResult;
      try {
        inventoryResult = await InventoryDeductionService.deductInventoryForOrder(
          items,
          locationId,
          result.id || orderNum
        );
      } catch (inventoryError) {
        console.error("Inventory deduction service error:", inventoryError);
        inventoryResult = { success: false, error: inventoryError instanceof Error ? inventoryError.message : 'Unknown inventory error' };
      }

      if (!inventoryResult.success) {
        console.error('❌ Inventory deduction failed:', inventoryResult.error);
        // Show warning but don't fail the entire transaction since order is already created
        setAlertModal({
          isOpen: true,
          title: 'Inventory Warning',
          message: `Order completed but inventory deduction failed: ${inventoryResult.error}. Please manually adjust inventory.`
        });
      } else {
        console.log('✅ Inventory successfully deducted for order:', inventoryResult.deductedItems);
        console.log('📊 Deduction summary:', {
          totalItems: inventoryResult.deductedItems?.length || 0,
          items: inventoryResult.deductedItems?.map(item => ({
            product: item.product_id,
            deducted: item.quantity_deducted,
            conversion: item.conversion_applied
          }))
        });
        ReloadDebugger.logCheckoutStep('Inventory deduction completed successfully');
      }

      setOrderNumber(orderNum);
      setShowPaymentSuccess(true);

      // Auto-close after 2 seconds and trigger order completion (reduced from 3s for better UX)
      setTimeout(async () => {
        try {
          ReloadDebugger.logCheckoutStep('Triggering order completion callback');
          await onOrderComplete(); // Backup approach - no parameters
          ReloadDebugger.logCheckoutStep('Order completion callback finished');
        } catch (error) {
          console.error('Error during order completion:', error);
          ReloadDebugger.logError('Order completion callback', error);
        }
        ReloadDebugger.logCheckoutStep('Closing checkout screen');
        onClose();
        
        // Stop debugging after successful completion
        ReloadDebugger.stopCheckoutDebug();
      }, 2000);

    } catch (error) {
      console.error('Order processing failed:', error);
      ReloadDebugger.logError('Order processing', error);
      
      setAlertModal({
        isOpen: true,
        title: 'Order Failed',
        message: `Failed to process order: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      
      // Stop debugging on error
      ReloadDebugger.stopCheckoutDebug();
    } finally {
      setIsProcessing(false);
    }
  };

  if (showPaymentSuccess) {
    return (
      <div className="flex-1 bg-neutral-900 flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-neutral-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-neutral-400 mb-2">Payment Successful!</h2>
            <p className="text-neutral-400 mb-4">Order #{orderNumber}</p>
            
            {paymentMethod === 'cash' && change > 0 && (
              <div className="bg-neutral-800/20 p-4 mb-4 border border-white/[0.06] rounded-lg">
                <div className="text-neutral-400 text-sm">Change Due:</div>
                <div className="text-2xl font-bold text-neutral-400">${change.toFixed(2)}</div>
              </div>
            )}
            
            <p className="text-neutral-500 text-sm">Returning to cart...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="flex-1 bg-neutral-900 flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {/* Customer Selection */}
        <div className="bg-transparent rounded-lg overflow-hidden p-2 relative transition-all duration-300 ease-out hover:bg-neutral-800/20 shadow-sm border border-white/[0.06] hover:border-white/[0.12] mb-2 pt-2 pr-2 pb-2">
            <CustomerSelector
              selectedCustomerId={selectedCustomer?.id}
              onCustomerSelect={setSelectedCustomer}
              placeholder="Search or select customer..."
            />
            {selectedCustomer && (
              <div className="px-2 pb-3 pt-2">
                <div className="text-xs text-neutral-400">
                  <div className="flex justify-between items-center mb-1">
                    <span>{selectedCustomer.display_name || selectedCustomer.name}</span>
                    <CustomerPointsDisplay customerId={selectedCustomer.id} />
                  </div>
                  <div>{selectedCustomer.email}</div>
                </div>
              </div>
            )}
          </div>

        {/* Order Summary - Now has more room */}
        <OrderSummary
          items={items}
          subtotal={subtotal}
          taxRate={taxRate}
          taxAmount={taxAmount}
          total={total}
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
        />
      </div>

      {/* Footer */}
      <div className="px-2 py-4 border-t border-white/[0.06]">
        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 px-3 py-2 bg-gradient-to-r from-red-500/70 to-red-600/70 hover:from-red-500/90 hover:to-red-600/90 disabled:bg-neutral-800 disabled:from-neutral-800 disabled:to-neutral-800 text-white text-sm transition-all duration-300 ease-out rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none disabled:shadow-none"
          >
            Cancel
          </button>
          <button
            onClick={processOrder}
            disabled={isProcessing || (paymentMethod === 'cash' && (cashReceivedNum < total || !cashReceived))}
            className="flex-1 px-3 py-2 bg-gradient-to-r from-green-500/70 to-green-600/70 hover:from-green-500/90 hover:to-green-600/90 disabled:bg-neutral-700 disabled:from-neutral-700 disabled:to-neutral-700 disabled:text-neutral-500 text-white text-sm transition-all duration-300 ease-out font-medium rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none disabled:shadow-none"
          >
            {isProcessing ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 border-2 border-white/80 border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </div>
            ) : (
              `Pay $${total.toFixed(2)}`
            )}
          </button>
        </div>
      </div>
      
      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
      />
      

    </div>
  );
});

CheckoutScreenComponent.displayName = 'CheckoutScreen';

// Export the component directly without any wrappers
// This avoids ref passing issues with lazy loading
export default CheckoutScreenComponent;
