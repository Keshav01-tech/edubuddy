// EduBuddy service worker: makes the app installable and quick to open.
// - Pages: always fetched fresh from the network; a saved copy (or the offline page) is used only without internet.
// - Built files (/assets/…) never change once published, so they are served from the cache.
// - Data (/api/…) is never cached: students, fees and marks always come live from the server.
const VERSION = 'edubuddy-v1';
const PAGES = `${VERSION}-pages`;
const FILES = `${VERSION}-files`;
const OFFLINE = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(FILES)
      .then((cache) => cache.addAll([OFFLINE, '/icons/icon-192.png', '/icons/icon-512.png', '/favicon.svg']))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(PAGES).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => (await caches.match(request)) || (await caches.match('/index.html')) || caches.match(OFFLINE)),
    );
    return;
  }

  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(request).then((hit) => hit || fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(FILES).then((cache) => cache.put(request, copy));
        }
        return response;
      })),
    );
  }
});
