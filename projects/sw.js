const CACHE_NAME = "aetherweather-cache-v1";
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

self.addEventListener("install", (_event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (url.hostname.includes("open-meteo.com")) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            if (networkResponse.ok) {
              const responseClone = networkResponse.clone();
              const headers = new Headers(responseClone.headers);
              headers.append("sw-cache-time", Date.now().toString());

              responseClone.blob().then((blob) => {
                const clonedWithTime = new Response(blob, {
                  status: responseClone.status,
                  statusText: responseClone.statusText,
                  headers: headers,
                });
                cache.put(event.request, clonedWithTime);
              });
            }
            return networkResponse;
          });

          if (cachedResponse) {
            const cacheTime = cachedResponse.headers.get("sw-cache-time");
            if (
              cacheTime &&
              Date.now() - parseInt(cacheTime) < CACHE_DURATION
            ) {
              return cachedResponse;
            }
          }
          return fetchPromise;
        });
      }),
    );
  }
});
