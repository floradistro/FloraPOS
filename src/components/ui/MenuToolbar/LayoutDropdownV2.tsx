/**
 * Layout Dropdown V2 - Apple 2035 Style
 * Combines: Orientation, Menu Mode, View Mode, Images, Price Display
 */

'use client'

import React, { useState } from 'react'
import { ToolbarDropdown } from './ToolbarDropdown'

interface LayoutDropdownV2Props {
  // Orientation
  orientation: 'horizontal' | 'vertical'
  onOrientationChange: (orientation: 'horizontal' | 'vertical') => void
  
  // Menu Mode
  isDualMode: boolean
  onModeChange: (isDual: boolean) => void
  
  // Display Settings
  viewMode: 'table' | 'card' | 'auto'
  showImages: boolean
  priceLocation: 'none' | 'header' | 'inline'
  onDisplayChange: (settings: {
    viewMode?: 'table' | 'card' | 'auto'
    showImages?: boolean
    priceLocation?: 'none' | 'header' | 'inline'
  }) => void
}

export function LayoutDropdownV2({
  orientation,
  onOrientationChange,
  isDualMode,
  onModeChange,
  viewMode,
  showImages,
  priceLocation,
  onDisplayChange
}: LayoutDropdownV2Props) {
  const [activeTab, setActiveTab] = useState<'structure' | 'display'>('structure')

  return (
    <ToolbarDropdown
      trigger={
        <div className="flex items-center gap-1.5 px-2.5 h-[28px] cursor-pointer text-white/80 hover:text-white transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5z" />
          </svg>
          <span className="text-xs font-medium">Layout</span>
        </div>
      }
    >
      <div className="w-[400px]" style={{ fontFamily: 'Tiempos, serif' }}>
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-4">
          <button
            onClick={() => setActiveTab('structure')}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'structure'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-white/50 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            Structure
          </button>
          <button
            onClick={() => setActiveTab('display')}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'display'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-white/50 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            Display
          </button>
        </div>

        {/* Structure Tab */}
        {activeTab === 'structure' && (
          <div className="space-y-4 max-h-[440px] overflow-y-auto px-1 pb-2" style={{ 
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent'
          }}>
            {/* Menu Mode - Visual Cards */}
            <div>
              <label className="text-xs text-white/60 mb-2 block font-medium">Menu Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onModeChange(false)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                    !isDualMode
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'bg-white/[0.02] text-white/60 hover:bg-white/[0.06] hover:text-white/80'
                  }`}
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="4" y="4" width="16" height="16" strokeWidth="2" rx="2" />
                  </svg>
                  <span className="text-xs font-medium">Single</span>
                </button>
                <button
                  onClick={() => onModeChange(true)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                    isDualMode
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'bg-white/[0.02] text-white/60 hover:bg-white/[0.06] hover:text-white/80'
                  }`}
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span className="text-xs font-medium">Dual</span>
                </button>
              </div>
            </div>

            {/* Orientation - Visual Cards */}
            <div>
              <label className="text-xs text-white/60 mb-2 block font-medium">Orientation</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onOrientationChange('horizontal')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                    orientation === 'horizontal'
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'bg-white/[0.02] text-white/60 hover:bg-white/[0.06] hover:text-white/80'
                  }`}
                >
                  <div className="w-14 h-8 border-2 border-current rounded-lg" />
                  <span className="text-xs font-medium">Horizontal</span>
                </button>
                <button
                  onClick={() => onOrientationChange('vertical')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                    orientation === 'vertical'
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'bg-white/[0.02] text-white/60 hover:bg-white/[0.06] hover:text-white/80'
                  }`}
                >
                  <div className="w-8 h-14 border-2 border-current rounded-lg" />
                  <span className="text-xs font-medium">Vertical</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Display Tab */}
        {activeTab === 'display' && (
          <div className="space-y-4 max-h-[440px] overflow-y-auto px-1 pb-2" style={{ 
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent'
          }}>
            {/* View Mode */}
            <div>
              <label className="text-xs text-white/60 mb-2 block font-medium">View Mode</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => onDisplayChange({ viewMode: 'auto' })}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                    viewMode === 'auto'
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'bg-white/[0.02] text-white/60 hover:bg-white/[0.06] hover:text-white/80'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-[10px] font-medium">Auto</span>
                </button>
                <button
                  onClick={() => onDisplayChange({ viewMode: 'table' })}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                    viewMode === 'table'
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'bg-white/[0.02] text-white/60 hover:bg-white/[0.06] hover:text-white/80'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span className="text-[10px] font-medium">Table</span>
                </button>
                <button
                  onClick={() => onDisplayChange({ viewMode: 'card' })}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                    viewMode === 'card'
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'bg-white/[0.02] text-white/60 hover:bg-white/[0.06] hover:text-white/80'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span className="text-[10px] font-medium">Card</span>
                </button>
              </div>
            </div>

            {/* Show Images - Toggle */}
            <div>
              <label className="text-xs text-white/60 mb-2 block font-medium">Images</label>
              <button
                onClick={() => onDisplayChange({ showImages: !showImages })}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                  showImages
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'bg-white/[0.02] text-white/60 hover:bg-white/[0.06] hover:text-white/80'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs font-medium">Show Product Images</span>
                </div>
                <div className={`relative w-10 h-5 rounded-full transition-all ${
                  showImages ? 'bg-blue-500' : 'bg-white/20'
                }`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${
                    showImages ? 'translate-x-5' : 'translate-x-0.5'
                  }`} />
                </div>
              </button>
            </div>

            {/* Price Location - Visual Cards */}
            <div>
              <label className="text-xs text-white/60 mb-2 block font-medium">Price Display</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => onDisplayChange({ priceLocation: 'none' })}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                    priceLocation === 'none'
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'bg-white/[0.02] text-white/60 hover:bg-white/[0.06] hover:text-white/80'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  <span className="text-[10px] font-medium">Hidden</span>
                </button>
                <button
                  onClick={() => onDisplayChange({ priceLocation: 'header' })}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                    priceLocation === 'header'
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'bg-white/[0.02] text-white/60 hover:bg-white/[0.06] hover:text-white/80'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 11h14M5 11a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 01-2 2M5 11v8a2 2 0 002 2h10a2 2 0 002-2v-8" />
                  </svg>
                  <span className="text-[10px] font-medium">Header</span>
                </button>
                <button
                  onClick={() => onDisplayChange({ priceLocation: 'inline' })}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                    priceLocation === 'inline'
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'bg-white/[0.02] text-white/60 hover:bg-white/[0.06] hover:text-white/80'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <span className="text-[10px] font-medium">Inline</span>
                </button>
              </div>
            </div>
          </div>
        )}
        
        <style jsx>{`
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
      </div>
    </ToolbarDropdown>
  )
}

