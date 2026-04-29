const POSTS_URL = "https://jsonplaceholder.typicode.com/posts";

const statusEl = document.getElementById("status");
const listEl = document.getElementById("list");

function setStatus(text, offline) {
  statusEl.textContent = text;
  statusEl.classList.toggle("offline", Boolean(offline));
}

async function registerSw() {
  if (!("serviceWorker" in navigator)) {
    setStatus("Trình duyệt không hỗ trợ Service Worker.");
    return false;
  }
  try {
    const reg = await navigator.serviceWorker.register("./sw.js", {
      scope: "./",
    });
    await navigator.serviceWorker.ready;
    return true;
  } catch (e) {
    setStatus("Không đăng ký được SW (cần HTTPS hoặc localhost): " + e.message);
    return false;
  }
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

async function loadPosts() {
  const online = navigator.onLine;
  setStatus(online ? "Đang tải từ mạng…" : "Không có mạng — dùng bản đã cache (nếu có)…", !online);

  try {
    const res = await fetch(POSTS_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(res.statusText);
    const posts = await res.json();
    renderPosts(posts);
    setStatus(
      online ? `Đã tải ${posts.length} bài (đã lưu qua Service Worker).` : `Offline — hiển thị ${posts.length} bài từ cache.`,
      !online
    );
  } catch (e) {
    setStatus("Lỗi: " + e.message + (online ? "" : " (thử mở trang khi có mạng một lần để cache)."));
    listEl.innerHTML = "";
  }
}

window.addEventListener("online", () => loadPosts());
window.addEventListener("offline", () => loadPosts());

(async () => {
  const ok = await registerSw();
  if (!ok) return;
  // Lần đầu có thể chưa có controller; fetch vẫn chạy, SW (sau activate) sẽ cache qua install + fetch handler
  await loadPosts();
})();
