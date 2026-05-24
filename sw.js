/* ============================================================
   ZENIT – Service Worker v1.0
   ============================================================ */
const CACHE_NAME = 'zenit-v1';
const ASSETS = [ '/', '/index.html', '/app.js', '/manifest.json', '/logo.png' ];

self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.hostname.includes('firebase') || url.hostname.includes('google')) { e.respondWith(fetch(e.request).catch(() => caches.match(e.request))); return; }
  e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request).then(res => { if (res && res.status === 200 && res.type !== 'opaque') { const clone = res.clone(); caches.open(CACHE_NAME).then(c => c.put(e.request, clone)); } return res; })));
});
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : { title: 'Zenit', body: '¡No pierdas tu racha!' };
  e.waitUntil(self.registration.showNotification(data.title || 'Zenit', { body: data.body || '¡No pierdas tu racha!', icon: '/logo.png', badge: '/logo.png', vibrate: [200, 100, 200], tag: 'zenit-streak', renotify: true, data: { url: '/' } }));
});