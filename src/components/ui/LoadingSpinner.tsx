import React from 'react';
import { AnimatedLogo } from './AnimatedLogo';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
  subText?: string;
  centered?: boolean;
  overlay?: boolean;
  fullHeight?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'lg', 
  className = '',
  text,
  subText,
  centered = true,
  overlay = false,
  fullHeight = true
}) => {

  const content = (
    <div className="text-center space-y-4">
      <AnimatedLogo size={size} className="mx-auto" />
      {text && (
        <div className="space-y-2">
          <p className="text-neutral-300 text-xl font-light">{text}</p>
          {subText && <p className="text-neutral-500 text-base">{subText}</p>}
        </div>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="absolute inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  if (centered) {
    return (
      <div className={`flex items-center justify-center ${fullHeight ? 'h-full' : ''} w-full`}>
        {content}
      </div>
    );
  }

  return content;
};