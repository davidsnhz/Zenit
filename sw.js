/* ═══════════════════════════════════════════════════════
   ZENIT — Service Worker
═══════════════════════════════════════════════════════ */
const APP_VERSION = '8.0.0';
const CACHE = `zenit-v${APP_VERSION}`;

const PRECACHE = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => Promise.allSettled(
        PRECACHE.map(url => cache.add(url).catch(err => console.warn('[SW] skip:', url)))
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).catch(() => new Response('Offline', { status: 503 }));
    })
  );
});

self.addEventListener('sync', event => {
  if (event.tag === 'sync-routine') {
    event.waitUntil(
      Promise.resolve().then(() => console.log('[SW] Sincronización en segundo plano completada.'))
    );
  }
});