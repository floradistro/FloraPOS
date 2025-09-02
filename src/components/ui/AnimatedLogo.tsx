'use client';

import React from 'react';
import Image from 'next/image';

interface AnimatedLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    xs: 'w-8 h-8',
    sm: 'w-12 h-12', 
    md: 'w-16 h-16',
    lg: 'w-32 h-32',  // Match cart empty state
    xl: 'w-40 h-40'
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <Image
        src="/logo123.png"
        alt="Flora"
        width={160}
        height={160}
        className={`
          ${sizeClasses[size]}
          object-contain
          opacity-30
        `}
        style={{
          animation: 'subtle-float 3s ease-in-out infinite'
        }}
        priority
      />

      {/* Custom CSS animations */}
      <style jsx>{`
        @keyframes subtle-float {
          0%, 100% { 
            transform: translateY(0px) scale(1);
            opacity: 0.3;
          }
          50% { 
            transform: translateY(-2px) scale(1.02);
            opacity: 0.4;
          }
        }
      `}</style>
    </div>
  );
};
