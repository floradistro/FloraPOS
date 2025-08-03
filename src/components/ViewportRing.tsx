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
        color: 'bg-green-500',
        style: 'animate-pulse duration-75'
      }
    }

    switch (connectionStatus) {
      case 'online':
        return {
          color: 'bg-white',
          style: 'animate-pulse duration-2000'
        }
      case 'offline':
        return {
          color: 'bg-red-500',
          style: 'animate-pulse duration-1000'
        }
      case 'error':
        return {
          color: 'bg-yellow-500', 
          style: 'animate-pulse duration-500'
        }
      default:
        return {
          color: 'bg-gray-500',
          style: ''
        }
    }
  }

  const status = getStatusConfig()
  
  return (
    <div className="viewport-ring fixed inset-0 pointer-events-none z-50 opacity-60">
      {/* Rounded border that follows iPad screen shape */}
      <div 
        className={`absolute inset-0 ${status.color} ${status.style}`}
        style={{
          border: '1px solid currentColor',
          borderRadius: 'max(12px, env(display-cutout-radius, 12px))',
          margin: '2px',
          background: 'transparent'
        }}
      />
    </div>
  )
} 