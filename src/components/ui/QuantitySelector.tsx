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
                  onClick={(e) => handleQuantitySelect(e, tier.min, tier.price, ruleGroup.productType)}
                  disabled={disabled}
                  className={`flex-1 min-w-0 px-2 py-1.5 text-xs transition-all duration-300 ease-out border ${
                    selectedQuantity === tier.min && selectedCategory === ruleGroup.productType
                      ? 'bg-neutral-600/10 text-neutral-200 font-medium border-neutral-400/60'
                      : 'bg-transparent text-neutral-400 hover:bg-neutral-600/5 hover:text-neutral-200 border-neutral-500/20 hover:border-neutral-400/40'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${index === 0 ? 'rounded-l-lg' : ''} ${index === ruleGroup.tiers.length - 1 ? 'rounded-r-lg' : ''}`}
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
      ))}
    </div>
  );
}