// Flora POS Service Worker - Optimized for iPad Pro
const CACHE_VERSION = 'flora-pos-v2'
const RUNTIME_CACHE = 'flora-runtime-v2'

// Core assets to cache immediately
const CORE_ASSETS = [
  '/',
  '/manifest.json',
  '/logo.png'
]

// Skip caching for these patterns
const SKIP_CACHE = [
  '/api/',
  '/_next/webpack-hmr',
  '/__nextjs',
  '/sw.js'
]

// Install event - cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  )
})

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_VERSION && name !== RUNTIME_CACHE)
            .map(name => caches.delete(name))
        )
      })
      .then(() => self.clients.claim())
  )
})

// Fetch event - network first strategy with cache fallback
self.addEventListener('fetch', (event) => {
  // Skip caching for certain URLs
  if (SKIP_CACHE.some(pattern => event.request.url.includes(pattern))) {
    return
  }

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Don't cache failed responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }

        // Clone the response
        const responseToCache = response.clone()

        // Cache the response
        caches.open(RUNTIME_CACHE)
          .then(cache => {
            cache.put(event.request, responseToCache)
          })

        return response
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request)
          .then(response => {
            if (response) {
              return response
            }

            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/')
            }

            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable'
            })
          })
      })
  )
})

// Handle messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys()
        .then(names => Promise.all(names.map(name => caches.delete(name))))
        .then(() => {
          event.ports[0].postMessage({ success: true })
        })
        .catch(error => {
          event.ports[0].postMessage({ success: false, error: error.message })
        })
    )
  }
})

// Background sync for offline capabilities
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData())
  }
})

async function syncData() {
  // Implement data sync logic here
  console.log('Background sync triggered')
} 