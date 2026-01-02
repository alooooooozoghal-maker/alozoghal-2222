// Service Worker for Alo Zoghal PWA
const CACHE_NAME = 'alo-zoghal-v1.2';
const urlsToCache = [
  '/',
  '/index.html',
  '/admin-panel.html',
  '/admin.js',
  '/admin-style.css',
  '/ads-simple.js',
  '/install-manager.js',
  '/app.js',
  
  // Data files
  '/data/ticker.json',
  '/data/stories.json',
  '/data/vip-ads.json',
  '/data/settings.json',
  
  // External resources
  'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css',
  'https://raw.githubusercontent.com/aloozoghal-hash/alozoghal/main/8f6dcedf3dc3dbaa82c0df548bd962c9.jpg',
  
  // Icons
  '/pwa/icons/icon-72x72.png',
  '/pwa/icons/icon-96x96.png',
  '/pwa/icons/icon-128x128.png'
];

// Install event
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[Service Worker] Skip waiting on install');
        return self.skipWaiting();
      })
  );
});

// Activate event
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event with network-first strategy for data, cache-first for static
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // For data files, use network-first strategy
  if (url.pathname.includes('/data/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache the updated data
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(event.request);
        })
    );
  } 
  // For other files, use cache-first strategy
  else {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // Return cached response if found
          if (response) {
            return response;
          }
          
          // Otherwise fetch from network
          return fetch(event.request)
            .then(response => {
              // Don't cache if not a valid response
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              
              // Cache the new resource
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
              
              return response;
            });
        })
    );
  }
});

// Background sync for orders if browser supports it
self.addEventListener('sync', event => {
  if (event.tag === 'sync-orders') {
    console.log('[Service Worker] Background sync for orders');
    event.waitUntil(syncOrders());
  }
});

// Push notification handler
self.addEventListener('push', event => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'سفارش جدید از الو ذغال',
    icon: '/pwa/icons/icon-96x96.png',
    badge: '/pwa/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    },
    actions: [
      {
        action: 'view',
        title: 'مشاهده'
      },
      {
        action: 'close',
        title: 'بستن'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'الو ذغال', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        if (windowClients.length > 0) {
          const client = windowClients[0];
          if ('focus' in client) {
            return client.focus();
          }
        }
        return clients.openWindow(event.notification.data.url);
      })
  );
});

// Helper function for background sync
async function syncOrders() {
  try {
    const cache = await caches.open('orders-queue');
    const requests = await cache.keys();
    
    for (const request of requests) {
      const orderData = await cache.match(request);
      if (orderData) {
        // Try to send the order
        const response = await fetch('https://script.google.com/macros/s/AKfycbyLQjEqmjs5Re2m7nf3lGU_IZQU0ILuFgiJWxrEQ306AgUy1zW090quuwv1QLWVOQyV/exec', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: await orderData.text()
        });
        
        if (response.ok) {
          // Remove from cache if sent successfully
          await cache.delete(request);
        }
      }
    }
  } catch (error) {
    console.error('[Service Worker] Sync error:', error);
  }
}

// Periodic sync for data updates
if ('periodicSync' in self.registration) {
  try {
    self.registration.periodicSync.register('update-data', {
      minInterval: 24 * 60 * 60 * 1000 // Once per day
    });
  } catch (error) {
    console.log('[Service Worker] Periodic sync not supported:', error);
  }
                  }
