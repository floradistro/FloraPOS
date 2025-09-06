'use client';

/**
 * Cache Management Utilities
 * Handles cache busting and cleanup for development
 */

export class CacheManager {
  private static readonly CACHE_VERSION = Date.now().toString();
  private static readonly DEV_CACHE_PREFIX = 'flora-pos-dev-';
  
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
      
      // Clear localStorage
      localStorage.clear();
      console.log('🧹 Cleared localStorage');
      
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
    if (process.env.NODE_ENV !== 'development' || typeof window === 'undefined') return;
    
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
    };
    
    console.log('🛠️ Development cache management enabled');
    console.log('   - Use Ctrl+Shift+R (Cmd+Shift+R) to force reload');
    console.log('   - Use __floraCacheManager.clearAll() in console');
  }
  
  /**
   * Check if we need to bust cache based on version
   */
  static shouldBustCache(): boolean {
    if (process.env.NODE_ENV !== 'development') return false;
    
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
