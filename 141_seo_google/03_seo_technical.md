# 03 — SEO kỹ thuật (Technical SEO) 🟡

> Nội dung hay tới đâu mà Google **không crawl/index được** hoặc trang **tải chậm** thì cũng vô ích. Technical SEO là "đường ống" đảm bảo mọi thứ đến được Google và người dùng.

**Mục lục**
1. [HTTPS & bảo mật](#1-https--bảo-mật)
2. [Cấu trúc URL & phân cấp site](#2-cấu-trúc-url--phân-cấp-site)
3. [robots.txt & meta robots](#3-robotstxt--meta-robots)
4. [Thẻ canonical](#4-thẻ-canonical-chống-trùng-lặp)
5. [XML Sitemap](#5-xml-sitemap)
6. [Tối ưu di động (mobile-first)](#6-tối-ưu-di-động-mobile-first-indexing)
7. [Tốc độ tải trang](#7-tốc-độ-tải-trang)
8. [Dữ liệu có cấu trúc (Schema)](#8-dữ-liệu-có-cấu-trúc-schema--json-ld)
9. [Crawl budget & hreflang](#9-crawl-budget--hreflang--nâng-cao)
10. [Checklist](#10-checklist)

---

## 1. HTTPS & bảo mật

**Khái niệm.** HTTPS mã hóa dữ liệu giữa trình duyệt và server bằng chứng chỉ SSL/TLS.

**Mục đích.** Là **yếu tố xếp hạng** (nhẹ) và là điều kiện tin cậy — Chrome gắn nhãn "Không bảo mật" cho site HTTP.

**Các bước:**
1. Cài chứng chỉ SSL (Let's Encrypt miễn phí, hoặc của hosting).
2. **Redirect 301** toàn bộ `http://` → `https://`.
3. Sửa mọi tài nguyên nội bộ (ảnh, JS, CSS) sang `https` để tránh **mixed content**.
4. Khai báo bản HTTPS trong Search Console.

**Ví dụ — redirect trong `.htaccess` (Apache/XAMPP):**

```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

---

## 2. Cấu trúc URL & phân cấp site

**Khái niệm.** *Site architecture* là cách tổ chức thư mục/URL theo tầng, thể hiện quan hệ giữa các trang.

**Mục đích.** Giúp Google hiểu trang nào quan trọng, phân bổ link equity, và giúp user điều hướng. Nguyên tắc **"3 clicks"**: mọi trang nên tới được trong ≤ 3 cú click từ trang chủ.

**Các bước:**
1. Thiết kế phân cấp nông, logic: `Trang chủ > Danh mục > Danh mục con > Sản phẩm`.
2. URL phản ánh phân cấp, có từ khóa, không dấu, gạch nối.
3. Dùng **breadcrumb** (kèm schema — mục 8).

**Ví dụ — cây URL của Xinh Store:**

```
https://xinhstore.vn/                          (Trang chủ)
├── /kem-chong-nang                            (Danh mục)
│   ├── /kem-chong-nang-da-dau                 (Danh mục con)
│   └── /kem-chong-nang/anessa-perfect-uv-60ml (Sản phẩm)
├── /serum                                     (Danh mục)
│   └── /serum/vitamin-c-melano-cc-20ml        (Sản phẩm)
└── /blog
    └── /blog/cach-chon-kem-chong-nang         (Bài viết)
```

---

## 3. robots.txt & meta robots

**Khái niệm.**
- `robots.txt`: file gốc ra lệnh cho bot **được/không được crawl** phần nào.
- `<meta name="robots">` / header `X-Robots-Tag`: kiểm soát **index** ở cấp từng trang.

> ⚠️ Phân biệt quan trọng: **`Disallow` trong robots.txt chỉ chặn crawl, KHÔNG chặn index**. Muốn một trang không xuất hiện trên Google, dùng `noindex` (chứ đừng `Disallow`) — vì nếu bị chặn crawl, Google không đọc được thẻ `noindex`.

**Mục đích.** Điều hướng bot crawl đúng chỗ, tiết kiệm crawl budget, giấu trang không cần index (giỏ hàng, trang lọc, admin).

**Ví dụ — `robots.txt` cho Xinh Store:**

```
# https://xinhstore.vn/robots.txt
User-agent: *
Disallow: /gio-hang
Disallow: /thanh-toan
Disallow: /*?sort=          # chặn crawl URL lọc/sắp xếp
Allow: /

# Khai báo sitemap
Sitemap: https://xinhstore.vn/sitemap.xml
```

**Ví dụ — chặn INDEX một trang cụ thể (trang cảm ơn sau thanh toán):**

```html
<meta name="robots" content="noindex, follow">
```

---

## 4. Thẻ canonical (chống trùng lặp)

**Khái niệm.** `<link rel="canonical">` chỉ cho Google biết đâu là **URL "gốc" chính thức** khi có nhiều URL nội dung giống/tương tự nhau.

**Mục đích.** Gộp tín hiệu xếp hạng về 1 URL, tránh **duplicate content** làm loãng sức mạnh (rất hay gặp ở e-commerce do URL lọc, phân trang, tham số tracking).

**Ví dụ — cùng 1 sản phẩm nhưng nhiều URL:**

```
https://xinhstore.vn/serum/vitamin-c-melano-cc-20ml            ← gốc
https://xinhstore.vn/serum/vitamin-c-melano-cc-20ml?color=red  ← biến thể
https://xinhstore.vn/serum/vitamin-c-melano-cc-20ml?utm=fb     ← tracking
```

Tất cả các URL trên đặt cùng một canonical trỏ về bản gốc:

```html
<link rel="canonical" href="https://xinhstore.vn/serum/vitamin-c-melano-cc-20ml">
```

---

## 5. XML Sitemap

**Khái niệm.** File XML liệt kê các URL quan trọng bạn muốn Google biết, kèm thời điểm cập nhật.

**Mục đích.** Giúp Google **phát hiện & crawl** nhanh hơn, đặc biệt với site lớn, trang mới, hoặc trang ít internal link trỏ tới.

**Các bước:**
1. Sinh sitemap tự động (plugin như Yoast/RankMath, hoặc framework tự tạo).
2. Chỉ đưa URL **canonical, trả 200, cho index** (đừng đưa trang `noindex`/redirect).
3. Site lớn → chia nhiều sitemap + 1 **sitemap index**.
4. Khai trong `robots.txt` và **submit** trong Search Console.

**Ví dụ — `sitemap.xml`:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://xinhstore.vn/</loc>
    <lastmod>2025-01-15</lastmod>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://xinhstore.vn/kem-chong-nang-da-dau</loc>
    <lastmod>2025-01-10</lastmod>
    <priority>0.8</priority>
  </url>
</urlset>
```

**Ví dụ — `sitemap_index.xml` (khi có nhiều sitemap):**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://xinhstore.vn/sitemap-products.xml</loc></sitemap>
  <sitemap><loc>https://xinhstore.vn/sitemap-blog.xml</loc></sitemap>
</sitemapindex>
```

---

## 6. Tối ưu di động (Mobile-first indexing)

**Khái niệm.** Từ 2019+, Google dùng **bản di động** của trang làm bản chính để index & xếp hạng (mobile-first indexing).

**Mục đích.** Phần lớn traffic đến từ mobile; bản mobile kém = tụt hạng cả trên desktop.

**Các bước:**
1. Dùng **responsive design** (một URL, CSS co giãn) — Google khuyến nghị.
2. Đảm bảo nội dung mobile = desktop (đừng ẩn nội dung quan trọng trên mobile).
3. Nút bấm đủ lớn, khoảng cách chạm hợp lý; font đọc được không cần zoom.
4. Có thẻ viewport.
5. Kiểm tra bằng công cụ **Mobile-Friendly** / thử trực tiếp trên máy.

**Ví dụ — thẻ viewport bắt buộc:**

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

---

## 7. Tốc độ tải trang

**Khái niệm.** Thời gian & độ mượt khi tải trang. Google đo qua **Core Web Vitals** (chi tiết & nâng cao ở [file 05](./05_seo_nang_cao.md)).

**Mục đích.** Trang nhanh → xếp hạng tốt hơn + tỷ lệ thoát thấp + chuyển đổi cao hơn.

**Các bước cơ bản:**
1. **Nén & tối ưu ảnh** (WebP/AVIF, đúng kích thước) — thường là thủ phạm nặng nhất.
2. **Bật nén** Gzip/Brotli và **cache** trình duyệt.
3. **Minify** CSS/JS, gộp file, loại bỏ code thừa.
4. **Lazy-load** ảnh/iframe dưới màn hình đầu.
5. Dùng **CDN** cho tài nguyên tĩnh.
6. Giảm/hoãn JavaScript chặn hiển thị (`defer`/`async`).

**Ví dụ — cache & nén trong `.htaccess`:**

```apache
# Nén
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript
</IfModule>

# Cache trình duyệt
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType text/css   "access plus 1 month"
</IfModule>
```

**Ví dụ — load script không chặn render:**

```html
<script src="/js/app.js" defer></script>
```

---

## 8. Dữ liệu có cấu trúc (Schema / JSON-LD)

**Khái niệm.** *Structured data* là đoạn mã theo từ vựng [Schema.org](https://schema.org) mô tả nội dung ở dạng máy hiểu được (sản phẩm, bài viết, đánh giá, sự kiện...). Google **khuyến nghị định dạng JSON-LD**.

**Mục đích.** Giúp Google hiểu chính xác nội dung và hiển thị **Rich Results** (sao đánh giá, giá, breadcrumb...) → tăng CTR mạnh.

> ⚠️ Từ 8/2023 Google **thu hẹp** một số rich result: `FAQPage` chỉ còn hiển thị cho site uy tín (chính phủ/y tế), `HowTo` bị gỡ. Vẫn nên khai báo đúng, nhưng đừng kỳ vọng mọi loại đều ra rich result.

**Các bước:**
1. Chọn loại schema đúng nội dung (Product, Article, BreadcrumbList, Organization, LocalBusiness...).
2. Nhúng JSON-LD trong `<head>` hoặc `<body>`.
3. **Kiểm tra** bằng [Rich Results Test](https://search.google.com/test/rich-results) và [Schema Markup Validator](https://validator.schema.org).
4. Dữ liệu schema phải **khớp nội dung hiển thị** (đừng khai giá/sao khác thực tế → vi phạm chính sách).

**Ví dụ 1 — Product + Offer + Review (trang sản phẩm):**

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Serum Vitamin C Melano CC 20ml",
  "image": "https://xinhstore.vn/images/melano-cc-20ml.webp",
  "description": "Serum dưỡng trắng, mờ thâm với Vitamin C nguyên chất.",
  "brand": { "@type": "Brand", "name": "Melano CC" },
  "sku": "SR-MLN-20",
  "offers": {
    "@type": "Offer",
    "url": "https://xinhstore.vn/serum/vitamin-c-melano-cc-20ml",
    "priceCurrency": "VND",
    "price": "195000",
    "availability": "https://schema.org/InStock"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "126"
  }
}
</script>
```

**Ví dụ 2 — BreadcrumbList (đường dẫn phân cấp):**

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Trang chủ", "item": "https://xinhstore.vn/" },
    { "@type": "ListItem", "position": 2, "name": "Serum", "item": "https://xinhstore.vn/serum" },
    { "@type": "ListItem", "position": 3, "name": "Vitamin C Melano CC 20ml" }
  ]
}
</script>
```

**Ví dụ 3 — Organization (khai báo thương hiệu, hỗ trợ Knowledge Panel):**

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Xinh Store",
  "url": "https://xinhstore.vn",
  "logo": "https://xinhstore.vn/images/logo.png",
  "sameAs": [
    "https://www.facebook.com/xinhstore",
    "https://www.tiktok.com/@xinhstore"
  ]
}
</script>
```

---

## 9. Crawl budget & hreflang 🔴 nâng cao

**Crawl budget** — *khái niệm*: số lượng URL Googlebot sẵn sàng crawl trong một khoảng thời gian. Quan trọng với site **rất lớn** (>10k+ URL). *Cách tối ưu*: giảm URL rác (tham số lọc vô hạn), sửa chuỗi redirect, dọn trang lỗi 404/soft-404, tăng tốc server (phản hồi nhanh → Google crawl nhiều hơn). Phân tích **log file** để biết Google thực sự crawl gì.

**hreflang** — *khái niệm*: thẻ khai báo phiên bản ngôn ngữ/khu vực của cùng một trang. *Mục đích*: Google trả đúng bản ngôn ngữ cho đúng người dùng, tránh trùng lặp giữa các bản dịch.

**Ví dụ — hreflang cho trang có bản tiếng Việt & tiếng Anh:**

```html
<link rel="alternate" hreflang="vi" href="https://xinhstore.vn/kem-chong-nang">
<link rel="alternate" hreflang="en" href="https://xinhstore.vn/en/sunscreen">
<link rel="alternate" hreflang="x-default" href="https://xinhstore.vn/kem-chong-nang">
```

---

## 10. Checklist

- [ ] Toàn site HTTPS, đã 301 từ HTTP, không mixed content
- [ ] Cấu trúc URL nông ≤ 3 click, có breadcrumb
- [ ] `robots.txt` đúng; dùng `noindex` (không phải `Disallow`) cho trang cần ẩn khỏi index
- [ ] Canonical đặt đúng cho mọi trang có biến thể URL
- [ ] Sitemap XML sạch, đã submit Search Console
- [ ] Responsive, mobile-friendly, có viewport
- [ ] Ảnh nén, bật cache/nén, minify, lazy-load
- [ ] Schema JSON-LD (Product/Breadcrumb/Organization) đã qua Rich Results Test
- [ ] (Site lớn) đã rà crawl budget; (đa ngôn ngữ) đã khai hreflang

➡️ Tiếp theo: [`04_seo_offpage.md`](./04_seo_offpage.md) — xây uy tín ngoài trang.
