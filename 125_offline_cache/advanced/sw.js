const CACHE = "125-offline-advanced-v2";
const PREFIX = "125-offline-advanced-";
const POSTS_URL = "https://jsonplaceholder.typicode.com/posts";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (key.startsWith(PREFIX) && key !== CACHE) {
            return caches.delete(key);
          }
        })
      );
      await self.clients.claim();
    })()
  );
});

function notifyClients(payload) {
  return self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
    clients.forEach((client) => client.postMessage(payload));
  });
}

/**
 * Stale-while-revalidate:
 * - Có cache → trả cache ngay (nhanh), đồng thời fetch nền và cập nhật cache + báo trang khi xong.
 * - Không cache → chờ mạng; offline → cache hoặc [].
 */
self.addEventListener("fetch", (event) => {
  const url = event.request.url;
  if (url !== POSTS_URL || event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    (async () => {
      const cached = await caches.match(POSTS_URL);

      const networkPromise = fetch(event.request).then(async (response) => {
        if (response.ok) {
          const cache = await caches.open(CACHE);
          await cache.put(POSTS_URL, response.clone());
          await notifyClients({
            type: "POSTS_REFRESHED",
            url: POSTS_URL,
            ts: Date.now(),
          });
        }
        return response;
      });

      if (cached) {
        event.waitUntil(networkPromise.catch(() => {}));
        return cached;
      }

      try {
        return await networkPromise;
      } catch {
        const fallback = await caches.match(POSTS_URL);
        if (fallback) return fallback;
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    })()
  );
});
