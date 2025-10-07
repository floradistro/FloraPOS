'use client';

/**
 * Cache Management Utilities
 * Handles cache busting and cleanup for development
 */

export class CacheManager {
  private static readonly CACHE_VERSION = Date.now().toString();
  private static readonly DEV_CACHE_PREFIX = 'flora-pos-dev-';
  private static clearingInterval: ReturnType<typeof setInterval> | null = null;
  
  /**
   * Clear all application caches
   */
  static async clearAllCaches(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    try {
      // Clear Service Worker caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('🧹 Cleared all service worker caches');
      }
      
      // Clear localStorage but preserve important data
      const preserveKeys = ['restock_operations', 'mock_purchase_orders', 'pos_user', 'pos_token', 'flora_pos_api_environment'];
      const preservedData: { [key: string]: string } = {};
      
      // Save important data - exact keys
      preserveKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          preservedData[key] = value;
        }
      });
      
      // Save important data - pattern-based (store configs, menu configs, TV registrations)
      const preservePatterns = ['flora-store-config-', 'flora-menu-config-', 'tv-id-'];
      Object.keys(localStorage).forEach(key => {
        if (preservePatterns.some(pattern => key.includes(pattern))) {
          const value = localStorage.getItem(key);
          if (value) {
            preservedData[key] = value;
          }
        }
      });
      
      // Clear all localStorage
      localStorage.clear();
      
      // Restore important data
      Object.entries(preservedData).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
      
      console.log('🧹 Cleared localStorage (preserved:', Object.keys(preservedData).filter(k => !k.includes('tv-id-')).join(', '), '+ TV registrations)');
      
      // Clear sessionStorage
      sessionStorage.clear();
      console.log('🧹 Cleared sessionStorage');
      
      // Clear IndexedDB if needed
      if ('indexedDB' in window) {
        // Note: This is a more aggressive approach for development
        // In production, you'd want to be more selective
      }
      
    } catch (error) {
      console.error('❌ Error clearing caches:', error);
    }
  }
  
  /**
   * Add cache busting to URLs in development
   */
  static addCacheBuster(url: string): string {
    if (process.env.NODE_ENV !== 'development') return url;
    
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}_cb=${this.CACHE_VERSION}`;
  }
  
  /**
   * Force reload the page with cache bypass
   */
  static forceReload(): void {
    if (typeof window === 'undefined') return;
    
    // Clear caches first
    this.clearAllCaches().then(() => {
      // Force reload with cache bypass
      window.location.reload();
    });
  }
  
  /**
   * Setup development cache management
   */
  static setupDevCacheManagement(): void {
    if (typeof window === 'undefined') return;
    
    // ALWAYS clear caches on load in development
    console.log('🧹 Clearing ALL caches on load...');
    this.clearAllCaches();
    
    // Clear caches periodically in development (every 30 seconds)
    if (process.env.NODE_ENV === 'development') {
      if (this.clearingInterval) {
        clearInterval(this.clearingInterval);
      }
      this.clearingInterval = setInterval(() => {
        console.log('🧹 Auto-clearing caches...');
        this.clearAllCaches();
      }, 30000); // Every 30 seconds
    }
    
    // Add keyboard shortcut for cache clearing (Ctrl+Shift+R or Cmd+Shift+R)
    window.addEventListener('keydown', (event) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'R') {
        event.preventDefault();
        console.log('🔄 Force reload triggered by keyboard shortcut');
        this.forceReload();
      }
    });
    
    // Add global cache management functions for console debugging
    (window as any).__floraCacheManager = {
      clearAll: () => this.clearAllCaches(),
      forceReload: () => this.forceReload(),
      version: this.CACHE_VERSION,
      stopAutoClear: () => {
        if (this.clearingInterval) {
          clearInterval(this.clearingInterval);
          this.clearingInterval = null;
          console.log('⏹️ Stopped auto-clearing caches');
        }
      }
    };
    
    console.log('🛠️ Development cache management enabled');
    console.log('   - Caches are cleared on every load');
    console.log('   - Caches are auto-cleared every 30 seconds');
    console.log('   - Use Ctrl+Shift+R (Cmd+Shift+R) to force reload');
    console.log('   - Use __floraCacheManager.clearAll() in console');
    console.log('   - Use __floraCacheManager.stopAutoClear() to stop auto-clearing');
  }
  
  /**
   * Check if we need to bust cache based on version
   */
  static shouldBustCache(): boolean {
    // ALWAYS bust cache in development
    if (process.env.NODE_ENV === 'development') return true;
    
    const storedVersion = localStorage.getItem('flora-cache-version');
    return storedVersion !== this.CACHE_VERSION;
  }
  
  /**
   * Update cache version
   */
  static updateCacheVersion(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('flora-cache-version', this.CACHE_VERSION);
  }
}
