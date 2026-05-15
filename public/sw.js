const CACHE_NAME = "ziying-shell-v3";
const BASE_PATH = new URL(self.registration.scope).pathname;
const withBase = (path) => `${BASE_PATH}${path}`.replace(/\/{2,}/g, "/");
const SHELL_URLS = [withBase(""), withBase("index.html"), withBase("icons/icon.svg")];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin || request.method !== "GET") {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(withBase("index.html"))));
    return;
  }

  if (url.pathname.startsWith(withBase("samples/"))) {
    event.respondWith(fetch(request));
    return;
  }

  if (url.pathname === withBase("manifest.webmanifest")) {
    event.respondWith(fetch(request));
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      });
    }),
  );
});
