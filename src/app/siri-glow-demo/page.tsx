'use client'

import { useState, useEffect } from 'react'
import SiriGlowBorder from '../../components/SiriGlowBorder'

// Same detection function as the component
const getIPadCornerRadius = (): number => {
  if (typeof window === 'undefined') return 20
  
  const isIPad = /iPad/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  
  if (!isIPad) return 20
  
  const screenWidth = window.screen.width
  const screenHeight = window.screen.height
  const maxDimension = Math.max(screenWidth, screenHeight)
  const minDimension = Math.min(screenWidth, screenHeight)
  
  if (maxDimension >= 2732 && minDimension >= 2048) {
    return 80 // iPad Pro 12.9"
  }
  
  if (maxDimension >= 2388 && minDimension >= 1668) {
    return 76 // iPad Pro 11"
  }
  
  return 20 // Other devices
}

const getDeviceInfo = () => {
  if (typeof window === 'undefined') return { 
    device: 'Unknown', 
    corners: 20, 
    resolution: '0 × 0', 
    maxDimension: 0, 
    minDimension: 0 
  }
  
  const cornerRadius = getIPadCornerRadius()
  const screenWidth = window.screen.width
  const screenHeight = window.screen.height
  const maxDimension = Math.max(screenWidth, screenHeight)
  const minDimension = Math.min(screenWidth, screenHeight)
  
  let device = 'Unknown Device'
  
  if (cornerRadius === 80) {
    device = 'iPad Pro 12.9"'
  } else if (cornerRadius === 76) {
    device = 'iPad Pro 11"'
  } else if (/iPad/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    device = 'iPad (Other Model)'
  } else {
    device = 'Non-iPad Device'
  }
  
  return {
    device,
    corners: cornerRadius,
    resolution: `${screenWidth} × ${screenHeight}`,
    maxDimension,
    minDimension
  }
}

export default function SiriGlowDemo() {
  const [isLoading, setIsLoading] = useState(false)
  const [thickness, setThickness] = useState(4)
  const [deviceInfo, setDeviceInfo] = useState({ device: 'Loading...', corners: 20, resolution: '', maxDimension: 0, minDimension: 0 })

  useEffect(() => {
    setDeviceInfo(getDeviceInfo())
  }, [])

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
          {/* Device Detection Info */}
          <div className="bg-black/50 p-4 rounded-lg border border-white/10">
            <p className="text-sm text-white/70 mb-2">
              <span className="font-medium">Device:</span> {deviceInfo.device}
            </p>
            <p className="text-sm text-white/70 mb-2">
              <span className="font-medium">Corner Radius:</span>{' '}
              <span className="text-blue-400 font-mono">{deviceInfo.corners}px</span>
            </p>
            <p className="text-sm text-white/70 mb-2">
              <span className="font-medium">Resolution:</span>{' '}
              <span className="font-mono">{deviceInfo.resolution}</span>
            </p>
            <p className="text-xs text-white/50 mt-2">
              Auto-detected based on screen dimensions
            </p>
          </div>

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
              The border follows iPad Pro corner radius specifications
            </p>
          </div>

          {/* iPad Pro Info */}
          <div className="text-xs text-white/50 space-y-1">
            <p>• <strong>iPad Pro 11":</strong> 76px corner radius</p>
            <p>• <strong>iPad Pro 12.9":</strong> 80px corner radius</p>
            <p>• <strong>Other devices:</strong> 20px default radius</p>
            <p>• Optimized for iPad PWA performance</p>
          </div>
        </div>
      </div>

      {/* Additional Visual Content */}
      <div className="mt-8 text-center">
        <p className="text-white/30 text-sm">
          The border effect surrounds the entire viewport with device-specific corner radius
        </p>
      </div>
    </div>
  )
} 