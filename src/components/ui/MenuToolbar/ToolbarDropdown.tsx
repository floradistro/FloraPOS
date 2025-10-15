'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ToolbarDropdownProps } from './types';

export const ToolbarDropdown: React.FC<ToolbarDropdownProps & { trigger?: React.ReactNode }> = ({ 
  label, 
  icon, 
  isActive = false, 
  children, 
  className = "",
  trigger
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
    <>
      <div className={`relative ${className}`} ref={dropdownRef} style={{ zIndex: isOpen ? 999999 : 50 }}>
        {trigger ? (
          <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
            {trigger}
          </div>
        ) : (
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
            {label && (
              <>
                <span className="whitespace-nowrap font-medium">{label}</span>
                <svg 
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </button>
        )}
        
        {isOpen && (
          <div className={`absolute top-full mt-2 rounded-2xl min-w-56 max-h-[calc(100vh-120px)] overflow-y-auto ${
            className?.includes('dropdown-right') ? 'right-0' : 'left-0'
          }`}
          style={{ 
            zIndex: 999999,
            background: 'rgba(23, 23, 23, 0.98)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
            fontFamily: 'Tiempos, serif'
          }}>
            <div className="py-2">
              {children}
            </div>
          </div>
        )}
      </div>
      
      {/* Backdrop overlay - blocks all interaction with content below */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-transparent"
          style={{ zIndex: 999998 }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};
