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
}

export function QuantitySelector({
  productId,
  basePrice,
  blueprintPricing,
  onQuantityChange,
  disabled = false,
  hidePrices = false
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

  // If product has a specific price set, show only that price (not blueprint pricing)
  if (basePrice > 0) {
    return (
      <div className="text-center">
        {!hidePrices && (
          <div className="text-xs font-medium text-neutral-400">
            {formatPrice(basePrice)}
          </div>
        )}
        <button
          onClick={(e) => handleQuantitySelect(e, 1, basePrice)}
          disabled={disabled}
          className={`px-3 py-1.5 text-xs transition-all duration-300 ease-out border rounded-lg ${
            selectedQuantity === 1
              ? 'bg-neutral-600/10 text-neutral-200 font-medium border-neutral-400/60'
              : 'bg-transparent text-neutral-400 hover:bg-neutral-600/5 hover:text-neutral-200 border-neutral-500/20 hover:border-neutral-400/40'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          Add to Cart
        </button>
      </div>
    );
  }

  // If no blueprint pricing, show fallback
  if (!blueprintPricing || !blueprintPricing.ruleGroups || blueprintPricing.ruleGroups.length === 0) {
    return (
      <div className="text-center">
        <div className="text-[9px] text-neutral-500 mt-1">
          No pricing available
        </div>
      </div>
    );
  }


  // Portal2 style pricing display - show only the first matching rule group for this specific product
  // This prevents showing all pricing tiers for every product
  const relevantRuleGroup = blueprintPricing.ruleGroups[0]; // Use the first (most relevant) rule group
  
  if (!relevantRuleGroup || !relevantRuleGroup.tiers || relevantRuleGroup.tiers.length === 0) {
    return (
      <div className="text-center">
        <div className="text-[9px] text-neutral-500 mt-1">
          No pricing available
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        {/* Rule Name Label - Only show if there are multiple rule groups */}
        {blueprintPricing.ruleGroups.length > 1 && (
          <div className="text-[9px] text-neutral-500 font-medium uppercase tracking-wide text-center">
            {relevantRuleGroup.ruleName}
          </div>
        )}
        {/* Pricing Tiers for this specific product */}
        <div className="flex">
          {relevantRuleGroup.tiers.map((tier, index) => (
            <Fragment key={`${relevantRuleGroup.ruleId}-${tier.min}`}>
              <button
                onClick={(e) => handleQuantitySelect(e, tier.min, tier.price, relevantRuleGroup.productType)}
                disabled={disabled}
                className={`flex-1 min-w-0 px-2 py-1.5 text-xs transition-all duration-300 ease-out border ${
                  selectedQuantity === tier.min && selectedCategory === relevantRuleGroup.productType
                    ? 'bg-neutral-600/10 text-neutral-200 font-medium border-neutral-400/60'
                    : 'bg-transparent text-neutral-400 hover:bg-neutral-600/5 hover:text-neutral-200 border-neutral-500/20 hover:border-neutral-400/40'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${index === 0 ? 'rounded-l-lg' : ''} ${index === relevantRuleGroup.tiers.length - 1 ? 'rounded-r-lg' : ''}`}
              >
                <div className="font-medium text-sm leading-tight">{tier.label}</div>
                {!hidePrices && (
                  <div className="text-[8px] text-neutral-600">${tier.price.toFixed(2)}</div>
                )}
              </button>
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}