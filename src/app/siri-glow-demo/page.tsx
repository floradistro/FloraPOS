'use client'

import { useState } from 'react'
import SiriGlowBorder from '../../components/SiriGlowBorder'

export default function SiriGlowDemo() {
  const [isLoading, setIsLoading] = useState(false)
  const [thickness, setThickness] = useState(4)

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
      {/* Siri Glow Border */}
      <SiriGlowBorder 
        isLoading={isLoading} 
        thickness={thickness}
        zIndex={100}
      />

      {/* Demo Controls */}
      <div className="bg-neutral-900 p-8 rounded-2xl shadow-2xl border border-white/10 max-w-md w-full">
        <h1 className="text-3xl font-bold mb-6 text-center">Siri Glow Border Demo</h1>
        
        <div className="space-y-6">
          {/* Loading State Toggle */}
          <div>
            <label className="block text-sm font-medium mb-2">Border State</label>
            <button
              onClick={() => setIsLoading(!isLoading)}
              className={`w-full py-3 px-6 rounded-xl font-medium transition-all duration-300 ${
                isLoading
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-purple-500/25'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              }`}
            >
              {isLoading ? 'Loading (Active)' : 'Idle'}
            </button>
          </div>

          {/* Thickness Control */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Border Thickness: {thickness}px
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={thickness}
              onChange={(e) => setThickness(Number(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #5856D6 0%, #5856D6 ${thickness * 10}%, rgba(255,255,255,0.2) ${thickness * 10}%, rgba(255,255,255,0.2) 100%)`
              }}
            />
          </div>

          {/* Status Info */}
          <div className="bg-black/50 p-4 rounded-lg border border-white/10">
            <p className="text-sm text-white/70">
              <span className="font-medium">Current State:</span>{' '}
              {isLoading ? (
                <span className="text-purple-400">Animated Siri Colors</span>
              ) : (
                <span className="text-white/50">Subtle White Pulse</span>
              )}
            </p>
            <p className="text-xs text-white/50 mt-2">
              The border animates around the entire viewport edge
            </p>
          </div>

          {/* Instructions */}
          <div className="text-xs text-white/50 space-y-1">
            <p>• Click the button to toggle between loading and idle states</p>
            <p>• Adjust the slider to change border thickness</p>
            <p>• The effect is optimized for iPad PWA performance</p>
          </div>
        </div>
      </div>

      {/* Additional Visual Content */}
      <div className="mt-8 text-center">
        <p className="text-white/30 text-sm">
          The border effect surrounds the entire viewport
        </p>
      </div>
    </div>
  )
} 