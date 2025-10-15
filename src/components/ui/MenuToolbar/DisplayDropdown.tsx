'use client';

import React from 'react';
import { ToolbarDropdown } from './ToolbarDropdown';
import { DropdownItem, DropdownSeparator } from './DropdownItem';
import { MenuConfig } from './types';

interface DisplayDropdownProps {
  currentConfig: MenuConfig;
  onConfigChange: (updates: Partial<MenuConfig>) => void;
  pandaMode?: boolean;
  onPandaModeToggle?: () => void;
  pricingTiersShape?: 'circle' | 'rectangle';
  onPricingShapeChange?: (shape: 'circle' | 'rectangle') => void;
}

export const DisplayDropdown: React.FC<DisplayDropdownProps> = ({
  currentConfig,
  onConfigChange,
  pandaMode = false,
  onPandaModeToggle,
  pricingTiersShape = 'circle',
  onPricingShapeChange
}) => {
  return (
    <ToolbarDropdown
      label={undefined}
      icon={
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
        </svg>
      }
      isActive={currentConfig.showImages || pandaMode}
    >
      <DropdownItem
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
          </svg>
        }
        label="Show Images"
        description="Display product images"
        isActive={currentConfig.showImages}
        onClick={() => onConfigChange({ showImages: true })}
      />
      <DropdownItem
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
          </svg>
        }
        label="Hide Images"
        description="Text-only display"
        isActive={!currentConfig.showImages}
        onClick={() => onConfigChange({ showImages: false })}
      />
      
      <DropdownSeparator />
      <div className="px-3 py-1 text-xs text-neutral-400 font-medium">VIEW MODE</div>
      
      <DropdownItem
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        }
        label="Auto"
        description="Smart view based on content"
        isActive={currentConfig.viewMode === 'auto'}
        onClick={() => onConfigChange({ viewMode: 'auto' })}
      />
      <DropdownItem
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 6h18m-9 8h9m-9 4h9m-18-8v8a2 2 0 002 2h16a2 2 0 002-2v-8M5 6V4a2 2 0 012-2h10a2 2 0 012 2v2" />
          </svg>
        }
        label="Table"
        description="Compact table view"
        isActive={currentConfig.viewMode === 'table'}
        onClick={() => {
          console.log('🔧 Setting viewMode to TABLE');
          onConfigChange({ viewMode: 'table' });
        }}
      />
      <DropdownItem
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        }
        label="Card"
        description="Visual card layout"
        isActive={currentConfig.viewMode === 'card'}
        onClick={() => {
          console.log('🔧 Setting viewMode to CARD');
          onConfigChange({ viewMode: 'card' });
        }}
      />
      
      <DropdownSeparator />
      <div className="px-3 py-1 text-xs text-neutral-400 font-medium">PRICE DISPLAY</div>
      
      <DropdownItem
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
          </svg>
        }
        label="Hide Prices"
        description="No pricing shown"
        isActive={currentConfig.priceLocation === 'none'}
        onClick={() => onConfigChange({ priceLocation: 'none' })}
      />
      <DropdownItem
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        }
        label="Header Prices"
        description="Pricing tiers at top"
        isActive={currentConfig.priceLocation === 'header'}
        onClick={() => onConfigChange({ priceLocation: 'header' })}
      />
      <DropdownItem
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
        label="Inline Prices"
        description="Prices in product rows"
        isActive={currentConfig.priceLocation === 'inline'}
        onClick={() => onConfigChange({ priceLocation: 'inline' })}
      />
      
      {onPricingShapeChange && (
        <>
          <DropdownSeparator />
          <div className="px-3 py-1 text-xs text-neutral-400 font-medium">PRICING STYLE</div>
          
          <DropdownItem
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" strokeWidth={2} />
              </svg>
            }
            label="Circle Tiers"
            description="Modern circular badges"
            isActive={pricingTiersShape === 'circle'}
            onClick={() => onPricingShapeChange('circle')}
          />
          <DropdownItem
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="6" width="18" height="12" rx="2" strokeWidth={2} />
              </svg>
            }
            label="Rectangle Tiers"
            description="Traditional pill style"
            isActive={pricingTiersShape === 'rectangle'}
            onClick={() => onPricingShapeChange('rectangle')}
          />
        </>
      )}
      
      {onPandaModeToggle && (
        <>
          <DropdownSeparator />
          <DropdownItem
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            }
            label="Dark Theme"
            description="High contrast dark mode"
            isActive={pandaMode}
            onClick={onPandaModeToggle}
          />
        </>
      )}
    </ToolbarDropdown>
  );
};
