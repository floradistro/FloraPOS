import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

const buttonVariants = {
  primary: 'bg-transparent hover:bg-neutral-600/10 border border-neutral-500/30 hover:border-neutral-400/50 text-neutral-200 hover:text-white',
  secondary: 'bg-transparent hover:bg-neutral-600/10 border border-neutral-500/30 hover:border-neutral-400/50 text-neutral-300 hover:text-neutral-200',
  ghost: 'bg-transparent hover:bg-neutral-600/5 border border-transparent text-neutral-400 hover:text-neutral-200',
  danger: 'bg-transparent hover:bg-red-600/10 border border-red-500/30 hover:border-red-400/50 text-red-300 hover:text-red-200'
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
  const baseClasses = 'rounded-lg transition-all duration-300 ease-out flex-shrink-0';
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


