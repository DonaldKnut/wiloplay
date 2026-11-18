const CACHE_NAME = "wiloplay-shell-v3";
const isLocalDevelopment =
  self.location.hostname === "localhost" ||
  self.location.hostname === "127.0.0.1" ||
  self.location.hostname === "::1" ||
  self.location.hostname.endsWith(".localhost");
const OFFLINE_URL = "/offline.html";
const PRECACHE_URLS = [
  "/app",
  OFFLINE_URL,
  "/icon.svg",
  "/pwa-192.png",
  "/pwa-512.png",
  "/pwa-maskable-512.png",
];

async function cacheResponse(request, response) {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  } catch (error) {
    console.warn("Wiloplay could not cache a response.", error);
  }
}

self.addEventListener("install", (event) => {
  if (isLocalDevelopment) {
    event.waitUntil(self.skipWaiting());
    return;
  }

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter(
              (cacheName) =>
                cacheName.startsWith("wiloplay-shell-") &&
                (isLocalDevelopment || cacheName !== CACHE_NAME),
            )
            .map((cacheName) => caches.delete(cacheName)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (isLocalDevelopment) return;

  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          if (response.ok) await cacheResponse(request, response);
          return response;
        } catch {
          return (
            (await caches.match(request)) ||
            (url.pathname === "/app"
              ? await caches.match("/app", { ignoreSearch: true })
              : url.pathname === "/"
                ? await caches.match("/", { ignoreSearch: true })
                : null) ||
            (await caches.match(OFFLINE_URL)) ||
            Response.error()
          );
        }
      })(),
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;

        const response = await fetch(request);
        if (response.ok) await cacheResponse(request, response);
        return response;
      })(),
    );
  }
});
