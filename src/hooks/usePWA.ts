'use client'

import { useEffect, useState } from 'react'

interface PWAState {
  isInstalled: boolean
  isInstallable: boolean
  isIPadPro: boolean
  isFullscreen: boolean
}

export function usePWA() {
  const [state, setState] = useState<PWAState>({
    isInstalled: false,
    isInstallable: false,
    isIPadPro: false,
    isFullscreen: false
  })
  const [installPrompt, setInstallPrompt] = useState<any>(null)

  useEffect(() => {
    // Detect iPad Pro
    const detectIPadPro = () => {
      const ua = navigator.userAgent
      const isIPad = ua.includes('iPad') || 
        (ua.includes('Macintosh') && 'ontouchend' in document)
      
      // Check for iPad Pro specific screen sizes
      const screenWidth = window.screen.width
      const screenHeight = window.screen.height
      const isIPadProSize = 
        (screenWidth === 1024 && screenHeight === 1366) || // 11" iPad Pro
        (screenWidth === 1366 && screenHeight === 1024) || // 11" iPad Pro landscape
        (screenWidth === 1194 && screenHeight === 834) ||  // 11" iPad Pro with home indicator
        (screenWidth === 834 && screenHeight === 1194) ||  // 11" iPad Pro landscape with home indicator
        (screenWidth === 1668 && screenHeight === 2388) || // 12.9" iPad Pro
        (screenWidth === 2388 && screenHeight === 1668) || // 12.9" iPad Pro landscape
        (screenWidth === 1668 && screenHeight === 2224) || // 12.9" iPad Pro with home indicator
        (screenWidth === 2224 && screenHeight === 1668)    // 12.9" iPad Pro landscape with home indicator
      
      return isIPad && isIPadProSize
    }

    // Check if running in standalone mode
    const checkStandalone = () => {
      return window.matchMedia('(display-mode: fullscreen)').matches ||
             window.matchMedia('(display-mode: standalone)').matches ||
             (window.navigator as any).standalone === true
    }

    // Check fullscreen status
    const checkFullscreen = () => {
      return document.fullscreenElement !== null ||
             window.innerHeight === window.screen.height
    }

    // Initialize state
    setState(prev => ({
      ...prev,
      isIPadPro: detectIPadPro(),
      isInstalled: checkStandalone(),
      isFullscreen: checkFullscreen()
    }))

    // Register optimized service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then(registration => {
          console.log('Service Worker registered:', registration.scope)
          
          // Check for updates periodically
          setInterval(() => {
            registration.update()
          }, 60000) // Check every minute
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error)
        })
    }

    // Handle install prompt
    const handleInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)
      setState(prev => ({ ...prev, isInstallable: true }))
    }

    // Handle app installed
    const handleAppInstalled = () => {
      setState(prev => ({ 
        ...prev, 
        isInstalled: true, 
        isInstallable: false 
      }))
      setInstallPrompt(null)
    }

    // Handle fullscreen change
    const handleFullscreenChange = () => {
      setState(prev => ({ ...prev, isFullscreen: checkFullscreen() }))
    }

    // Handle resize (for orientation changes)
    const handleResize = () => {
      setState(prev => ({
        ...prev,
        isIPadPro: detectIPadPro(),
        isFullscreen: checkFullscreen()
      }))
    }

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [])

  const install = async () => {
    if (!installPrompt) return false

    try {
      installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice
      setInstallPrompt(null)
      setState(prev => ({ ...prev, isInstallable: false }))
      return outcome === 'accepted'
    } catch (error) {
      console.error('Install failed:', error)
      return false
    }
  }

  const enterFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen()
      } else if ((document.documentElement as any).webkitRequestFullscreen) {
        await (document.documentElement as any).webkitRequestFullscreen()
      }
      return true
    } catch (error) {
      console.error('Fullscreen failed:', error)
      return false
    }
  }

  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen()
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen()
      }
      return true
    } catch (error) {
      console.error('Exit fullscreen failed:', error)
      return false
    }
  }

  return {
    ...state,
    install,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen: state.isFullscreen ? exitFullscreen : enterFullscreen
  }
} 