// POSV1 Service Worker - DEVELOPMENT MODE - MINIMAL CACHING
// DISABLED AGGRESSIVE CACHING FOR DEVELOPMENT

const isDevelopment = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
const CACHE_VERSION = isDevelopment ? Date.now().toString() : 'v1';
const CACHE_NAME = `posv1-cache-${CACHE_VERSION}`;
const API_CACHE_NAME = `posv1-api-cache-${CACHE_VERSION}`;
const STATIC_CACHE_NAME = `posv1-static-cache-${CACHE_VERSION}`;

// Resources to cache immediately
const STATIC_RESOURCES = [
  '/',
  '/login',
  '/logo123.png',
  // CSS files are cached dynamically as they have hashed names in production
];

// API endpoints to cache with different strategies
const API_CACHE_STRATEGIES = {
  // Long-lived data - cache for hours
  longCache: [
    '/api/categories',
    '/api/proxy/flora-im/locations',
  ],
  
  // Medium-lived data - cache for minutes
  mediumCache: [
    '/api/users-matrix/customers',
    '/api/pricing/rules',
  ],
  
  // Short-lived data - cache briefly for performance
  shortCache: [
    '/api/proxy/flora-im/products',
    '/api/proxy/flora-im/inventory',
  ],
};

// Cache durations in milliseconds - DEVELOPMENT MODE (MINIMAL CACHING)
const CACHE_DURATIONS = isDevelopment ? {
  longCache: 0,                     // No caching in development
  mediumCache: 0,                   // No caching in development
  shortCache: 0,                    // No caching in development
  static: 0,                        // No caching in development
} : {
  longCache: 2 * 60 * 60 * 1000,    // 2 hours in production
  mediumCache: 30 * 60 * 1000,      // 30 minutes in production
  shortCache: 5 * 60 * 1000,        // 5 minutes in production
  static: 24 * 60 * 60 * 1000,      // 24 hours in production
};

// Install event - cache static resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      // Cache static resources with validation and error handling
      caches.open(STATIC_CACHE_NAME).then(async (cache) => {
        const validatedResources = [];
        
        // Validate each resource before caching
        for (const resource of STATIC_RESOURCES) {
          try {
            const response = await fetch(resource, { method: 'HEAD' });
            if (response.ok) {
              validatedResources.push(resource);
            } else {
              console.warn(`Resource not found, skipping cache: ${resource} (${response.status})`);
            }
          } catch (err) {
            console.warn(`Failed to validate resource, skipping cache: ${resource}`, err);
          }
        }
        
        // Cache only validated resources
        if (validatedResources.length > 0) {
          try {
            return await cache.addAll(validatedResources);
          } catch (error) {
            console.warn('Failed to cache some validated resources:', error);
            // Try to cache resources individually as fallback
            return Promise.all(
              validatedResources.map(resource => 
                cache.add(resource).catch(err => 
                  console.warn(`Failed to cache ${resource}:`, err)
                )
              )
            );
          }
        }
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== API_CACHE_NAME && 
                cacheName !== STATIC_CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - intelligent caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static resources
  if (isStaticResource(url.pathname)) {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // Handle page requests
  event.respondWith(handlePageRequest(request));
});

// Handle API requests with intelligent caching
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Determine cache strategy
  let cacheStrategy = 'shortCache';
  let cacheDuration = CACHE_DURATIONS.shortCache;
  
  for (const [strategy, patterns] of Object.entries(API_CACHE_STRATEGIES)) {
    if (patterns.some(pattern => pathname.includes(pattern))) {
      cacheStrategy = strategy;
      cacheDuration = CACHE_DURATIONS[strategy];
      break;
    }
  }

  const cache = await caches.open(API_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  // Check if cached response is still valid
  if (cachedResponse) {
    const cachedTime = cachedResponse.headers.get('sw-cached-time');
    if (cachedTime) {
      const age = Date.now() - parseInt(cachedTime);
      if (age < cacheDuration) {
        // Return cached response if still fresh
        return cachedResponse;
      }
    }
  }

  try {
    // Fetch fresh data
    const response = await fetch(request);
    
    if (response.ok) {
      // Clone response for caching
      const responseClone = response.clone();
      
      // Add cache timestamp
      const modifiedResponse = new Response(responseClone.body, {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers: {
          ...Object.fromEntries(responseClone.headers.entries()),
          'sw-cached-time': Date.now().toString()
        }
      });
      
      // Cache the response
      cache.put(request, modifiedResponse);
    }
    
    return response;
  } catch (error) {
    // Network failed, return cached response if available
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for critical endpoints
    if (pathname.includes('/api/proxy/flora-im/products')) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Offline - cached data not available',
          data: []
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    throw error;
  }
}

// Handle static resource requests
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    // Check if we should revalidate in background
    const cachedTime = cachedResponse.headers.get('sw-cached-time');
    if (cachedTime) {
      const age = Date.now() - parseInt(cachedTime);
      if (age > CACHE_DURATIONS.static) {
        // Revalidate in background
        fetch(request).then(response => {
          if (response.ok) {
            cache.put(request, response.clone());
          }
        }).catch(() => {
          // Ignore background revalidation errors
        });
      }
    }
    
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const responseClone = response.clone();
      cache.put(request, responseClone);
    }
    
    return response;
  } catch (error) {
    // Return offline fallback for pages
    return new Response(
      '<html><body><h1>Offline</h1><p>Please check your connection</p></body></html>',
      {
        status: 503,
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
}

// Handle page requests
async function handlePageRequest(request) {
  try {
    return await fetch(request);
  } catch (error) {
    // Return cached page or offline fallback
    const cache = await caches.open(STATIC_CACHE_NAME);
    const cachedResponse = await cache.match('/');
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response(
      '<html><body><h1>Offline</h1><p>Flora POS is offline</p></body></html>',
      {
        status: 503,
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
}

// Helper function to check if resource is static
function isStaticResource(pathname) {
  return pathname.startsWith('/_next/') || 
         pathname.startsWith('/static/') ||
         pathname.includes('.') && // has file extension
         !pathname.includes('/api/');
}

// Background sync for orders (when network is restored)
// Background sync events are handled by the main application
// Keep this event listener for future implementation if needed
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-orders') {
    console.log('Background sync requested but not implemented');
  }
});



// Message handling for cache management
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_INVALIDATE') {
    const { pattern } = event.data;
    invalidateCache(pattern);
  }
});

// Invalidate cache entries matching a pattern
async function invalidateCache(pattern) {
  const cache = await caches.open(API_CACHE_NAME);
  const requests = await cache.keys();
  
  const toDelete = requests.filter(request => 
    request.url.includes(pattern)
  );
  
  await Promise.all(toDelete.map(request => cache.delete(request)));
}
