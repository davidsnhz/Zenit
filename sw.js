/* ============================================================
   ZENIT – Service Worker v2.0
   ============================================================ */
// CAMBIA ESTO CADA VEZ QUE ACTUALICES TU APP (ej. zenit-v3, zenit-v4...)
// Sube la versión a v3 (o el número que te toque) para forzar la actualización en todos los móviles
const CACHE_NAME = 'zenit-v3'; 

const ASSETS = [ 
  '/', 
  '/index.html', 
  '/app.js', 
  '/manifest.json', 
  '/logo.png', 
  '/logoblanco.png',
  '/logo peque.png' /* <-- AÑADIMOS EL NUEVO ICONO AQUÍ */
];

/* ── Install: Guarda los archivos nuevos en caché ── */
self.addEventListener('install', e => {
  // skipWaiting fuerza a este nuevo SW a instalarse inmediatamente, saltándose la fase de "espera"
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[Service Worker] Guardando archivos en caché v2');
      return cache.addAll(ASSETS);
    })
  );
});

/* ── Activate: Elimina la caché vieja ── */
self.addEventListener('activate', e => {
  console.log('[Service Worker] Activado');
  e.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          // Si la caché existente NO es la actual (zenit-v2), se borra.
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Borrando caché antigua:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      // Toma el control de todos los clientes (pestañas) inmediatamente
      return self.clients.claim();
    })
  );
});

/* ── Fetch: Cache-First para archivos locales, Network-First para APIs ── */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  
  // Excepciones: Firebase o Google siempre buscan en la red primero
  if (url.hostname.includes('firebase') || url.hostname.includes('google')) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }
  
  // Archivos de la app (HTML, JS, CSS, PNG): Buscar en caché, si no está, ir a la red
  e.respondWith(
    caches.match(e.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request).then(networkResponse => {
        // Guarda en caché cualquier archivo nuevo que no estuviera pre-cacheado
        if (networkResponse && networkResponse.status === 200 && networkResponse.type !== 'opaque') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, responseClone));
        }
        return networkResponse;
      }).catch(() => {
        // Opcional: Fallback si no hay red ni caché
        console.log('[Service Worker] Fallo en la red y no hay caché para:', e.request.url);
      });
    })
  );
});

/* ── Push Notifications ── */
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : { title: 'Zenit', body: '¡No pierdas tu racha!' };
  e.waitUntil(
    self.registration.showNotification(data.title || 'Zenit', {
      body: data.body || '¡No pierdas tu racha!',
      icon: '/logo.png',
      badge: '/logo.png',
      vibrate: [200, 100, 200],
      tag: 'zenit-streak',
      renotify: true,
      data: { url: '/' }
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});

/* ── Background Sync: Recordatorio de racha ── */
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SCHEDULE_NOTIFICATION') {
    const { time, hasTrainedToday } = e.data;
    if (hasTrainedToday) return;
    const [h, m] = time.split(':').map(Number);
    const now = new Date();
    let target = new Date();
    target.setHours(h, m, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    const delay = target - now;
    setTimeout(() => {
      self.registration.showNotification('Zenit – ¡Racha en peligro!', {
        body: '¡No pierdas tu racha! Registra tu entrenamiento o descanso de hoy.',
        icon: '/logo.png',
        badge: '/logo.png',
        vibrate: [300, 100, 300],
        tag: 'zenit-streak'
      });
    }, delay);
  }
});