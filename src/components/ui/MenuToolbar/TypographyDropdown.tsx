/**
 * Typography Dropdown - Canva Style
 * Everything text-related: Fonts, Sizes, Colors
 */

'use client'

import React, { useState } from 'react'
import { ToolbarDropdown } from './ToolbarDropdown'

interface TypographyDropdownProps {
  // Font Families
  titleFont: string
  pricingFont: string
  cardFont: string
  onFontsChange: (fonts: {
    titleFont: string
    pricingFont: string
    cardFont: string
  }) => void
  
  // Font Sizes
  headerTitleSize: number
  cardTitleSize: number
  priceSize: number
  categorySize: number
  onFontSizesChange: (sizes: {
    headerTitleSize: number
    cardTitleSize: number
    priceSize: number
    categorySize: number
  }) => void
  
  // Text Colors
  fontColor: string
  cardFontColor: string
  onTextColorsChange: (colors: {
    fontColor: string
    cardFontColor: string
  }) => void
}

const PRESET_FONTS = [
  { name: 'Tiempo', value: 'Tiempo, serif' },
  { name: 'DonGraffiti', value: 'DonGraffiti, cursive' },
  { name: 'Inter', value: 'Inter, sans-serif' },
  { name: 'Helvetica', value: 'Helvetica, sans-serif' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Roboto', value: 'Roboto, sans-serif' },
  { name: 'SF Pro', value: '-apple-system, BlinkMacSystemFont, sans-serif' },
  { name: 'Courier', value: 'Courier New, monospace' },
]

export function TypographyDropdown({
  titleFont,
  pricingFont,
  cardFont,
  onFontsChange,
  headerTitleSize,
  cardTitleSize,
  priceSize,
  categorySize,
  onFontSizesChange,
  fontColor,
  cardFontColor,
  onTextColorsChange
}: TypographyDropdownProps) {
  const [activeTab, setActiveTab] = useState<'family' | 'sizes' | 'colors'>('family')

  return (
    <ToolbarDropdown
      icon={<></>}
      trigger={
        <div className="flex items-center gap-1.5 px-2.5 h-[28px] cursor-pointer text-white/80 hover:text-white transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
          <span className="text-xs font-medium">Typography</span>
        </div>
      }
    >
      <div className="w-[400px]" style={{ fontFamily: 'Tiempos, serif' }}>
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-4">
          <button
            onClick={() => setActiveTab('family')}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'family'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-white/50 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            Font
          </button>
          <button
            onClick={() => setActiveTab('sizes')}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'sizes'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-white/50 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            Sizes
          </button>
          <button
            onClick={() => setActiveTab('colors')}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all relative overflow-hidden ${
              activeTab === 'colors'
                ? 'text-white shadow-sm'
                : 'text-white/50 hover:text-white/80 hover:bg-white/5'
            }`}
            style={{
              background: activeTab === 'colors' 
                ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(168, 85, 247, 0.15) 50%, rgba(236, 72, 153, 0.15) 100%)'
                : 'transparent'
            }}
          >
            <span className="relative z-10">Colors</span>
            {activeTab === 'colors' && (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 animate-gradient-wave" />
            )}
          </button>
        </div>

        {/* Font Family Tab */}
        {activeTab === 'family' && (
          <div className="space-y-2 max-h-[440px] overflow-y-auto px-1 pb-2" style={{ 
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent'
          }}>
            {PRESET_FONTS.map(font => (
              <button
                key={font.value}
                onClick={() => onFontsChange({ titleFont: font.value, pricingFont: font.value, cardFont: font.value })}
                className={`w-full flex items-center px-4 py-3.5 rounded-xl transition-all ${
                  titleFont === font.value
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'bg-white/[0.02] text-white/70 hover:bg-white/[0.06] hover:text-white/90'
                }`}
              >
                <span className="text-base" style={{ fontFamily: font.value }}>{font.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Sizes Tab */}
        {activeTab === 'sizes' && (
          <div className="space-y-4 px-1 pb-1">
            <div className="px-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/60">Header Title</span>
                <span className="text-[11px] text-white/70 font-mono bg-white/5 px-2 py-0.5 rounded tracking-wide" style={{ fontWeight: 400, letterSpacing: '0.02em' }}>{headerTitleSize}px</span>
              </div>
              <input
                type="range"
                min="20"
                max="120"
                value={headerTitleSize}
                onChange={(e) => onFontSizesChange({ headerTitleSize: parseInt(e.target.value), cardTitleSize, priceSize, categorySize })}
                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider-thumb"
              />
            </div>

            <div className="px-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/60">Card Title</span>
                <span className="text-[11px] text-white/70 font-mono bg-white/5 px-2 py-0.5 rounded tracking-wide" style={{ fontWeight: 400, letterSpacing: '0.02em' }}>{cardTitleSize}px</span>
              </div>
              <input
                type="range"
                min="10"
                max="40"
                value={cardTitleSize}
                onChange={(e) => onFontSizesChange({ headerTitleSize, cardTitleSize: parseInt(e.target.value), priceSize, categorySize })}
                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider-thumb"
              />
            </div>

            <div className="px-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/60">Price</span>
                <span className="text-[11px] text-white/70 font-mono bg-white/5 px-2 py-0.5 rounded tracking-wide" style={{ fontWeight: 400, letterSpacing: '0.02em' }}>{priceSize}px</span>
              </div>
              <input
                type="range"
                min="12"
                max="80"
                value={priceSize}
                onChange={(e) => onFontSizesChange({ headerTitleSize, cardTitleSize, priceSize: parseInt(e.target.value), categorySize })}
                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider-thumb"
              />
            </div>

            <div className="px-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/60">Category</span>
                <span className="text-[11px] text-white/70 font-mono bg-white/5 px-2 py-0.5 rounded tracking-wide" style={{ fontWeight: 400, letterSpacing: '0.02em' }}>{categorySize}px</span>
              </div>
              <input
                type="range"
                min="16"
                max="80"
                value={categorySize}
                onChange={(e) => onFontSizesChange({ headerTitleSize, cardTitleSize, priceSize, categorySize: parseInt(e.target.value) })}
                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider-thumb"
              />
            </div>
          </div>
        )}

        {/* Colors Tab */}
        {activeTab === 'colors' && (
          <div className="space-y-3 px-1 pb-1">
            {/* Main Text Color */}
            <div>
              <label className="text-xs text-white/60 mb-2 block font-medium">Main Text</label>
              <div className="flex items-center gap-2 p-2 bg-white/[0.03] rounded-xl">
                <input
                  type="color"
                  value={fontColor}
                  onChange={(e) => onTextColorsChange({ fontColor: e.target.value, cardFontColor })}
                  className="w-10 h-10 rounded-lg cursor-pointer bg-transparent"
                  style={{ border: 'none' }}
                />
                <input
                  type="text"
                  value={fontColor}
                  onChange={(e) => onTextColorsChange({ fontColor: e.target.value, cardFontColor })}
                  className="flex-1 px-3 py-2 bg-white/5 rounded-lg text-xs text-white/90 font-mono border-0 focus:bg-white/10 focus:outline-none transition-colors"
                  placeholder="#FFFFFF"
                />
              </div>
            </div>

            {/* Card Text Color */}
            <div>
              <label className="text-xs text-white/60 mb-2 block font-medium">Card Text</label>
              <div className="flex items-center gap-2 p-2 bg-white/[0.03] rounded-xl">
                <input
                  type="color"
                  value={cardFontColor}
                  onChange={(e) => onTextColorsChange({ fontColor, cardFontColor: e.target.value })}
                  className="w-10 h-10 rounded-lg cursor-pointer bg-transparent"
                  style={{ border: 'none' }}
                />
                <input
                  type="text"
                  value={cardFontColor}
                  onChange={(e) => onTextColorsChange({ fontColor, cardFontColor: e.target.value })}
                  className="flex-1 px-3 py-2 bg-white/5 rounded-lg text-xs text-white/90 font-mono border-0 focus:bg-white/10 focus:outline-none transition-colors"
                  placeholder="#FFFFFF"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          background: linear-gradient(180deg, #ffffff 0%, #f0f0f0 100%);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
          transition: all 0.15s ease-out;
        }
        .slider-thumb::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          background: #ffffff;
          box-shadow: 0 2px 8px rgba(255, 255, 255, 0.3);
        }
        .slider-thumb::-webkit-slider-thumb:active {
          transform: scale(1.05);
        }
        
        @keyframes gradient-wave {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        
        .animate-gradient-wave {
          background-size: 200% 200%;
          animation: gradient-wave 3s ease infinite;
        }
        
        /* Webkit scrollbar styling */
        div::-webkit-scrollbar {
          width: 6px;
        }
        
        div::-webkit-scrollbar-track {
          background: transparent;
        }
        
        div::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 10px;
        }
        
        div::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.25);
        }
      `}</style>
    </ToolbarDropdown>
  )
}

