const CACHE = "posts-v1";
const POSTS_URL = "https://jsonplaceholder.typicode.com/posts";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        fetch(POSTS_URL).then((res) => {
          if (res.ok) return cache.put(POSTS_URL, res.clone());
        })
      )
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

/**
 * Ưu tiên mạng: lấy mới nhất, lưu cache; hết mạng thì trả bản cache.
 */
self.addEventListener("fetch", (event) => {
  const url = event.request.url;
  if (url !== POSTS_URL || event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(POSTS_URL, copy));
        }
        return response;
      })
      .catch(() =>
        caches.match(POSTS_URL).then((cached) => {
          if (cached) {
            return cached;
          }
          return new Response(JSON.stringify([]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        })
      )
  );
});
