# 04 — SEO Off-page & Backlink 🟡

> *Off-page* = mọi tín hiệu uy tín đến từ **bên ngoài** website. Cốt lõi là **backlink** — được xem như "phiếu bầu" của các website khác. Nếu on-page là "bạn tự nói mình giỏi", off-page là "người khác nói bạn giỏi".

**Mục lục**
1. [Backlink là gì & vì sao quan trọng](#1-backlink-là-gì--vì-sao-quan-trọng)
2. [Thuộc tính link: dofollow/nofollow/sponsored/ugc](#2-thuộc-tính-link-dofollow--nofollow--sponsored--ugc)
3. [Đánh giá chất lượng backlink](#3-đánh-giá-chất-lượng-backlink)
4. [Anchor text](#4-anchor-text)
5. [Chiến thuật xây backlink (cơ bản → nâng cao)](#5-chiến-thuật-xây-backlink)
6. [Local SEO & Google Business Profile](#6-local-seo--google-business-profile)
7. [Kiểm tra & disavow link xấu](#7-kiểm-tra--disavow-link-xấu--nâng-cao)
8. [Checklist](#8-checklist)

---

## 1. Backlink là gì & vì sao quan trọng

**Khái niệm.** *Backlink* (inbound link) là liên kết từ website **khác** trỏ về trang của bạn.

**Mục đích.** Backlink là một trong những **yếu tố xếp hạng mạnh nhất**. Mỗi link chất lượng truyền "sự tín nhiệm" (link equity / authority) và giúp Google khám phá trang. Nguyên tắc vàng: **chất lượng > số lượng**.

**Ví dụ.** 1 link từ báo `vnexpress.net` (uy tín cao, liên quan) giá trị hơn 100 link từ các blog rác, spam. Google từ lâu (thuật toán Penguin) đã **phạt** website mua link số lượng lớn kém chất lượng.

---

## 2. Thuộc tính link: dofollow / nofollow / sponsored / ugc

**Khái niệm.** Thuộc tính `rel` trên thẻ `<a>` cho Google biết bạn "bảo chứng" cho link đó tới mức nào.

| Thuộc tính | Ý nghĩa | Dùng khi |
|---|---|---|
| *(không có rel)* / **dofollow** | Truyền authority | Link tự nhiên, biên tập |
| `rel="nofollow"` | Không bảo chứng, thường không truyền | Link không tin tưởng hoàn toàn |
| `rel="sponsored"` | Link trả phí/quảng cáo | Bài booking, affiliate |
| `rel="ugc"` | User-generated (bình luận, forum) | Link do người dùng đăng |

**Mục đích.** Khai báo đúng để **tránh bị phạt** vì "link scheme" (mua link mà để dofollow). Một hồ sơ backlink tự nhiên có **cả** dofollow lẫn nofollow.

**Ví dụ:**

```html
<!-- Link quảng cáo/booking phải đánh dấu sponsored -->
<a href="https://xinhstore.vn/kem-chong-nang" rel="sponsored">Xem kem chống nắng</a>

<!-- Link trong bình luận blog -->
<a href="https://xinhstore.vn" rel="ugc nofollow">website của tôi</a>
```

---

## 3. Đánh giá chất lượng backlink

**Khái niệm.** Không phải link nào cũng như nhau. Đánh giá theo các tiêu chí:

| Tiêu chí | Link tốt | Link xấu |
|---|---|---|
| **Độ uy tín domain** (DR/DA*) | Cao (báo, site đầu ngành) | Thấp, PBN, site spam |
| **Liên quan chủ đề** | Cùng ngành (làm đẹp, sức khỏe) | Lạc đề (casino, cá độ) |
| **Vị trí link** | Trong nội dung chính (editorial) | Footer, sidebar, hàng loạt |
| **Lưu lượng thật** | Site có traffic thật | Site "chết", chỉ để bán link |
| **Tự nhiên** | Được đặt vì nội dung hay | Mua hàng loạt, trao đổi ồ ạt |

> *DR (Domain Rating - Ahrefs) và DA (Domain Authority - Moz) là chỉ số của **bên thứ ba**, KHÔNG phải của Google. Dùng để tham khảo tương đối, đừng thần thánh hóa.

**Mục đích.** Tập trung nguồn lực vào link **có giá trị thật**, tránh link độc hại kéo tụt hạng.

---

## 4. Anchor text

**Khái niệm.** *Anchor text* là phần chữ hiển thị của một backlink.

**Mục đích.** Anchor mô tả giúp Google hiểu trang đích nói về gì — nhưng **quá nhiều anchor trùng từ khóa chính xác** lại là dấu hiệu thao túng (over-optimization) → bị phạt.

**Các bước — giữ hồ sơ anchor tự nhiên, đa dạng:**

| Loại anchor | Ví dụ | Tỷ lệ nên có |
|---|---|---|
| Thương hiệu | "Xinh Store" | Cao (an toàn nhất) |
| URL trần | "xinhstore.vn" | Trung bình |
| Chung chung | "xem tại đây", "website này" | Trung bình |
| Từ khóa chính xác | "kem chống nắng cho da dầu" | **Thấp** (dùng dè dặt) |
| Từ khóa mở rộng | "các loại kem chống nắng của Xinh Store" | Thấp–trung bình |

**Ví dụ hồ sơ tự nhiên.** Nếu 80% backlink dùng đúng anchor "kem chống nắng cho da dầu" → rất bất thường. Hồ sơ tự nhiên chủ yếu là tên thương hiệu và anchor chung chung.

---

## 5. Chiến thuật xây backlink

### 🟢 Cơ bản (nền móng, an toàn)

**1. Foundational / citation links.** Tạo hồ sơ thương hiệu trên các nền tảng uy tín: Google Business Profile, Facebook, TikTok, LinkedIn, các sàn (Shopee/Lazada), trang niêm yết doanh nghiệp.
- *Mục đích*: xây nền tảng NAP nhất quán (mục 6), tín hiệu thương hiệu tồn tại thật.

**2. Internal PR đơn giản.** Gửi sản phẩm cho KOC/blogger nhỏ đổi lấy bài review có link.

### 🟡 Trung cấp

**3. Guest posting (đăng bài khách).**
- *Khái niệm*: viết bài chất lượng đăng trên blog/báo cùng ngành, kèm 1 link tự nhiên về site.
- *Các bước*: (1) tìm site cùng chủ đề nhận guest post; (2) pitch chủ đề hữu ích; (3) viết bài chất lượng; (4) chèn link ngữ cảnh, không nhồi.

**4. Broken link building.**
- *Khái niệm*: tìm link hỏng (404) trên site khác, gợi ý họ thay bằng link tới nội dung tương ứng của bạn.
- *Các bước*: dùng Ahrefs tìm trang 404 có nhiều link trỏ tới → tạo/đã có nội dung thay thế → email báo họ.

### 🔴 Nâng cao

**5. Digital PR & linkable assets.**
- *Khái niệm*: tạo "tài sản đáng link" (khảo sát, số liệu ngành, infographic, công cụ miễn phí) rồi PR tới báo chí → nhận link tự nhiên số lượng lớn từ nguồn uy tín.
- *Ví dụ*: Xinh Store làm **"Báo cáo thói quen chống nắng của phụ nữ Việt 2025"** với số liệu khảo sát → báo sức khỏe/làm đẹp trích dẫn và link về.

**6. Skyscraper technique.**
- *Khái niệm*: tìm nội dung đang được link nhiều → tạo phiên bản **tốt hơn hẳn** → liên hệ những site đang link bản cũ.

**Ví dụ — email outreach (broken link / skyscraper):**

```text
Tiêu đề: Link hỏng trong bài "Cách chống nắng mùa hè" của bạn

Chào chị Lan,

Em đang đọc bài "Cách chống nắng mùa hè" rất hữu ích trên website của chị.
Em có thấy ở đoạn nói về chỉ số SPF, link tới trang giải thích SPF đang bị lỗi 404.

Bên em vừa có một bài chi tiết về cách đọc chỉ số SPF/PA, có thể thay thế phù hợp:
https://xinhstore.vn/blog/spf-pa-la-gi

Hy vọng giúp ích cho bạn đọc của chị. Cảm ơn chị!
```

---

## 6. Local SEO & Google Business Profile

**Khái niệm.** *Local SEO* tối ưu để hiện trong kết quả **địa phương** (Local Pack + bản đồ) khi user tìm "gần đây". Trung tâm là **Google Business Profile (GBP)** — hồ sơ doanh nghiệp trên Google Maps/Search.

**Mục đích.** Kéo khách ở gần đến cửa hàng/website; cực quan trọng với doanh nghiệp có địa điểm vật lý.

**Các bước:**
1. Tạo & **xác minh** Google Business Profile.
2. Điền đủ: tên, danh mục, giờ mở cửa, ảnh, sản phẩm/dịch vụ.
3. Đảm bảo **NAP nhất quán** — *Name, Address, Phone* giống hệt nhau trên GBP, website, và mọi nơi niêm yết.
4. Thu thập & **trả lời đánh giá** (review) đều đặn.
5. Xây **local citations** (niêm yết trên foody, danh bạ ngành...).
6. Chèn schema `LocalBusiness` trên trang liên hệ.

**Ví dụ — NAP nhất quán:**

```
Name:    Xinh Store
Address: 123 Nguyễn Trãi, P.7, Quận 5, TP.HCM
Phone:   (028) 1234 5678
```
> Sai lệch nhỏ (ghi "Q.5" nơi này, "Quận 5" nơi khác) cũng làm giảm độ tin cậy local.

---

## 7. Kiểm tra & disavow link xấu 🔴 nâng cao

**Khái niệm.** *Disavow* = báo Google "đừng tính các link này khi đánh giá site tôi". Dùng khi bị **backlink độc hại** (negative SEO, tàn dư mua link cũ) trỏ tới.

**Mục đích.** Bảo vệ site khỏi bị vạ lây/phạt vì hồ sơ link bẩn.

> ⚠️ Google nói phần lớn site **không cần** disavow (thuật toán tự bỏ qua link rác). Chỉ dùng khi có **link xấu số lượng lớn có chủ đích** hoặc đã dính manual action.

**Các bước:**
1. Xuất toàn bộ backlink (Search Console → Links, hoặc Ahrefs).
2. Lọc ra link độc hại (spam, lạc đề, PBN).
3. Ưu tiên **liên hệ gỡ** link trước.
4. Với link không gỡ được → lập file `disavow.txt` → upload tại [Disavow Tool](https://search.google.com/search-console/disavow-links).

**Ví dụ — file `disavow.txt`:**

```text
# Các link spam đã liên hệ gỡ nhưng không được (2025-01-20)
https://spam-blog-abc.xyz/bai-viet-rac
https://link-farm-123.top/page

# Chặn toàn bộ domain xấu
domain:pbn-mua-link.net
domain:casino-spam.info
```

---

## 8. Checklist

- [ ] Đã lập hồ sơ nền tảng (GBP, mạng xã hội, sàn) với NAP nhất quán
- [ ] Hiểu & khai đúng `sponsored`/`ugc`/`nofollow` cho link trả phí/bình luận
- [ ] Ưu tiên backlink **liên quan + uy tín**, không mua link số lượng
- [ ] Hồ sơ anchor text đa dạng, không lạm dụng exact-match
- [ ] Có ít nhất 1 chiến thuật chủ động (guest post / broken link / digital PR)
- [ ] Google Business Profile đã xác minh, có review & trả lời
- [ ] Đã rà backlink độc hại; chỉ disavow khi thật sự cần

➡️ Tiếp theo: [`05_seo_nang_cao.md`](./05_seo_nang_cao.md) — E-E-A-T, Core Web Vitals, SEO ngữ nghĩa.
