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

    try {
      // Generate order number
      const orderNum = `POS-${Date.now()}`;
      
      // Get location ID from mapping
      const locationId = LOCATION_MAPPINGS[user?.location || 'Default']?.id || LOCATION_MAPPINGS['Default'].id;
      
      // Map cart items to include WooCommerce product IDs for rewards integration
      const mappedLineItems = await Promise.all(items.map(async item => {
        const wooCommerceProductId = await ProductMappingService.findWooCommerceProductId(item.name);
        const productId = wooCommerceProductId || item.product_id || parseInt(item.id);
        
        // Calculate final price after overrides and discounts
        let finalPrice = item.override_price !== undefined ? item.override_price : item.price;
        if (item.discount_percentage !== undefined && item.discount_percentage > 0) {
          finalPrice = finalPrice * (1 - item.discount_percentage / 100);
        }
        
        const lineItem: any = {
          product_id: productId,
          name: item.name,
          quantity: item.quantity,
          subtotal: (finalPrice * item.quantity).toFixed(2),
          total: (finalPrice * item.quantity).toFixed(2),
          sku: item.sku || item.id,
          meta_data: [
            {
              key: '_actual_quantity',
              value: item.quantity.toString() // Store the actual quantity (e.g., 3.5g)
            },
            {
              key: '_actual_price',
              value: finalPrice.toString() // Store the final price per unit after overrides/discounts
            },
            {
              key: '_original_price',
              value: item.price.toString() // Store the original price before overrides
            }
          ], // Initialize meta_data array for line item
        };
          
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


      
      // Create order via API
      const response = await apiFetch('/api/orders', {
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
        } catch (jsonError) {
          const errorText = await response.text().catch(() => 'Unknown error');
          errorMessage = `Server error: ${errorText.substring(0, 100)}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();



      // Complete the order and award points using native WooCommerce Points & Rewards logic
      if (result.data?.id) {
        try {
          // First, mark the order as completed and paid (POS transactions are immediate)
          const completeResponse = await apiFetch(`/api/orders/${result.data.id}`, {
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
          
          // Award points using native WooCommerce logic
          const pointsResponse = await apiFetch('/api/orders/award-points-native', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderId: result.data.id,
              customerId: selectedCustomer?.id || null
            }),
          });
          
          if (!pointsResponse.ok) {
            console.error('❌ Points award failed:', pointsResponse.status);
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
        setAlertModal({
          isOpen: true,
          title: 'Inventory Warning',
          message: `Order completed but inventory deduction failed: ${inventoryResult.error}`
        });
      }

      // Complete the order and close checkout
      try {
        await onOrderComplete();
      } catch (error) {
        console.error('Error during order completion:', error);
      }
      
      onClose();

    } catch (error) {
      console.error('Order processing failed:', error);
      
      setAlertModal({
        isOpen: true,
        title: 'Order Failed',
        message: `Failed to process order: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsProcessing(false);
    }
  };


  return (
    <div ref={ref} className="flex-1 bg-gradient-to-br from-neutral-900/40 via-neutral-800/30 to-neutral-900/40 backdrop-blur-xl flex flex-col h-full border-l border-white/[0.08] shadow-2xl">
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-600/50 scrollbar-track-transparent hover:scrollbar-thumb-neutral-500/50">

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
      <div className="px-4 py-4 border-t border-white/[0.08] bg-gradient-to-t from-neutral-900/60 to-transparent backdrop-blur-md">
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 px-5 py-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-red-500/40 text-neutral-300 hover:text-red-300 text-base font-medium transition-all duration-300 ease-out rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
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
            className="flex-1 px-5 py-3 bg-gradient-to-r from-neutral-700/50 to-neutral-600/50 hover:from-neutral-600/60 hover:to-neutral-500/60 backdrop-blur-md border border-white/10 hover:border-white/20 text-neutral-100 hover:text-white text-base font-bold transition-all duration-300 ease-out rounded-xl shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:text-neutral-500"
          >
            {isProcessing ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-white/80 border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
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
