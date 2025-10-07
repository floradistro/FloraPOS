'use client';

import React, { useState, useEffect } from 'react';
import { storeConfigService, StoreConfig, TVConfig } from '../../services/store-config-service';
import { menuConfigService, MenuConfig } from '../../services/menu-config-service';
import { useAuth } from '../../contexts/AuthContext';

export function StoreConfigPanel() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(null);
  const [themes, setThemes] = useState<MenuConfig[]>([]);
  const [loading, setLoading] = useState(false);

  // Load store config and themes
  const loadConfig = async () => {
    if (!user?.location_id) return;
    
    setLoading(true);
    try {
      const [config, allThemes] = await Promise.all([
        storeConfigService.getStoreConfig(user.location_id),
        menuConfigService.getAllConfigs(user.location_id, false)
      ]);
      
      if (config) {
        setStoreConfig(config);
      } else {
        // Create default config
        setStoreConfig({
          location_id: user.location_id,
          store_name: user.location || `Location ${user.location_id}`,
          tvs: [
            {
              tv_number: 1,
              display_name: 'TV 1',
              orientation: 'horizontal',
              theme_id: null,
              auto_launch: false,
              enabled: true
            }
          ]
        });
      }
      
      setThemes(allThemes);
    } catch (error) {
      console.error('Failed to load store config:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showModal) {
      loadConfig();
    }
  }, [showModal, user?.location_id]);

  const handleAddTV = () => {
    if (!storeConfig) return;
    
    const newTVNumber = Math.max(...storeConfig.tvs.map(tv => tv.tv_number), 0) + 1;
    
    setStoreConfig({
      ...storeConfig,
      tvs: [
        ...storeConfig.tvs,
        {
          tv_number: newTVNumber,
          display_name: `TV ${newTVNumber}`,
          orientation: 'horizontal',
          theme_id: null,
          auto_launch: false,
          enabled: true
        }
      ]
    });
  };

  const handleRemoveTV = (tvNumber: number) => {
    if (!storeConfig) return;
    
    setStoreConfig({
      ...storeConfig,
      tvs: storeConfig.tvs.filter(tv => tv.tv_number !== tvNumber)
    });
  };

  const handleUpdateTV = (tvNumber: number, updates: Partial<TVConfig>) => {
    if (!storeConfig) return;
    
    setStoreConfig({
      ...storeConfig,
      tvs: storeConfig.tvs.map(tv => 
        tv.tv_number === tvNumber ? { ...tv, ...updates } : tv
      )
    });
  };

  const handleSave = async () => {
    if (!storeConfig) return;
    
    try {
      if (storeConfig.id) {
        await storeConfigService.updateStoreConfig(storeConfig.location_id, storeConfig);
      } else {
        await storeConfigService.saveStoreConfig(storeConfig);
      }
      
      alert('✅ Store config saved!');
      setShowModal(false);
    } catch (error) {
      console.error('Failed to save store config:', error);
      alert('❌ Failed to save store config');
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-1.5 px-2 h-[28px] text-xs transition-all duration-200 ease-out rounded border bg-transparent text-white border-blue-600/50 hover:bg-blue-600/10 hover:border-blue-500/70"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        Store Config
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999]" onClick={() => setShowModal(false)}>
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-semibold text-white mb-6">📺 Store Configuration - {storeConfig?.store_name}</h3>
            
            {loading ? (
              <div className="text-center py-12 text-neutral-400">Loading...</div>
            ) : storeConfig && (
              <>
                {/* Store Name */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Store Name</label>
                  <input
                    type="text"
                    value={storeConfig.store_name}
                    onChange={(e) => setStoreConfig({ ...storeConfig, store_name: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* TV List */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-white">TV Displays ({storeConfig.tvs.length})</h4>
                    <button
                      onClick={handleAddTV}
                      className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded-md text-white text-sm transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add TV
                    </button>
                  </div>

                  <div className="space-y-3">
                    {storeConfig.tvs.map((tv) => (
                      <div
                        key={tv.tv_number}
                        className="p-4 bg-neutral-800 border border-neutral-700 rounded-lg"
                      >
                        <div className="flex items-start gap-4">
                          {/* TV Number Badge */}
                          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                            <span className="text-xl font-bold text-blue-400">{tv.tv_number}</span>
                          </div>

                          {/* TV Config */}
                          <div className="flex-1 grid grid-cols-2 gap-3">
                            {/* Display Name */}
                            <div>
                              <label className="block text-xs text-neutral-400 mb-1">Display Name</label>
                              <input
                                type="text"
                                value={tv.display_name}
                                onChange={(e) => handleUpdateTV(tv.tv_number, { display_name: e.target.value })}
                                className="w-full px-2 py-1.5 bg-neutral-900 border border-neutral-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                              />
                            </div>

                            {/* Orientation */}
                            <div>
                              <label className="block text-xs text-neutral-400 mb-1">Orientation</label>
                              <select
                                value={tv.orientation}
                                onChange={(e) => handleUpdateTV(tv.tv_number, { orientation: e.target.value as 'horizontal' | 'vertical' })}
                                className="w-full px-2 py-1.5 bg-neutral-900 border border-neutral-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                              >
                                <option value="horizontal">Horizontal</option>
                                <option value="vertical">Vertical</option>
                              </select>
                            </div>

                            {/* Theme */}
                            <div>
                              <label className="block text-xs text-neutral-400 mb-1">Default Theme</label>
                              <select
                                value={tv.theme_id || ''}
                                onChange={(e) => {
                                  const themeId = e.target.value ? parseInt(e.target.value) : null;
                                  const theme = themes.find(t => t.id === themeId);
                                  handleUpdateTV(tv.tv_number, { 
                                    theme_id: themeId,
                                    theme_name: theme?.name 
                                  });
                                }}
                                className="w-full px-2 py-1.5 bg-neutral-900 border border-neutral-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                              >
                                <option value="">No Default Theme</option>
                                {themes.map(theme => (
                                  <option key={theme.id} value={theme.id}>{theme.name}</option>
                                ))}
                              </select>
                            </div>

                            {/* Enabled */}
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={`tv-${tv.tv_number}-enabled`}
                                checked={tv.enabled}
                                onChange={(e) => handleUpdateTV(tv.tv_number, { enabled: e.target.checked })}
                                className="w-4 h-4 rounded bg-neutral-900 border-neutral-600 text-blue-600 focus:ring-blue-500"
                              />
                              <label htmlFor={`tv-${tv.tv_number}-enabled`} className="text-xs text-neutral-400">
                                Enabled
                              </label>
                            </div>
                          </div>

                          {/* Remove Button */}
                          {storeConfig.tvs.length > 1 && (
                            <button
                              onClick={() => handleRemoveTV(tv.tv_number)}
                              className="flex-shrink-0 p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Save Buttons */}
                <div className="flex gap-3 pt-4 border-t border-neutral-700">
                  <button
                    onClick={handleSave}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-md text-white font-medium transition-colors"
                  >
                    Save Store Config
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 rounded-md text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
