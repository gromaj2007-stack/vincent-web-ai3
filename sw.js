// Vincent 2.0.4 - always request fresh HTML, JS and CSS.
const CACHE='vivi-v206-kawaii';
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys()){if(key.startsWith('vivi-'))await caches.delete(key)}await self.clients.claim()})()));
self.addEventListener('fetch',event=>{const request=event.request;if(request.method!=='GET')return;const url=new URL(request.url);if(url.origin!==self.location.origin)return;if(request.mode==='navigate'||/\.(?:js|css|html)$/.test(url.pathname)){event.respondWith(fetch(new Request(request,{cache:'no-store'})));return;}event.respondWith(fetch(request).catch(()=>caches.match(request)));});
