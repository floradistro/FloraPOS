'use client'

import { useState, useEffect } from 'react'

interface ViewportRingProps {
  isLoading?: boolean
  isCheckingOut?: boolean
}

export function ViewportRing({ isLoading = false, isCheckingOut = false }: ViewportRingProps) {
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
    // Checkout state has highest priority
    if (isCheckingOut) {
      return {
        color: '#10b981', // brighter green-500
        style: 'animate-pulse',
        glow: 'drop-shadow-[0_0_8px_rgba(16,185,129,1)] drop-shadow-[0_0_16px_rgba(16,185,129,1)] drop-shadow-[0_0_24px_rgba(16,185,129,1)] drop-shadow-[0_0_32px_rgba(16,185,129,0.9)] drop-shadow-[0_0_48px_rgba(16,185,129,0.8)] drop-shadow-[0_0_64px_rgba(16,185,129,0.6)]', // ultra-bright multi-layer green glow
        className: ''
      }
    }

    // Loading state overrides connection status - use Siri-like glow
    if (isLoading) {
      return {
        color: 'transparent', // Let the animation handle colors
        style: '',
        glow: '',
        className: 'siri-loading'
      }
    }

    switch (connectionStatus) {
      case 'online':
        return {
          color: '#ffffff', // white
          style: 'animate-pulse duration-2000',
          glow: '',
          className: ''
        }
      case 'offline':
        return {
          color: '#f87171', // brighter red-400
          style: 'animate-pulse duration-1000',
          glow: 'drop-shadow-[0_0_8px_rgba(248,113,113,1)] drop-shadow-[0_0_16px_rgba(248,113,113,1)] drop-shadow-[0_0_24px_rgba(248,113,113,0.9)] drop-shadow-[0_0_32px_rgba(248,113,113,0.8)] drop-shadow-[0_0_48px_rgba(248,113,113,0.7)]', // bright red glow
          className: ''
        }
      case 'error':
        return {
          color: '#c0c0c0', // platinum instead of yellow (memory preference)
          style: 'animate-pulse duration-500',
          glow: 'drop-shadow-[0_0_8px_rgba(192,192,192,1)] drop-shadow-[0_0_16px_rgba(192,192,192,1)] drop-shadow-[0_0_24px_rgba(192,192,192,0.9)] drop-shadow-[0_0_32px_rgba(192,192,192,0.8)] drop-shadow-[0_0_48px_rgba(192,192,192,0.7)]', // platinum glow
          className: ''
        }
      default:
        return {
          color: '#6b7280', // gray-500
          style: '',
          glow: '',
          className: ''
        }
    }
  }

  const status = getStatusConfig()
  
  return (
    <div className="viewport-ring fixed pointer-events-none z-[9999]" style={{
      // Position to wrap entire app content, excluding iOS status bars
      top: '0px', // Start at absolute top (above iOS status bar)
      left: '0px', 
      right: '0px',
      bottom: '0px' // End at absolute bottom (below our status bar)
    }}>
      {/* Perfect border following device screen shape */}
      <div 
        className={`absolute inset-0 ${status.style} ${status.glow} ${status.className}`}
        style={{
          // Use inset box-shadow for consistent stroke weight around rounded corners (only when not loading)
          boxShadow: !isLoading && status.color !== 'transparent' ? `inset 0 0 0 1px ${status.color}` : undefined,
          // iPad Pro/Air: ~28px, iPad Mini: ~24px, iPhone: ~16px
          borderRadius: 'clamp(16px, 2.5vw, 32px)', 
          opacity: isLoading || isCheckingOut ? 0.9 : 0.6, // Higher opacity for active states
          pointerEvents: 'none',
          WebkitBackfaceVisibility: 'hidden',
          backfaceVisibility: 'hidden',
          transform: 'translate3d(0, 0, 0)',
          willChange: 'opacity, box-shadow',
          boxSizing: 'border-box',
          // Ensure perfect PWA fit - wrap entire viewport
          margin: '0',
          padding: '0'
        }}
      />
    </div>
  )
} 