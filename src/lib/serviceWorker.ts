/**
 * Service Worker Registration and PWA Features
 */

// Check if service workers are supported
export const isServiceWorkerSupported = (): boolean => {
  return 'serviceWorker' in navigator;
};

// Register the service worker
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!isServiceWorkerSupported()) {
    console.log('Service workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker is available
            console.log('New service worker available');
            // Notify user about update
            notifyUserAboutUpdate(registration);
          }
        });
      }
    });

    console.log('Service worker registered successfully');
    return registration;
  } catch (error) {
    console.error('Service worker registration failed:', error);
    return null;
  }
};

// Service worker update notification disabled
const notifyUserAboutUpdate = (registration: ServiceWorkerRegistration) => {
  // Browser messages disabled - no notification shown
  console.log('Service worker update available but notification disabled');
};

// Unregister service worker (for development)
export const unregisterServiceWorker = async (): Promise<boolean> => {
  if (!isServiceWorkerSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      return await registration.unregister();
    }
    return false;
  } catch (error) {
    console.error('Service worker unregistration failed:', error);
    return false;
  }
};

// Cache invalidation helper
export const invalidateCache = (pattern: string): void => {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'CACHE_INVALIDATE',
      pattern,
    });
  }
};

// PWA installation
export const isPWAInstallable = (): boolean => {
  return 'beforeinstallprompt' in window;
};

// PWA install prompt
let deferredPrompt: any = null;

export const setupPWAInstall = (): void => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });
};

export const showPWAInstallPrompt = async (): Promise<boolean> => {
  if (!deferredPrompt) {
    return false;
  }

  try {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    return outcome === 'accepted';
  } catch (error) {
    console.error('PWA install prompt failed:', error);
    return false;
  }
};

// Check if running as PWA
export const isPWAMode = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
};

// Network status monitoring
export const setupNetworkMonitoring = (): void => {
  window.addEventListener('online', () => {
    console.log('Network restored');
    // Background sync not implemented in this version
    console.log('Network restored - service worker ready');
  });

  window.addEventListener('offline', () => {
    console.log('Network lost');
    // Could show offline notification to user
  });
};

// Get network status
export const isOnline = (): boolean => {
  return navigator.onLine;
};

// Initialize PWA features - DEVELOPMENT MODE (DISABLED)
export const initializePWA = (): void => {
  if (typeof window === 'undefined') return;

  // DEVELOPMENT MODE - DISABLE SERVICE WORKER REGISTRATION
  console.log('🚫 Service Worker DISABLED for development');
  unregisterServiceWorker(); // Remove any existing service worker
  
  // Setup PWA install prompt (keep for future)
  setupPWAInstall();
  
  // Setup network monitoring (keep for debugging)
  setupNetworkMonitoring();
};
