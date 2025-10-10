/**
 * Design Dropdown - Canva Style
 * Combines Colors, Fonts, and Sizes into one rich visual panel
 */

'use client'

import React, { useState } from 'react'
import { ToolbarDropdown } from './ToolbarDropdown'

interface DesignDropdownProps {
  // Colors
  backgroundColor: string
  fontColor: string
  containerColor: string
  cardFontColor: string
  imageBackgroundColor: string
  onColorsChange: (colors: {
    backgroundColor: string
    fontColor: string
    containerColor: string
    cardFontColor: string
    imageBackgroundColor: string
  }) => void
  
  // Fonts
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
}

const PRESET_FONTS = [
  { name: 'Tiempos', value: 'Tiempos, serif', style: 'Elegant Serif' },
  { name: 'Don Graffiti', value: 'Don Graffiti, cursive', style: 'Playful Script' },
  { name: 'Inter', value: 'Inter, sans-serif', style: 'Modern Sans' },
  { name: 'Helvetica', value: 'Helvetica, sans-serif', style: 'Clean Sans' },
]

export function DesignDropdown({
  backgroundColor,
  fontColor,
  containerColor,
  cardFontColor,
  imageBackgroundColor,
  onColorsChange,
  titleFont,
  pricingFont,
  cardFont,
  onFontsChange,
  headerTitleSize,
  cardTitleSize,
  priceSize,
  categorySize,
  onFontSizesChange
}: DesignDropdownProps) {
  const [activeTab, setActiveTab] = useState<'colors' | 'typography'>('colors')

  return (
    <ToolbarDropdown
      trigger={
        <div className="flex items-center gap-1.5 px-2.5 h-[28px] cursor-pointer">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          <span className="text-xs font-medium">Design</span>
        </div>
      }
    >
      <div className="w-[380px]" style={{ fontFamily: 'Tiempos, serif' }}>
        {/* Tabs */}
        <div className="flex border-b border-white/10 mb-3">
          <button
            onClick={() => setActiveTab('colors')}
            className={`flex-1 px-4 py-2.5 text-xs font-medium transition-all ${
              activeTab === 'colors'
                ? 'text-white border-b-2 border-white'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            Colors
          </button>
          <button
            onClick={() => setActiveTab('typography')}
            className={`flex-1 px-4 py-2.5 text-xs font-medium transition-all ${
              activeTab === 'typography'
                ? 'text-white border-b-2 border-white'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            Typography
          </button>
        </div>

        {/* Colors Tab */}
        {activeTab === 'colors' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {/* Background Color */}
              <div>
                <label className="text-xs text-white/60 mb-1.5 block font-medium">Background</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => onColorsChange({ backgroundColor: e.target.value, fontColor, containerColor, cardFontColor, imageBackgroundColor })}
                    className="w-10 h-10 rounded-lg border-2 border-white/20 cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => onColorsChange({ backgroundColor: e.target.value, fontColor, containerColor, cardFontColor, imageBackgroundColor })}
                    className="flex-1 px-2 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-white/90 font-mono"
                  />
                </div>
              </div>

              {/* Text Color */}
              <div>
                <label className="text-xs text-white/60 mb-1.5 block font-medium">Text</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={fontColor}
                    onChange={(e) => onColorsChange({ backgroundColor, fontColor: e.target.value, containerColor, cardFontColor, imageBackgroundColor })}
                    className="w-10 h-10 rounded-lg border-2 border-white/20 cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={fontColor}
                    onChange={(e) => onColorsChange({ backgroundColor, fontColor: e.target.value, containerColor, cardFontColor, imageBackgroundColor })}
                    className="flex-1 px-2 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-white/90 font-mono"
                  />
                </div>
              </div>

              {/* Container Color */}
              <div>
                <label className="text-xs text-white/60 mb-1.5 block font-medium">Container</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={containerColor}
                    onChange={(e) => onColorsChange({ backgroundColor, fontColor, containerColor: e.target.value, cardFontColor, imageBackgroundColor })}
                    className="w-10 h-10 rounded-lg border-2 border-white/20 cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={containerColor}
                    onChange={(e) => onColorsChange({ backgroundColor, fontColor, containerColor: e.target.value, cardFontColor, imageBackgroundColor })}
                    className="flex-1 px-2 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-white/90 font-mono"
                  />
                </div>
              </div>

              {/* Card Text Color */}
              <div>
                <label className="text-xs text-white/60 mb-1.5 block font-medium">Card Text</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={cardFontColor}
                    onChange={(e) => onColorsChange({ backgroundColor, fontColor, containerColor, cardFontColor: e.target.value, imageBackgroundColor })}
                    className="w-10 h-10 rounded-lg border-2 border-white/20 cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={cardFontColor}
                    onChange={(e) => onColorsChange({ backgroundColor, fontColor, containerColor, cardFontColor: e.target.value, imageBackgroundColor })}
                    className="flex-1 px-2 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-white/90 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Image Background */}
            <div>
              <label className="text-xs text-white/60 mb-1.5 block font-medium">Image Background</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={imageBackgroundColor}
                  onChange={(e) => onColorsChange({ backgroundColor, fontColor, containerColor, cardFontColor, imageBackgroundColor: e.target.value })}
                  className="w-10 h-10 rounded-lg border-2 border-white/20 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={imageBackgroundColor}
                  onChange={(e) => onColorsChange({ backgroundColor, fontColor, containerColor, cardFontColor, imageBackgroundColor: e.target.value })}
                  className="flex-1 px-2 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-white/90 font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* Typography Tab */}
        {activeTab === 'typography' && (
          <div className="space-y-4">
            {/* Font Families */}
            <div>
              <label className="text-xs text-white/60 mb-2 block font-medium">Font Family</label>
              <div className="space-y-2">
                {PRESET_FONTS.map(font => (
                  <button
                    key={font.value}
                    onClick={() => onFontsChange({ titleFont: font.value, pricingFont: font.value, cardFont: font.value })}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all ${
                      titleFont === font.value
                        ? 'bg-white/10 border-white/30 text-white'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <span className="text-sm font-medium" style={{ fontFamily: font.value }}>{font.name}</span>
                    <span className="text-xs text-white/50">{font.style}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Sizes - Visual Sliders */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <label className="text-xs text-white/60 font-medium">Text Sizes</label>
              
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-white/70">Header Title</span>
                  <span className="text-xs text-white/90 font-mono bg-white/5 px-2 py-0.5 rounded">{headerTitleSize}px</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="120"
                  value={headerTitleSize}
                  onChange={(e) => onFontSizesChange({ headerTitleSize: parseInt(e.target.value), cardTitleSize, priceSize, categorySize })}
                  className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer slider-thumb"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-white/70">Card Title</span>
                  <span className="text-xs text-white/90 font-mono bg-white/5 px-2 py-0.5 rounded">{cardTitleSize}px</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="40"
                  value={cardTitleSize}
                  onChange={(e) => onFontSizesChange({ headerTitleSize, cardTitleSize: parseInt(e.target.value), priceSize, categorySize })}
                  className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer slider-thumb"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-white/70">Price</span>
                  <span className="text-xs text-white/90 font-mono bg-white/5 px-2 py-0.5 rounded">{priceSize}px</span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="80"
                  value={priceSize}
                  onChange={(e) => onFontSizesChange({ headerTitleSize, cardTitleSize, priceSize: parseInt(e.target.value), categorySize })}
                  className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer slider-thumb"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-white/70">Category</span>
                  <span className="text-xs text-white/90 font-mono bg-white/5 px-2 py-0.5 rounded">{categorySize}px</span>
                </div>
                <input
                  type="range"
                  min="16"
                  max="80"
                  value={categorySize}
                  onChange={(e) => onFontSizesChange({ headerTitleSize, cardTitleSize, priceSize, categorySize: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer slider-thumb"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 14px;
          height: 14px;
          background: white;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
        .slider-thumb::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 2px 12px rgba(255, 255, 255, 0.4);
        }
      `}</style>
    </ToolbarDropdown>
  )
}

