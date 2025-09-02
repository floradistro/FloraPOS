import React from 'react';

interface DividerProps {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export function Divider({ className = '', orientation = 'vertical' }: DividerProps) {
  const baseClasses = orientation === 'vertical' 
    ? 'w-px h-4 bg-white/[0.08]' 
    : 'h-px w-full bg-white/[0.08]';
  
  return (
    <div className={`${baseClasses} ${className}`} />
  );
}
