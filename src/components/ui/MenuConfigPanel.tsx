'use client';

import React, { useState, useEffect } from 'react';
import { menuConfigService, MenuConfig } from '../../services/menu-config-service';
import { useAuth } from '../../contexts/AuthContext';

interface MenuConfigPanelProps {
  onLoadConfig: (config: MenuConfig) => void;
  onSaveConfig: (name: string) => Promise<void>;
  currentConfigName?: string;
}

export function MenuConfigPanel({ onLoadConfig, onSaveConfig, currentConfigName }: MenuConfigPanelProps) {
  const { user } = useAuth();
  const [configs, setConfigs] = useState<MenuConfig[]>([]);
  const [templates, setTemplates] = useState<MenuConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);
  const [qrUrl, setQrUrl] = useState('');
  const [locations, setLocations] = useState<Record<number, string>>({});

  // Load location names
  const loadLocations = async () => {
    try {
      const response = await fetch('/api/proxy/flora-im/locations', {
        headers: {
          'x-api-environment': localStorage.getItem('flora_pos_api_environment') || 'docker',
          'Cache-Control': 'no-cache'
        }
      });
      const result = await response.json();
      
      if (result.success && result.data) {
        const locationMap: Record<number, string> = {};
        result.data.forEach((loc: any) => {
          locationMap[loc.id] = loc.name;
        });
        setLocations(locationMap);
      }
    } catch (error) {
      console.warn('Failed to load locations:', error);
    }
  };

  // Load configs and templates
  const loadConfigs = async () => {
    setLoading(true);
    try {
      const [regularConfigs, templateConfigs] = await Promise.all([
        menuConfigService.getAllConfigs(user?.location_id ? Number(user.location_id) : undefined, false), // Regular configs only, for this location
        menuConfigService.getTemplates() // Templates from dedicated endpoint
      ]);
      
      setConfigs(regularConfigs);
      setTemplates(templateConfigs);
      
      console.log(`📊 Loaded ${regularConfigs.length} configs and ${templateConfigs.length} templates`);
    } catch (error) {
      console.error('Failed to load configs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
    loadConfigs();
  }, [user?.location_id]);

  const handleSave = async () => {
    if (!saveName.trim()) {
      alert('Please enter a theme name');
      return;
    }

    try {
      await onSaveConfig(saveName);
      setShowSaveModal(false);
      setSaveName('');
      await loadConfigs();
    } catch (error) {
      console.error('Failed to save theme:', error);
      alert('Failed to save theme');
    }
  };

  const handleLoad = async (configId: number) => {
    try {
      const config = await menuConfigService.getConfig(configId);
      onLoadConfig(config);
      setShowLoadModal(false);
    } catch (error) {
      console.error('Failed to load theme:', error);
      alert('Failed to load theme');
    }
  };

  const handleGenerateQR = async () => {
    if (!user?.location_id) {
      alert('No location selected');
      return;
    }

    const baseUrl = window.location.origin;
    const url = `${baseUrl}/menu-display?location_id=${user.location_id}`;
    
    // Generate QR using Google Charts API
    const qrApiUrl = `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(url)}&choe=UTF-8`;
    
    setQrUrl(qrApiUrl);
    setShowQRModal(true);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Load Config Button */}
        <button
          id="menu-load-config-trigger"
          onClick={() => setShowLoadModal(true)}
          className="flex items-center gap-1.5 px-2 h-[28px] text-xs transition-all duration-200 ease-out rounded border bg-transparent text-white border-neutral-600/50 hover:bg-neutral-600/10 hover:border-neutral-500/70"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Load Theme
        </button>

        {/* Save Theme Button */}
        <button
          id="menu-save-config-trigger"
          onClick={() => setShowSaveModal(true)}
          className="flex items-center gap-1.5 px-2 h-[28px] text-xs transition-all duration-200 ease-out rounded border bg-transparent text-white border-green-600/50 hover:bg-green-600/10 hover:border-green-500/70"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          Save Theme
        </button>

        {/* QR Code Button */}
        <button
          id="menu-qr-code-trigger"
          onClick={handleGenerateQR}
          className="flex items-center gap-1.5 px-2 h-[28px] text-xs transition-all duration-200 ease-out rounded border bg-transparent text-white border-purple-600/50 hover:bg-purple-600/10 hover:border-purple-500/70"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
          QR Code
        </button>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999]" onClick={() => setShowSaveModal(false)}>
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-4">🎨 Save Menu Theme</h3>
            
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Enter theme name..."
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 mb-4"
              autoFocus
            />

            <div className="flex items-center gap-2 text-xs text-neutral-400 mb-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Saves all colors, fonts, categories, and layout settings</span>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-md text-white font-medium transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 rounded-md text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999]" onClick={() => setShowLoadModal(false)}>
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-4">🎨 Load Menu Theme</h3>
            
            {/* Templates Section */}
            {templates.length > 0 && (
              <>
                <h4 className="text-sm font-semibold text-neutral-400 mb-3">✨ Templates</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                  {templates.map(template => (
                    <div
                      key={template.id}
                      onClick={() => handleLoad(template.id!)}
                      className="p-4 bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg cursor-pointer hover:border-purple-400/50 transition-all group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-white group-hover:text-purple-300 transition-colors">{template.name}</h5>
                          <p className="text-xs text-neutral-400 mt-1">
                            {template.config_data.isDualMenu ? 'Dual Menu' : 'Single Menu'} • {template.config_data.orientation}
                          </p>
                        </div>
                        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            
            {/* Saved Themes Section */}
            <h4 className="text-sm font-semibold text-neutral-400 mb-3">💾 Saved Themes</h4>
            {configs.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                <p>No saved themes yet</p>
                <p className="text-xs mt-2">Save your current theme to see it here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {configs.map(config => (
                  <div
                    key={config.id}
                    onClick={() => handleLoad(config.id!)}
                    className="p-4 bg-neutral-800 border border-neutral-700 rounded-lg cursor-pointer hover:border-blue-500/50 hover:bg-neutral-750 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium text-white group-hover:text-blue-300 transition-colors">{config.name}</h5>
                        <p className="text-xs text-neutral-400 mt-1">
                          {config.config_data.isDualMenu ? 'Dual Menu' : 'Single Menu'} • 
                          {config.location_id ? (
                            <span className="text-blue-300">{locations[config.location_id] || `Location ${config.location_id}`}</span>
                          ) : (
                            <span className="text-purple-300">All Locations</span>
                          )} •
                          {new Date(config.updated_at || '').toLocaleDateString()}
                        </p>
                      </div>
                      {config.is_active && (
                        <span className="px-2 py-0.5 bg-green-500/20 border border-green-500/30 rounded text-xs text-green-300">
                          Active
                        </span>
                      )}
                      <svg className="w-5 h-5 text-neutral-400 group-hover:text-blue-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex gap-2 mt-6 pt-4 border-t border-neutral-700">
              <button
                onClick={() => setShowLoadModal(false)}
                className="flex-1 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 rounded-md text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && qrUrl && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999]" onClick={() => setShowQRModal(false)}>
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-4">📱 QR Code - Location {user?.location_id}</h3>
            
            <div className="bg-white p-6 rounded-lg mb-4 flex items-center justify-center">
              <img src={qrUrl} alt="QR Code" className="w-full max-w-[300px]" />
            </div>
            
            <div className="mb-4">
              <p className="text-xs text-neutral-400 mb-2">Scan this QR code to open menu on any device:</p>
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/menu-display?location_id=${user?.location_id}`}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white text-xs font-mono"
                onClick={(e) => e.currentTarget.select()}
              />
            </div>
            
            <div className="flex gap-2">
              <a
                href={qrUrl}
                download={`menu-qr-location-${user?.location_id}.png`}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-md text-white text-center font-medium transition-colors"
              >
                Download QR
              </a>
              <button
                onClick={() => setShowQRModal(false)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 rounded-md text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

