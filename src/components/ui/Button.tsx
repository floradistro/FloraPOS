import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

const buttonVariants = {
  primary: 'bg-neutral-800/50 hover:bg-neutral-800/70 text-neutral-300 hover:text-neutral-200 border-b border-white/[0.02]',
  secondary: 'bg-neutral-900/40 hover:bg-neutral-800/60 text-neutral-400 hover:text-neutral-300 border-b border-white/[0.02]',
  ghost: 'bg-transparent hover:bg-neutral-800/50 text-neutral-500 hover:text-neutral-400 border-b border-transparent',
  danger: 'bg-red-900/30 hover:bg-red-900/50 text-red-400 hover:text-red-300 border-b border-white/[0.02]'
};

const buttonSizes = {
  sm: 'px-2 py-1 text-xs md:text-base',
  md: 'px-3 py-2 text-sm md:text-lg',
  lg: 'px-4 py-3 text-base md:text-xl'
};

export function Button({ 
  variant = 'secondary', 
  size = 'md', 
  children, 
  className = '', 
  ...props 
}: ButtonProps) {
  const baseClasses = 'rounded-lg smooth-hover  flex-shrink-0';
  const variantClasses = buttonVariants[variant];
  const sizeClasses = buttonSizes[size];
  
  return (
    <button 
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}


