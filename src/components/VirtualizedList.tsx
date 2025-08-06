import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'

interface VirtualizedListProps<T> {
  items: T[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  overscan?: number
  className?: string
  onScroll?: (scrollTop: number) => void
  loadMore?: () => void
  hasMore?: boolean
  isLoading?: boolean
}

export function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className = '',
  onScroll,
  loadMore,
  hasMore = false,
  isLoading = false
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Calculate which items should be visible
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    )
    return { startIndex, endIndex }
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length])

  // Get visible items
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1)
  }, [items, visibleRange])

  // Total height of all items
  const totalHeight = items.length * itemHeight

  // Handle scroll events
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = event.currentTarget.scrollTop
    setScrollTop(newScrollTop)
    onScroll?.(newScrollTop)

    // Load more when near bottom
    if (loadMore && hasMore && !isLoading) {
      const scrollBottom = newScrollTop + containerHeight
      const threshold = totalHeight - (itemHeight * 3) // Load when 3 items from bottom
      
      if (scrollBottom >= threshold) {
        loadMore()
      }
    }
  }, [onScroll, loadMore, hasMore, isLoading, containerHeight, totalHeight, itemHeight])

  // Intersection Observer for additional load more trigger
  useEffect(() => {
    const container = containerRef.current
    if (!container || !loadMore || !hasMore || isLoading) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      {
        root: container,
        threshold: 0.1,
        rootMargin: '100px'
      }
    )

    // Create a sentinel element at the bottom
    const sentinel = document.createElement('div')
    sentinel.style.height = '1px'
    sentinel.style.position = 'absolute'
    sentinel.style.bottom = '100px'
    sentinel.style.width = '100%'
    container.appendChild(sentinel)
    observer.observe(sentinel)

    return () => {
      observer.disconnect()
      if (container.contains(sentinel)) {
        container.removeChild(sentinel)
      }
    }
  }, [loadMore, hasMore, isLoading])

  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      {/* Total height spacer */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Visible items container */}
        <div
          style={{
            position: 'absolute',
            top: visibleRange.startIndex * itemHeight,
            width: '100%'
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={visibleRange.startIndex + index}
              style={{ height: itemHeight }}
              className="flex-shrink-0"
            >
              {renderItem(item, visibleRange.startIndex + index)}
            </div>
          ))}
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              width: '100%',
              height: itemHeight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            className="text-text-secondary"
          >
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span>Loading more...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Hook for virtualized list with automatic sizing
export function useVirtualizedList<T>(
  items: T[],
  containerRef: React.RefObject<HTMLElement>,
  itemHeight: number,
  options?: {
    overscan?: number
    loadMore?: () => void
    hasMore?: boolean
    isLoading?: boolean
  }
) {
  const [containerHeight, setContainerHeight] = useState(400)
  const [scrollTop, setScrollTop] = useState(0)

  // Update container height when container size changes
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateHeight = () => {
      setContainerHeight(container.clientHeight)
    }

    updateHeight()

    const resizeObserver = new ResizeObserver(updateHeight)
    resizeObserver.observe(container)

    return () => resizeObserver.disconnect()
  }, [containerRef])

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const overscan = options?.overscan ?? 5
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    )
    return { startIndex, endIndex }
  }, [scrollTop, itemHeight, containerHeight, options?.overscan, items.length])

  // Get visible items
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1).map((item, index) => ({
      item,
      index: visibleRange.startIndex + index
    }))
  }, [items, visibleRange])

  return {
    containerHeight,
    scrollTop,
    setScrollTop,
    visibleRange,
    visibleItems,
    totalHeight: items.length * itemHeight
  }
}