/**
 * Cart Service - Centralized cart management logic
 * Extracted from page.tsx for better maintainability and testability
 */

import { CartItem } from '../types';
import { Product } from '../components/ui/ProductGrid';
import { reportUserActionError } from '../lib/errorReporting';

export interface CartItemCreationResult {
  success: boolean;
  cartItem?: CartItem;
  error?: string;
}

export class CartService {
  /**
   * Create a cart item from a product with all the complex logic
   * Handles variants, pricing tiers, and conversion ratios
   */
  static createCartItemFromProduct(product: Product): CartItemCreationResult {
    try {
      // Portal2 style - use selected pricing or fallback to regular price
      const selectedQuantity = product.selected_quantity || 1;
      
      // CRITICAL FIX: Use blueprint pricing if available, otherwise fall back to regular_price
      let selectedPrice = product.selected_price;
      
      if (!selectedPrice || selectedPrice === 0) {
        // Try to get price from blueprint pricing if available
        if (product.blueprintPricing && product.blueprintPricing.ruleGroups && product.blueprintPricing.ruleGroups.length > 0) {
          // Use the first tier from the first rule group as default
          const firstRuleGroup = product.blueprintPricing.ruleGroups[0];
          const firstTier = firstRuleGroup?.tiers?.[0];
          if (firstTier && firstTier.price) {
            selectedPrice = parseFloat(firstTier.price.toString());
            console.log(`📊 Using blueprint price for ${product.name}: $${selectedPrice}`);
          }
        }
        
        // Fall back to regular_price
        if (!selectedPrice || selectedPrice === 0) {
          selectedPrice = parseFloat(product.regular_price) || 0;
        }
        
        // VALIDATION: Prevent $0.00 products from being added to cart
        if (selectedPrice === 0) {
          console.error(`❌ Product ${product.name} has no price set!`, {
            regular_price: product.regular_price,
            selected_price: product.selected_price,
            blueprintPricing: product.blueprintPricing
          });
          throw new Error(`Cannot add "${product.name}" to cart: Product has no price set. Please set a price in WooCommerce or configure blueprint pricing.`);
        }
      }
      
      const selectedCategory = product.selected_category;

      // Calculate per-unit price (in case the selected price is for multiple units)
      const perUnitPrice = selectedPrice / selectedQuantity;

      // Create unique ID and properly track product/variant IDs
      const itemDetails = this.createItemIdentification(product);
      
      // Extract pricing tier information if available
      const pricingTier = this.extractPricingTier(product, selectedQuantity, selectedCategory, perUnitPrice);

      const cartItem: CartItem = {
        id: itemDetails.itemId,
        name: itemDetails.itemName,
        price: perUnitPrice,
        quantity: selectedQuantity,
        image: product.image,
        sku: product.sku,
        category: selectedCategory,
        product_id: itemDetails.productId,
        variation_id: itemDetails.variationId,
        is_variant: itemDetails.isVariant,
        pricing_tier: pricingTier
      };

      return {
        success: true,
        cartItem
      };

    } catch (error) {
      reportUserActionError(
        error instanceof Error ? error : new Error('Unknown add to cart error'),
        'addToCart',
        { 
          productId: product.id, 
          productName: product.name,
          selectedQuantity: product.selected_quantity,
          selectedPrice: product.selected_price
        }
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error creating cart item'
      };
    }
  }

  /**
   * Create item identification details (ID, name, product/variant IDs)
   */
  private static createItemIdentification(product: Product): {
    itemId: string;
    itemName: string;
    productId: number;
    variationId: number | undefined;
    isVariant: boolean;
  } {
    let itemId: string;
    let itemName: string;
    let productId: number;
    let variationId: number | undefined;
    let isVariant: boolean = false;

    // Check if this is a variant product (has parent_id)
    if ((product as any).parent_id) {
      // This is a variant
      isVariant = true;
      productId = (product as any).parent_id; // Use parent product ID
      variationId = product.id;               // Use variant ID as variation_id
      itemId = `variant-${productId}-${variationId}`;
      itemName = product.name; // Already includes variant info
    } else {
      // Regular product
      productId = product.id;
      itemId = product.selected_category 
        ? `${product.id}-${product.selected_category}` 
        : product.id.toString();
      itemName = product.name;
    }
    
    // CRITICAL VALIDATION: Ensure productId is valid
    if (!productId || isNaN(productId) || productId <= 0) {
      console.error('❌ CartService: Invalid product ID detected', {
        product_id: product.id,
        product_name: product.name,
        product_type: product.type,
        parent_id: (product as any).parent_id,
        calculated_productId: productId
      });
      throw new Error(`Cannot add "${product.name}" to cart: Invalid product ID`);
    }

    return {
      itemId,
      itemName,
      productId,
      variationId,
      isVariant
    };
  }

  /**
   * Extract pricing tier information from blueprint pricing
   */
  private static extractPricingTier(
    product: Product, 
    selectedQuantity: number, 
    selectedCategory: string | undefined, 
    perUnitPrice: number
  ): CartItem['pricing_tier'] | undefined {
    
    if (!product.blueprintPricing || !selectedQuantity || !selectedCategory) {
      return undefined;
    }

    // Find the matching tier from blueprint pricing
    let foundTier = null;
    let foundRuleGroup = null;
    
    for (const ruleGroup of product.blueprintPricing.ruleGroups) {
      // Check all tiers in this rule group for exact quantity + price match
      const matchingTier = ruleGroup.tiers.find(tier => {
        return this.validateTierMatch(tier, selectedQuantity, perUnitPrice);
      });
      
      if (matchingTier) {
        foundTier = matchingTier;
        foundRuleGroup = ruleGroup;
        
        // For Pre-Roll specifically, prioritize if selected category matches
        if (ruleGroup.ruleName === 'Pre-Roll' && selectedCategory === 'preroll') {
          break; // Perfect match, stop searching
        }
      }
    }
    
    if (foundTier && foundRuleGroup) {
      const validatedConversionRatio = this.validateConversionRatio(foundTier.conversion_ratio, selectedQuantity);
      
      return {
        tier_label: foundTier.label || 'Unknown Tier',
        tier_rule_name: foundRuleGroup.ruleName || 'Unknown Rule',
        tier_price: perUnitPrice,
        tier_quantity: selectedQuantity,
        tier_category: selectedCategory,
        // Only include validated conversion ratio
        ...(validatedConversionRatio ? {
          conversion_ratio: validatedConversionRatio
        } : {})
      };
    }

    return undefined;
  }

