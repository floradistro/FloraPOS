'use client'

import { useState } from 'react'
import SiriGlowBorder from '../../components/SiriGlowBorder'

export default function SiriGlowDemo() {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Siri Glow Border Demo</h1>
          <p className="text-white/70">
            Clean, minimal Siri-style border effect for the entire viewport
          </p>
        </div>

        <div className="space-y-6">
          {/* Toggle Control */}
          <div className="flex justify-center">
            <button
              onClick={() => setIsLoading(!isLoading)}
              className={`px-8 py-4 rounded-lg font-medium transition-all duration-300 ${
                isLoading
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              {isLoading ? 'Stop Animation' : 'Start Animation'}
            </button>
          </div>

          {/* Status Info */}
          <div className="bg-white/5 p-6 rounded-lg border border-white/10 text-center">
            <p className="text-lg mb-2">
              <span className="font-medium">Current State:</span>{' '}
              {isLoading ? (
                <span className="text-purple-400">Animated Siri Colors</span>
              ) : (
                <span className="text-white/50">Idle White Pulse</span>
              )}
            </p>
            <p className="text-sm text-white/60">
              The border surrounds the entire viewport with smooth color transitions
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-white/5 p-4 rounded-lg">
              <h3 className="font-medium mb-2">✨ Features</h3>
              <ul className="space-y-1 text-white/70">
                <li>• Viewport-wide border effect</li>
                <li>• Smooth color transitions</li>
                <li>• Minimal performance impact</li>
                <li>• No external dependencies</li>
              </ul>
            </div>
            <div className="bg-white/5 p-4 rounded-lg">
              <h3 className="font-medium mb-2">🎯 Usage</h3>
              <ul className="space-y-1 text-white/70">
                <li>• Loading states</li>
                <li>• Processing indicators</li>
                <li>• Status visualization</li>
                <li>• UI feedback</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Siri Glow Border - Locks to viewport edge OVER iOS status bar */}
      <SiriGlowBorder isLoading={isLoading} />
    </div>
  )
}