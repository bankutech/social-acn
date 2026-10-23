const CACHE_NAME = 'acn-plus-v2';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Always fetch fresh network content; fallback to cache only when completely offline
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
