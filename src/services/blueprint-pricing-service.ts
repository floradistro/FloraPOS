/**
 * Blueprint Pricing Service - Portal2 Implementation for POSV1
 * Standardized with unified API client
 */

import { api } from '../lib/api-client';

export interface BlueprintPricingTier {
  min: number;
  max?: number | null;
  price: number;
  unit: string;
  label: string;
  ruleName?: string; // Added to track which rule this tier comes from
  conversion_ratio?: {
    input_amount: number;
    input_unit: string;
    output_amount: number;
    output_unit: string;
    description?: string;
  };
}

export interface BlueprintPricingRuleGroup {
  ruleName: string;
  ruleId: string;
  productType?: string;
  tiers: BlueprintPricingTier[];
}

export interface BlueprintPricingData {
  productId: number;
  blueprintId: number;
  blueprintName: string;
  ruleGroups: BlueprintPricingRuleGroup[];
}

export class BlueprintPricingService {
  /**
   * Get blueprint pricing for a product using its category IDs
   */
  static async getBlueprintPricing(productId: number, categoryIds: number[] = []): Promise<BlueprintPricingData | null> {
    try {
      // Use batch API for consistency
      const results = await this.getBlueprintPricingBatch([{ id: productId, categoryIds }]);
      return results[productId] || null;
    } catch (error) {
      console.error('Error getting blueprint pricing:', error);
      return null;
    }
  }



  /**
   * Batch fetch blueprint pricing for multiple products - optimized for performance
   * Uses unified API client with built-in caching and error handling
   */
  static async getBlueprintPricingBatch(products: Array<{id: number, categoryIds: number[]}>): Promise<Record<number, BlueprintPricingData | null>> {
    try {
      const result = await api.blueprintPricing(products);
      return result.data || {};
    } catch (error) {
      console.error('Blueprint pricing batch error:', error);
      // Return empty results on error to prevent breaking the app
      const emptyResults: Record<number, BlueprintPricingData | null> = {};
      for (const product of products) {
        emptyResults[product.id] = null;
      }
      return emptyResults;
    }
  }

  // Legacy method name for compatibility
  static async getBlueprintPricingForProduct(productId: number, categoryIds: number[] = []): Promise<BlueprintPricingData | null> {
    return this.getBlueprintPricing(productId, categoryIds);
  }
}