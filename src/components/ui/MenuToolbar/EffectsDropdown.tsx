/**
 * Effects Dropdown - Canva Style
 * Combines Transparency, Blur, Glow, Background into one visual panel
 */

'use client'

import React from 'react'
import { ToolbarDropdown } from './ToolbarDropdown'

interface EffectsDropdownProps {
  containerOpacity: number
  borderWidth: number
  borderOpacity: number
  imageOpacity: number
  blurIntensity: number
  glowIntensity: number
  onTransparencyChange: (values: {
    containerOpacity: number
    borderWidth: number
    borderOpacity: number
    imageOpacity: number
    blurIntensity: number
    glowIntensity?: number
  }) => void
  customBackground: string
  onCustomBackgroundChange: (code: string) => void
}

export function EffectsDropdown({
  containerOpacity,
  borderWidth,
  borderOpacity,
  imageOpacity,
  blurIntensity,
  glowIntensity,
  onTransparencyChange,
  customBackground,
  onCustomBackgroundChange
}: EffectsDropdownProps) {
  return (
    <ToolbarDropdown
      icon={<></>}
      trigger={
        <div className="flex items-center gap-1.5 px-2.5 h-[28px] cursor-pointer">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          <span className="text-xs font-medium">Effects</span>
        </div>
      }
    >
      <div className="w-[340px] space-y-4" style={{ fontFamily: 'Tiempos, serif' }}>
        {/* Opacity Section */}
        <div>
          <h4 className="text-xs font-semibold text-white/80 mb-3 uppercase tracking-wider">Opacity</h4>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-white/70">Container</span>
                <span className="text-xs text-white/90 font-mono bg-white/5 px-2 py-0.5 rounded">{containerOpacity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={containerOpacity}
                onChange={(e) => onTransparencyChange({ 
                  containerOpacity: parseInt(e.target.value), 
                  borderWidth, 
                  borderOpacity, 
                  imageOpacity, 
                  blurIntensity,
                  glowIntensity
                })}
                className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer slider-thumb"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-white/70">Border</span>
                <span className="text-xs text-white/90 font-mono bg-white/5 px-2 py-0.5 rounded">{borderOpacity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={borderOpacity}
                onChange={(e) => onTransparencyChange({ 
                  containerOpacity, 
                  borderWidth, 
                  borderOpacity: parseInt(e.target.value), 
                  imageOpacity, 
                  blurIntensity,
                  glowIntensity
                })}
                className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer slider-thumb"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-white/70">Images</span>
                <span className="text-xs text-white/90 font-mono bg-white/5 px-2 py-0.5 rounded">{imageOpacity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={imageOpacity}
                onChange={(e) => onTransparencyChange({ 
                  containerOpacity, 
                  borderWidth, 
                  borderOpacity, 
                  imageOpacity: parseInt(e.target.value), 
                  blurIntensity,
                  glowIntensity
                })}
                className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer slider-thumb"
              />
            </div>
          </div>
        </div>

        {/* Effects Section */}
        <div className="pt-3 border-t border-white/10">
          <h4 className="text-xs font-semibold text-white/80 mb-3 uppercase tracking-wider">Effects</h4>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-white/70">Blur</span>
                <span className="text-xs text-white/90 font-mono bg-white/5 px-2 py-0.5 rounded">{blurIntensity}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="32"
                value={blurIntensity}
                onChange={(e) => onTransparencyChange({ 
                  containerOpacity, 
                  borderWidth, 
                  borderOpacity, 
                  imageOpacity, 
                  blurIntensity: parseInt(e.target.value),
                  glowIntensity
                })}
                className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer slider-thumb"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-white/70">Glow</span>
                <span className="text-xs text-white/90 font-mono bg-white/5 px-2 py-0.5 rounded">{glowIntensity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={glowIntensity}
                onChange={(e) => onTransparencyChange({ 
                  containerOpacity, 
                  borderWidth, 
                  borderOpacity, 
                  imageOpacity, 
                  blurIntensity,
                  glowIntensity: parseInt(e.target.value)
                })}
                className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer slider-thumb"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-white/70">Border Width</span>
                <span className="text-xs text-white/90 font-mono bg-white/5 px-2 py-0.5 rounded">{borderWidth}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="8"
                value={borderWidth}
                onChange={(e) => onTransparencyChange({ 
                  containerOpacity, 
                  borderWidth: parseInt(e.target.value), 
                  borderOpacity, 
                  imageOpacity, 
                  blurIntensity,
                  glowIntensity
                })}
                className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer slider-thumb"
              />
            </div>
          </div>
        </div>

        {/* Custom Background */}
        {customBackground && (
          <div className="pt-3 border-t border-white/10">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-white/80 uppercase tracking-wider">Custom Background</label>
              <button
                onClick={() => onCustomBackgroundChange('')}
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Clear
              </button>
            </div>
            <div className="px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-lg text-xs text-green-300">
              ✓ Active
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

