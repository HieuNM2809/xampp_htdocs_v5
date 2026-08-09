# 06 — Đo lường & phân tích hiệu quả 🟡 → 🔴

> Nguyên tắc xuyên suốt: **"Không đo được thì không tối ưu được."** Mọi kỹ thuật ở [file 01](./01_nghien_cuu_tu_khoa.md)–[05](./05_seo_nang_cao.md) chỉ có giá trị khi bạn theo dõi được nó có tạo ra traffic/đơn hàng hay không. Đây là lớp "đo đạc" nối cả **SEO** lẫn **Google Ads**.

**Mục lục**
1. [Vì sao phải đo lường](#1-vì-sao-phải-đo-lường)
2. [Google Search Console (SEO)](#2-google-search-console-gsc--bảng-điều-khiển-của-seo)
3. [Google Analytics 4 (hành vi & chuyển đổi)](#3-google-analytics-4-ga4--hành-vi--chuyển-đổi)
4. [Gắn UTM để biết nguồn campaign](#4-gắn-utm-để-biết-chính-xác-nguồn-campaign)
5. [Liên thông 3 công cụ](#5-liên-thông-3-công-cụ-gsc--ga4--google-ads)
6. [Bộ KPI cần theo dõi](#6-bộ-kpi-cần-theo-dõi-seo--ads)
7. [Phân tích nâng cao](#7-phân-tích-nâng-cao--nâng-cao)
8. [Vòng lặp tối ưu](#8-vòng-lặp-tối-ưu-dựa-trên-dữ-liệu)
9. [Checklist](#9-checklist)

---

## 1. Vì sao phải đo lường

**Khái niệm.** Đo lường (measurement/analytics) là việc thu thập & phân tích dữ liệu để biết hoạt động SEO/Ads đang tạo ra kết quả gì.

**Mục đích.** Chuyển từ "làm theo cảm tính" sang "quyết định theo dữ liệu": biết từ khóa nào lên top, trang nào ra đơn, kênh nào sinh lời, chỗ nào cần sửa.

**3 công cụ nền tảng (đều miễn phí của Google):**

| Công cụ | Trả lời câu hỏi | Dùng cho |
|---|---|---|
| **Search Console** | Site hiển thị & được click thế nào trên Google? Index ổn không? | SEO |
| **Google Analytics 4** | Người dùng vào site rồi làm gì? Có chuyển đổi không? | SEO + Ads + mọi kênh |
| **Google Ads (báo cáo)** | Quảng cáo chi bao nhiêu, ra bao nhiêu đơn? | Ads |

---

## 2. Google Search Console (GSC) — "bảng điều khiển" của SEO

**Khái niệm.** Công cụ cho biết website hiển thị & được click ra sao trên kết quả tìm kiếm, kèm tình trạng crawl/index. Đây là **dữ liệu trực tiếp từ Google**, chính xác nhất cho SEO.

**Mục đích.** Tìm cơ hội tối ưu (từ khóa, trang) và phát hiện lỗi kỹ thuật khiến trang không lên top.

**Các bước:**
1. Thêm & **xác minh** quyền sở hữu (DNS / thẻ HTML / liên kết GA).
2. Submit sitemap ([file 03](./03_seo_technical.md)).
3. Đọc các báo cáo chính:

| Báo cáo | Cho biết | Dùng để |
|---|---|---|
| **Performance** | Impressions, Clicks, CTR, Vị trí TB theo từ khóa/trang | tìm từ khóa & trang để tối ưu |
| **Pages (Index)** | Trang nào được/không được index + lý do | sửa lỗi crawl/index |
| **Sitemaps** | Trạng thái sitemap đã submit | đảm bảo Google thấy trang |
| **Core Web Vitals** | LCP/INP/CLS thực tế (field data) | biết trang nào cần tối ưu tốc độ ([file 05](./05_seo_nang_cao.md)) |
| **Links** | Backlink & internal link | quản lý off-page ([file 04](./04_seo_offpage.md)) |

**Ví dụ — 3 quyết định kinh điển từ báo cáo Performance:**

| Tín hiệu trong GSC | Chẩn đoán | Hành động |
|---|---|---|
| Impressions cao, **CTR thấp** | Tiêu đề/mô tả chưa hấp dẫn | Viết lại title + meta ([file 02](./02_seo_onpage.md)) |
| **Vị trí TB 8–15** (đầu trang 2) | "Gần top", chỉ cần đẩy nhẹ | Bổ sung nội dung + internal link |
| Trang **tụt hạng** sau update | Nội dung/E-E-A-T yếu đi | Rà soát & cập nhật nội dung |

---

## 3. Google Analytics 4 (GA4) — hành vi & chuyển đổi

**Khái niệm.** GA4 đo người dùng làm gì **sau khi** vào site: nguồn traffic, trang xem, mức độ tương tác, và **key events** (sự kiện quan trọng — trước GA4 gọi là "conversions": mua hàng, đăng ký, thêm giỏ...).

**Mục đích.** Biết traffic từ đâu tới và kênh/trang nào thực sự ra tiền, không chỉ ra lượt xem.

**Các bước:**
1. Tạo property GA4 → gắn **Google tag** (trực tiếp hoặc qua Google Tag Manager).
2. Đánh dấu sự kiện quan trọng là **key event** (VD `purchase`, `add_to_cart`, `generate_lead`).
3. Đọc báo cáo: **Traffic acquisition** (organic / paid / social / direct), **Engagement**, **Conversions**.

**Ví dụ.** GA4 cho thấy `Organic Search` mang 60% phiên nhưng tỷ lệ chuyển đổi 1,2%; `Paid Search` chỉ 15% phiên nhưng chuyển đổi 2,5% → cân nhắc tăng ngân sách Ads cho nhóm từ khóa đang thắng, đồng thời cải thiện landing page organic.

---

## 4. Gắn UTM để biết chính xác nguồn campaign

**Khái niệm.** *UTM* là các tham số gắn vào URL để GA4 nhận diện chính xác click đến từ chiến dịch nào.

**Mục đích.** Phân tách hiệu quả từng nguồn/quảng cáo/biến thể — nếu không gắn, nhiều traffic sẽ bị gom nhầm vào "direct/referral".

**Ví dụ — URL gắn UTM cho một banner Facebook Ads:**

```
https://xinhstore.vn/kem-chong-nang?utm_source=facebook&utm_medium=cpc&utm_campaign=he_2025&utm_content=banner_a
```

| Tham số | Nghĩa | Ví dụ |
|---|---|---|
| `utm_source` | Nguồn | facebook, google, zalo |
| `utm_medium` | Loại | cpc, email, social |
| `utm_campaign` | Tên chiến dịch | he_2025 |
| `utm_term` | Từ khóa (thường cho paid search) | kem_chong_nang |
| `utm_content` | Phân biệt biến thể A/B | banner_a |

> 💡 Google Ads có **auto-tagging** (tham số `gclid`) — bật lên là tự gắn, không cần UTM thủ công cho chính Google Ads. UTM chủ yếu dùng cho các kênh khác (Facebook, email, KOL...).

---

## 5. Liên thông 3 công cụ (GSC + GA4 + Google Ads)

**Khái niệm.** Kết nối các công cụ để dữ liệu chảy qua lại, thay vì xem rời rạc.

**Mục đích.** Có bức tranh toàn cảnh và — quan trọng nhất — cấp "nhiên liệu" chuyển đổi cho Smart Bidding.

**Các bước:**
1. **GSC ↔ GA4**: liên kết để xem dữ liệu từ khóa organic ngay trong GA4.
2. **GA4 ↔ Google Ads**: import **key events** của GA4 làm conversion cho Ads → điều kiện để **Smart Bidding** (tCPA/tROAS) học và tối ưu.
3. Bật **Enhanced Conversions** để đo chính xác hơn khi cookie bị hạn chế.

**Ví dụ.** Sau khi import `purchase` từ GA4 vào Google Ads, bật chiến lược **Maximize Conversion Value / tROAS** — Google mới có dữ liệu doanh thu để tự đấu giá theo lợi nhuận.

---

## 6. Bộ KPI cần theo dõi (SEO + Ads)

**Khái niệm.** *KPI* là các chỉ số then chốt phản ánh sức khỏe & hiệu quả.

| Mảng | KPI | Ý nghĩa |
|---|---|---|
| SEO | Organic clicks, Vị trí TB, số từ khóa top 3/10 | độ phủ & xu hướng tự nhiên |
| SEO | Số trang được index, lỗi coverage | sức khỏe kỹ thuật |
| SEO/UX | % URL đạt "Good" ở LCP/INP/CLS | chất lượng trải nghiệm |
| Ads | CTR, CPC, CPA, **ROAS**, Impression Share | hiệu quả trả phí |
| Chung | Tỷ lệ chuyển đổi, Doanh thu theo kênh | kết quả tiền thật |

**Mục đích.** Chọn đúng vài KPI cốt lõi để theo dõi định kỳ, tránh "chết chìm" trong hàng trăm số liệu.

---

## 7. Phân tích nâng cao 🔴

**▸ Looker Studio dashboard** — *Khái niệm*: công cụ báo cáo miễn phí gộp GSC + GA4 + Google Ads thành một dashboard tự động. *Mục đích*: xem **organic vs paid** cạnh nhau, theo dõi xu hướng tuần/tháng, chia sẻ cho team/sếp mà không phải mở 3 công cụ.

**▸ Attribution (mô hình phân bổ)** — *Khái niệm*: cách chia "công lao" của một chuyển đổi cho các điểm chạm. GA4 mặc định **data-driven** (dựa dữ liệu), thay cho "last-click" cũ. *Mục đích*: không đánh giá thấp các kênh hỗ trợ. *Ví dụ*: khách thấy Display → tìm organic → click Ads Search rồi mới mua; last-click quy hết cho Search, còn data-driven ghi nhận cả 3 → quyết định ngân sách công bằng hơn.

**▸ Phát hiện keyword cannibalization qua GSC** — *Khái niệm*: khi nhiều URL của bạn cùng nhảy thứ hạng thất thường cho **một** từ khóa trong báo cáo Performance → dấu hiệu 2 trang đang "đá nhau". *Hành động*: gộp trang hoặc chỉnh lại keyword map ([file 01](./01_nghien_cuu_tu_khoa.md)).

**▸ Đo tác động Google Core Update** — *Khái niệm*: đối chiếu mốc ngày Google tung bản cập nhật lõi với biến động traffic organic. *Mục đích*: biết đợt tụt/tăng là do update (cần xem lại nội dung/E-E-A-T) hay do yếu tố khác.

---

## 8. Vòng lặp tối ưu dựa trên dữ liệu

```
   ┌─────────────────────────────────────────────────────────┐
   │  ĐO (GSC / GA4 / Google Ads)                              │
   │        │                                                   │
   │        ▼                                                   │
   │  TÌM ĐIỂM YẾU (CTR thấp? trang 2? CPA cao? tụt hạng?)      │
   │        │                                                   │
   │        ▼                                                   │
   │  GIẢ THUYẾT → SỬA (title / nội dung / bid / landing page)  │
   │        │                                                   │
   │        ▼                                                   │
   │  ĐO LẠI → so sánh → giữ cái tốt, lặp lại  ◄────────────────┤
   └─────────────────────────────────────────────────────────┘
```

**Ví dụ một chu kỳ.** GSC báo bài "cách chọn kem chống nắng" có CTR 1,1% (thấp so với vị trí #5) → giả thuyết title chưa hút → thêm con số & lợi ích vào title → sau 2 tuần CTR lên 3,4%, clicks tăng gấp 3 → giữ và áp dụng cách viết title tương tự cho bài khác.

---

## 9. Checklist

- [ ] Đã cài & xác minh **Search Console** + **GA4**
- [ ] Đã đánh dấu **key events** (mua hàng / lead) trong GA4
- [ ] Đã link **GSC↔GA4** và **GA4↔Google Ads** (import conversion)
- [ ] Gắn **UTM** cho mọi link campaign paid/social/email (Google Ads dùng auto-tagging)
- [ ] Có **dashboard Looker Studio** theo dõi organic vs paid
- [ ] Xem **GSC Performance** hằng tuần: khai thác "CTR thấp" & "đầu trang 2"
- [ ] Theo dõi **ROAS/CPA** để điều chỉnh ngân sách Ads
- [ ] Rà **cannibalization** & đối chiếu **Core Update** định kỳ

---

⬅️ Quay lại [`README.md`](./README.md) để xem toàn bộ lộ trình. Đo lường là bước khép vòng: dữ liệu ở đây quay lại nuôi [nghiên cứu từ khóa](./01_nghien_cuu_tu_khoa.md), [nội dung](./02_seo_onpage.md) và tối ưu Google Ads.
