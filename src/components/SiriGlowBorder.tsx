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

export const SiriGlowBorder: React.FC<SiriGlowBorderProps> = ({
  isLoading,
  thickness = 3,
  zIndex = 9999,
  className = ''
}) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <>
      {/* Top Border */}
      <div
        className={`siri-border siri-border-top ${isLoading ? 'siri-loading' : 'siri-idle'} ${className}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: `${thickness}px`,
          zIndex,
          pointerEvents: 'none'
        }}
      />
      
      {/* Right Border */}
      <div
        className={`siri-border siri-border-right ${isLoading ? 'siri-loading' : 'siri-idle'} ${className}`}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: `${thickness}px`,
          zIndex,
          pointerEvents: 'none'
        }}
      />
      
      {/* Bottom Border */}
      <div
        className={`siri-border siri-border-bottom ${isLoading ? 'siri-loading' : 'siri-idle'} ${className}`}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: `${thickness}px`,
          zIndex,
          pointerEvents: 'none'
        }}
      />
      
      {/* Left Border */}
      <div
        className={`siri-border siri-border-left ${isLoading ? 'siri-loading' : 'siri-idle'} ${className}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: `${thickness}px`,
          zIndex,
          pointerEvents: 'none'
        }}
      />
      
      {/* Corner Highlights for smooth corners */}
      <div
        className={`siri-corner siri-corner-tl ${isLoading ? 'siri-loading' : 'siri-idle'} ${className}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: `${thickness * 3}px`,
          height: `${thickness * 3}px`,
          zIndex: zIndex + 1,
          pointerEvents: 'none'
        }}
      />
      <div
        className={`siri-corner siri-corner-tr ${isLoading ? 'siri-loading' : 'siri-idle'} ${className}`}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: `${thickness * 3}px`,
          height: `${thickness * 3}px`,
          zIndex: zIndex + 1,
          pointerEvents: 'none'
        }}
      />
      <div
        className={`siri-corner siri-corner-bl ${isLoading ? 'siri-loading' : 'siri-idle'} ${className}`}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: `${thickness * 3}px`,
          height: `${thickness * 3}px`,
          zIndex: zIndex + 1,
          pointerEvents: 'none'
        }}
      />
      <div
        className={`siri-corner siri-corner-br ${isLoading ? 'siri-loading' : 'siri-idle'} ${className}`}
        style={{
          position: 'fixed',
          bottom: 0,
          right: 0,
          width: `${thickness * 3}px`,
          height: `${thickness * 3}px`,
          zIndex: zIndex + 1,
          pointerEvents: 'none'
        }}
      />

      <style jsx>{`
        /* Base styles for all borders */
        .siri-border {
          background: linear-gradient(90deg, transparent, currentColor, transparent);
          transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }

        /* Vertical borders need different gradient direction */
        .siri-border-left,
        .siri-border-right {
          background: linear-gradient(0deg, transparent, currentColor, transparent);
        }

        /* Corner overlays for smooth effect */
        .siri-corner {
          border-radius: 50%;
          filter: blur(${thickness * 2}px);
          transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Loading state - Siri colors animation */
        .siri-loading {
          animation: siriGlow 4s ease-in-out infinite;
          box-shadow: 
            0 0 ${thickness * 4}px currentColor,
            inset 0 0 ${thickness * 2}px currentColor;
        }

        .siri-loading.siri-corner {
          animation: siriCornerGlow 4s ease-in-out infinite;
        }

        /* Idle state - Subtle white pulse */
        .siri-idle {
          color: rgba(255, 255, 255, 0.4);
          animation: idlePulse 3s ease-in-out infinite;
          box-shadow: 
            0 0 ${thickness * 2}px rgba(255, 255, 255, 0.2),
            inset 0 0 ${thickness}px rgba(255, 255, 255, 0.1);
        }

        .siri-idle.siri-corner {
          color: rgba(255, 255, 255, 0.3);
          animation: idleCornerPulse 3s ease-in-out infinite;
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

        /* Corner glow animation for loading state */
        @keyframes siriCornerGlow {
          0%, 100% {
            color: #007AFF;
            transform: scale(1);
            opacity: 0.8;
          }
          20% {
            color: #5856D6;
            transform: scale(1.2);
            opacity: 1;
          }
          40% {
            color: #AF52DE;
            transform: scale(1.1);
            opacity: 0.9;
          }
          60% {
            color: #FF2D55;
            transform: scale(1.3);
            opacity: 1;
          }
          80% {
            color: #5AC8FA;
            transform: scale(1.1);
            opacity: 0.85;
          }
        }

        /* Idle pulse animation */
        @keyframes idlePulse {
          0%, 100% {
            opacity: 0.3;
            transform: scaleX(1) scaleY(1);
          }
          50% {
            opacity: 0.6;
            transform: scaleX(1.01) scaleY(1.01);
          }
        }

        /* Idle corner pulse */
        @keyframes idleCornerPulse {
          0%, 100% {
            opacity: 0.2;
            transform: scale(0.8);
          }
          50% {
            opacity: 0.4;
            transform: scale(1);
          }
        }

        /* Ensure smooth transitions between states */
        .siri-border,
        .siri-corner {
          will-change: color, transform, opacity, filter;
          transform: translateZ(0);
          backface-visibility: hidden;
          -webkit-font-smoothing: antialiased;
        }

        /* Performance optimization for iPad */
        @media (hover: none) and (pointer: coarse) {
          .siri-border,
          .siri-corner {
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
          
          .siri-border,
          .siri-corner {
            transition-duration: 1s;
          }
        }
      `}</style>
    </>
  )
}

export default SiriGlowBorder 