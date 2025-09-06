'use client';

import React from 'react';
import { CacheManager } from '../../lib/cache-manager';

/**
 * Development Cache Controls Component
 * Only shows in development mode
 */
export function DevCacheControls() {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const handleClearCache = async () => {
    try {
      await CacheManager.clearAllCaches();
      alert('✅ All caches cleared! The page will reload.');
      window.location.reload();
    } catch (error) {
      console.error('Error clearing cache:', error);
      alert('❌ Error clearing cache. Check console for details.');
    }
  };

  const handleForceReload = () => {
    CacheManager.forceReload();
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-yellow-500 text-black p-2 rounded-lg shadow-lg text-xs">
      <div className="font-bold mb-1">🛠️ DEV TOOLS</div>
      <div className="space-y-1">
        <button
          onClick={handleClearCache}
          className="block w-full text-left hover:bg-yellow-400 px-2 py-1 rounded"
          title="Clear all caches and reload"
        >
          🧹 Clear Cache
        </button>
        <button
          onClick={handleForceReload}
          className="block w-full text-left hover:bg-yellow-400 px-2 py-1 rounded"
          title="Force reload with cache bypass"
        >
          🔄 Force Reload
        </button>
        <div className="text-xs opacity-75 pt-1 border-t border-yellow-600">
          Ctrl+Shift+R: Force reload
        </div>
      </div>
    </div>
  );
}
