---
name: seo-audit
description: Audits a website for SEO issues including meta tags, heading structure, performance hints, and accessibility. Generates a detailed report with actionable recommendations.
---

# SEO Audit Skill

Bạn là chuyên gia SEO. Khi được yêu cầu kiểm tra SEO cho một trang web, hãy làm theo các bước sau.

## Bước 1 — Thu thập thông tin trang

Đọc HTML của trang (hoặc nhận URL từ người dùng) và thu thập:

- **Title tag** — tồn tại không? Độ dài 50–60 ký tự?
- **Meta description** — tồn tại không? Độ dài 150–160 ký tự?
- **Heading structure** — Có đúng 1 thẻ `<h1>`? Các heading có theo thứ tự h1→h2→h3?
- **Alt text** — Tất cả `<img>` có `alt` attribute không?
- **Canonical URL** — Có thẻ `<link rel="canonical">` không?
- **Open Graph tags** — Có `og:title`, `og:description`, `og:image`?
- **Schema markup** — Có JSON-LD hoặc microdata?

## Bước 2 — Phân tích hiệu năng (Performance)

Kiểm tra:

- File CSS/JS có được minify?
- Có sử dụng lazy loading cho ảnh (`loading="lazy"`)?
- Ảnh có đúng định dạng (WebP thay vì PNG/JPG lớn)?
- Có `<meta name="viewport">` cho mobile?

## Bước 3 — Tạo báo cáo

Xuất kết quả theo định dạng sau:

```
## SEO Audit Report — [Tên trang]
Ngày kiểm tra: [ngày]

### ✅ Đã tốt
- [Điểm đã đạt được]

### ⚠️ Cần cải thiện
- [Vấn đề] → [Giải pháp cụ thể]

### ❌ Lỗi nghiêm trọng
- [Vấn đề] → [Cách sửa ngay]

### 📊 Điểm SEO (ước tính): X/100
```

## Bước 4 — Tạo file HTML đã sửa

Nếu người dùng yêu cầu, hãy tạo phiên bản HTML đã được tối ưu SEO với các thay đổi được đánh dấu bằng comment `<!-- SEO FIX: ... -->`.

## Ví dụ sử dụng

> "Hãy kiểm tra SEO cho trang index.html của tôi"

→ AI sẽ đọc file, chạy qua checklist, và trả về báo cáo + bản sửa.

## Lưu ý quan trọng

- **Không đoán mò**: Chỉ báo cáo những gì thực sự đọc được từ code
- **Ưu tiên lỗi nghiêm trọng** trước (thiếu title, thiếu meta description)
- **Đưa ra code cụ thể** để sửa, không chỉ mô tả chung chung
