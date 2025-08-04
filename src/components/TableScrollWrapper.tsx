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

    // Enable horizontal scroll with mouse wheel when holding shift
    const handleWheel = (e: WheelEvent) => {
      if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault()
        element.scrollLeft += e.deltaY || e.deltaX
      }
    }

    // Enable drag to scroll
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

    element.addEventListener('wheel', handleWheel, { passive: false })
    element.addEventListener('mousedown', handleMouseDown)
    element.addEventListener('mouseleave', handleMouseLeave)
    element.addEventListener('mouseup', handleMouseUp)
    element.addEventListener('mousemove', handleMouseMove)

    // Listen for window resize to recheck scrollability
    window.addEventListener('resize', checkScrollable)

    return () => {
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
      className="table-scroll-container mb-3 relative"
      style={{ userSelect: 'none' }}
    >
      <div className="table-scroll-hint">
        Shift + Scroll or Drag to scroll →
      </div>
      {children}
    </div>
  )
}