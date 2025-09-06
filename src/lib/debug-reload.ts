/**
 * Debug tool to track page reloads during checkout
 * This will help identify what's causing the app to reload during sales
 */

export class ReloadDebugger {
  private static isDebugging = false;
  private static checkoutStartTime: number | null = null;

  static startCheckoutDebug() {
    this.isDebugging = true;
    this.checkoutStartTime = Date.now();
    
    console.log('🐛 [RELOAD DEBUG] Checkout process started - monitoring for reloads');
    
    // Listen for beforeunload to catch if page is reloading
    const beforeUnloadHandler = (event: BeforeUnloadEvent) => {
      if (this.isDebugging) {
        console.error('🚨 [RELOAD DEBUG] Page is reloading during checkout!');
        console.error('🚨 [RELOAD DEBUG] Stack trace:', new Error().stack);
        
        // In development, try to prevent the reload to debug
        if (process.env.NODE_ENV === 'development') {
          event.preventDefault();
          event.returnValue = 'DEBUG: Page reload detected during checkout!';
          return 'DEBUG: Page reload detected during checkout!';
        }
      }
    };
    
    window.addEventListener('beforeunload', beforeUnloadHandler);
    
    // Automatically clean up after 30 seconds
    setTimeout(() => {
      this.stopCheckoutDebug();
      window.removeEventListener('beforeunload', beforeUnloadHandler);
    }, 30000);
  }

  static stopCheckoutDebug() {
    if (this.isDebugging && this.checkoutStartTime) {
      const duration = Date.now() - this.checkoutStartTime;
      console.log(`✅ [RELOAD DEBUG] Checkout completed successfully in ${duration}ms - no reload detected`);
    }
    
    this.isDebugging = false;
    this.checkoutStartTime = null;
  }

  static logCheckoutStep(step: string) {
    if (this.isDebugging) {
      console.log(`🔍 [RELOAD DEBUG] Checkout step: ${step}`);
    }
  }

  static logApiCall(url: string, method: string) {
    if (this.isDebugging) {
      console.log(`🌐 [RELOAD DEBUG] API call: ${method} ${url}`);
    }
  }

  static logError(step: string, error: any) {
    if (this.isDebugging) {
      console.error(`❌ [RELOAD DEBUG] Error in ${step}:`, error);
    }
  }

  // Check if we're in a reload situation by looking at performance navigation API
  static detectIfPageReloaded() {
    if (typeof window !== 'undefined' && window.performance && window.performance.navigation) {
      const navType = window.performance.navigation.type;
      if (navType === 1) { // TYPE_RELOAD
        console.warn('🔄 [RELOAD DEBUG] Page was reloaded (performance.navigation.type = 1)');
        return true;
      }
    }
    
    // Alternative check using Performance Navigation Timing API (modern browsers)
    if (typeof window !== 'undefined' && window.performance && window.performance.getEntriesByType) {
      const navEntries = window.performance.getEntriesByType('navigation');
      if (navEntries.length > 0) {
        const navEntry = navEntries[0] as any;
        if (navEntry.type === 'reload') {
          console.warn('🔄 [RELOAD DEBUG] Page was reloaded (NavigationTiming.type = reload)');
          return true;
        }
      }
    }
    
    return false;
  }

  // Monitor for any window.location changes
  static monitorLocationChanges() {
    // Disabled - window.location properties are read-only in modern browsers
    // This was causing: "Cannot assign to read only property 'assign' of object '[object Location]'"
    // If needed, use a MutationObserver or listen to popstate/hashchange events instead
  }
}

// Auto-detect if page was reloaded on import
if (typeof window !== 'undefined') {
  ReloadDebugger.detectIfPageReloaded();
  
  // Only monitor in development
  if (process.env.NODE_ENV === 'development') {
    ReloadDebugger.monitorLocationChanges();
  }
}
