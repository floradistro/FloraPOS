'use client';

import React from 'react';
import { DropdownItemProps } from './types';

export const DropdownItem: React.FC<DropdownItemProps> = ({
  icon,
  label,
  description,
  isActive = false,
  disabled = false,
  onClick
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-all duration-200 ease-out ${
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : isActive
          ? 'bg-neutral-700/80 text-white'
          : 'text-neutral-300 hover:bg-neutral-700/60 hover:text-white'
      }`}
    >
      {icon && (
        <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{label}</div>
        {description && (
          <div className="text-xs text-neutral-400 truncate mt-0.5">{description}</div>
        )}
      </div>
      {isActive && (
        <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  );
};

export const DropdownSeparator: React.FC = () => (
  <div className="h-px bg-neutral-600/50 my-2 mx-4" />
);
