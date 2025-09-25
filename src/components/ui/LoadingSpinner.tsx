import React from 'react';
import { AnimatedLogo } from './AnimatedLogo';
import { MatrixRain } from './MatrixRain';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  centered?: boolean;
  overlay?: boolean;
  fullHeight?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'lg', 
  className = '',
  centered = true,
  overlay = false,
  fullHeight = true
}) => {

  const content = (
    <div className="text-center relative">
      <AnimatedLogo size={size} className="mx-auto relative z-10" />
    </div>
  );

  if (overlay) {
    return (
      <div className="absolute inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
        <MatrixRain size={size} className="opacity-30" />
        {content}
      </div>
    );
  }

  if (centered) {
    return (
      <div className={`flex items-center justify-center ${fullHeight ? 'h-full' : ''} w-full relative`}>
        <MatrixRain size={size} className="opacity-30" />
        {content}
      </div>
    );
  }

  return content;
};