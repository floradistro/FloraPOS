'use client';

import React, { useState, useEffect } from 'react';
import { ToolbarDropdown } from './ToolbarDropdown';
import { DropdownItem } from './DropdownItem';
import { menuConfigService, MenuConfig } from '../../../services/menu-config-service';
import { useAuth } from '../../../contexts/AuthContext';

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
  onLoadTheme: (themeId: number) => void;
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
  hasLocation,
  onLoadTheme
}) => {
  const { user } = useAuth();
  const [themes, setThemes] = useState<MenuConfig[]>([]);
  const [showThemes, setShowThemes] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load themes when themes section expands (reload every time to get fresh data)
  useEffect(() => {
    if (showThemes) {
      loadThemes();
    }
  }, [showThemes]);

  const loadThemes = async () => {
    setLoading(true);
    try {
      const locationId = user?.location_id ? parseInt(user.location_id?.toString() ?? '') : undefined;
      const allConfigs = await menuConfigService.getAllConfigs(locationId, false);
      console.log('📋 All configs loaded:', allConfigs.length);
      console.log('📋 Config types:', allConfigs.map(c => ({ name: c.name, type: c.config_type })));
      const themeConfigs = allConfigs.filter(c => c.config_type === 'theme');
      console.log('🎨 Filtered themes:', themeConfigs.length);
      setThemes(themeConfigs);
    } catch (error) {
      console.error('Failed to load themes:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolbarDropdown
      icon={<></>}
      trigger={
        <div className="flex items-center gap-1.5 px-2.5 h-[28px] cursor-pointer text-white/80 hover:text-white transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-xs font-medium">Menu</span>
        </div>
      }
    >
    <div className="w-[400px]" style={{ fontFamily: 'Tiempos, serif' }}>
      <div className="space-y-1 max-h-[440px] overflow-y-auto px-1 pb-2" style={{ 
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent'
      }}>
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
      
      {/* Themes Section - Expandable */}
      <button
        onClick={() => {
          setShowThemes(!showThemes);
          if (!showThemes) loadThemes();
        }}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-all duration-200 ease-out mx-1 text-white/70 hover:bg-white/[0.06] hover:text-white/90"
      >
        <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium truncate">Themes {showThemes && themes.length > 0 && `(${themes.length})`}</div>
        </div>
        {showThemes && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              loadThemes();
            }}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            title="Refresh themes"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}
        <svg 
          className={`w-4 h-4 transition-transform duration-200 ${showThemes ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Themes List */}
      {showThemes && (
        <div className="mx-1 px-2 py-1 space-y-1">
          {/* Create New Theme */}
          <button
            onClick={onSaveTheme}
            className="w-full flex items-center gap-2 px-2 py-2 text-left rounded transition-all duration-200 text-white/60 hover:bg-white/[0.04] hover:text-white/80 border border-dashed border-white/10 hover:border-white/20"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-xs">Create New Theme</span>
          </button>

          {/* Theme Items */}
          {loading ? (
            <div className="text-center py-2 text-white/40 text-xs">Loading...</div>
          ) : themes.length === 0 ? (
            <div className="text-center py-2 text-white/40 text-xs">No themes saved</div>
          ) : (
            themes.map(theme => (
              <button
                key={theme.id}
                onClick={() => onLoadTheme(theme.id!)}
                className="w-full flex items-center gap-2 px-2 py-2 text-left rounded transition-all duration-200 text-white/70 hover:bg-white/[0.04] hover:text-white/90 group"
              >
                <span 
                  className="w-3 h-3 rounded-full border border-white/20 flex-shrink-0" 
                  style={{ backgroundColor: theme.config_data.backgroundColor }}
                />
                <span className="text-xs flex-1 truncate">{theme.name}</span>
                <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))
          )}
        </div>
      )}
      
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
        description="Manage store settings"
        onClick={onStoreConfig}
      />
      </div>
      
      <style jsx>{`
        /* Webkit scrollbar styling */
        div::-webkit-scrollbar {
          width: 6px;
        }
        
        div::-webkit-scrollbar-track {
          background: transparent;
        }
        
        div::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 10px;
        }
        
        div::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.25);
        }
      `}</style>
    </div>
    </ToolbarDropdown>
  );
};
