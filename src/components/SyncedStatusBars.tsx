'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'

interface StatusState {
  color: string
  style: string
}

const StatusContext = createContext<StatusState>({ color: 'bg-gray-500', style: '' })

interface StatusProviderProps {
  isLoading?: boolean
  children: ReactNode
}

export function StatusProvider({ isLoading = false, children }: StatusProviderProps) {
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

  const getStatusConfig = (): StatusState => {
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
    <StatusContext.Provider value={status}>
      {children}
    </StatusContext.Provider>
  )
}

export function SyncedStatusBar() {
  const status = useContext(StatusContext)
  return <div className={`w-full ${status.color} ${status.style} h-0.5`} />
} 