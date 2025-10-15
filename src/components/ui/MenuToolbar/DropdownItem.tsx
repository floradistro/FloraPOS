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
      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-all duration-200 ease-out mx-1 ${
        disabled
          ? 'opacity-30 cursor-not-allowed'
          : isActive
          ? 'bg-white/[0.08] text-white/95'
          : 'text-white/60 hover:bg-white/[0.04] hover:text-white/85'
      }`}
      style={{ fontFamily: 'Tiempos, serif' }}
    >
      {icon && (
        <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-white/50">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium truncate">{label}</div>
        {description && (
          <div className="text-[10px] text-white/40 truncate mt-0.5">{description}</div>
        )}
      </div>
      {isActive && (
        <svg className="w-3.5 h-3.5 text-white/60 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  );
};

export const DropdownSeparator: React.FC = () => (
  <div className="h-px bg-white/[0.06] my-2 mx-3" />
);
