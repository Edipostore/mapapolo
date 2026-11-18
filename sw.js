const CACHE_NAME = "rastreamento-v5";
const BASE_URL = new URL("./", self.registration.scope);
const APP_ASSETS = [
  "./",
  "index.html",
  "manifest.json",
  "assets/css/styles.css",
  "assets/js/script.js",
  "assets/img/shop (1).png",
  "assets/img/app-icon.svg"
].map(path => new URL(path, BASE_URL));

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const requestUrl = new URL(request.url);
  if (request.method !== "GET" || requestUrl.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        return await fetch(request);
      } catch {
        const cachedPage = await caches.match(request) || await caches.match(new URL("index.html", BASE_URL));
        return cachedPage || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;

    const response = await fetch(request);
    if (response.ok && response.type === "basic") {
      event.waitUntil(
        caches.open(CACHE_NAME)
          .then(cache => cache.put(request, response.clone()))
          .catch(error => console.error("Erro ao atualizar o cache:", error))
      );
    }
    return response;
  })());
});