/* Spark Homes Repair Estimator — service worker.
   Cache-first, fully offline. All paths are RELATIVE so the app works from a
   GitHub Pages project subpath (scope is this file's directory). */

// Bump this string on every deploy to invalidate the old cache.
const CACHE = 'spark-estimator-v1';

// Precache the entire app shell + vendored libraries + icons.
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './vendor/exceljs.min.js',
  './vendor/jszip.min.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE)
      .then(function (cache) { return cache.addAll(PRECACHE); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (key) {
          if (key !== CACHE) return caches.delete(key); // drop stale versions
        }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  const req = event.request;
  if (req.method !== 'GET') return; // never intercept POST/etc.

  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (cached) {
      if (cached) return cached; // cache-first

      return fetch(req).then(function (resp) {
        // Runtime-cache successful same-origin GETs so the app stays whole offline.
        if (resp && resp.ok && new URL(req.url).origin === self.location.origin) {
          const copy = resp.clone();
          caches.open(CACHE).then(function (cache) { cache.put(req, copy); });
        }
        return resp;
      }).catch(function () {
        // Offline fallback: serve the app shell for navigations.
        if (req.mode === 'navigate') return caches.match('./index.html');
        return caches.match('./');
      });
    })
  );
});
