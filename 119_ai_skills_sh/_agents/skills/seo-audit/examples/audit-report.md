## SEO Audit Report — bad-page.html
Ngày kiểm tra: 2026-03-21

---

### ✅ Đã tốt
- Có thẻ `<title>` tồn tại

---

### ⚠️ Cần cải thiện
- **Title quá ngắn** (`"Trang web của tôi"` — chỉ 20 ký tự) → Nên 50–60 ký tự, ví dụ: `"Shop Sản Phẩm Chất Lượng — Giá Tốt Nhất Việt Nam"`
- **Thiếu `lang` attribute** trên `<html>` → Thêm `<html lang="vi">`

---

### ❌ Lỗi nghiêm trọng

| # | Vấn đề | Cách sửa |
|---|--------|----------|
| 1 | Thiếu `<meta name="description">` | Thêm vào `<head>`: `<meta name="description" content="Mô tả 150–160 ký tự...">` |
| 2 | Thiếu `<meta name="viewport">` | Trang không tương thích mobile → Thêm: `<meta name="viewport" content="width=device-width, initial-scale=1.0">` |
| 3 | Không có thẻ `<h1>` | Heading đầu tiên là `<h2>` → Đổi thành `<h1>` |
| 4 | Heading nhảy cấp h2 → h4 | Sửa thành h2 → h3 |
| 5 | 3 ảnh thiếu `alt` attribute | Thêm mô tả alt cho mỗi ảnh |
| 6 | Thiếu `<link rel="canonical">` | Thêm canonical URL vào `<head>` |
| 7 | Thiếu Open Graph tags | Thêm `og:title`, `og:description`, `og:image` |
| 8 | Thiếu Schema Markup | Thêm JSON-LD Schema vào `<head>` |
| 9 | Ảnh dùng `.png/.jpg` lớn, không lazy load | Chuyển sang `.webp` + thêm `loading="lazy"` |
| 10 | JS không có `defer` | Thêm `defer` vào `<script>` để không block render |

---

### 📊 Điểm SEO (ước tính): **28/100**

**Cần làm ngay:**
1. Thêm `<meta name="description">`
2. Thêm `<meta name="viewport">`
3. Đổi `<h2>` đầu tiên thành `<h1>`
4. Thêm `alt` cho tất cả ảnh

→ Xem [`good-page.html`](./good-page.html) để thấy phiên bản đã sửa hoàn chỉnh.
