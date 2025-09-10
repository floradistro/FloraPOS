'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface SettingsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}

export function SettingsDropdown({ isOpen, onClose, onToggle }: SettingsDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const handleClearCache = async () => {
    try {
      // Clear various caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      // Clear localStorage
      localStorage.clear();
      
      // Clear sessionStorage  
      sessionStorage.clear();
      
      // Refresh the page
      window.location.reload();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
    onClose();
  };

  const handleReloadPage = () => {
    window.location.reload();
    onClose();
  };

  const handleViewConsole = () => {
    // Open developer console programmatically (works in some browsers)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 POS Debug Console - Use browser dev tools (F12) for full debugging');
      console.log('🔧 Current User:', user);
      console.log('🔧 Environment:', process.env.NODE_ENV);
      console.log('🔧 API Base:', process.env.NEXT_PUBLIC_API_BASE_URL);
    }
    onClose();
  };

  const handleExportData = () => {
    try {
      const data = {
        timestamp: new Date().toISOString(),
        user: user,
        localStorage: { ...localStorage },
        sessionStorage: { ...sessionStorage },
        environment: process.env.NODE_ENV
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pos-debug-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export data:', error);
    }
    onClose();
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className="w-full bg-neutral-900/80 backdrop-blur-sm border border-neutral-700/50 rounded-lg overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-neutral-700/50 bg-neutral-800/50">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium text-neutral-300 uppercase tracking-wider">Settings & Dev Tools</h3>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-200 bg-neutral-900/80 hover:bg-neutral-800/90 border border-neutral-700/50 hover:border-neutral-600/60 transition-all duration-300 ease-out p-1 rounded-lg"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* User Info */}
      {user && (
        <div className="px-4 py-3 border-b border-neutral-700/50 bg-neutral-850/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-sm text-neutral-200 font-medium">{user.username}</div>
              <div className="text-xs text-neutral-400">{user.location || 'FloraDistro'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Dev Tools Section */}
      <div className="py-1">
        <div className="px-4 py-1.5 text-xs font-medium text-neutral-500 uppercase tracking-wider">
          Development Tools
        </div>
        
        <button
          onClick={handleViewConsole}
          className="w-full px-4 py-2 text-left text-sm text-neutral-300 hover:bg-neutral-800/20 hover:text-neutral-200 transition-all duration-300 ease-out flex items-center gap-3 group rounded-lg mx-2"
        >
          <svg className="w-3.5 h-3.5 text-neutral-500 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs">View Console Logs</span>
        </button>

        <button
          onClick={handleClearCache}
          className="w-full px-4 py-2 text-left text-sm text-neutral-300 hover:bg-neutral-800/20 hover:text-neutral-200 transition-all duration-300 ease-out flex items-center gap-3 group rounded-lg mx-2"
        >
          <svg className="w-3.5 h-3.5 text-neutral-500 group-hover:text-orange-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span className="text-xs">Clear All Cache</span>
        </button>

        <button
          onClick={handleReloadPage}
          className="w-full px-4 py-2 text-left text-sm text-neutral-300 hover:bg-neutral-800/20 hover:text-neutral-200 transition-all duration-300 ease-out flex items-center gap-3 group rounded-lg mx-2"
        >
          <svg className="w-3.5 h-3.5 text-neutral-500 group-hover:text-green-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="text-xs">Reload Application</span>
        </button>

        <button
          onClick={handleExportData}
          className="w-full px-4 py-2 text-left text-sm text-neutral-300 hover:bg-neutral-800/20 hover:text-neutral-200 transition-all duration-300 ease-out flex items-center gap-3 group rounded-lg mx-2"
        >
          <svg className="w-3.5 h-3.5 text-neutral-500 group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-xs">Export Debug Data</span>
        </button>
      </div>

      {/* System Info Section */}
      <div className="border-t border-neutral-700/50 py-2">
        <div className="px-4 py-1.5 text-xs font-medium text-neutral-500 uppercase tracking-wider">
          System Information
        </div>
        
        <div className="px-4 py-2 space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-xs text-neutral-500">Environment</span>
            <span className="text-xs text-neutral-300 font-mono">{process.env.NODE_ENV}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-neutral-500">Version</span>
            <span className="text-xs text-neutral-300 font-mono">{process.env.npm_package_version || '1.0.0'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-neutral-500">Build</span>
            <span className="text-xs text-neutral-300 font-mono">{process.env.NEXT_PUBLIC_BUILD_ID || 'dev'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-neutral-500">API</span>
            <span className="text-xs text-blue-400 font-mono">floradistro.com</span>
          </div>
        </div>
      </div>

      {/* Account Section */}
      <div className="border-t border-neutral-700/50 py-2">
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all duration-300 ease-out flex items-center gap-3 group rounded-lg mx-2"
        >
          <svg className="w-3.5 h-3.5 group-hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="text-xs">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
