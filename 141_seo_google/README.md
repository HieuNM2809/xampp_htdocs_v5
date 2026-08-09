# 🔎 SEO Google & Google Ads — Lộ trình từ cơ bản đến nâng cao

Bộ tài liệu này trình bày **có hệ thống** các phương pháp đưa website lên Google, chia làm hai mảng lớn:

1. **SEO Google** (Search Engine Optimization) — kéo **traffic tự nhiên (organic)**, không trả tiền cho mỗi lượt click.
2. **Google Ads** — kéo **traffic trả phí (paid)**, trả tiền theo click/hiển thị/chuyển đổi.

Mỗi kỹ thuật được trình bày theo 4 phần: **Khái niệm → Mục đích → Các bước thực hiện → Ví dụ minh họa**, sắp xếp từ **cơ bản → nâng cao**.

> ⚠️ SEO và thuật toán Google thay đổi liên tục. Tài liệu này phản ánh best-practice tính đến **2025** (Core Web Vitals dùng INP, E-E-A-T có thêm chữ "Experience", RSA thay ETA, Performance Max...). Luôn đối chiếu [Google Search Central](https://developers.google.com/search) và [Google Ads Help](https://support.google.com/google-ads) khi triển khai thật.

---

## Mục lục bộ tài liệu

| # | File | Cấp độ | Nội dung chính |
|---|------|--------|----------------|
| 0 | `README.md` (file này) | — | Tổng quan, cách Google hoạt động, lộ trình, thuật ngữ |
| 1 | [`01_nghien_cuu_tu_khoa.md`](./01_nghien_cuu_tu_khoa.md) | 🟢 Cơ bản | Nghiên cứu & lập bản đồ từ khóa |
| 2 | [`02_seo_onpage.md`](./02_seo_onpage.md) | 🟢 Cơ bản | Title, meta, heading, nội dung, hình ảnh, internal link |
| 3 | [`03_seo_technical.md`](./03_seo_technical.md) | 🟡 Trung cấp | Tốc độ, URL, sitemap, robots, schema, mobile, canonical |
| 4 | [`04_seo_offpage.md`](./04_seo_offpage.md) | 🟡 Trung cấp | Backlink, digital PR, Local SEO, disavow |
| 5 | [`05_seo_nang_cao.md`](./05_seo_nang_cao.md) | 🔴 Nâng cao | E-E-A-T, Core Web Vitals, SEO ngữ nghĩa, topic cluster, AI Overviews |
| 6 | [`06_google_ads.md`](./06_google_ads.md) | 🟢→🔴 | Cấu trúc, Search/Display/Shopping/PMax, đấu giá, Quality Score, chuyển đổi |

---

## 1. Cách Google hoạt động (nền tảng để hiểu mọi kỹ thuật)

Muốn tối ưu, phải hiểu Google đi qua **3 giai đoạn**:

```
     ┌──────────┐        ┌──────────┐        ┌──────────────────┐
     │  CRAWL   │  ───▶  │  INDEX   │  ───▶  │  RANK / SERVING  │
     │ (thu thập)│        │ (lập chỉ  │        │ (xếp hạng & trả  │
     │           │        │  mục)    │        │  kết quả)        │
     └──────────┘        └──────────┘        └──────────────────┘
      Googlebot           Lưu vào             Xếp hạng theo hàng trăm
      đọc URL             kho index           tín hiệu khi có truy vấn
```

| Giai đoạn | Google làm gì | Bạn tối ưu cái gì |
|---|---|---|
| **Crawl** | Googlebot theo link, đọc `robots.txt`, sitemap để tìm & tải trang | Cho phép crawl, sitemap, internal link, không chặn nhầm |
| **Index** | Phân tích nội dung, chọn canonical, lưu vào kho | Nội dung rõ ràng, canonical đúng, tránh nội dung trùng lặp |
| **Rank** | Khi user tìm, chọn & sắp xếp trang phù hợp nhất | Từ khóa, on-page, backlink, E-E-A-T, tốc độ, trải nghiệm |

**Trang xếp hạng (SERP)** ngày nay không chỉ có "10 link xanh" mà còn: quảng cáo (Ads), Featured Snippet, People Also Ask, Local Pack (bản đồ), hình ảnh, video, và **AI Overviews** (kết quả do AI tổng hợp). SEO hiện đại là tối ưu cho **cả trang kết quả**, không chỉ vị trí #1 truyền thống.

---

## 2. SEO vs Google Ads — chọn cái nào?

| Tiêu chí | SEO (Organic) | Google Ads (Paid) |
|---|---|---|
| **Chi phí/click** | Không trả trực tiếp | Trả theo CPC/CPM/CPA |
| **Thời gian thấy kết quả** | Chậm (3–6 tháng+) | Ngay lập tức (bật là chạy) |
| **Độ bền** | Bền, "tài sản" tích lũy | Tắt tiền = tắt traffic |
| **Vị trí trên SERP** | Dưới khu quảng cáo | Trên cùng ("Sponsored") |
| **Tỷ lệ click** | Cao với truy vấn thông tin | Cao với truy vấn mua hàng |
| **Kiểm soát** | Gián tiếp (phụ thuộc thuật toán) | Trực tiếp (ngân sách, từ khóa, đối tượng) |

👉 **Chiến lược tốt nhất là kết hợp**: Ads để có traffic & doanh thu **ngay** trong lúc SEO còn "ủ"; dữ liệu từ khóa/chuyển đổi của Ads lại giúp định hướng nội dung SEO. Đây là lý do tài liệu gộp cả hai.

---

## 3. Lộ trình học đề xuất (roadmap)

```
🟢 CƠ BẢN (tháng 1–2)
   1. Nghiên cứu từ khóa  →  hiểu người dùng tìm gì
   2. SEO On-page          →  mỗi trang tối ưu cho 1 cụm từ khóa
   3. Google Ads Search cơ bản  →  có đơn hàng ngay

🟡 TRUNG CẤP (tháng 3–5)
   4. SEO Technical  →  đảm bảo Google crawl/index tốt, tốc độ đạt
   5. SEO Off-page   →  xây uy tín bằng backlink, Local SEO
   6. Ads: Shopping, Quality Score, remarketing

🔴 NÂNG CAO (tháng 6+)
   7. E-E-A-T & Core Web Vitals  →  vượt đối thủ ở YMYL/cạnh tranh cao
   8. SEO ngữ nghĩa & topic cluster  →  thống trị cả cụm chủ đề
   9. Ads: Smart Bidding (tROAS), Performance Max, tối ưu chuyển đổi
```

---

## 4. Ví dụ xuyên suốt

Để các ví dụ nhất quán, toàn bộ tài liệu dùng một website giả định:

> 🛍️ **Xinh Store** — cửa hàng mỹ phẩm online tại Việt Nam
> - Domain: `https://xinhstore.vn`
> - Sản phẩm tiêu biểu: *kem chống nắng*, *serum vitamin C*, *sữa rửa mặt*
> - Mục tiêu: bán hàng online (e-commerce), giao toàn quốc

Đây là ngành cạnh tranh cao, thuộc nhóm nhạy cảm **YMYL** (Your Money or Your Life — liên quan sức khỏe/tài chính người dùng), nên là ví dụ tốt để minh họa cả kỹ thuật cơ bản lẫn E-E-A-T nâng cao.

---

## 5. Bộ công cụ nên có

| Nhóm | Miễn phí | Trả phí |
|---|---|---|
| **Của Google** | Search Console, Analytics (GA4), Keyword Planner, PageSpeed Insights, Rich Results Test, Google Trends, Google Business Profile | — |
| **Nghiên cứu từ khóa / đối thủ** | Google Autocomplete, AnswerThePublic (giới hạn) | Ahrefs, Semrush, Moz |
| **Technical / tốc độ** | Lighthouse (Chrome DevTools), Screaming Frog (500 URL free) | Screaming Frog full, Sitebulb |
| **Theo dõi thứ hạng** | — | Ahrefs Rank Tracker, Semrush, SerpRobot |

> 🔑 **Bắt buộc cài đầu tiên**: [Google Search Console](https://search.google.com/search-console) (theo dõi index, thứ hạng, lỗi) và [GA4](https://analytics.google.com) (đo hành vi & chuyển đổi). Không có 2 công cụ này thì làm SEO/Ads là "mù".

---

## 6. Bảng thuật ngữ nhanh

| Thuật ngữ | Nghĩa |
|---|---|
| **SERP** | Search Engine Results Page — trang kết quả tìm kiếm |
| **Organic / Paid** | Kết quả tự nhiên / kết quả trả phí (quảng cáo) |
| **Crawl / Index** | Google thu thập / lưu chỉ mục trang |
| **On-page / Off-page** | Tối ưu **trong** trang / **ngoài** trang (backlink...) |
| **Backlink** | Link từ website khác trỏ về bạn |
| **CTR** | Click-Through Rate — tỷ lệ click / lượt hiển thị |
| **Search Intent** | Ý định tìm kiếm (thông tin / điều hướng / thương mại / giao dịch) |
| **SERP Feature** | Thành phần đặc biệt trên SERP (snippet, PAA, local pack...) |
| **E-E-A-T** | Experience, Expertise, Authoritativeness, Trustworthiness |
| **Core Web Vitals** | LCP, INP, CLS — chỉ số trải nghiệm trang |
| **Schema / Structured Data** | Dữ liệu có cấu trúc giúp Google hiểu nội dung |
| **CPC / CPA / ROAS** | Cost/click, Cost/chuyển đổi, Return On Ad Spend |
| **Quality Score** | Điểm chất lượng từ khóa trong Google Ads (1–10) |
| **YMYL** | "Your Money or Your Life" — chủ đề ảnh hưởng lớn tới người đọc |

---

## 7. Tham khảo chính thống

- [Google Search Central — Tài liệu SEO chính thức](https://developers.google.com/search/docs)
- [Google Search Essentials (trước đây là Webmaster Guidelines)](https://developers.google.com/search/docs/essentials)
- [SEO Starter Guide của Google](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [web.dev — Core Web Vitals](https://web.dev/vitals/)
- [Schema.org](https://schema.org/) & [Google Structured Data Gallery](https://developers.google.com/search/docs/appearance/structured-data/search-gallery)
- [Google Ads Help Center](https://support.google.com/google-ads)
- [Google Search Quality Rater Guidelines (PDF)](https://guidelines.raterhub.com/searchqualityevaluatorguidelines.pdf)

---

> 👉 Bắt đầu từ [`01_nghien_cuu_tu_khoa.md`](./01_nghien_cuu_tu_khoa.md) — nền móng của mọi chiến dịch SEO/Ads.
