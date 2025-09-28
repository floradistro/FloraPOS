'use client';

import React, { ReactNode } from 'react';
import ReactDOM from 'react-dom';

interface UnifiedPopoutProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  width?: string;
  height?: string;
}

export function UnifiedPopout({ 
  isOpen, 
  onClose, 
  children,
  className = '',
  width = 'min(90vw, 800px)',
  height = 'min(80vh, 700px)'
}: UnifiedPopoutProps) {
  if (!isOpen || typeof document === 'undefined') return null;

  return ReactDOM.createPortal(
    <>
      {/* Enhanced Glass Overlay */}
      <div 
        className="fixed inset-0 transition-all duration-500"
        style={{ 
          zIndex: 99998,
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(8px) saturate(120%)',
          WebkitBackdropFilter: 'blur(8px) saturate(120%)'
        }}
        onClick={onClose}
      />
      
      {/* Subtle Glass Modal */}
      <div 
        className={`fixed rounded-2xl overflow-hidden shadow-2xl ${className}`}
        style={{ 
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: width,
          height: height,
          zIndex: 99999,
          background: 'rgba(23, 23, 23, 0.85)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          filter: 'contrast(1.1) brightness(1.1)'
        }}
      >
        {children}
      </div>
    </>,
    document.body
  );
}
