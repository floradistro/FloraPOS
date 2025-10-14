'use client';

import React from 'react';
import Image from 'next/image';

interface UnifiedLoadingScreenProps {
  overlay?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Unified Loading Screen
 * Consistent animated logo loading across all views
 * No text, just animated logo
 */
export const UnifiedLoadingScreen: React.FC<UnifiedLoadingScreenProps> = ({ 
  overlay = false,
  size = 'lg'
}) => {
  const sizeMap = {
    sm: 48,
    md: 80,
    lg: 120
  };
  
  const logoSize = sizeMap[size];
  
  const containerClass = overlay
    ? "absolute inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50"
    : "h-full flex items-center justify-center";
  
  return (
    <div className={containerClass}>
      <div className="relative">
        <div 
          className="relative flex items-center justify-center"
          style={{
            width: logoSize,
            height: logoSize
          }}
        >
          <Image 
            src="/logo123.png" 
            alt="Loading" 
            width={logoSize}
            height={logoSize}
            className="object-contain animate-pulse"
            priority
            style={{
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Inline loading component (for small sections)
 */
export const InlineLoading: React.FC = () => (
  <div className="flex items-center justify-center p-4">
    <Image 
      src="/logo123.png" 
      alt="Loading" 
      width={32}
      height={32}
      className="object-contain animate-pulse opacity-40"
      priority
    />
  </div>
);

