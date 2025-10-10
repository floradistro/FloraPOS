/**
 * Layout Dropdown Enhanced - Canva Style
 * Combines Menu Mode, Orientation, Display Settings
 */

'use client'

import React from 'react'
import { ToolbarDropdown } from './ToolbarDropdown'

interface LayoutDropdownEnhancedProps {
  isDualMode: boolean
  onModeChange: (isDual: boolean) => void
  orientation: 'horizontal' | 'vertical'
  onOrientationChange: (orientation: 'horizontal' | 'vertical') => void
  currentViewMode: 'table' | 'card' | 'auto'
  onViewModeChange: (mode: 'table' | 'card' | 'auto') => void
  showImages: boolean
  onShowImagesChange: (show: boolean) => void
  priceLocation: 'none' | 'header' | 'inline'
  onPriceLocationChange: (location: 'none' | 'header' | 'inline') => void
}

export function LayoutDropdownEnhanced({
  isDualMode,
  onModeChange,
  orientation,
  onOrientationChange,
  currentViewMode,
  onViewModeChange,
  showImages,
  onShowImagesChange,
  priceLocation,
  onPriceLocationChange
}: LayoutDropdownEnhancedProps) {
  return (
    <ToolbarDropdown
      trigger={
        <div className="flex items-center gap-1.5 px-2.5 h-[28px] cursor-pointer">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
          </svg>
          <span className="text-xs font-medium">Layout</span>
        </div>
      }
    >
      <div className="w-[280px] space-y-4" style={{ fontFamily: 'Tiempos, serif' }}>
        {/* Menu Mode */}
        <div>
          <label className="text-xs text-white/60 mb-2 block font-medium">Menu Mode</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onModeChange(false)}
              className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                !isDualMode
                  ? 'bg-white/10 border-white/30 text-white'
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/8 hover:border-white/20'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />
              </svg>
              <span className="text-xs font-medium">Single</span>
            </button>
            <button
              onClick={() => onModeChange(true)}
              className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                isDualMode
                  ? 'bg-white/10 border-white/30 text-white'
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/8 hover:border-white/20'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 0a2 2 0 012 2v8a2 2 0 01-2 2" />
              </svg>
              <span className="text-xs font-medium">Dual</span>
            </button>
          </div>
        </div>

        {/* Orientation */}
        <div className="pt-3 border-t border-white/10">
          <label className="text-xs text-white/60 mb-2 block font-medium">Orientation</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onOrientationChange('horizontal')}
              className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                orientation === 'horizontal'
                  ? 'bg-white/10 border-white/30 text-white'
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/8 hover:border-white/20'
              }`}
            >
              <div className="w-12 h-6 border-2 border-current rounded"></div>
              <span className="text-xs font-medium">Horizontal</span>
            </button>
            <button
              onClick={() => onOrientationChange('vertical')}
              className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                orientation === 'vertical'
                  ? 'bg-white/10 border-white/30 text-white'
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/8 hover:border-white/20'
              }`}
            >
              <div className="w-6 h-12 border-2 border-current rounded"></div>
              <span className="text-xs font-medium">Vertical</span>
            </button>
          </div>
        </div>

        {/* Display Options */}
        <div className="pt-3 border-t border-white/10">
          <label className="text-xs text-white/60 mb-2 block font-medium">Display</label>
          <div className="space-y-2">
            {/* View Mode */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-white/70 w-20">View</label>
              <select
                value={currentViewMode}
                onChange={(e) => onViewModeChange(e.target.value as 'table' | 'card' | 'auto')}
                className="flex-1 px-2 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-white/90"
              >
                <option value="auto">Auto</option>
                <option value="table">Table</option>
                <option value="card">Card</option>
              </select>
            </div>

            {/* Show Images */}
            <div className="flex items-center justify-between px-2 py-1.5 bg-white/5 border border-white/10 rounded">
              <span className="text-xs text-white/70">Show Images</span>
              <button
                onClick={() => onShowImagesChange(!showImages)}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  showImages ? 'bg-blue-500' : 'bg-white/20'
                }`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  showImages ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            {/* Price Location */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-white/70 w-20">Prices</label>
              <select
                value={priceLocation}
                onChange={(e) => onPriceLocationChange(e.target.value as 'none' | 'header' | 'inline')}
                className="flex-1 px-2 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-white/90"
              >
                <option value="none">Hidden</option>
                <option value="header">Header</option>
                <option value="inline">Inline</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        select {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23fff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
          background-position: right 0.5rem center;
          background-repeat: no-repeat;
          background-size: 1.5em 1.5em;
          padding-right: 2.5rem;
        }
      `}</style>
    </ToolbarDropdown>
  )
}

