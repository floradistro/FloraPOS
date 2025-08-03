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
    <div className="fixed inset-0 pointer-events-none z-50 opacity-60">
      {/* Top border - at absolute edge */}
      <div className={`absolute top-0 left-0 right-0 h-px ${status.color} ${status.style}`} />
      
      {/* Right border - at absolute edge */}
      <div className={`absolute top-0 right-0 bottom-0 w-px ${status.color} ${status.style}`} />
      
      {/* Bottom border - at absolute edge */}
      <div className={`absolute bottom-0 left-0 right-0 h-px ${status.color} ${status.style}`} />
      
      {/* Left border - at absolute edge */}
      <div className={`absolute top-0 left-0 bottom-0 w-px ${status.color} ${status.style}`} />
    </div>
  )
} 