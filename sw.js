/* ============================================================
   ZENIT – Service Worker v7.0 (Actualización UI)
   ============================================================ */
const CACHE_NAME = 'zenit-v7'; 
const ASSETS = [ '/', '/index.html', '/app.js', '/manifest.json', '/logo.png', '/logoblanco.png', '/logo peque.png' ];

self.addEventListener('install', e => {
  self.skipWaiting(); 
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key))))
    .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.url.includes('index.html') || e.request.url.includes('app.js')) {
    e.respondWith(
      fetch(e.request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, copy));
        return response;
      }).catch(() => caches.match(e.request))
    );
  } else {
    e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
  }
});