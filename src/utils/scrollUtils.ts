/**
 * iPad scroll utilities to prevent hangups and improve touch handling
 */

// Force unlock scroll on any container
export const unlockScroll = (element: HTMLElement) => {
  element.style.overflow = 'auto'
  element.style.webkitOverflowScrolling = 'touch'
  element.style.touchAction = 'pan-y'
  
  // Force a reflow to ensure changes take effect
  element.offsetHeight
  
  // Trigger a small scroll to unlock momentum
  const currentScrollTop = element.scrollTop
  element.scrollTop = currentScrollTop + 1
  element.scrollTop = currentScrollTop
}

// Restore scroll position with momentum
export const restoreScrollPosition = (element: HTMLElement, position: number) => {
  element.scrollTop = position
  unlockScroll(element)
}

// Handle touch events to prevent scroll hangups
export const setupTouchScrolling = (element: HTMLElement) => {
  let touchStartY = 0
  let isScrolling = false
  
  const handleTouchStart = (e: TouchEvent) => {
    touchStartY = e.touches[0].clientY
    isScrolling = false
    
    // Ensure scrolling is enabled
    unlockScroll(element)
  }
  
  const handleTouchMove = (e: TouchEvent) => {
    if (!isScrolling) {
      const touchY = e.touches[0].clientY
      const deltaY = Math.abs(touchY - touchStartY)
      
      if (deltaY > 5) {
        isScrolling = true
        unlockScroll(element)
      }
    }
  }
  
  const handleTouchEnd = () => {
    // Ensure momentum scrolling continues
    setTimeout(() => {
      unlockScroll(element)
    }, 0)
  }
  
  // Add event listeners
  element.addEventListener('touchstart', handleTouchStart, { passive: true })
  element.addEventListener('touchmove', handleTouchMove, { passive: true })
  element.addEventListener('touchend', handleTouchEnd, { passive: true })
  
  // Return cleanup function
  return () => {
    element.removeEventListener('touchstart', handleTouchStart)
    element.removeEventListener('touchmove', handleTouchMove)
    element.removeEventListener('touchend', handleTouchEnd)
  }
}

// Debounced scroll unlock for performance
let unlockTimeout: NodeJS.Timeout | null = null
export const debouncedUnlockScroll = (element: HTMLElement, delay = 100) => {
  if (unlockTimeout) {
    clearTimeout(unlockTimeout)
  }
  
  unlockTimeout = setTimeout(() => {
    unlockScroll(element)
  }, delay)
}

// Global scroll unlock for emergency situations
export const globalScrollUnlock = () => {
  const scrollableElements = document.querySelectorAll('.scrollable-container, .scrollable-container-x, .scrollable-container-xy')
  
  scrollableElements.forEach((element) => {
    if (element instanceof HTMLElement) {
      unlockScroll(element)
    }
  })
}

// Auto-setup scroll handling for all scrollable containers
export const autoSetupScrollHandling = () => {
  const scrollableElements = document.querySelectorAll('.scrollable-container')
  
  scrollableElements.forEach((element) => {
    if (element instanceof HTMLElement) {
      setupTouchScrolling(element)
    }
  })
}