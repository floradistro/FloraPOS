'use client';

import React from 'react';
import { ToolbarDropdown } from './ToolbarDropdown';

interface FontSelectorItemProps {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
}

const FontSelectorItem: React.FC<FontSelectorItemProps> = ({
  label,
  description,
  value,
  onChange
}) => {
  const fonts = [
    'Tiempos, serif',
    'DonGraffiti, sans-serif',
    'Arial, sans-serif',
    'Georgia, serif',
    'Courier New, monospace',
    'Helvetica, sans-serif',
    'Times New Roman, serif',
    'Verdana, sans-serif',
    'Impact, sans-serif',
    'Comic Sans MS, cursive'
  ];

  return (
    <div className="px-4 py-2 hover:bg-neutral-700/60 transition-colors">
      <div className="text-sm font-medium text-white mb-1">{label}</div>
      <div className="text-xs text-neutral-400 mb-2">{description}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-1 bg-neutral-800 border border-neutral-600 rounded text-xs text-white cursor-pointer hover:bg-neutral-700 focus:outline-none focus:border-neutral-500"
        style={{ fontFamily: value }}
      >
        {fonts.map((font) => (
          <option key={font} value={font} style={{ fontFamily: font }}>
            {font.split(',')[0]}
          </option>
        ))}
      </select>
    </div>
  );
};

interface FontDropdownProps {
  titleFont: string;
  pricingFont: string;
  cardFont: string;
  onFontsChange: (fonts: { titleFont: string; pricingFont: string; cardFont: string }) => void;
  iconOnly?: boolean;
}

export const FontDropdown: React.FC<FontDropdownProps> = ({
  titleFont,
  pricingFont,
  cardFont,
  onFontsChange,
  iconOnly = false
}) => {
  return (
    <ToolbarDropdown
      label={iconOnly ? undefined : "Fonts"}
      icon={
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
      }
    >
      <FontSelectorItem
        label="Title Font"
        description="Product/category titles"
        value={titleFont}
        onChange={(value) => onFontsChange({ titleFont: value, pricingFont, cardFont })}
      />
      <FontSelectorItem
        label="Pricing Font"
        description="Price displays"
        value={pricingFont}
        onChange={(value) => onFontsChange({ titleFont, pricingFont: value, cardFont })}
      />
      <FontSelectorItem
        label="Card Font"
        description="Card content text"
        value={cardFont}
        onChange={(value) => onFontsChange({ titleFont, pricingFont, cardFont: value })}
      />
    </ToolbarDropdown>
  );
};
