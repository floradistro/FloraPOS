import React from 'react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'default' | 'active' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const iconButtonVariants = {
  default: 'text-neutral-400 hover:text-neutral-200 bg-neutral-900/80 hover:bg-neutral-800/90 border border-neutral-700/50 hover:border-neutral-600/60 relative',
  active: 'text-white bg-neutral-800/90 border border-neutral-500 relative after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-4 after:h-0.5 after:bg-blue-500 after:rounded-full',
  ghost: 'text-neutral-400 hover:text-neutral-200 bg-transparent hover:bg-neutral-800/20 border-none'
};

const iconButtonSizes = {
  sm: 'p-1',
  md: 'p-2',
  lg: 'p-3'
};

export function IconButton({ 
  children, 
  variant = 'default', 
  size = 'md', 
  className = '', 
  ...props 
}: IconButtonProps) {
  const baseClasses = 'rounded-lg transition-all duration-300 ease-out';
  const variantClasses = iconButtonVariants[variant];
  const sizeClasses = iconButtonSizes[size];
  
  return (
    <button 
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
      style={{
        // Hardware acceleration for ultra-smooth interactions
        willChange: 'background-color, color, border-color, transform',
        backfaceVisibility: 'hidden',
        transform: 'translateZ(0)',
      }}
      {...props}
    >
      {children}
    </button>
  );
}
