'use client';

/**
 * Cache Management Utilities
 * OPTIMIZED - No aggressive clearing, respects React Query cache
 */

export class CacheManager {
  private static readonly CACHE_VERSION = '1.0.0'; // Static version
  private static readonly DEV_CACHE_PREFIX = 'flora-pos-dev-';
  private static clearingInterval: ReturnType<typeof setInterval> | null = null;
  
  /**
   * Clear all application caches (manual only)
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
      
      // Save important data - pattern-based
      const preservePatterns = ['flora-store-config-', 'flora-menu-config-', 'tv-id-', 'magic-bg-'];
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
      
    } catch (error) {
      console.error('❌ Error clearing caches:', error);
    }
  }
  
  /**
   * Add cache busting to URLs (disabled for better performance)
   */
  static addCacheBuster(url: string): string {
    // DISABLED: Let React Query and HTTP caching handle this
    return url;
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
   * Setup development cache management - DISABLED FOR PERFORMANCE
   */
  static setupDevCacheManagement(): void {
    if (typeof window === 'undefined') return;
    
    // DISABLED: No auto-clearing, respect React Query cache
    console.log('✅ Cache management: Manual mode only');
    console.log('   - React Query caching enabled');
    console.log('   - HTTP caching enabled');
    console.log('   - Use Ctrl+Shift+R to force reload if needed');
    console.log('   - Use __floraCacheManager.clearAll() to manually clear');
    
    // Add keyboard shortcut for cache clearing
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
        console.log('✅ Auto-clear already disabled');
      }
    };
  }
  
  /**
   * Check if we need to bust cache
   */
  static shouldBustCache(): boolean {
    // DISABLED: Let caching work properly
    return false;
  }
  
  /**
   * Update cache version
   */
  static updateCacheVersion(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('flora-cache-version', this.CACHE_VERSION);
  }
}
