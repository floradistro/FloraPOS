'use client';

import React, { useState, useEffect, Fragment } from 'react';
import { BlueprintPricingData } from '../../services/blueprint-pricing-service';

interface QuantitySelectorProps {
  productId: number;
  basePrice: number;
  blueprintPricing?: BlueprintPricingData | null | undefined;
  onQuantityChange: (quantity: number, price: number, category?: string) => void;
  disabled?: boolean;
  hidePrices?: boolean; // New prop to hide prices in sales view
  selectedPricingTier?: string | null; // New prop to filter by selected pricing tier
  compact?: boolean; // Compact mode for list view
}

export function QuantitySelector({
  productId,
  basePrice,
  blueprintPricing,
  onQuantityChange,
  disabled = false,
  hidePrices = false,
  selectedPricingTier = null,
  compact = false
}: QuantitySelectorProps) {
  const [selectedQuantity, setSelectedQuantity] = useState<number | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Reset selection when pricing data changes
  useEffect(() => {
    setSelectedQuantity(null);
    setSelectedPrice(null);
    setSelectedCategory(null);
  }, [blueprintPricing]);

  // Listen for external clear events (like clicking outside)
  useEffect(() => {
    const handleClearSelections = () => {
      setSelectedQuantity(null);
      setSelectedPrice(null);
      setSelectedCategory(null);
    };

    window.addEventListener('clearQuantitySelections', handleClearSelections);
    return () => {
      window.removeEventListener('clearQuantitySelections', handleClearSelections);
    };
  }, []);

  const handleQuantitySelect = (e: React.MouseEvent, quantity: number, price: number, category?: string) => {
    e.stopPropagation();
    console.log(`🔄 QuantitySelector: Button clicked - quantity: ${quantity}, price: ${price}, category: ${category}, productId: ${productId}`);
    setSelectedQuantity(quantity);
    setSelectedPrice(price);
    setSelectedCategory(category || null);
    onQuantityChange(quantity, price, category);
  };

  const formatPrice = (price: number) => {
    const numPrice = typeof price === 'number' && !isNaN(price) ? price : 0;
    return `$${numPrice.toFixed(2)}`;
  };

  // Check for blueprint pricing FIRST (priority over base price)
  if (!blueprintPricing || !blueprintPricing.ruleGroups || blueprintPricing.ruleGroups.length === 0) {
    // No blueprint pricing - fall back to base price if available
    if (basePrice > 0) {
      return (
        <div className={compact ? 'text-left' : 'text-center'}>
          <button
            onClick={(e) => handleQuantitySelect(e, 1, basePrice)}
            disabled={disabled}
            className={`${compact ? 'min-w-[44px] h-9 px-3' : 'w-16 h-16'} rounded-full text-xs transition-all duration-300 ease-out border flex items-center justify-center ${
              selectedQuantity === 1
                ? 'bg-white/10 text-white font-medium border-white/40 shadow-lg shadow-black/20'
                : 'bg-neutral-800/40 text-neutral-400 hover:bg-neutral-700/60 hover:text-neutral-300 border-neutral-500/30 hover:border-neutral-400/50 hover:shadow-md'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
            title="Add to Cart"
          >
            <div className={`font-medium ${compact ? 'text-[10px]' : 'text-xs'} leading-tight text-center`}>Add</div>
          </button>
        </div>
      );
    }
    
    // No pricing at all
    return (
      <div className={compact ? 'text-left' : 'text-center'}>
        <div className={`${compact ? 'text-[10px]' : 'text-[9px]'} text-neutral-500 mt-1`}>
          No pricing available
        </div>
      </div>
    );
  }


  // Portal2 style pricing display - show only the selected rule group or first matching rule group
  // Filter by selected pricing tier if provided
  const relevantRuleGroup = selectedPricingTier 
    ? blueprintPricing.ruleGroups.find(group => group.ruleName === selectedPricingTier) || blueprintPricing.ruleGroups[0]
    : blueprintPricing.ruleGroups[0]; // Use the first (most relevant) rule group as fallback
  
  if (!relevantRuleGroup || !relevantRuleGroup.tiers || relevantRuleGroup.tiers.length === 0) {
    return (
      <div className={compact ? 'text-left' : 'text-center'}>
        <div className={`${compact ? 'text-[10px]' : 'text-[9px]'} text-neutral-500 mt-1`}>
          No pricing available
        </div>
      </div>
    );
  }

  return (
    <div className={compact ? '' : 'space-y-2'}>
      <div className={compact ? '' : 'space-y-1'}>
        {/* Pricing Tiers for this specific product - Round Buttons */}
        <div className={`flex ${compact ? 'flex-nowrap gap-1.5' : 'flex-wrap gap-2'} ${compact ? 'justify-start' : 'justify-center'}`}>
          {relevantRuleGroup.tiers.map((tier, index) => (
            <Fragment key={`${relevantRuleGroup.ruleId}-${tier.min}`}>
              <button
                onClick={(e) => handleQuantitySelect(e, tier.min, tier.price, relevantRuleGroup.productType)}
                disabled={disabled}
                className={`${compact ? 'min-w-[44px] h-9 px-2' : 'min-w-[50px] h-12 w-12'} rounded-full text-xs transition-all duration-300 ease-out border flex items-center justify-center ${
                  selectedQuantity === tier.min && selectedCategory === relevantRuleGroup.productType
                    ? 'bg-white/10 text-white font-medium border-white/40 shadow-lg shadow-black/20'
                    : 'bg-neutral-800/40 text-neutral-400 hover:bg-neutral-700/60 hover:text-neutral-300 border-neutral-500/30 hover:border-neutral-400/50 hover:shadow-md'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
                title={tier.label}
              >
                <div className={`font-medium ${compact ? 'text-[10px]' : 'text-xs'} leading-tight text-center whitespace-nowrap`}>{tier.label}</div>
              </button>
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}