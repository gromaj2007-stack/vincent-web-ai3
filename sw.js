// Vivi 2.7.0: network-first for all local assets, no persistent app cache.
const CACHE = 'vivi-270-network-only';
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil((async () => {
  for (const name of await caches.keys()) await caches.delete(name);
  await self.clients.claim();
})()));
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(fetch(new Request(req, {cache:'no-store'})));
});
