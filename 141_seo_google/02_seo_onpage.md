# 02 — SEO On-page 🟢

> *On-page* = mọi thứ bạn tối ưu **bên trong** trang: nội dung + HTML. Đây là phần bạn **kiểm soát 100%**, nên làm trước tiên.

**Mục lục**
1. [Thẻ tiêu đề (Title tag)](#1-thẻ-tiêu-đề-title-tag)
2. [Thẻ meta description](#2-thẻ-meta-description)
3. [Cấu trúc heading (H1–H6)](#3-cấu-trúc-heading-h1h6)
4. [Tối ưu nội dung](#4-tối-ưu-nội-dung)
5. [Tối ưu hình ảnh](#5-tối-ưu-hình-ảnh)
6. [URL & internal link](#6-url--internal-link)
7. [Featured Snippet & tối ưu đoạn trích](#7-tối-ưu-featured-snippet--nâng-cao)
8. [Mẫu HTML hoàn chỉnh](#8-mẫu-html-on-page-hoàn-chỉnh)
9. [Checklist](#9-checklist)

---

## 1. Thẻ tiêu đề (Title tag)

**Khái niệm.** `<title>` là dòng tiêu đề xanh hiển thị trên SERP và trên tab trình duyệt. Là **tín hiệu on-page mạnh nhất**.

**Mục đích.** Nói cho Google + người dùng biết trang nói về gì, và **thuyết phục họ click** (tăng CTR).

**Các bước / quy tắc:**
1. Độ dài **~50–60 ký tự** (~600px) để không bị cắt "...".
2. Đặt **từ khóa chính gần đầu**.
3. Mỗi trang một title **duy nhất**.
4. Thêm yếu tố hấp dẫn: con số, năm, USP (chính hãng, freeship), tên thương hiệu ở cuối.
5. Đừng nhồi nhét từ khóa (keyword stuffing).

**Ví dụ:**

```html
<!-- ❌ Kém: mơ hồ, không từ khóa -->
<title>Trang chủ - Xinh Store</title>

<!-- ✅ Tốt: từ khóa đầu + USP + brand -->
<title>Kem Chống Nắng Cho Da Dầu Chính Hãng, Freeship | Xinh Store</title>
```

> 💡 Google đôi khi **tự viết lại** title nếu thấy title của bạn kém phù hợp. Viết title sát nội dung để tránh bị ghi đè.

---

## 2. Thẻ meta description

**Khái niệm.** `<meta name="description">` là đoạn mô tả ~1–2 dòng dưới title trên SERP.

**Mục đích.** **Không phải yếu tố xếp hạng trực tiếp**, nhưng ảnh hưởng lớn tới **CTR** — mô tả hấp dẫn = nhiều click hơn = tín hiệu tốt gián tiếp.

**Các bước:**
1. Độ dài **~150–160 ký tự**.
2. Chứa từ khóa chính (Google **bôi đậm** từ khớp truy vấn).
3. Có **lời kêu gọi hành động (CTA)**: "Mua ngay", "Xem bảng giá", "Freeship".
4. Mỗi trang một description riêng.

**Ví dụ:**

```html
<meta name="description"
  content="Kem chống nắng cho da dầu mụn, kiềm dầu, không bít lỗ chân lông.
  ✔ Chính hãng ✔ Freeship toàn quốc ✔ Đổi trả 7 ngày. Mua ngay tại Xinh Store!">
```

---

## 3. Cấu trúc heading (H1–H6)

**Khái niệm.** Thẻ `<h1>`–`<h6>` tạo **dàn ý phân cấp** cho nội dung, như mục lục của một cuốn sách.

**Mục đích.** Giúp Google hiểu cấu trúc & chủ đề; giúp người dùng (và trình đọc màn hình) quét nội dung dễ hơn.

**Các bước / quy tắc:**
1. **Đúng 1 thẻ `<h1>`** mỗi trang = chủ đề chính, chứa từ khóa chính.
2. Dùng `<h2>` cho các mục lớn, `<h3>` cho mục con — **không nhảy cấp** (h1 → h3).
3. Heading mô tả đúng nội dung bên dưới, chèn từ khóa phụ **tự nhiên**.

**Ví dụ — dàn ý bài blog:**

```html
<h1>Cách chọn kem chống nắng cho da dầu mụn</h1>
  <h2>1. Vì sao da dầu cần kem chống nắng riêng?</h2>
  <h2>2. Tiêu chí chọn kem chống nắng cho da dầu</h2>
    <h3>2.1. Kết cấu kiềm dầu, không gây bít tắc</h3>
    <h3>2.2. Chỉ số SPF/PA phù hợp</h3>
  <h2>3. Top 5 kem chống nắng cho da dầu đáng mua</h2>
```

---

## 4. Tối ưu nội dung

**Khái niệm.** Nội dung (content) là phần chữ/thông tin trên trang — thứ Google thực sự đánh giá để xếp hạng.

**Mục đích.** Đáp ứng **search intent** đầy đủ và tốt hơn đối thủ → Google ưu tiên.

**Các bước:**
1. **Bám intent**: trang review thì phải so sánh, trang bán hàng thì phải có giá/nút mua.
2. **Độ sâu đủ**: bao phủ các câu hỏi phụ (lấy từ PAA). Không có "độ dài chuẩn" — đủ để giải quyết vấn đề là được.
3. **Đặt từ khóa tự nhiên**: trong đoạn mở đầu, vài heading, và rải đều — viết cho người, không cho bot.
4. **Từ đồng nghĩa & thực thể liên quan** (semantic): với "kem chống nắng" nên có "SPF", "PA+++", "tia UVA/UVB", "da dầu" — giúp Google hiểu ngữ cảnh.
5. **Dễ đọc**: đoạn ngắn, bullet, bảng, in đậm ý chính.
6. **Cập nhật định kỳ** nội dung cũ (freshness).

**Ví dụ — đoạn mở đầu tối ưu (từ khóa in *nghiêng* để minh họa):**

> *Kem chống nắng cho da dầu* cần kết cấu mỏng nhẹ, kiềm dầu và không gây bít tắc lỗ chân lông. Bài viết giúp bạn hiểu cách đọc chỉ số *SPF/PA*, phân biệt kem chống nắng *vật lý* và *hóa học*, và chọn đúng sản phẩm cho làn da dầu mụn.

> ⚠️ **Tránh keyword stuffing**: "kem chống nắng da dầu, kem chống nắng cho da dầu, kem chống nắng da dầu tốt..." lặp lại nhồi nhét → bị coi là spam.

---

## 5. Tối ưu hình ảnh

**Khái niệm.** Tối ưu ảnh về **tên file, thẻ alt, dung lượng, định dạng** để vừa lên **Google Images**, vừa không làm chậm trang.

**Mục đích.** Thêm nguồn traffic (image search), tăng khả năng tiếp cận (accessibility), và cải thiện tốc độ (liên quan Core Web Vitals — xem file 05).

**Các bước:**
1. **Tên file mô tả**, có gạch nối: `kem-chong-nang-anessa.jpg` (không phải `IMG_2931.jpg`).
2. **Thẻ `alt`** mô tả ảnh + từ khóa tự nhiên (dùng cho SEO + trình đọc màn hình).
3. **Nén ảnh** (TinyPNG/Squoosh) và dùng định dạng hiện đại **WebP/AVIF**.
4. **`width`/`height`** rõ ràng để tránh layout nhảy (CLS).
5. **Lazy-load** ảnh dưới màn hình đầu (`loading="lazy"`).
6. **`srcset`** để phục vụ ảnh responsive theo thiết bị.

**Ví dụ:**

```html
<!-- ❌ Kém -->
<img src="/img/IMG_2931.jpg">

<!-- ✅ Tốt: tên file + alt + kích thước + lazy + responsive -->
<img
  src="/images/kem-chong-nang-anessa-60ml.webp"
  srcset="/images/kem-chong-nang-anessa-60ml-400.webp 400w,
          /images/kem-chong-nang-anessa-60ml-800.webp 800w"
  sizes="(max-width: 600px) 400px, 800px"
  alt="Kem chống nắng Anessa 60ml cho da dầu, chống trôi khi đi bơi"
  width="800" height="800"
  loading="lazy">
```

---

## 6. URL & internal link

**Khái niệm.**
- *URL slug*: phần địa chỉ mô tả trang.
- *Internal link*: link giữa các trang **trong cùng website**.

**Mục đích.** URL rõ ràng giúp người & Google hiểu trang; internal link phân bổ "sức mạnh" (link equity) và giúp Google crawl sâu.

**Các bước:**
1. URL **ngắn, có từ khóa, gạch nối, chữ thường, không dấu**: `/kem-chong-nang-da-dau`.
2. Tránh tham số rối: `?id=123&cat=45&ref=abc`.
3. **Anchor text mô tả** khi đặt internal link (không dùng "bấm vào đây").
4. Link từ trang mạnh → trang cần đẩy; link các bài liên quan cho nhau.

**Ví dụ internal link (anchor text tối ưu):**

```html
<!-- ❌ -->
Xem sản phẩm <a href="/p/123">tại đây</a>.

<!-- ✅ anchor mô tả, chứa từ khóa -->
Tham khảo thêm <a href="/kem-chong-nang-da-dau">các loại kem chống nắng cho da dầu</a>
đang bán chạy tại Xinh Store.
```

---

## 7. Tối ưu Featured Snippet 🔴 nâng cao

**Khái niệm.** *Featured Snippet* là hộp trả lời nổi bật ("vị trí số 0") Google trích ngay đầu SERP.

**Mục đích.** Chiếm vị trí cao nhất, tăng CTR & thương hiệu; là "vé" để nội dung được AI Overviews trích dẫn (xem file 05).

**Các bước:**
1. Tìm từ khóa dạng câu hỏi (từ PAA).
2. **Trả lời trực tiếp, súc tích 40–60 từ** ngay dưới một heading là chính câu hỏi đó.
3. Với "cách làm" → dùng danh sách đánh số; với so sánh → dùng **bảng**.

**Ví dụ — cấu trúc đón snippet dạng định nghĩa:**

```html
<h2>SPF là gì?</h2>
<p><strong>SPF (Sun Protection Factor)</strong> là chỉ số đo khả năng bảo vệ da
khỏi tia UVB gây cháy nắng. Ví dụ SPF 50 lọc được khoảng 98% tia UVB.
Với người Việt đi ngoài trời, nên chọn SPF từ 30 trở lên.</p>
```

---

## 8. Mẫu HTML On-page hoàn chỉnh

Gộp mọi thẻ ở trên vào phần `<head>` + đầu `<body>` một trang chuẩn:

```html
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- Title & description -->
  <title>Kem Chống Nắng Cho Da Dầu Chính Hãng, Freeship | Xinh Store</title>
  <meta name="description"
    content="Kem chống nắng cho da dầu mụn, kiềm dầu, không bít lỗ chân lông.
    ✔ Chính hãng ✔ Freeship toàn quốc. Mua ngay tại Xinh Store!">

  <!-- Canonical (xem file 03) -->
  <link rel="canonical" href="https://xinhstore.vn/kem-chong-nang-da-dau">

  <!-- Open Graph: đẹp khi share Facebook/Zalo -->
  <meta property="og:title" content="Kem Chống Nắng Cho Da Dầu | Xinh Store">
  <meta property="og:description" content="Chính hãng, freeship toàn quốc.">
  <meta property="og:image" content="https://xinhstore.vn/images/kcn-da-dau-og.jpg">
  <meta property="og:type" content="website">
</head>
<body>
  <h1>Kem chống nắng cho da dầu</h1>
  <img src="/images/kem-chong-nang-da-dau.webp"
       alt="Bộ sưu tập kem chống nắng cho da dầu tại Xinh Store"
       width="800" height="500">
  <p>Tổng hợp <a href="/kem-chong-nang">kem chống nắng</a> phù hợp da dầu mụn...</p>
  <h2>Tiêu chí chọn kem chống nắng cho da dầu</h2>
  ...
</body>
</html>
```

---

## 9. Checklist

- [ ] Title ~50–60 ký tự, từ khóa đầu, duy nhất mỗi trang
- [ ] Meta description ~150–160 ký tự, có CTA
- [ ] Đúng 1 `<h1>`, heading phân cấp không nhảy bậc
- [ ] Nội dung bám intent, đủ sâu, có từ đồng nghĩa/thực thể liên quan
- [ ] Ảnh: tên file mô tả + alt + WebP + width/height + lazy-load
- [ ] URL ngắn, có từ khóa, gạch nối, chữ thường
- [ ] Internal link với anchor text mô tả
- [ ] Có Open Graph tag cho mạng xã hội

➡️ Tiếp theo: [`03_seo_technical.md`](./03_seo_technical.md) — đảm bảo Google crawl/index tốt.
