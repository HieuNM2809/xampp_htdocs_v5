const POSTS_URL = "https://jsonplaceholder.typicode.com/posts";

const statusEl = document.getElementById("status");
const hintEl = document.getElementById("hint");
const listEl = document.getElementById("list");

function setStatus(text, offline) {
  statusEl.textContent = text;
  statusEl.classList.toggle("offline", Boolean(offline));
}

function setHint(text) {
  hintEl.textContent = text || "";
}

function renderPosts(posts) {
  listEl.innerHTML = "";
  for (const p of posts) {
    const li = document.createElement("li");
    li.innerHTML = `<span class="id">#${p.id}</span>${escapeHtml(p.title)}`;
    listEl.appendChild(li);
  }
}

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

async function registerSw() {
  if (!("serviceWorker" in navigator)) {
    setStatus("Trình duyệt không hỗ trợ Service Worker.");
    return false;
  }
  try {
    await navigator.serviceWorker.register("./sw.js", { scope: "./" });
    await navigator.serviceWorker.ready;
    return true;
  } catch (e) {
    setStatus("Không đăng ký được SW: " + e.message);
    return false;
  }
}

async function loadPostsFromResponse(res, sourceLabel) {
  if (!res.ok) throw new Error(res.statusText);
  const posts = await res.json();
  renderPosts(posts);
  const online = navigator.onLine;
  setStatus(
    `${sourceLabel} · ${posts.length} bài · ${online ? "online" : "offline"}`,
    !online
  );
}

async function loadPosts() {
  const online = navigator.onLine;
  setHint("");
  setStatus(
    online ? "Đang tải… (SWR: có cache thì hiện ngay)" : "Offline — chờ cache…",
    !online
  );

  try {
    const res = await fetch(POSTS_URL, { cache: "no-store" });
    await loadPostsFromResponse(res, online ? "Từ mạng hoặc cache (qua SW)" : "Từ cache / fallback");
  } catch (e) {
    setStatus("Lỗi: " + e.message);
    listEl.innerHTML = "";
  }
}

/**
 * Sau khi SW cập nhật cache trong nền, đọc trực tiếp từ Cache Storage — không gọi fetch().
 * fetch() lại sw.js → fetch nền → POSTS_REFRESHED → vòng lặp vô hạn.
 */
navigator.serviceWorker.addEventListener("message", async (event) => {
  const d = event.data;
  if (!d || d.type !== "POSTS_REFRESHED") return;
  try {
    const res = await caches.match(POSTS_URL);
    if (!res) return;
    await loadPostsFromResponse(res, "Đã cập nhật nền");
    setHint(`Đã đồng bộ (${new Date(d.ts).toLocaleTimeString()})`);
    setTimeout(() => setHint(""), 2800);
  } catch (_) {}
});

window.addEventListener("online", () => loadPosts());
window.addEventListener("offline", () => loadPosts());

(async () => {
  const ok = await registerSw();
  if (!ok) return;
  await loadPosts();
})();
