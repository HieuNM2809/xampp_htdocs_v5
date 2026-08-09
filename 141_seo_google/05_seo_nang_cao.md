# 05 — SEO nâng cao 🔴

> Khi kỹ thuật cơ bản đã chuẩn, đây là 3 mặt trận quyết định thắng thua ở ngành cạnh tranh cao: **E-E-A-T** (uy tín), **Core Web Vitals** (trải nghiệm), và **SEO ngữ nghĩa** (thống trị cả cụm chủ đề & lọt vào AI Overviews).

**Mục lục**
1. [E-E-A-T](#1-e-e-a-t-experience-expertise-authoritativeness-trustworthiness)
2. [Core Web Vitals](#2-core-web-vitals)
3. [SEO ngữ nghĩa & Topic Cluster](#3-seo-ngữ-nghĩa--topic-cluster)
4. [Tối ưu cho AI Overviews / SGE](#4-tối-ưu-cho-ai-overviews--sge)
5. [Checklist](#5-checklist)

---

## 1. E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness)

**Khái niệm.** E-E-A-T là khung Google dùng trong *Search Quality Rater Guidelines* để đánh giá độ tin cậy nội dung:

| Chữ | Nghĩa | Câu hỏi Google đặt ra |
|---|---|---|
| **E**xperience | Kinh nghiệm thực tế | Người viết đã *trực tiếp* dùng/trải nghiệm chưa? |
| **E**xpertise | Chuyên môn | Người viết có kiến thức chuyên sâu không? |
| **A**uthoritativeness | Thẩm quyền | Trang/tác giả có được ngành công nhận là nguồn uy tín? |
| **T**rustworthiness | Độ tin cậy | Thông tin có chính xác, minh bạch, an toàn? |

> 💡 Chữ **E**xperience được thêm 12/2022 (trước đó là E-A-T). **Trust là trung tâm & quan trọng nhất**. E-E-A-T **không phải một chỉ số** đo trực tiếp — nó là tập hợp tín hiệu.

**Mục đích.** Cực kỳ quan trọng với trang **YMYL** (Your Money or Your Life — sức khỏe, tài chính, pháp lý). Mỹ phẩm ảnh hưởng sức khỏe da → Xinh Store thuộc YMYL, phải chứng minh uy tín mới lên top bền.

**Các bước thể hiện E-E-A-T:**
1. **Experience**: nội dung có trải nghiệm thật — ảnh tự chụp sản phẩm, kết quả dùng thực tế, review "người thật việc thật".
2. **Expertise**: bài y khoa/thành phần do người có chuyên môn thật viết/kiểm duyệt (dược sĩ, bác sĩ da liễu).
3. **Authoritativeness**: trang tác giả (author bio), được báo ngành trích dẫn, thương hiệu mạnh.
4. **Trustworthiness**: trang **About/Contact** rõ ràng, chính sách đổi trả/bảo mật, HTTPS, thông tin doanh nghiệp thật, đánh giá minh bạch, trích nguồn.

**Ví dụ — hộp tác giả + schema thể hiện chuyên môn** *(các giá trị trong `[...]` là placeholder — thay bằng thông tin chuyên gia thật của bạn, không bịa):*

```html
<div class="author-box">
  <img src="/images/tac-gia.webp" alt="Ảnh tác giả">
  <div>
    <strong>Bài viết được kiểm duyệt bởi [Tên dược sĩ phụ trách]</strong>
    <p>[Học vị / chức danh] — [số năm] năm kinh nghiệm tư vấn da liễu.</p>
    <a href="/tac-gia/duoc-si">Xem hồ sơ chuyên gia</a>
  </div>
</div>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Cách chọn kem chống nắng cho da mụn",
  "author": {
    "@type": "Person",
    "name": "[Tên tác giả]",
    "jobTitle": "Dược sĩ",
    "url": "https://xinhstore.vn/tac-gia/duoc-si"
  },
  "reviewedBy": { "@type": "Person", "name": "[Tên bác sĩ kiểm duyệt]" },
  "datePublished": "2025-01-10",
  "dateModified": "2025-01-18"
}
</script>
```

> ⚠️ E-E-A-T đòi hỏi **thông tin thật**. Đừng bịa tên chuyên gia/bằng cấp — Google (và người dùng) có thể đối chiếu, và thông tin sai làm mất Trust — phản tác dụng.

---

## 2. Core Web Vitals

**Khái niệm.** Bộ 3 chỉ số Google đo **trải nghiệm thực tế** của người dùng trên trang, là một phần của tín hiệu **Page Experience**.

| Chỉ số | Đo cái gì | 🟢 Tốt | 🟠 Cần cải thiện | 🔴 Kém |
|---|---|---|---|---|
| **LCP** (Largest Contentful Paint) | Tốc độ *tải* — thời điểm phần tử lớn nhất hiện ra | ≤ 2,5s | ≤ 4,0s | > 4,0s |
| **INP** (Interaction to Next Paint) | Độ *phản hồi* khi tương tác | ≤ 200ms | ≤ 500ms | > 500ms |
| **CLS** (Cumulative Layout Shift) | Độ *ổn định* — layout có nhảy không | ≤ 0,1 | ≤ 0,25 | > 0,25 |

> 💡 **INP đã thay thế FID** (First Input Delay) làm chỉ số chính thức từ **12/3/2024**. INP khó hơn FID vì đo *toàn bộ* độ trễ tương tác trong suốt phiên, không chỉ lần chạm đầu.

**Mục đích.** Trang đạt CWV "tốt" được cộng điểm trải nghiệm và giữ chân người dùng (đặc biệt mobile). Đây thường là "điểm hòa" khi nội dung & backlink ngang nhau.

**Các bước — đo:**
1. **Field data (thật)**: Search Console → báo cáo *Core Web Vitals*; hoặc CrUX. Đây là dữ liệu Google dùng để xếp hạng.
2. **Lab data (mô phỏng)**: PageSpeed Insights / Lighthouse để **gỡ lỗi**.

**Các bước — cải thiện từng chỉ số:**

**▸ LCP (tải nhanh phần tử lớn nhất):**
```html
<!-- Preload ảnh hero (thường là phần tử LCP) để tải sớm -->
<link rel="preload" as="image" href="/images/hero-kem-chong-nang.webp"
      fetchpriority="high">
```
- Dùng ảnh WebP/AVIF, CDN, server phản hồi nhanh (TTFB thấp), tránh ảnh hero lazy-load.

**▸ CLS (chống nhảy layout):**
```html
<!-- Luôn khai width/height (hoặc aspect-ratio) để trình duyệt chừa chỗ -->
<img src="/images/banner.webp" width="1200" height="400" alt="Banner khuyến mãi">
```
```css
/* Dành sẵn không gian cho ảnh/quảng cáo; nạp font không gây nhảy chữ */
@font-face { font-family: "Inter"; src: url(/fonts/inter.woff2); font-display: swap; }
```

**▸ INP (phản hồi tương tác nhanh):**
- Giảm & chia nhỏ JavaScript nặng (long tasks), tránh chặn main thread.
- Hoãn script không cần thiết (`defer`/`async`), dùng `requestIdleCallback` cho việc phụ.
- Debounce các handler chạy dày (scroll, input).

---

## 3. SEO ngữ nghĩa & Topic Cluster

**Khái niệm.** *Semantic SEO* = tối ưu theo **chủ đề & ý nghĩa (entities)**, không chỉ từ khóa đơn lẻ. Google (qua các mô hình như BERT/MUM) hiểu **ngữ cảnh và mối quan hệ**, nên site bao phủ trọn một chủ đề sẽ được xem là có **thẩm quyền chủ đề (topical authority)**.

**Mô hình Topic Cluster (Pillar – Cluster):**

```
                    ┌───────────────────────────┐
                    │   PILLAR PAGE (trụ)        │
                    │  "Hướng dẫn chống nắng      │
                    │   toàn tập"  /chong-nang     │
                    └────────────┬──────────────┘
          ┌──────────────┬───────┴───────┬──────────────┐
          ▼              ▼               ▼              ▼
   /spf-pa-la-gi   /kcn-cho-da-dau   /kcn-vat-ly-hoa-hoc  /cach-thoa-kcn
   (cluster)        (cluster)         (cluster)          (cluster)
   ⇅ link 2 chiều giữa pillar ⇄ mọi cluster, và cluster ⇄ cluster liên quan
```

**Mục đích.** Thay vì đấu lẻ từng từ khóa, bạn "bao vây" toàn bộ chủ đề → Google coi bạn là chuyên gia → toàn bộ cụm cùng lên hạng.

**Các bước:**
1. Chọn **chủ đề trụ** rộng (VD "chống nắng") → làm **pillar page** tổng quan.
2. Liệt kê mọi câu hỏi/khía cạnh con → mỗi cái một **bài cluster** chuyên sâu.
3. **Internal link 2 chiều**: pillar ⇄ cluster, cluster ⇄ cluster liên quan, với anchor mô tả.
4. Phủ **thực thể & từ liên quan** trong nội dung (SPF, PA, UVA/UVB, broad-spectrum, da liễu...).
5. Bám đúng **search intent** từng bài.

**Ví dụ.** Xinh Store xây cụm "chống nắng": 1 pillar `/blog/chong-nang-toan-tap` + 8 bài cluster (SPF là gì, KCN cho da dầu, vật lý vs hóa học, cách thoa đúng, KCN cho trẻ em...). Sau vài tháng, cả cụm phủ top vì Google nhận diện topical authority.

---

## 4. Tối ưu cho AI Overviews / SGE 🔴

**Khái niệm.** *AI Overviews* (tiền thân là SGE — Search Generative Experience) là phần Google dùng AI tổng hợp câu trả lời ngay đầu SERP, có **trích dẫn nguồn**. Đây là xu hướng lớn định hình SEO 2024–2025+.

**Mục đích.** Trở thành **nguồn được AI trích dẫn** → giữ hiển thị & thương hiệu ngay cả khi giao diện tìm kiếm thay đổi.

**Các bước (kế thừa mọi thứ ở trên, nhấn mạnh):**
1. Trả lời **trực tiếp, súc tích** câu hỏi (cấu trúc như Featured Snippet — xem [file 02](./02_seo_onpage.md)).
2. Nội dung có **E-E-A-T** rõ (AI ưu tiên nguồn đáng tin).
3. **Structured data** đầy đủ để máy dễ hiểu (xem [file 03](./03_seo_technical.md)).
4. Bao phủ chủ đề theo **cluster** để trở thành nguồn tham chiếu.
5. Dùng ngôn ngữ tự nhiên, trả lời đúng **ý định** & các câu hỏi phụ (PAA).

**Ví dụ.** Với truy vấn "kem chống nắng vật lý và hóa học khác gì nhau", một bài có đoạn mở đầu trả lời gọn 2–3 câu + bảng so sánh + tác giả là chuyên gia có hồ sơ rõ ràng → khả năng cao được AI Overviews trích dẫn kèm link.

---

## 5. Checklist

- [ ] Có trang tác giả + kiểm duyệt bởi chuyên gia thật cho nội dung YMYL (Experience/Expertise)
- [ ] About/Contact/chính sách minh bạch, HTTPS, thông tin doanh nghiệp thật (Trust)
- [ ] LCP ≤ 2,5s (preload hero, WebP, TTFB thấp)
- [ ] INP ≤ 200ms (giảm/chia nhỏ JS, hoãn script phụ)
- [ ] CLS ≤ 0,1 (khai width/height, font-display: swap, chừa chỗ ad)
- [ ] Đo CWV bằng **field data** (Search Console), gỡ lỗi bằng Lighthouse
- [ ] Đã xây ít nhất 1 topic cluster (pillar + cluster + internal link 2 chiều)
- [ ] Nội dung phủ thực thể liên quan, bám intent, sẵn sàng cho Featured Snippet/AI Overviews

➡️ Tiếp theo: [`06_do_luong_phan_tich.md`](./06_do_luong_phan_tich.md) — đo lường & phân tích hiệu quả (SEO + Ads).
