const CACHE_NAME = "budget-planner-shell-v1";
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/app-icon.svg",
  "/favicon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(APP_SHELL);
      const indexPage = await cache.match("/index.html");

      if (!indexPage) {
        throw new Error("Could not cache the app's start page.");
      }

      const html = await indexPage.text();
      const assets = Array.from(
        html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g),
        (match) => match[1]
      );

      await cache.addAll(assets);
      await self.skipWaiting();
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName.startsWith("budget-planner-shell-") && cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(request.url);

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseCopy = response.clone();
            void caches
              .open(CACHE_NAME)
              .then((cache) => cache.put("/index.html", responseCopy));
          }
          return response;
        })
        .catch(async () => {
          const cachedPage =
            (await caches.match(request)) ?? (await caches.match("/index.html"));

          if (cachedPage) {
            return cachedPage;
          }

          return Response.error();
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        if (response.ok) {
          const responseCopy = response.clone();
          void caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(request, responseCopy));
        }

        return response;
      });
    })
  );
});
