'use client'

import { usePWA } from '@/hooks/usePWA'
import { useState, useEffect } from 'react'

export default function PWAInstaller() {
  const { 
    isInstalled, 
    isInstallable, 
    isIPadPro, 
    isFullscreen, 
    install, 
    toggleFullscreen 
  } = usePWA()
  
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // Show prompt after 5 seconds if not installed
    if (!isInstalled && isInstallable) {
      const timer = setTimeout(() => setShowPrompt(true), 5000)
      return () => clearTimeout(timer)
    }
  }, [isInstalled, isInstallable])

  const handleInstall = async () => {
    const success = await install()
    if (success) {
      setShowPrompt(false)
    }
  }

  // Don't show anything if already installed
  if (isInstalled && isFullscreen) return null

  return (
    <>
      {/* Fullscreen toggle for iPad Pro */}
      {isIPadPro && isInstalled && (
        <button
          onClick={toggleFullscreen}
          className="fixed top-2 left-2 z-50 bg-black/20 backdrop-blur-sm hover:bg-black/30 text-white/90 p-2 rounded-lg transition-all duration-200 pwa-safe-top"
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          style={{ top: 'calc(var(--ios-status-bar-height, 0px) + 8px)' }}
        >
          {isFullscreen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          )}
        </button>
      )}

      {/* Install prompt */}
      {showPrompt && isInstallable && !isInstalled && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <img src="/logo.png" alt="Flora POS" className="w-12 h-12 rounded-xl" />
              <div>
                <h3 className="text-white font-semibold text-lg">Install Flora POS</h3>
                <p className="text-gray-400 text-sm">
                  {isIPadPro ? 'Optimized for iPad Pro' : 'Fast, offline-ready POS'}
                </p>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Works offline</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Full screen experience</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Instant loading</span>
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                onClick={handleInstall}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200"
              >
                Install Now
              </button>
              <button
                onClick={() => setShowPrompt(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-3 px-4 rounded-xl transition-colors duration-200"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Minimal install button */}
      {isInstallable && !showPrompt && !isInstalled && (
        <button
          onClick={handleInstall}
          className="fixed bottom-4 right-4 z-40 bg-green-600 hover:bg-green-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
          aria-label="Install app"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>
      )}
    </>
  )
} 