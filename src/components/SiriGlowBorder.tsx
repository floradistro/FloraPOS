'use client'

import React from 'react'

interface SiriGlowBorderProps {
  isLoading?: boolean
  className?: string
}

export const SiriGlowBorder: React.FC<SiriGlowBorderProps> = ({
  isLoading = false,
  className = ''
}) => {
  return (
    <div
      className={`siri-border ${isLoading ? 'active' : 'idle'} ${className}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        pointerEvents: 'none',
        border: '3px solid transparent',
        borderRadius: '20px',
        margin: '2px',
        background: isLoading 
          ? 'linear-gradient(45deg, #007AFF, #5856D6, #AF52DE, #FF2D55, #5AC8FA) border-box'
          : 'rgba(255, 255, 255, 0.2) border-box',
        WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'subtract',
        mask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
        maskComposite: 'subtract',
        animation: isLoading 
          ? 'siriPulse 2s ease-in-out infinite' 
          : 'idlePulse 4s ease-in-out infinite',
      }}
    />
  )
}

export default SiriGlowBorder