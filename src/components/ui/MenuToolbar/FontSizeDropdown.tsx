/**
 * Font Size Dropdown - Control font sizes for all text elements
 */

'use client'

import React from 'react'
import { ToolbarDropdown } from './ToolbarDropdown'
import { DropdownItem } from './DropdownItem'

interface FontSizeDropdownProps {
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
  iconOnly?: boolean
}

export const FontSizeDropdown: React.FC<FontSizeDropdownProps> = ({
  headerTitleSize,
  cardTitleSize,
  priceSize,
  categorySize,
  onFontSizesChange,
  iconOnly = false
}) => {
  return (
    <ToolbarDropdown
      label={iconOnly ? undefined : "Font Size"}
      icon={
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      }
    >
      <div className="w-80 p-4 space-y-4">
        {/* Header Title Size */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-neutral-300">Header Title</label>
            <span className="text-xs text-neutral-500">{headerTitleSize}px</span>
          </div>
          <input
            type="range"
            min="20"
            max="300"
            step="4"
            value={headerTitleSize}
            onChange={(e) => onFontSizesChange({
              headerTitleSize: parseInt(e.target.value),
              cardTitleSize,
              priceSize,
              categorySize
            })}
            className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-[10px] text-neutral-500 mt-1">
            <span>20px</span>
            <span>300px</span>
          </div>
        </div>

        {/* Card/Row Title Size */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-neutral-300">Product Names</label>
            <span className="text-xs text-neutral-500">{cardTitleSize}px</span>
          </div>
          <input
            type="range"
            min="10"
            max="200"
            step="2"
            value={cardTitleSize}
            onChange={(e) => onFontSizesChange({
              headerTitleSize,
              cardTitleSize: parseInt(e.target.value),
              priceSize,
              categorySize
            })}
            className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-[10px] text-neutral-500 mt-1">
            <span>10px</span>
            <span>200px</span>
          </div>
        </div>

        {/* Price Size */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-neutral-300">Prices</label>
            <span className="text-xs text-neutral-500">{priceSize}px</span>
          </div>
          <input
            type="range"
            min="12"
            max="250"
            step="2"
            value={priceSize}
            onChange={(e) => onFontSizesChange({
              headerTitleSize,
              cardTitleSize,
              priceSize: parseInt(e.target.value),
              categorySize
            })}
            className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-[10px] text-neutral-500 mt-1">
            <span>12px</span>
            <span>250px</span>
          </div>
        </div>

        {/* Category Header Size */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-neutral-300">Category Headers</label>
            <span className="text-xs text-neutral-500">{categorySize}px</span>
          </div>
          <input
            type="range"
            min="16"
            max="200"
            step="2"
            value={categorySize}
            onChange={(e) => onFontSizesChange({
              headerTitleSize,
              cardTitleSize,
              priceSize,
              categorySize: parseInt(e.target.value)
            })}
            className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-[10px] text-neutral-500 mt-1">
            <span>16px</span>
            <span>200px</span>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="border-t border-neutral-700 pt-3 space-y-2">
          <div className="text-[10px] text-neutral-400 uppercase tracking-wider mb-2">Quick Presets</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onFontSizesChange({
                headerTitleSize: 60,
                cardTitleSize: 18,
                priceSize: 32,
                categorySize: 40
              })}
              className="px-2 py-1.5 bg-neutral-700/50 hover:bg-neutral-700 text-neutral-300 text-xs rounded transition-colors"
            >
              Default
            </button>
            <button
              onClick={() => onFontSizesChange({
                headerTitleSize: 180,
                cardTitleSize: 60,
                priceSize: 120,
                categorySize: 80
              })}
              className="px-2 py-1.5 bg-neutral-700/50 hover:bg-neutral-700 text-neutral-300 text-xs rounded transition-colors"
            >
              Large
            </button>
            <button
              onClick={() => onFontSizesChange({
                headerTitleSize: 260,
                cardTitleSize: 100,
                priceSize: 180,
                categorySize: 120
              })}
              className="px-2 py-1.5 bg-neutral-700/50 hover:bg-neutral-700 text-neutral-300 text-xs rounded transition-colors col-span-2"
            >
              Extra Large
            </button>
          </div>
        </div>
      </div>
    </ToolbarDropdown>
  )
}

