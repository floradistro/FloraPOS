'use client';

import React from 'react';
import { ToolbarDropdown } from './ToolbarDropdown';
import { DropdownItem } from './DropdownItem';

interface ConfigDropdownProps {
  loadedConfigName?: string;
  onLoadConfig: () => void;
  onSaveLayout: () => void;
  onSaveTheme: () => void;
  onQRCode: () => void;
  onStoreConfig: () => void;
  onToggleTVPanel: () => void;
  showTVPanel: boolean;
  onlineCount: number;
  totalTVs: number;
  hasLocation: boolean;
}

export const ConfigDropdown: React.FC<ConfigDropdownProps> = ({
  loadedConfigName,
  onLoadConfig,
  onSaveLayout,
  onSaveTheme,
  onQRCode,
  onStoreConfig,
  onToggleTVPanel,
  showTVPanel,
  onlineCount,
  totalTVs,
  hasLocation
}) => {
  return (
    <ToolbarDropdown
      label={loadedConfigName ? `✓ ${loadedConfigName}` : 'Config'}
      icon={
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      }
      isActive={!!loadedConfigName}
    >
      <DropdownItem
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        }
        label={`TV Panel (${onlineCount}/${totalTVs})`}
        description={showTVPanel ? "Hide TV control panel" : "Show TV control panel"}
        isActive={showTVPanel}
        onClick={onToggleTVPanel}
      />
      
      <div className="border-t border-neutral-700/50 my-1" />
      
      <DropdownItem
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        }
        label="Load Config"
        description="Load saved layouts & themes"
        onClick={onLoadConfig}
      />
      
      <DropdownItem
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
        }
        label="Save Layout"
        description="Save menu structure"
        onClick={onSaveLayout}
      />
      
      <DropdownItem
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
        }
        label="Save Theme"
        description="Save colors & fonts"
        onClick={onSaveTheme}
      />
      
      <div className="border-t border-neutral-700/50 my-1" />
      
      <DropdownItem
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
        }
        label="QR Code"
        description="Generate QR for TVs"
        onClick={onQRCode}
        disabled={!hasLocation}
      />
      
      <DropdownItem
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        }
        label="Store Config"
        description="Configure store & TVs"
        onClick={onStoreConfig}
      />
    </ToolbarDropdown>
  );
};
