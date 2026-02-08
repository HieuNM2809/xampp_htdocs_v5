À 👍 câu này là **cốt lõi của Astro** luôn. Mình giải thích **cơ chế hoạt động của Astro** theo **từng bước từ lúc code → người dùng mở web**, dễ hiểu nhất nhé.

![Image](https://res.cloudinary.com/ddxwdqwkr/image/upload/f_auto/v1633284886/patterns.dev/theislandsarch--avuxy9rrkk8.png)

![Image](https://astro.build/_astro/server.D2Qe3bq5_Z1CCDsv.webp?dpl=696a6ba23d259c0008a486c6)

![Image](https://docs.astro.build/open-graph/en/reference/directives-reference.webp)

---

# 🧠 CƠ CHẾ HOẠT ĐỘNG CỦA ASTRO

## Tổng quan 1 câu

> **Astro render HTML trước, JavaScript chỉ được tải khi bạn yêu cầu**

---

## 1️⃣ Khi bạn viết code Astro

Ví dụ:

```astro
---
const posts = await getPosts();
---
<h1>Blog</h1>
<ul>
  {posts.map(p => <li>{p.title}</li>)}
</ul>
```

👉 Phần trong `---` là **JavaScript chạy ở server / build time**
👉 Nó **không tồn tại trong trình duyệt**

---

## 2️⃣ Quá trình BUILD (SSG)

Khi chạy:

```bash
npm run build
```

Astro sẽ:

1. Chạy toàn bộ JS trong `---`
2. Fetch data
3. Render component
4. Xuất ra **HTML hoàn chỉnh**

Kết quả:

```html
<h1>Blog</h1>
<ul>
  <li>Bài 1</li>
  <li>Bài 2</li>
</ul>
```

❌ Không có JS
✅ SEO cực tốt
✅ Load cực nhanh

---

## 3️⃣ Người dùng mở website

Trình duyệt nhận:

* HTML
* CSS

👉 Trang **hiện ngay lập tức**
👉 Không chờ JS

---

## 4️⃣ JavaScript chỉ xuất hiện khi có “Island”

Ví dụ:

```astro
<Counter client:load />
```

Cơ chế:

1. Astro **tách Counter thành 1 island**
2. Chỉ bundle JS cho island đó
3. Load JS theo directive:

   * `client:load`
   * `client:idle`
   * `client:visible`

👉 Phần còn lại **không có JS**

---

## 5️⃣ Islands Architecture (trái tim của Astro ❤️)

Astro dùng kiến trúc gọi là **Islands Architecture**:

* Trang web = HTML tĩnh
* Component tương tác = island
* Mỗi island **độc lập JS**

👉 Không có “JS toàn trang” như SPA

---

## 6️⃣ So với React (SPA)

| React              | Astro            |
| ------------------ | ---------------- |
| Gửi JS toàn bộ app | Gửi HTML         |
| JS render UI       | HTML render UI   |
| SEO khó            | SEO mặc định tốt |
| Nặng               | Rất nhẹ          |

👉 Astro **không phải SPA**

---

## 7️⃣ Astro chạy ở đâu?

Astro hỗ trợ:

* **SSG** (static site)
* **SSR** (server rendering)
* **Hybrid** (page tĩnh + page động)

Tất cả đều dựa trên nguyên tắc:

> **HTML trước – JS sau**

---

## 8️⃣ Sơ đồ tư duy cho dễ nhớ

```
Bạn viết Astro
      ↓
JS chạy ở build/server
      ↓
HTML được tạo ra
      ↓
Browser nhận HTML
      ↓
(Chỉ nếu có client:* thì JS mới load)
```

---

## 9️⃣ Chốt 1 câu cho nhớ lâu 🧠

> **Astro không “render ở client”, Astro “ship HTML”**

---

Nếu bạn muốn, mình có thể:

* Vẽ **flow so sánh Astro vs React vs Next**
* Giải thích Astro theo **tư duy backend / frontend**
* Làm demo **0 JS → thêm island từng bước**

👉 Bạn đang học Astro để **hiểu kiến trúc** hay để **đi phỏng vấn / đi làm**?
