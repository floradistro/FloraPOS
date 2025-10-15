'use client';

import React from 'react';
import { ToolbarDropdown } from './ToolbarDropdown';
import { DropdownItem, DropdownSeparator } from './DropdownItem';

interface PricingDropdownProps {
  pricingTiersShape: 'circle' | 'rectangle';
  onPricingShapeChange: (shape: 'circle' | 'rectangle') => void;
  priceSize: number;
  onPriceSizeChange: (size: number) => void;
  pricingFont: string;
  onPricingFontChange: (font: string) => void;
  fontColor: string;
  containerColor: string;
  pricingContainerOpacity: number;
  pricingBorderWidth: number;
  pricingBorderOpacity: number;
  onColorsChange?: (colors: { fontColor?: string; containerColor?: string }) => void;
  onPricingTransparencyChange?: (values: { pricingContainerOpacity?: number; pricingBorderWidth?: number; pricingBorderOpacity?: number }) => void;
}

const POPULAR_FONTS = [
  { name: 'Tiempos', value: 'Tiempos, serif' },
  { name: 'SF Pro', value: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif' },
  { name: 'Inter', value: 'Inter, sans-serif' },
  { name: 'Helvetica', value: 'Helvetica Neue, Helvetica, Arial, sans-serif' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Playfair', value: 'Playfair Display, serif' },
  { name: 'Roboto', value: 'Roboto, sans-serif' },
  { name: 'Montserrat', value: 'Montserrat, sans-serif' },
];

export const PricingDropdown: React.FC<PricingDropdownProps> = ({
  pricingTiersShape,
  onPricingShapeChange,
  priceSize,
  onPriceSizeChange,
  pricingFont,
  onPricingFontChange,
  fontColor,
  containerColor,
  pricingContainerOpacity,
  pricingBorderWidth,
  pricingBorderOpacity,
  onColorsChange,
  onPricingTransparencyChange
}) => {
  return (
    <ToolbarDropdown
      label={undefined}
      icon={
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
      trigger={
        <div className="flex items-center gap-1.5 px-2.5 h-[28px] cursor-pointer text-white/80 hover:text-white transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-medium tracking-wide">Pricing</span>
        </div>
      }
      isActive={true}
    >
      <div className="w-[340px] max-h-[600px] overflow-y-auto space-y-4 p-4" style={{
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent'
      }}>
        {/* Shape Selection */}
        <div>
          <div className="text-xs text-white/60 font-medium mb-3 tracking-wide uppercase">Tier Style</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onPricingShapeChange('circle')}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                pricingTiersShape === 'circle'
                  ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/20'
                  : 'bg-white/[0.02] text-white/60 hover:bg-white/[0.06] hover:text-white/80'
              }`}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" strokeWidth={2} />
              </svg>
              <span className="text-[11px] font-medium">Circle</span>
            </button>
            <button
              onClick={() => onPricingShapeChange('rectangle')}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                pricingTiersShape === 'rectangle'
                  ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/20'
                  : 'bg-white/[0.02] text-white/60 hover:bg-white/[0.06] hover:text-white/80'
              }`}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="7" width="18" height="10" rx="2" strokeWidth={2} />
              </svg>
              <span className="text-[11px] font-medium">Rectangle</span>
            </button>
          </div>
        </div>

        <DropdownSeparator />

        {/* Price Font Size */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-white/70 font-medium tracking-wide">Price Font Size</label>
            <span className="text-xs text-white/50 font-mono">{priceSize}px</span>
          </div>
          <input
            type="range"
            min="16"
            max="80"
            value={priceSize}
            onChange={(e) => onPriceSizeChange(parseInt(e.target.value))}
            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.2) ${((priceSize - 16) / (80 - 16)) * 100}%, rgba(255,255,255,0.05) ${((priceSize - 16) / (80 - 16)) * 100}%, rgba(255,255,255,0.05) 100%)`
            }}
          />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-white/40">Small (16px)</span>
            <span className="text-[10px] text-white/40">Large (80px)</span>
          </div>
          <div className="text-[10px] text-white/40 mt-2">
            💡 Container auto-adjusts to fit text
          </div>
        </div>

        <DropdownSeparator />

        {/* Font Selection */}
        <div>
          <label className="text-xs text-white/70 font-medium mb-2 block tracking-wide">Pricing Font</label>
          <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto" style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent'
          }}>
            {POPULAR_FONTS.map((font) => (
              <button
                key={font.value}
                onClick={() => onPricingFontChange(font.value)}
                className={`px-3 py-2 rounded-lg text-left transition-all text-xs ${
                  pricingFont === font.value
                    ? 'bg-white/10 text-white ring-1 ring-white/20'
                    : 'bg-white/[0.02] text-white/60 hover:bg-white/[0.06] hover:text-white/80'
                }`}
                style={{ fontFamily: font.value }}
              >
                {font.name}
              </button>
            ))}
          </div>
        </div>

        <DropdownSeparator />

        {/* Container Background Color */}
        {onColorsChange && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-white/70 font-medium tracking-wide">Container Color</label>
              <input
                type="color"
                value={containerColor}
                onChange={(e) => onColorsChange({ containerColor: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer border border-white/20"
              />
            </div>
            <input
              type="text"
              value={containerColor}
              onChange={(e) => onColorsChange({ containerColor: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-white/30"
              placeholder="#000000"
            />
          </div>
        )}

        <DropdownSeparator />

        {/* Pricing Container Opacity */}
        {onPricingTransparencyChange && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-white/70 font-medium tracking-wide">Tier Opacity</label>
              <span className="text-xs text-white/50 font-mono">{pricingContainerOpacity}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={pricingContainerOpacity}
              onChange={(e) => onPricingTransparencyChange({ pricingContainerOpacity: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.2) ${pricingContainerOpacity}%, rgba(255,255,255,0.05) ${pricingContainerOpacity}%, rgba(255,255,255,0.05) 100%)`
              }}
            />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-white/40">Transparent</span>
              <span className="text-[10px] text-white/40">Solid</span>
            </div>
          </div>
        )}

        <DropdownSeparator />

        {/* Pricing Border Controls */}
        {onPricingTransparencyChange && (
          <>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-white/70 font-medium tracking-wide">Tier Border Width</label>
                <span className="text-xs text-white/50 font-mono">{pricingBorderWidth}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="8"
                value={pricingBorderWidth}
                onChange={(e) => onPricingTransparencyChange({ pricingBorderWidth: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.2) ${(pricingBorderWidth / 8) * 100}%, rgba(255,255,255,0.05) ${(pricingBorderWidth / 8) * 100}%, rgba(255,255,255,0.05) 100%)`
                }}
              />
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-white/40">None</span>
                <span className="text-[10px] text-white/40">Thick (8px)</span>
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-white/70 font-medium tracking-wide">Tier Border Opacity</label>
                <span className="text-xs text-white/50 font-mono">{pricingBorderOpacity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={pricingBorderOpacity}
                onChange={(e) => onPricingTransparencyChange({ pricingBorderOpacity: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.2) ${pricingBorderOpacity}%, rgba(255,255,255,0.05) ${pricingBorderOpacity}%, rgba(255,255,255,0.05) 100%)`
                }}
              />
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-white/40">Invisible</span>
                <span className="text-[10px] text-white/40">Solid</span>
              </div>
            </div>
          </>
        )}

        <DropdownSeparator />

        {/* Quick Color Presets */}
        {onColorsChange && (
          <div>
            <div className="text-xs text-white/60 font-medium mb-3 tracking-wide uppercase">Quick Presets</div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onColorsChange({ fontColor: '#ffffff', containerColor: '#000000' })}
                className="px-2 py-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] transition-all text-[10px] text-white/60 hover:text-white/80"
              >
                <div className="w-full h-6 rounded mb-1 bg-gradient-to-br from-black to-gray-800 border border-white/10"></div>
                Dark
              </button>
              <button
                onClick={() => onColorsChange({ fontColor: '#000000', containerColor: '#ffffff' })}
                className="px-2 py-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] transition-all text-[10px] text-white/60 hover:text-white/80"
              >
                <div className="w-full h-6 rounded mb-1 bg-gradient-to-br from-white to-gray-100 border border-white/10"></div>
                Light
              </button>
              <button
                onClick={() => onColorsChange({ fontColor: '#ffd700', containerColor: '#1a1a1a' })}
                className="px-2 py-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] transition-all text-[10px] text-white/60 hover:text-white/80"
              >
                <div className="w-full h-6 rounded mb-1 bg-gradient-to-br from-yellow-500 to-yellow-600 border border-white/10"></div>
                Gold
              </button>
            </div>
          </div>
        )}

        <style jsx>{`
          .slider::-webkit-slider-thumb {
            appearance: none;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: white;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          }
          .slider::-moz-range-thumb {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: white;
            cursor: pointer;
            border: none;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          }
        `}</style>
      </div>
    </ToolbarDropdown>
  );
};

