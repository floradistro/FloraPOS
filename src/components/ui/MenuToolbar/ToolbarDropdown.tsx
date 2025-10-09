'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ToolbarDropdownProps } from './types';

export const ToolbarDropdown: React.FC<ToolbarDropdownProps> = ({ 
  label, 
  icon, 
  isActive = false, 
  children, 
  className = "" 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`relative z-10 ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm transition-all duration-200 ease-out ${
          isActive || isOpen
            ? 'bg-neutral-700/90 text-white border border-neutral-500/70'
            : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60 border border-transparent hover:border-neutral-600/50'
        }`}
        title={label}
      >
        {icon}
        <span className="whitespace-nowrap font-medium">{label}</span>
        <svg 
          className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className={`absolute top-full mt-2 bg-neutral-800/95 backdrop-blur-sm border border-neutral-600/50 rounded-lg shadow-xl z-[9999] min-w-56 max-h-[calc(100vh-120px)] overflow-y-auto ${
          className?.includes('dropdown-right') ? 'right-0' : 'left-0'
        }`}>
          <div className="py-2">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};
