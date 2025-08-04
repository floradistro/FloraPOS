/**
 * SiriGlowBorder Component - PWA Viewport Border Effect
 * 
 * Usage:
 * <SiriGlowBorder isLoading={true} />
 * 
 * Props:
 * - isLoading: boolean - When true, shows animated Siri colors. When false, shows subtle white pulse.
 * - thickness: number (optional) - Border thickness in pixels. Default: 3
 * - zIndex: number (optional) - Z-index for the border. Default: 9999
 * 
 * Place this component at the root level of your app, outside main content containers.
 */

'use client'

import React, { useEffect, useState } from 'react'

interface SiriGlowBorderProps {
  isLoading: boolean
  thickness?: number
  zIndex?: number
  className?: string
}

// Detect iPad Pro model and return appropriate corner radius
const getIPadCornerRadius = (): number => {
  if (typeof window === 'undefined') return 20 // Default for SSR
  
  // Check if we're on an iPad
  const isIPad = /iPad/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  
  if (!isIPad) return 20 // Default for non-iPad devices
  
  // Get screen dimensions to determine iPad model
  const screenWidth = window.screen.width
  const screenHeight = window.screen.height
  const maxDimension = Math.max(screenWidth, screenHeight)
  const minDimension = Math.min(screenWidth, screenHeight)
  
  // iPad Pro 12.9" - 2048 x 2732 pixels
  if (maxDimension >= 2732 && minDimension >= 2048) {
    return 80
  }
  
  // iPad Pro 11" - 1668 x 2388 pixels
  if (maxDimension >= 2388 && minDimension >= 1668) {
    return 76
  }
  
  // Other iPad models - use default
  return 20
}

export const SiriGlowBorder: React.FC<SiriGlowBorderProps> = ({
  isLoading,
  thickness = 3,
  zIndex = 9999,
  className = ''
}) => {
  const [mounted, setMounted] = useState(false)
  const [cornerRadius, setCornerRadius] = useState(20)

  useEffect(() => {
    setMounted(true)
    const radius = getIPadCornerRadius()
    setCornerRadius(radius)
    
    // Debug log for development
    if (process.env.NODE_ENV === 'development') {
      console.log('🎯 SiriGlowBorder: Detected corner radius:', radius, 'px')
    }
  }, [])

  if (!mounted) return null

  return (
    <>
      {/* Single border element that wraps the entire screen */}
      <div
        className={`siri-border-wrapper ${isLoading ? 'siri-loading' : 'siri-idle'} ${className}`}
        style={{
          position: 'fixed',
          top: `${thickness/2}px`,
          left: `${thickness/2}px`,
          right: `${thickness/2}px`,
          bottom: `${thickness/2}px`,
          zIndex,
          pointerEvents: 'none',
          border: `${thickness}px solid currentColor`,
          borderRadius: `${cornerRadius}px`,
          boxSizing: 'border-box'
        }}
      />

      <style jsx>{`
        /* Base wrapper styles */
        .siri-border-wrapper {
          transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }

        /* Loading state - Siri colors animation */
        .siri-loading {
          animation: siriGlow 4s ease-in-out infinite;
          box-shadow: 
            0 0 ${thickness * 4}px currentColor,
            inset 0 0 ${thickness * 2}px currentColor;
        }

        /* Idle state - Subtle white pulse */
        .siri-idle {
          color: rgba(255, 255, 255, 0.4);
          animation: idlePulse 3s ease-in-out infinite;
          box-shadow: 
            0 0 ${thickness * 2}px rgba(255, 255, 255, 0.2),
            inset 0 0 ${thickness}px rgba(255, 255, 255, 0.1);
        }

        /* Main Siri glow animation */
        @keyframes siriGlow {
          0%, 100% {
            color: #007AFF;
            filter: brightness(1.2) saturate(1.5);
          }
          20% {
            color: #5856D6;
            filter: brightness(1.4) saturate(1.8);
          }
          40% {
            color: #AF52DE;
            filter: brightness(1.3) saturate(1.6);
          }
          60% {
            color: #FF2D55;
            filter: brightness(1.5) saturate(2);
          }
          80% {
            color: #5AC8FA;
            filter: brightness(1.3) saturate(1.7);
          }
        }

        /* Idle pulse animation */
        @keyframes idlePulse {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.002);
          }
        }

        /* Ensure smooth transitions between states */
        .siri-border-wrapper {
          will-change: color, transform, opacity, filter;
          transform: translateZ(0);
          backface-visibility: hidden;
          -webkit-font-smoothing: antialiased;
        }

        /* Performance optimization for iPad */
        @media (hover: none) and (pointer: coarse) {
          .siri-border-wrapper {
            transform: translateZ(0);
            -webkit-transform: translateZ(0);
          }
        }

        /* Reduce motion for accessibility */
        @media (prefers-reduced-motion: reduce) {
          .siri-loading,
          .siri-idle {
            animation-duration: 6s;
          }
          
          .siri-border-wrapper {
            transition-duration: 1s;
          }
        }

        /* iPad Pro specific optimizations - Absolute screen edge positioning */
        @media screen and (min-width: 1024px) and (orientation: portrait),
               screen and (min-height: 1024px) and (orientation: landscape) {
          .siri-border-wrapper {
            filter: blur(0.5px);
            /* Position at absolute screen edges, over system UI */
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            margin: ${thickness/2}px;
          }
        }

        /* Absolute positioning for all PWA modes - True viewport edge */
        @supports (display-mode: fullscreen) or (display-mode: standalone) {
          .siri-border-wrapper {
            /* Absolute screen edge positioning - independent of app content */
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            margin: ${thickness/2}px;
          }
        }

        /* Force absolute positioning on iPad regardless of mode */
        @media (hover: none) and (pointer: coarse) and (min-width: 1024px) {
          .siri-border-wrapper {
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            margin: ${thickness/2}px !important;
          }
        }
      `}</style>
    </>
  )
}

export default SiriGlowBorder 