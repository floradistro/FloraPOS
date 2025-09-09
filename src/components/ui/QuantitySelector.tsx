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

  const handleQuantitySelect = (quantity: number, price: number, category?: string) => {
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

  // If no blueprint pricing, show base price
  if (!blueprintPricing || !blueprintPricing.ruleGroups || blueprintPricing.ruleGroups.length === 0) {
    return (
      <div className="text-center">
        {!hidePrices && (
          <div className="text-xs font-medium text-neutral-400">
            {formatPrice(basePrice)}
          </div>
        )}
        <div className="text-[9px] text-neutral-500 mt-1">
          No pricing tiers
        </div>
      </div>
    );
  }


  // Portal2 style pricing display - show rule groups
  return (
    <div className="space-y-2">
      {blueprintPricing.ruleGroups.map((ruleGroup) => (
        <div key={ruleGroup.ruleId} className="space-y-1">
          {/* Rule Name Label */}
          <div className="text-[9px] text-neutral-500 font-medium uppercase tracking-wide text-center">
            {ruleGroup.ruleName}
          </div>
          {/* Pricing Tiers for this rule */}
          <div className="flex">
            {ruleGroup.tiers.map((tier, index) => (
              <Fragment key={`${ruleGroup.ruleId}-${tier.min}`}>
                <button
                  onClick={() => handleQuantitySelect(tier.min, tier.price, ruleGroup.productType)}
                  disabled={disabled}
                  className={`flex-1 min-w-0 px-2 py-1.5 text-xs transition-all relative ${
                    selectedQuantity === tier.min && selectedCategory === ruleGroup.productType
                      ? 'bg-white/10 text-neutral-400 font-medium'
                      : 'bg-transparent text-neutral-500 hover:bg-white/5 hover:text-neutral-400'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="font-medium text-sm leading-tight">{tier.label}</div>
                  {!hidePrices && (
                    <div className="text-[8px] text-neutral-600">${tier.price.toFixed(2)}</div>
                  )}
                  {/* Faded vertical divider on the right */}
                  {index < ruleGroup.tiers.length - 1 && (
                    <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
                  )}
                </button>
              </Fragment>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}