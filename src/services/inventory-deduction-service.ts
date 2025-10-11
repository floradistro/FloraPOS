import { apiFetch } from '../lib/api-fetch';
/**
 * Inventory Deduction Service
 * Handles stock deduction with conversion ratios from BluePrints plugin
 */

import { CartItem } from '../types';

export interface InventoryDeductionResult {
  success: boolean;
  error?: string;
  deductedItems?: Array<{
    product_id: number;
    variation_id: number;
    quantity_sold: number;
    quantity_deducted: number;
    conversion_applied: boolean;
    conversion_ratio?: any;
  }>;
}

export class InventoryDeductionService {
  
  /**
   * Deduct inventory for all items in an order
   */
  static async deductInventoryForOrder(
    cartItems: CartItem[], 
    locationId: number, 
    orderId: string | number
  ): Promise<InventoryDeductionResult> {
    const deductedItems: any[] = [];
    
    // Validate inputs
    if (!cartItems || cartItems.length === 0) {
      return {
        success: false,
        error: 'No items to process for inventory deduction'
      };
    }

    if (!locationId || locationId <= 0) {
      return {
        success: false,
        error: 'Invalid location ID for inventory deduction'
      };
    }
    
    try {
      console.log(`📦 Processing inventory for ${cartItems.length} items at location ${locationId}`);
      
      for (let i = 0; i < cartItems.length; i++) {
        const item = cartItems[i];
        console.log(`📦 [${i + 1}/${cartItems.length}] Processing: ${item.name} (qty: ${item.quantity})`);
        
        const result = await this.deductInventoryForItem(item, locationId, orderId);
        if (!result.success) {
          console.error(`❌ Deduction failed for ${item.name}, rolling back all changes`);
          // Rollback previous deductions if one fails
          await this.rollbackDeductions(deductedItems, locationId);
          return {
            success: false,
            error: `Failed to deduct inventory for ${item.name}: ${result.error}`
          };
        }
        if (result.deductedItem) {
          deductedItems.push(result.deductedItem);
          console.log(`✅ [${i + 1}/${cartItems.length}] Deducted: ${result.deductedItem.quantity_deducted} units`);
        }
      }
      
      console.log(`✅ All ${deductedItems.length} items processed successfully`);
      return {
        success: true,
        deductedItems
      };
    } catch (error) {
      console.error('❌ Critical error during inventory deduction:', error);
      // Rollback any successful deductions
      if (deductedItems.length > 0) {
        console.log(`🔄 Rolling back ${deductedItems.length} successful deductions...`);
        await this.rollbackDeductions(deductedItems, locationId);
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during inventory deduction'
      };
    }
  }

