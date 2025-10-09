'use client';

import React from 'react';
import { ToolbarDropdown } from './ToolbarDropdown';

interface SliderItemProps {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (value: number) => void;
}

const SliderItem: React.FC<SliderItemProps> = ({
  label,
  description,
  value,
  min,
  max,
  step,
  suffix = '',
  onChange
}) => (
  <div className="px-4 py-3">
    <div className="flex items-center justify-between mb-2">
      <div>
        <div className="text-sm font-medium text-white">{label}</div>
        <div className="text-xs text-neutral-400">{description}</div>
      </div>
      <div className="text-sm font-mono font-bold text-white bg-neutral-700 px-2 py-1 rounded">
        {value}{suffix}
      </div>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
      style={{
        background: `linear-gradient(to right, #10b981 0%, #10b981 ${((value - min) / (max - min)) * 100}%, #374151 ${((value - min) / (max - min)) * 100}%, #374151 100%)`
      }}
    />
    <div className="flex justify-between text-xs text-neutral-500 mt-1">
      <span>{min}{suffix}</span>
      <span>{max}{suffix}</span>
    </div>
  </div>
);

interface TransparencyDropdownProps {
  containerOpacity: number;
  borderWidth: number;
  borderOpacity: number;
  imageOpacity: number;
  blurIntensity: number;
  glowIntensity?: number;
  onTransparencyChange: (values: { 
    containerOpacity: number; 
    borderWidth: number; 
    borderOpacity: number;
    imageOpacity: number;
    blurIntensity: number;
    glowIntensity?: number;
  }) => void;
}

export const TransparencyDropdown: React.FC<TransparencyDropdownProps> = ({
  containerOpacity,
  borderWidth,
  borderOpacity,
  imageOpacity,
  blurIntensity,
  glowIntensity = 40,
  onTransparencyChange
}) => {
  return (
    <ToolbarDropdown
      label={undefined}
      icon={
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      }
    >
      <div className="space-y-2 py-2">
        <SliderItem
          label="Container Opacity"
          description="Table/card transparency"
          value={containerOpacity}
          min={0}
          max={100}
          step={5}
          suffix="%"
          onChange={(value) => onTransparencyChange({ containerOpacity: value, borderWidth, borderOpacity, imageOpacity, blurIntensity, glowIntensity })}
        />
        <div className="border-t border-neutral-700"></div>
        <SliderItem
          label="Glow Intensity"
          description="Text glow/halo strength"
          value={glowIntensity}
          min={0}
          max={100}
          step={5}
          suffix="px"
          onChange={(value) => onTransparencyChange({ containerOpacity, borderWidth, borderOpacity, imageOpacity, blurIntensity, glowIntensity: value })}
        />
        <SliderItem
          label="Blur Intensity"
          description="Glass blur effect strength"
          value={blurIntensity}
          min={0}
          max={24}
          step={2}
          suffix="px"
          onChange={(value) => onTransparencyChange({ containerOpacity, borderWidth, borderOpacity, imageOpacity, blurIntensity: value, glowIntensity })}
        />
        <SliderItem
          label="Image Opacity"
          description="Product image transparency"
          value={imageOpacity}
          min={0}
          max={100}
          step={5}
          suffix="%"
          onChange={(value) => onTransparencyChange({ containerOpacity, borderWidth, borderOpacity, imageOpacity: value, blurIntensity, glowIntensity })}
        />
        <SliderItem
          label="Border Width"
          description="Border thickness"
          value={borderWidth}
          min={0}
          max={10}
          step={1}
          suffix="px"
          onChange={(value) => onTransparencyChange({ containerOpacity, borderWidth: value, borderOpacity, imageOpacity, blurIntensity, glowIntensity })}
        />
        <SliderItem
          label="Border Opacity"
          description="Border transparency"
          value={borderOpacity}
          min={0}
          max={100}
          step={5}
          suffix="%"
          onChange={(value) => onTransparencyChange({ containerOpacity, borderWidth, borderOpacity: value, imageOpacity, blurIntensity, glowIntensity })}
        />
      </div>
    </ToolbarDropdown>
  );
};

