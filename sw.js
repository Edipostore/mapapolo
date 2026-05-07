const CACHE_NAME = "rastreamento-v2";
const ASSETS = [
  "/",
  "/index.html",
  "/assets/css/styles.css",
  "/assets/js/script.js",
  "/assets/img/shop (1).png",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log("Cache aberto");
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request)
      .then(cached => {
        // Retorna do cache ou faz fetch
        return cached || fetch(e.request).then(response => {
          // Cacheia novas requisições
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(e.request, responseClone);
            });
          }
          return response;
        });
      })
      .catch(() => {
        // Fallback offline
        if (e.request.mode === "navigate") {
          return caches.match("/index.html");
        }
      })
  );
});