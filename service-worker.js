const SHELL_CACHE = 'muhada-shell-v2';
const API_CACHE = 'muhada-api-v2';

const SHELL_FILES = [
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== SHELL_CACHE && k !== API_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Endpoint data artikel (proxy Cloudflare Pages Function): network-first,
  // fall back to last cached response.
  if (url.pathname.startsWith('/api/articles')) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(API_CACHE).then((cache) => cache.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Proxy gambar: cache-first (gambar jarang berubah), supaya lebih cepat
  // dan tetap bisa tampil kalau koneksi sedang putus.
  if (url.pathname.startsWith('/api/image')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((res) => {
          const clone = res.clone();
          caches.open(API_CACHE).then((cache) => cache.put(event.request, clone));
          return res;
        });
      })
    );
    return;
  }

  // App shell: cache-first.
  if (SHELL_FILES.some((f) => event.request.url.endsWith(f.replace('./', '')))) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
  }
});
