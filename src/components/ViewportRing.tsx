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
    <div className="viewport-ring fixed inset-0 pointer-events-none z-50 opacity-60">
      {/* Rounded border that follows iPad screen shape */}
      <div 
        className={`absolute inset-0 ${status.style}`}
        style={{
          border: `1px solid ${status.color}`,
          borderRadius: 'max(24px, env(display-cutout-radius, 24px))',
          margin: '2px',
          background: 'transparent',
          color: status.color
        }}
      />
    </div>
  )
} 