  /**
   * Validate if a tier matches the selected quantity and price
   */
  private static validateTierMatch(tier: any, selectedQuantity: number, perUnitPrice: number): boolean {
    // Validate tier data
    if (!tier || typeof tier.min !== 'number' || typeof tier.price !== 'number') {
      return false;
    }
    
    const quantityMatch = tier.min === selectedQuantity;
    
    // Price matching with multiple strategies
    let priceMatch = false;
    
    try {
      // Validate inputs
      if (selectedQuantity <= 0 || tier.price < 0 || perUnitPrice < 0) {
        return false;
      }
      
      const totalTierPrice = tier.price;
      const perUnitTierPrice = totalTierPrice / selectedQuantity;
      
      // Strategy 1: Total price match (user selected total vs tier total)
      const totalProductPrice = perUnitPrice * selectedQuantity;
      const priceMatchTotal = Math.abs(tier.price - totalProductPrice) < 0.01;
      
      // Strategy 2: Per-unit price match (calculate tier per-unit vs product per-unit)
      const priceMatchPerUnit = Math.abs(perUnitTierPrice - perUnitPrice) < 0.01;
      
      // Strategy 3: Looser tolerance for floating point precision issues
      const priceMatchLoose = Math.abs(perUnitTierPrice - perUnitPrice) < 0.1;
      
      if (priceMatchTotal || priceMatchPerUnit || (priceMatchLoose && quantityMatch)) {
        priceMatch = true;
      }
      
    } catch (error) {
      return false;
    }
    
    return quantityMatch && priceMatch;
  }

  /**
   * Validate and sanitize conversion ratio data
   */
  private static validateConversionRatio(conversionRatio: any, selectedQuantity: number): any {
    if (!conversionRatio) return null;

    const cr = conversionRatio;
    
    // Comprehensive validation
    const isValid = 
      cr &&
      typeof cr.input_amount === 'number' &&
      typeof cr.output_amount === 'number' &&
      cr.input_amount > 0 &&
      cr.output_amount > 0 &&
      !isNaN(cr.input_amount) &&
      !isNaN(cr.output_amount) &&
      cr.input_unit &&
      cr.output_unit &&
      typeof cr.input_unit === 'string' &&
      typeof cr.output_unit === 'string';
        
    if (!isValid) return null;

    const validatedRatio = {
      input_amount: cr.input_amount,
      input_unit: cr.input_unit,
      output_amount: cr.output_amount, 
      output_unit: cr.output_unit,
      description: cr.description || ''
    };
    
    // Calculate and validate deduction amount
    const deductionAmount = selectedQuantity * validatedRatio.input_amount / validatedRatio.output_amount;
    if (deductionAmount <= 0 || isNaN(deductionAmount) || !isFinite(deductionAmount)) {
      return null;
    }

    return validatedRatio;
  }

  /**
   * Merge cart item into existing cart array
   * Returns new cart array with merged/added item
   */
  static mergeCartItem(existingItems: CartItem[], newItem: CartItem): CartItem[] {
    const existingItem = existingItems.find(item => item.id === newItem.id);
    
    if (existingItem) {
      // Merge quantities for existing item
      return existingItems.map(item =>
        item.id === newItem.id 
          ? { ...item, quantity: item.quantity + newItem.quantity }
          : item
      );
    } else {
      // Add new item
      return [...existingItems, newItem];
    }
  }

  /**
   * Update item quantity in cart (remove if 0)
   */
  static updateItemQuantity(items: CartItem[], itemId: string, quantity: number): CartItem[] {
    if (quantity <= 0) {
      return items.filter(item => item.id !== itemId);
    } else {
      return items.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      );
    }
  }

  /**
   * Remove item from cart
   */
  static removeItem(items: CartItem[], itemId: string): CartItem[] {
    return items.filter(item => item.id !== itemId);
  }

  /**
   * Calculate cart totals with price overrides and discounts
   */
  static calculateCartTotals(items: CartItem[]): {
    totalItems: number;
    totalPrice: number;
  } {
    return {
      totalItems: items.reduce((total, item) => total + item.quantity, 0),
      totalPrice: items.reduce((total, item) => {
        // Use override price if set, otherwise use original price
        let finalPrice = item.override_price !== undefined ? item.override_price : item.price;
        
        // Apply discount if set
        if (item.discount_percentage !== undefined && item.discount_percentage > 0) {
          finalPrice = finalPrice * (1 - item.discount_percentage / 100);
        }
        
        return total + (finalPrice * item.quantity);
      }, 0)
    };
  }

  /**
   * Validate cart before checkout
   */
  static validateCart(items: CartItem[]): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (items.length === 0) {
      errors.push('Cart is empty');
    }

    // Check for invalid quantities or prices
    items.forEach(item => {
      if (item.quantity <= 0) {
        errors.push(`Invalid quantity for ${item.name}`);
      }
      if (item.price < 0) {
        errors.push(`Invalid price for ${item.name}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