  /**
   * Deduct inventory for a single item with validation
   */
  private static async deductInventoryForItem(
    item: CartItem, 
    locationId: number, 
    orderId: string | number
  ): Promise<{ success: boolean; error?: string; deductedItem?: any }> {
    try {
      // Validate item data
      if (!item || !item.name) {
        return { success: false, error: 'Invalid item data' };
      }
      
      if (!item.quantity || item.quantity <= 0 || isNaN(item.quantity)) {
        return { success: false, error: `Invalid quantity for ${item.name}: ${item.quantity}` };
      }
      
      const productId = item.product_id || parseInt(item.id);
      if (!productId || productId <= 0 || isNaN(productId)) {
        return { success: false, error: `Invalid product ID for ${item.name}` };
      }
      
      const variationId = item.is_variant && item.variation_id ? item.variation_id : 0;

      // Step 1: Get current inventory level
      console.log(`📊 Checking current stock for ${item.name} (Product: ${productId}, Variation: ${variationId || 'N/A'})`);
      const currentStock = await this.getCurrentInventory(productId, locationId, variationId);
      if (currentStock === null) {
        return {
          success: false,
          error: `Could not retrieve current inventory for ${item.name}. Cannot proceed without knowing current stock.`
        };
      }
      console.log(`📊 Current stock: ${currentStock.toFixed(2)}`);

      // Step 2: Calculate deduction amount (apply conversion ratio if present)
      const deductionResult = this.calculateDeductionAmount(item);
      if (!deductionResult.success) {
        return {
          success: false,
          error: deductionResult.error
        };
      }

      const actualDeductionAmount = deductionResult.deductionAmount!;
      console.log(`📊 Deduction amount: ${actualDeductionAmount.toFixed(2)}`);

      // Step 3: Calculate new stock level
      const newStock = Math.max(0, currentStock - actualDeductionAmount);

      // Warn if deduction exceeds current stock (but allow it to prevent blocking sales)
      if (actualDeductionAmount > currentStock) {
        console.warn(`⚠️ OVERSELLING: ${item.name} - Deducting ${actualDeductionAmount.toFixed(2)} but only ${currentStock.toFixed(2)} in stock. New stock will be 0.`);
      }

      // Step 4: Update inventory via Magic2 API
      console.log(`📝 Updating inventory: ${currentStock.toFixed(2)} → ${newStock.toFixed(2)}`);
      const updateResult = await this.updateInventory(productId, locationId, newStock, variationId);
      if (!updateResult.success) {
        return {
          success: false,
          error: updateResult.error || 'Failed to update inventory in database'
        };
      }

      console.log(`✅ Successfully deducted inventory for ${item.name}`);

      return {
        success: true,
        deductedItem: {
          product_id: productId,
          variation_id: variationId,
          quantity_sold: item.quantity,
          quantity_deducted: actualDeductionAmount,
          conversion_applied: !!item.pricing_tier?.conversion_ratio,
          conversion_ratio: item.pricing_tier?.conversion_ratio,
          old_stock: currentStock,
          new_stock: newStock
        }
      };

    } catch (error) {
      console.error(`❌ Exception deducting inventory for ${item.name}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during inventory deduction'
      };
    }
  }

  /**
   * Calculate the actual amount to deduct from inventory based on conversion ratios
   */
  private static calculateDeductionAmount(item: CartItem): {
    success: boolean;
    deductionAmount?: number;
    error?: string;
  } {
    let actualDeductionAmount = item.quantity;

    // Check if conversion ratio is required for this item type
    const requiresConversionRatio = this.requiresConversionRatio(item);

    if (requiresConversionRatio && !item.pricing_tier?.conversion_ratio) {
      return {
        success: false,
        error: `${item.name} requires conversion ratio but none found. Sale blocked to prevent inventory errors.`
      };
    }

    if (item.pricing_tier?.conversion_ratio) {
      const conversionRatio = item.pricing_tier.conversion_ratio;

      try {
        // Validate conversion ratio data
        if (!conversionRatio.input_amount || !conversionRatio.output_amount ||
            typeof conversionRatio.input_amount !== 'number' ||
            typeof conversionRatio.output_amount !== 'number' ||
            conversionRatio.input_amount <= 0 ||
            conversionRatio.output_amount <= 0 ||
            isNaN(conversionRatio.input_amount) ||
            isNaN(conversionRatio.output_amount)) {
          throw new Error(`Invalid conversion ratio data: ${JSON.stringify(conversionRatio)}`);
        }

        // Validate item quantity
        if (!item.quantity || typeof item.quantity !== 'number' || 
            item.quantity <= 0 || isNaN(item.quantity)) {
          throw new Error(`Invalid item quantity: ${item.quantity}`);
        }

        // Calculate actual amount to deduct from inventory
        const calculatedAmount = (item.quantity * conversionRatio.input_amount) / conversionRatio.output_amount;

        // Validate the calculation result
        if (isNaN(calculatedAmount) || !isFinite(calculatedAmount) || calculatedAmount <= 0) {
          throw new Error(`Invalid deduction calculation result: ${calculatedAmount}`);
        }

        // Cap deduction to reasonable maximum (safety net)
        const maxReasonableDeduction = item.quantity * 10; // No more than 10x the sold quantity
        actualDeductionAmount = Math.min(calculatedAmount, maxReasonableDeduction);

        if (actualDeductionAmount !== calculatedAmount) {
          console.warn(`⚠️ Capped deduction for ${item.name}: ${calculatedAmount} → ${actualDeductionAmount}`);
        }

      } catch (error) {
        return {
          success: false,
          error: `Invalid conversion ratio for ${item.name}. Transaction blocked to prevent inventory errors.`
        };
      }
    } else if (requiresConversionRatio) {
      return {
        success: false,
        error: `${item.name} inventory calculation failed. No valid conversion ratio found.`
      };
    }

    return {
      success: true,
      deductionAmount: actualDeductionAmount
    };
  }

  /**
   * Check if an item requires a conversion ratio
   */
  private static requiresConversionRatio(item: CartItem): boolean {
    return item.pricing_tier?.tier_rule_name === 'Pre-Roll' || 
           item.category === 'preroll' ||
           (!!item.pricing_tier?.tier_rule_name && 
            item.pricing_tier.tier_rule_name.toLowerCase().includes('roll'));
  }

  /**
   * Get current inventory level for a product at a location with retry logic
   */
  private static async getCurrentInventory(
    productId: number, 
    locationId: number, 
    variationId: number = 0,
    retryCount: number = 0
  ): Promise<number | null> {
    const maxRetries = 2;
    
    try {
      // Validate inputs
      if (!productId || productId <= 0) {
        console.error('Invalid product ID for inventory check');
        return null;
      }
      if (!locationId || locationId <= 0) {
        console.error('Invalid location ID for inventory check');
        return null;
      }
      
      const params = new URLSearchParams({
        product_id: productId.toString(),
        location_id: locationId.toString(),
        ...(variationId && variationId > 0 ? { variation_id: variationId.toString() } : {})
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      let response;
      try {
        response = await apiFetch(`/api/proxy/flora-im/inventory?${params}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal
        });
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          if (retryCount < maxRetries) {
            console.warn(`⏱️ Inventory fetch timed out, retrying (${retryCount + 1}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return this.getCurrentInventory(productId, locationId, variationId, retryCount + 1);
          }
          console.error('Inventory fetch timed out after retries');
          return null;
        }
        throw fetchError;
      }
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`Failed to fetch current inventory: ${response.status}`);
        // Retry on 500 errors
        if (response.status >= 500 && retryCount < maxRetries) {
          console.warn(`⚠️ Server error (${response.status}), retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return this.getCurrentInventory(productId, locationId, variationId, retryCount + 1);
        }
        return null;
      }

      const data = await response.json();
      let currentStock = 0;

      // Handle different response formats from the API
      if (Array.isArray(data)) {
        const inventoryRecord = data.find(inv => 
          parseInt(inv.product_id) === productId && 
          parseInt(inv.location_id) === locationId &&
          parseInt(inv.variation_id || 0) === variationId
        );
        currentStock = inventoryRecord ? parseFloat(inventoryRecord.quantity || inventoryRecord.available_quantity || 0) : 0;
      } else if (data.success && data.data) {
        if (Array.isArray(data.data)) {
          const inventoryRecord = data.data.find((inv: any) => 
            parseInt(inv.product_id) === productId && 
            parseInt(inv.location_id) === locationId &&
            parseInt(inv.variation_id || 0) === variationId
          );
          currentStock = inventoryRecord ? parseFloat(inventoryRecord.quantity || inventoryRecord.available_quantity || 0) : 0;
        } else if (typeof data.data === 'object') {
          currentStock = parseFloat(data.data.quantity || data.data.available_quantity || 0);
        }
      }

      // Validate the stock value
      if (isNaN(currentStock) || !isFinite(currentStock)) {
        console.error('Invalid stock value returned from API');
        return null;
      }

      return Math.max(0, currentStock); // Ensure non-negative
    } catch (error) {
      console.error('Error fetching current inventory:', error);
      // Retry on exception
      if (retryCount < maxRetries) {
        console.warn(`🔄 Retrying inventory fetch (${retryCount + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.getCurrentInventory(productId, locationId, variationId, retryCount + 1);
      }
      return null;
    }
  }

  /**
   * Update inventory level via Magic2 API with retry logic
   */
  private static async updateInventory(
    productId: number,
    locationId: number,
    newStock: number,
    variationId: number = 0,
    retryCount: number = 0
  ): Promise<{ success: boolean; error?: string }> {
    const maxRetries = 3;
    
    try {
      // Validate inputs
      if (!productId || productId <= 0) {
        return { success: false, error: 'Invalid product ID' };
      }
      if (!locationId || locationId <= 0) {
        return { success: false, error: 'Invalid location ID' };
      }
      if (newStock < 0) {
        return { success: false, error: 'Invalid stock quantity (negative)' };
      }
      
      const updateData = {
        product_id: productId,
        location_id: locationId,
        quantity: parseFloat(newStock.toFixed(2)), // Round to 2 decimal places
        ...(variationId && variationId > 0 ? { variation_id: variationId } : {})
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      let response;
      try {
        response = await apiFetch('/api/proxy/flora-im/inventory', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
          signal: controller.signal
        });
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          // Retry on timeout
          if (retryCount < maxRetries) {
            console.warn(`⏱️ Inventory update timed out, retrying (${retryCount + 1}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
            return this.updateInventory(productId, locationId, newStock, variationId, retryCount + 1);
          }
          return { success: false, error: 'Inventory update timed out after multiple retries' };
        }
        throw fetchError;
      }
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.message || errorData.error || `API returned ${response.status}`;
        
        // Retry on 500 errors
        if (response.status >= 500 && retryCount < maxRetries) {
          console.warn(`⚠️ Server error (${response.status}), retrying (${retryCount + 1}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          return this.updateInventory(productId, locationId, newStock, variationId, retryCount + 1);
        }
        
        return {
          success: false,
          error: `Failed to update inventory: ${errorMsg}`
        };
      }

      const responseData = await response.json();
      if (responseData.success === false) {
        return {
          success: false,
          error: responseData.error || responseData.message || 'API returned success:false'
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Exception in updateInventory:', error);
      
      // Retry on network errors
      if (retryCount < maxRetries) {
        console.warn(`🔄 Retrying inventory update (${retryCount + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return this.updateInventory(productId, locationId, newStock, variationId, retryCount + 1);
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error updating inventory'
      };
    }
  }

  /**
   * Rollback inventory deductions in case of failure
   */
  private static async rollbackDeductions(
    deductedItems: any[], 
    locationId: number
  ): Promise<void> {
    for (const item of deductedItems) {
      try {
        await this.updateInventory(
          item.product_id, 
          locationId, 
          item.old_stock, 
          item.variation_id
        );
      } catch (error) {
        console.error(`❌ Rollback failed for product ${item.product_id}:`, error);
      }
    }
  }
}
