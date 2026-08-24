/* ============================================================
   ZENIT – Service Worker v18
   ============================================================ */
const CACHE_NAME = 'zenit-v18';
const CORE_ASSETS = [
  '/', '/index.html', '/app.js', '/manifest.json',
  '/logoblanco.png', '/logo peque.png',
  '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png',
  '/favicon-32.png', '/favicon-16.png'
];

// Install: pre-cache core assets one by one so a single missing/failed
// file never aborts the whole cache (addAll is all-or-nothing).
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.all(CORE_ASSETS.map(url =>
        cache.add(url).catch(err => console.warn('[SW] no se pudo cachear', url, err))
      ))
    )
  );
});

// Activate: drop old caches.
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Fetch: network-first for the app shell (HTML/JS) so updates land fast;
// cache-first for everything else (icons, fonts) for speed/offline.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isShell = req.mode === 'navigate' ||
                  url.pathname.endsWith('/index.html') ||
                  url.pathname.endsWith('/app.js');

  if (isShell) {
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then(r => r || caches.match('/index.html')))
    );
  } else {
    e.respondWith(
      caches.match(req).then(cached =>
        cached || fetch(req).then(res => {
          if (res.ok && url.origin === self.location.origin) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(req, copy));
          }
          return res;
        }).catch(() => cached)
      )
    );
  }
});

// Streak reminder: the page asks us to fire a local notification at a set time.
// Timers in a SW aren't guaranteed to survive termination, but this covers the
// common "app was opened today" session without breaking the promise silently.
let reminderTimeout = null;
self.addEventListener('message', e => {
  const data = e.data || {};
  if (data.type === 'SCHEDULE_NOTIFICATION') {
    if (reminderTimeout) clearTimeout(reminderTimeout);
    if (data.hasTrainedToday) return;

    const [h, m] = String(data.time || '20:00').split(':').map(Number);
    const now = new Date();
    const target = new Date();
    target.setHours(h || 20, m || 0, 0, 0);
    if (target <= now) return; // hora ya pasada hoy; se reprogramará mañana al abrir la app

    const delay = Math.min(target - now, 2147483647);
    reminderTimeout = setTimeout(() => {
      self.registration.showNotification('Zenit · ¡No pierdas tu racha!', {
        body: 'Aún no has registrado tu día. Un pequeño esfuerzo cuenta.',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'zenit-streak'
      });
    }, delay);
  }
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(list => {
      for (const c of list) { if ('focus' in c) return c.focus(); }
      if (self.clients.openWindow) return self.clients.openWindow('/');
    })
  );
});
