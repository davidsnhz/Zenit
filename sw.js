/* ============================================================
   ZENIT – Service Worker v3.0 (Versión de fuerza bruta)
   ============================================================ */
const CACHE_NAME = 'zenit-v3'; // Cambiado a v3 para forzar renovación
const ASSETS = [ '/', '/index.html', '/app.js', '/manifest.json', '/logo.png', '/logoblanco.png', '/logo peque.png' ];

self.addEventListener('install', e => {
  self.skipWaiting(); // Obliga a reemplazar al anterior
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('activate', e => {
  // BORRADO TOTAL Y AGRESIVO DE CUALQUIER CACHÉ ANTERIOR
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key))))
    .then(() => self.clients.claim()) // Toma control de todas las pestañas
  );
});

self.addEventListener('fetch', e => {
  // Estrategia: Network First para index.html y app.js para evitar este problema
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