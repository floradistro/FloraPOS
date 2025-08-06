'use client'

import { useState, useEffect } from 'react'
import { useMemoryOptimization } from '@/hooks/useMemoryOptimization'
import { performanceMonitor } from '@/config/performance'

interface PerformanceStats {
  totalQueries: number
  staleQueries: number
  activeQueries: number
  memoryUsage: {
    used: number
    total: number
    limit: number
    percentage: number
  } | null
}

/**
 * Development component for monitoring performance metrics
 * Only shows in development mode
 */
export function PerformanceMonitor() {
  const [isVisible, setIsVisible] = useState(false)
  const [stats, setStats] = useState<PerformanceStats | null>(null)
  const { getMemoryStats, triggerCleanup } = useMemoryOptimization()

  // Only show in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Show performance monitor after delay to avoid interfering with initial load
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [])

  // Update stats periodically
  useEffect(() => {
    if (!isVisible) return

    const updateStats = () => {
      const currentStats = getMemoryStats()
      setStats(currentStats)
    }

    updateStats()
    const interval = setInterval(updateStats, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [isVisible, getMemoryStats])

  if (!isVisible || process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs font-mono z-50 max-w-xs">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold">Performance Monitor</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ×
        </button>
      </div>
      
      {stats && (
        <div className="space-y-1">
          <div>Queries: {stats.totalQueries} ({stats.activeQueries} active)</div>
          <div>Stale: {stats.staleQueries}</div>
          
          {stats.memoryUsage && (
            <div>
              <div>Memory: {stats.memoryUsage.used}MB / {stats.memoryUsage.limit}MB</div>
              <div className="w-full bg-gray-700 rounded h-1 mt-1">
                <div 
                  className={`h-1 rounded ${
                    stats.memoryUsage.percentage > 80 ? 'bg-red-500' :
                    stats.memoryUsage.percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(stats.memoryUsage.percentage, 100)}%` }}
                />
              </div>
            </div>
          )}
          
          <button
            onClick={triggerCleanup}
            className="mt-2 px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
          >
            Cleanup Cache
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * Hook to show performance monitoring keyboard shortcut
 */
export function usePerformanceShortcut() {
  const [showMonitor, setShowMonitor] = useState(false)

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return

    const handleKeyPress = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + P to toggle performance monitor
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'P') {
        event.preventDefault()
        setShowMonitor(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  return showMonitor
}