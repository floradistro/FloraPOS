'use client'

import { usePWA } from '@/hooks/usePWA'
import { pwaUtils } from '@/lib/pwa-utils'
import { useState, useEffect } from 'react'

export default function PWATestPage() {
  const pwa = usePWA()
  const [deviceInfo, setDeviceInfo] = useState({
    isIPad: false,
    screenWidth: 0,
    screenHeight: 0,
    devicePixelRatio: 1,
    orientation: 'portrait' as 'portrait' | 'landscape',
    isRetina: false
  })
  const [cacheCleared, setCacheCleared] = useState(false)

  useEffect(() => {
    // Get device info after component mounts
    setDeviceInfo(pwaUtils.getDeviceInfo())
  }, [])

  const handleClearCache = async () => {
    try {
      await pwaUtils.clearCache()
      setCacheCleared(true)
      setTimeout(() => setCacheCleared(false), 3000)
    } catch (error) {
      console.error('Failed to clear cache:', error)
    }
  }

  const handleUpdateSW = async () => {
    const updated = await pwaUtils.updateServiceWorker()
    if (updated) {
      alert('Service Worker updated!')
    }
  }

  return (
    <div className="min-h-screen bg-black text-white viewport-container">
      <div className="max-w-4xl mx-auto space-y-8 p-8" data-scrollable>
        <h1 className="text-3xl font-bold mb-8">PWA Test Page</h1>

        {/* PWA Status */}
        <section className="bg-gray-900 rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold mb-4">PWA Status</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Installed:</span>
              <span className={`ml-2 ${pwa.isInstalled ? 'text-green-500' : 'text-red-500'}`}>
                {pwa.isInstalled ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Installable:</span>
              <span className={`ml-2 ${pwa.isInstallable ? 'text-green-500' : 'text-gray-500'}`}>
                {pwa.isInstallable ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <span className="text-gray-400">iPad Pro:</span>
              <span className={`ml-2 ${pwa.isIPadPro ? 'text-green-500' : 'text-gray-500'}`}>
                {pwa.isIPadPro ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Fullscreen:</span>
              <span className={`ml-2 ${pwa.isFullscreen ? 'text-green-500' : 'text-gray-500'}`}>
                {pwa.isFullscreen ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </section>

        {/* Device Info */}
        <section className="bg-gray-900 rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold mb-4">Device Info</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Screen:</span>
              <span className="ml-2">{deviceInfo.screenWidth} × {deviceInfo.screenHeight}</span>
            </div>
            <div>
              <span className="text-gray-400">Pixel Ratio:</span>
              <span className="ml-2">{deviceInfo.devicePixelRatio}x</span>
            </div>
            <div>
              <span className="text-gray-400">Orientation:</span>
              <span className="ml-2">{deviceInfo.orientation}</span>
            </div>
            <div>
              <span className="text-gray-400">Retina:</span>
              <span className={`ml-2 ${deviceInfo.isRetina ? 'text-green-500' : 'text-gray-500'}`}>
                {deviceInfo.isRetina ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </section>

        {/* Actions */}
        <section className="bg-gray-900 rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            {pwa.isInstallable && (
              <button
                onClick={pwa.install}
                className="bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg transition-colors"
              >
                Install App
              </button>
            )}
            
            {!pwa.isFullscreen && (
              <button
                onClick={pwa.enterFullscreen}
                className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg transition-colors"
              >
                Enter Fullscreen
              </button>
            )}
            
            {pwa.isFullscreen && (
              <button
                onClick={pwa.exitFullscreen}
                className="bg-orange-600 hover:bg-orange-700 text-white py-3 px-6 rounded-lg transition-colors"
              >
                Exit Fullscreen
              </button>
            )}
            
            <button
              onClick={handleClearCache}
              className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-lg transition-colors"
            >
              {cacheCleared ? 'Cache Cleared!' : 'Clear Cache'}
            </button>
            
            <button
              onClick={handleUpdateSW}
              className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-lg transition-colors"
            >
              Update Service Worker
            </button>
            
            <button
              onClick={() => setDeviceInfo(pwaUtils.getDeviceInfo())}
              className="bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-lg transition-colors"
            >
              Refresh Device Info
            </button>
          </div>
        </section>

        {/* Safe Area Demo */}
        <section className="bg-gray-900 rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold mb-4">Safe Area Demo</h2>
          <div className="bg-gray-800 rounded p-4">
            <p className="text-sm text-gray-400 mb-2">CSS Variables:</p>
            <code className="text-xs block space-y-1">
              <div>--safe-area-inset-top: {typeof window !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top') || '0px' : '0px'}</div>
              <div>--safe-area-inset-right: {typeof window !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-right') || '0px' : '0px'}</div>
              <div>--safe-area-inset-bottom: {typeof window !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom') || '0px' : '0px'}</div>
              <div>--safe-area-inset-left: {typeof window !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-left') || '0px' : '0px'}</div>
            </code>
          </div>
          
          {/* Status Bar Height Demo */}
          <div className="bg-gray-800 rounded p-4 mt-4">
            <p className="text-sm text-gray-400 mb-2">PWA Status Bar:</p>
            <code className="text-xs block space-y-1">
              <div>--ios-status-bar-height: {typeof window !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--ios-status-bar-height') || '0px' : '0px'}</div>
              <div>PWA Mode: {pwa.isInstalled ? 'Yes' : 'No'}</div>
              <div>Display Mode: {typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches ? 'Standalone' : 'Browser'}</div>
            </code>
          </div>
        </section>

        {/* Status Bar Visual Demo */}
        {pwa.isInstalled && (
          <section className="bg-gray-900 rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold mb-4">Status Bar Visual Test</h2>
            <div 
              className="bg-red-500/20 border-2 border-red-500 rounded p-4 text-center"
              style={{ height: 'var(--ios-status-bar-height, 44px)' }}
            >
              <span className="text-red-400 text-sm">
                This box should match the status bar height: {typeof window !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--ios-status-bar-height') || '0px' : '0px'}
              </span>
            </div>
          </section>
        )}
      </div>
    </div>
  )
} 