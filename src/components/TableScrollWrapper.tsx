'use client'

import { useRef, useEffect, ReactNode } from 'react'

interface TableScrollWrapperProps {
  children: ReactNode
}

export default function TableScrollWrapper({ children }: TableScrollWrapperProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const element = scrollRef.current
    if (!element) return

    // Check if table is scrollable and add data attribute
    const checkScrollable = () => {
      const table = element.querySelector('table')
      if (table && table.scrollWidth > element.clientWidth) {
        element.setAttribute('data-scrollable', 'true')
      } else {
        element.removeAttribute('data-scrollable')
      }
    }

    // Initial check
    setTimeout(checkScrollable, 100)

    // iPad-specific touch handling to prevent scroll hangups
    let touchStartX = 0
    let touchStartY = 0
    let isHorizontalScroll = false
    let scrollStarted = false

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      touchStartX = touch.clientX
      touchStartY = touch.clientY
      isHorizontalScroll = false
      scrollStarted = false
      
      // Force enable scrolling
      element.style.overflowX = 'auto'
      ;(element.style as any).webkitOverflowScrolling = 'touch'
    }

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      const deltaX = Math.abs(touch.clientX - touchStartX)
      const deltaY = Math.abs(touch.clientY - touchStartY)
      
      // Determine scroll direction on first move
      if (!scrollStarted && (deltaX > 5 || deltaY > 5)) {
        isHorizontalScroll = deltaX > deltaY
        scrollStarted = true
      }
      
      // If horizontal scroll, prevent vertical scroll and enable horizontal
      if (isHorizontalScroll) {
        e.preventDefault()
        const scrollDelta = (touch.clientX - touchStartX) * -1
        element.scrollLeft = element.scrollLeft + scrollDelta
        touchStartX = touch.clientX
      }
    }

    const handleTouchEnd = () => {
      // Reset scroll state
      isHorizontalScroll = false
      scrollStarted = false
      
      // Ensure scroll momentum continues
      setTimeout(() => {
        ;(element.style as any).webkitOverflowScrolling = 'touch'
      }, 0)
    }

    // Enable horizontal scroll with mouse wheel when holding shift
    const handleWheel = (e: WheelEvent) => {
      if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault()
        element.scrollLeft += e.deltaY || e.deltaX
      }
    }

    // Enable drag to scroll for desktop
    let isMouseDown = false
    let startX = 0
    let scrollLeft = 0

    const handleMouseDown = (e: MouseEvent) => {
      isMouseDown = true
      element.style.cursor = 'grabbing'
      startX = e.pageX - element.offsetLeft
      scrollLeft = element.scrollLeft
    }

    const handleMouseLeave = () => {
      isMouseDown = false
      element.style.cursor = 'grab'
    }

    const handleMouseUp = () => {
      isMouseDown = false
      element.style.cursor = 'grab'
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDown) return
      e.preventDefault()
      const x = e.pageX - element.offsetLeft
      const walk = (x - startX) * 2 // Increase scroll speed
      element.scrollLeft = scrollLeft - walk
    }

    // Add all event listeners
    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })
    element.addEventListener('wheel', handleWheel, { passive: false })
    element.addEventListener('mousedown', handleMouseDown)
    element.addEventListener('mouseleave', handleMouseLeave)
    element.addEventListener('mouseup', handleMouseUp)
    element.addEventListener('mousemove', handleMouseMove)

    // Listen for window resize to recheck scrollability
    window.addEventListener('resize', checkScrollable)

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
      element.removeEventListener('wheel', handleWheel)
      element.removeEventListener('mousedown', handleMouseDown)
      element.removeEventListener('mouseleave', handleMouseLeave)
      element.removeEventListener('mouseup', handleMouseUp)
      element.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', checkScrollable)
    }
  }, [])

  return (
    <div 
      ref={scrollRef}
      className="table-scroll-container scrollable-container-x mb-3 relative"
      style={{ 
        userSelect: 'none',
        touchAction: 'pan-x',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      <div className="table-scroll-hint">
        Shift + Scroll or Drag to scroll →
      </div>
      {children}
    </div>
  )
}