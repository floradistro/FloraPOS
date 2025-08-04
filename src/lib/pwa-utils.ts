// PWA Utility Functions for iPad Pro optimization

export const pwaUtils = {
  // Clear all caches
  clearCache: async () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const messageChannel = new MessageChannel()
      
      return new Promise((resolve, reject) => {
        messageChannel.port1.onmessage = (event) => {
          if (event.data.success) {
            resolve(true)
          } else {
            reject(new Error(event.data.error))
          }
        }
        
        navigator.serviceWorker.controller?.postMessage(
          { type: 'CLEAR_CACHE' },
          [messageChannel.port2]
        )
      })
    }
    return false
  },

  // Force update service worker
  updateServiceWorker: async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        await registration.update()
        return true
      }
    }
    return false
  },

  // Check if app is in standalone mode
  isStandalone: () => {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.matchMedia('(display-mode: fullscreen)').matches ||
           (window.navigator as any).standalone === true
  },

  // Get device info
  getDeviceInfo: () => {
    const ua = navigator.userAgent
    const isIPad = ua.includes('iPad') || 
      (ua.includes('Macintosh') && 'ontouchend' in document)
    
    const screenWidth = window.screen.width
    const screenHeight = window.screen.height
    
    const devicePixelRatio = window.devicePixelRatio || 1
    
    return {
      isIPad,
      screenWidth,
      screenHeight,
      devicePixelRatio,
      orientation: (screenWidth > screenHeight ? 'landscape' : 'portrait') as 'landscape' | 'portrait',
      isRetina: devicePixelRatio > 1,
    }
  },

  // Lock orientation (experimental)
  lockOrientation: async (orientation: 'portrait' | 'landscape' | 'any' = 'any') => {
    if ('orientation' in screen && 'lock' in (screen.orientation as any)) {
      try {
        await (screen.orientation as any).lock(orientation)
        return true
      } catch (err) {
        console.warn('Orientation lock not supported:', err)
      }
    }
    return false
  },

  // Prevent zoom on double tap
  preventZoom: () => {
    let lastTouchEnd = 0
    
    document.addEventListener('touchend', (event) => {
      const now = Date.now()
      if (now - lastTouchEnd <= 300) {
        event.preventDefault()
      }
      lastTouchEnd = now
    }, { passive: false })
  },

  // Enable safe area padding for notched devices
  enableSafeArea: () => {
    document.documentElement.style.setProperty(
      '--safe-area-inset-top',
      'env(safe-area-inset-top, 0px)'
    )
    document.documentElement.style.setProperty(
      '--safe-area-inset-right',
      'env(safe-area-inset-right, 0px)'
    )
    document.documentElement.style.setProperty(
      '--safe-area-inset-bottom',
      'env(safe-area-inset-bottom, 0px)'
    )
    document.documentElement.style.setProperty(
      '--safe-area-inset-left',
      'env(safe-area-inset-left, 0px)'
    )
  },

  // Initialize iPad Pro optimizations
  initializeIPadOptimizations: () => {
    // Prevent zoom
    pwaUtils.preventZoom()
    
    // Enable safe area
    pwaUtils.enableSafeArea()
    
    // Disable bounce scrolling
    document.body.style.overscrollBehavior = 'none'
    
    // Disable context menu
    document.addEventListener('contextmenu', (e) => e.preventDefault())
    
    // Disable text selection on UI elements
    document.documentElement.style.webkitUserSelect = 'none'
    
    // Enable momentum scrolling for scrollable areas
    const scrollableElements = document.querySelectorAll('[data-scrollable]')
    scrollableElements.forEach(el => {
      const element = el as HTMLElement
      ;(element.style as any).webkitOverflowScrolling = 'touch'
    })
  }
} 