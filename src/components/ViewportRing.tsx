'use client'

import { useState, useEffect } from 'react'

interface ViewportRingProps {
  isLoading?: boolean
}

export function ViewportRing({ isLoading = false }: ViewportRingProps) {
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'error'>('online')

  useEffect(() => {
    const handleOnline = () => setConnectionStatus('online')
    const handleOffline = () => setConnectionStatus('offline')

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const getStatusConfig = () => {
    // Loading state overrides connection status
    if (isLoading) {
      return {
        color: '#22c55e', // green-500
        style: 'animate-pulse duration-75'
      }
    }

    switch (connectionStatus) {
      case 'online':
        return {
          color: '#ffffff', // white
          style: 'animate-pulse duration-2000'
        }
      case 'offline':
        return {
          color: '#ef4444', // red-500
          style: 'animate-pulse duration-1000'
        }
      case 'error':
        return {
          color: '#eab308', // yellow-500
          style: 'animate-pulse duration-500'
        }
      default:
        return {
          color: '#6b7280', // gray-500
          style: ''
        }
    }
  }

  const status = getStatusConfig()
  
  return (
    <div className="viewport-ring fixed inset-0 pointer-events-none z-[9999]">
      {/* SVG for perfect uniform thickness */}
      <div 
        className={`absolute ${status.style}`}
        style={{
          top: '0px',
          left: '0px',
          right: '0px',
          bottom: '0px',
          border: `1px solid ${status.color}`,
          borderRadius: '24px',
          opacity: 0.6,
          pointerEvents: 'none',
          WebkitBackfaceVisibility: 'hidden',
          backfaceVisibility: 'hidden',
          transform: 'translate3d(0, 0, 0)',
          willChange: 'opacity'
        }}
      />
    </div>
  )
} 