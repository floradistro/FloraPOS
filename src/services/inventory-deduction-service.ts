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
    console.log(`🔍 Starting inventory deduction for order ${orderId}, location ${locationId}, ${cartItems.length} items`);
    const deductedItems: any[] = [];
    
    try {
      for (const item of cartItems) {
        console.log(`📦 Processing item: ${item.name} (qty: ${item.quantity})`);
        if (item.pricing_tier?.conversion_ratio) {
          console.log(`⚖️ Has conversion ratio:`, item.pricing_tier.conversion_ratio);
        }
        const result = await this.deductInventoryForItem(item, locationId, orderId);
        if (!result.success) {
          // Rollback previous deductions if one fails
          await this.rollbackDeductions(deductedItems, locationId);
          return {
            success: false,
            error: `Failed to deduct inventory for ${item.name}: ${result.error}`
          };
        }
        if (result.deductedItem) {
          deductedItems.push(result.deductedItem);
        }
      }
      
      return {
        success: true,
        deductedItems
      };
    } catch (error) {
      // Rollback any successful deductions
      await this.rollbackDeductions(deductedItems, locationId);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during inventory deduction'
      };
    }
  }

  /**
   * Deduct inventory for a single item
   */
  private static async deductInventoryForItem(
    item: CartItem, 
    locationId: number, 
    orderId: string | number
  ): Promise<{ success: boolean; error?: string; deductedItem?: any }> {
    try {
      const productId = item.product_id || parseInt(item.id);
      const variationId = item.is_variant && item.variation_id ? item.variation_id : 0;

      // Step 1: Get current inventory level
      const currentStock = await this.getCurrentInventory(productId, locationId, variationId);
      if (currentStock === null) {
        return {
          success: false,
          error: `Could not retrieve current inventory for ${item.name}`
        };
      }

      // Step 2: Apply conversion ratio if present
      const deductionResult = this.calculateDeductionAmount(item);
      if (!deductionResult.success) {
        return {
          success: false,
          error: deductionResult.error
        };
      }

      const actualDeductionAmount = deductionResult.deductionAmount!;

      // Step 3: Calculate new stock level
      const newStock = Math.max(0, currentStock - actualDeductionAmount);

      // Log the inventory operation
      console.log(`Inventory deduction: "${item.name}" - Current: ${currentStock.toFixed(3)}, Deducting: ${actualDeductionAmount.toFixed(3)}, New: ${newStock.toFixed(3)}`);

      // Warn if deduction exceeds current stock
      if (actualDeductionAmount > currentStock) {
        console.warn(`OVERSELLING: Deduction (${actualDeductionAmount.toFixed(3)}) exceeds current stock (${currentStock.toFixed(3)})`);
      }

      // Step 4: Update inventory via Magic2 API
      const updateResult = await this.updateInventory(productId, locationId, newStock, variationId);
      if (!updateResult.success) {
        return {
          success: false,
          error: updateResult.error
        };
      }

      // Log successful deduction
      console.log(`✅ Successfully deducted inventory for "${item.name}" at location ${locationId}`);

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
      console.error(`Error deducting inventory for ${item.name}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
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
          console.warn(`Capped deduction amount from ${calculatedAmount} to ${actualDeductionAmount} for safety`);
        }

        // Log conversion ratio application
        console.log(`Conversion ratio applied: "${item.name}" - ${item.quantity} ${conversionRatio.output_unit} = ${actualDeductionAmount.toFixed(3)} ${conversionRatio.input_unit}`);

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
   * Get current inventory level for a product at a location
   */
  private static async getCurrentInventory(
    productId: number, 
    locationId: number, 
    variationId: number = 0
  ): Promise<number | null> {
    try {
      const params = new URLSearchParams({
        product_id: productId.toString(),
        location_id: locationId.toString(),
        ...(variationId ? { variation_id: variationId.toString() } : {})
      });

      const response = await fetch(`/api/proxy/flora-im/inventory?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        console.error(`Failed to fetch current inventory:`, response.status);
        return null;
      }

      const data = await response.json();
      let currentStock = 0;

      if (Array.isArray(data)) {
        const inventoryRecord = data.find(inv => 
          parseInt(inv.product_id) === productId && 
          parseInt(inv.location_id) === locationId &&
          parseInt(inv.variation_id || 0) === variationId
        );
        currentStock = inventoryRecord ? parseFloat(inventoryRecord.quantity || inventoryRecord.available_quantity || 0) : 0;
      } else if (data.success && data.data) {
        const inventoryRecord = data.data.find((inv: any) => 
          parseInt(inv.product_id) === productId && 
          parseInt(inv.location_id) === locationId &&
          parseInt(inv.variation_id || 0) === variationId
        );
        currentStock = inventoryRecord ? parseFloat(inventoryRecord.quantity || inventoryRecord.available_quantity || 0) : 0;
      }

      return currentStock;
    } catch (error) {
      console.error('Error fetching current inventory:', error);
      return null;
    }
  }

  /**
   * Update inventory level via Magic2 API
   */
  private static async updateInventory(
    productId: number,
    locationId: number,
    newStock: number,
    variationId: number = 0
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData = {
        product_id: productId,
        location_id: locationId,
        quantity: newStock,
        ...(variationId ? { variation_id: variationId } : {})
      };

      const response = await fetch('/api/proxy/flora-im/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `Failed to update inventory: ${response.status}`
        };
      }

      return { success: true };
    } catch (error) {
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
    console.log('🔄 Rolling back inventory deductions...');
    
    for (const item of deductedItems) {
      try {
        // Restore the original stock level
        await this.updateInventory(
          item.product_id, 
          locationId, 
          item.old_stock, 
          item.variation_id
        );
        console.log(`✅ Rolled back inventory for product ${item.product_id}`);
      } catch (error) {
        console.error(`❌ Failed to rollback inventory for product ${item.product_id}:`, error);
      }
    }
  }
}
