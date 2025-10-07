'use client';

import React from 'react';
import { ToolbarDropdown } from './ToolbarDropdown';

interface ColorPickerItemProps {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
}

const ColorPickerItem: React.FC<ColorPickerItemProps> = ({
  label,
  description,
  value,
  onChange
}) => (
  <div className="flex items-center justify-between px-4 py-2 hover:bg-neutral-700/60 transition-colors">
    <div>
      <div className="text-sm font-medium text-white">{label}</div>
      <div className="text-xs text-neutral-400">{description}</div>
    </div>
    <input
      type="color"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-8 h-8 rounded border border-neutral-600 cursor-pointer"
    />
  </div>
);

interface ColorDropdownProps {
  backgroundColor: string;
  fontColor: string;
  containerColor: string;
  cardFontColor: string;
  imageBackgroundColor: string;
  onColorsChange: (colors: { 
    backgroundColor: string; 
    fontColor: string; 
    containerColor: string;
    cardFontColor: string;
    imageBackgroundColor: string;
  }) => void;
}

export const ColorDropdown: React.FC<ColorDropdownProps> = ({
  backgroundColor,
  fontColor,
  containerColor,
  cardFontColor,
  imageBackgroundColor,
  onColorsChange
}) => {
  return (
    <ToolbarDropdown
      label="Colors"
      icon={
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5a2 2 0 00-2 2v12a4 4 0 004 4h2a2 2 0 002-2V5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 3h2a2 2 0 012 2v12a4 4 0 01-4 4h-2a2 2 0 01-2-2V5a2 2 0 012-2z" />
        </svg>
      }
    >
      <ColorPickerItem
        label="Background"
        description="Menu background color"
        value={backgroundColor}
        onChange={(value) => onColorsChange({ backgroundColor: value, fontColor, containerColor, cardFontColor, imageBackgroundColor })}
      />
      <ColorPickerItem
        label="Text Color"
        description="Primary text color"
        value={fontColor}
        onChange={(value) => onColorsChange({ backgroundColor, fontColor: value, containerColor, cardFontColor, imageBackgroundColor })}
      />
      <ColorPickerItem
        label="Container"
        description="Card container color"
        value={containerColor}
        onChange={(value) => onColorsChange({ backgroundColor, fontColor, containerColor: value, cardFontColor, imageBackgroundColor })}
      />
      <ColorPickerItem
        label="Card Font"
        description="Card text color"
        value={cardFontColor}
        onChange={(value) => onColorsChange({ backgroundColor, fontColor, containerColor, cardFontColor: value, imageBackgroundColor })}
      />
      <ColorPickerItem
        label="Image Background"
        description="Product image background"
        value={imageBackgroundColor}
        onChange={(value) => onColorsChange({ backgroundColor, fontColor, containerColor, cardFontColor, imageBackgroundColor: value })}
      />
    </ToolbarDropdown>
  );
};
