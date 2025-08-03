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
    <div className="viewport-ring fixed pointer-events-none z-[9999]" style={{
      top: 'env(safe-area-inset-top, 0px)',
      left: 'env(safe-area-inset-left, 0px)', 
      right: 'env(safe-area-inset-right, 0px)',
      bottom: 'env(safe-area-inset-bottom, 0px)'
    }}>
      {/* Perfect border following device screen shape */}
      <div 
        className={`absolute inset-0 ${status.style}`}
        style={{
          border: `1px solid ${status.color}`,
          // iPad Pro/Air: ~28px, iPad Mini: ~24px, iPhone: ~16px
          borderRadius: 'clamp(16px, 2.5vw, 32px)', 
          opacity: 0.6,
          pointerEvents: 'none',
          WebkitBackfaceVisibility: 'hidden',
          backfaceVisibility: 'hidden',
          transform: 'translate3d(0, 0, 0)',
          willChange: 'opacity',
          boxSizing: 'border-box',
          // Ensure perfect PWA fit
          margin: '0',
          padding: '0'
        }}
      />
    </div>
  )
} 