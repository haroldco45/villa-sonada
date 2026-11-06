const CACHE = "villa-sonada-v5";
const CORE = ["./", "index.html", "manifest.json", "media/hero-poster.jpg", "media/icon-192.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

// Página: red primero (siempre lo último); fotos: caché primero. Videos van directo a la red.
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || req.url.endsWith(".mp4") || req.headers.get("range")) return;
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(r => { caches.open(CACHE).then(c => c.put(req, r.clone())); return r; })
      .catch(() => caches.match(req).then(r => r || caches.match("index.html"))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok && new URL(req.url).origin === location.origin) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
    return r;
  })));
});
