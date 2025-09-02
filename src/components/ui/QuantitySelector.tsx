'use client';

import React, { useState, useEffect } from 'react';
import { BlueprintPricingData } from '../../services/blueprint-pricing-service';

interface QuantitySelectorProps {
  productId: number;
  basePrice: number;
  blueprintPricing?: BlueprintPricingData | null | undefined;
  onQuantityChange: (quantity: number, price: number, category?: string) => void;
  disabled?: boolean;
}

export function QuantitySelector({
  productId,
  basePrice,
  blueprintPricing,
  onQuantityChange,
  disabled = false
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
        <div className="text-xs font-medium text-neutral-400">
          {formatPrice(basePrice)}
        </div>
        <div className="text-[9px] text-neutral-500 mt-1">
          No pricing tiers
        </div>
      </div>
    );
  }

  // Helper function to get category display name
  const getCategoryLabel = (category: string) => {
    switch (category.toLowerCase()) {
      case 'flower': return 'Flower (g)';
      case 'preroll': return 'Pre-Roll (units)';
      case 'vape': return 'Vape (units)';
      case 'edible': return 'Edible (units)';
      case 'concentrate': return 'Concentrate (g)';
      case 'gram': return 'Grams';
      case 'eighth': return 'Eighth';
      default: return category.charAt(0).toUpperCase() + category.slice(1);
    }
  };

  // Portal2 style pricing display - show rule groups
  return (
    <div className="space-y-2">
      {blueprintPricing.ruleGroups.map((ruleGroup) => (
        <div key={ruleGroup.ruleId} className="space-y-1">
          {/* Rule Name Label */}
          <div className="text-[9px] text-neutral-500 font-medium uppercase tracking-wide">
            {ruleGroup.ruleName}
            {ruleGroup.productType && (
              <span className="text-neutral-600 ml-1">
                ({getCategoryLabel(ruleGroup.productType)})
              </span>
            )}
          </div>
          {/* Pricing Tiers for this rule */}
          <div className="flex">
            {ruleGroup.tiers.map((tier, index) => (
              <button
                key={`${ruleGroup.ruleId}-${tier.min}`}
                onClick={() => handleQuantitySelect(tier.min, tier.price, ruleGroup.productType)}
                disabled={disabled}
                className={`flex-1 min-w-0 px-1.5 py-1 text-xs transition-all ${
                  selectedQuantity === tier.min && selectedCategory === ruleGroup.productType
                    ? 'bg-white/10 text-neutral-400 font-medium'
                    : 'bg-transparent text-neutral-500 hover:bg-white/5 hover:text-neutral-400'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${
                  index < ruleGroup.tiers.length - 1 ? 'border-r border-white/10' : ''
                }`}
              >
                <div className="font-medium text-[10px] leading-tight">{tier.label}</div>
                <div className="text-[8px] text-neutral-600">${tier.price.toFixed(2)}</div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}