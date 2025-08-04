'use client'

import { useState, useEffect } from 'react'

interface TopStatusBarProps {
  isLoading?: boolean
}

export function TopStatusBar({ isLoading = false }: TopStatusBarProps) {
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
        color: 'bg-blue-500',
        style: 'animate-pulse duration-300'
      }
    }

    switch (connectionStatus) {
      case 'online':
        return {
          color: 'bg-green-500',
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
    <div 
      className={`w-full ${status.color} ${status.style} h-0.5 flex-shrink-0`}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}
    />
  )
} 