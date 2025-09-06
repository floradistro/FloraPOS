import React from 'react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'default' | 'active' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const iconButtonVariants = {
  default: 'text-neutral-500 hover:text-neutral-300 bg-transparent hover:bg-white/[0.08] border-none relative',
  active: 'text-white bg-transparent border-none relative after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-4 after:h-0.5 after:bg-blue-500 after:rounded-full',
  ghost: 'text-neutral-500 hover:text-neutral-300 bg-transparent hover:bg-white/[0.06] border-none'
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
  const baseClasses = 'rounded-sm vscode-button-hover';
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
