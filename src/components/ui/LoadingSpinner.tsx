import React from 'react';
import { AnimatedLogo } from './AnimatedLogo';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
  centered?: boolean;
  overlay?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '',
  text,
  centered = false,
  overlay = false
}) => {

  const spinner = (
    <AnimatedLogo size={size} className={className} />
  );

  const content = text ? (
    <div className="text-center">
      <AnimatedLogo size={size} className="mx-auto mb-3" />
      <p className="text-neutral-400 text-sm">{text}</p>
    </div>
  ) : spinner;

  if (overlay) {
    return (
      <div className="absolute inset-0 bg-neutral-900/80 flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  if (centered) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        {content}
      </div>
    );
  }

  return content;
};


