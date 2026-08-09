# 01 — Nghiên cứu từ khóa (Keyword Research) 🟢

> Nền móng của mọi chiến dịch. Sai từ khóa = tối ưu đúng kỹ thuật nhưng sai đối tượng → phí công.

**Mục lục**
1. [Từ khóa & ý định tìm kiếm là gì](#1-từ-khóa--ý-định-tìm-kiếm)
2. [Tìm từ khóa hạt giống (seed)](#2-tìm-từ-khóa-hạt-giống-seed)
3. [Mở rộng & lấy số liệu](#3-mở-rộng--lấy-số-liệu-từ-khóa)
4. [Các chỉ số cần đọc](#4-các-chỉ-số-cần-đọc)
5. [Long-tail & phân loại theo intent](#5-long-tail--phân-loại-theo-intent)
6. [Lập bản đồ từ khóa (keyword mapping)](#6-lập-bản-đồ-từ-khóa-keyword-mapping--nâng-cao)
7. [Phân tích khoảng trống đối thủ](#7-phân-tích-khoảng-trống-đối-thủ--nâng-cao)
8. [Checklist](#8-checklist)

---

## 1. Từ khóa & ý định tìm kiếm

**Khái niệm.** *Từ khóa* là cụm từ người dùng gõ vào Google. *Ý định tìm kiếm (search intent)* là **mục đích thực sự** đằng sau cụm từ đó. Google xếp hạng theo intent, không theo mặt chữ.

**4 loại intent:**

| Intent | Người dùng muốn | Ví dụ truy vấn | Loại trang nên làm |
|---|---|---|---|
| **Informational** | Tìm hiểu, học | "cách chọn kem chống nắng" | Blog, hướng dẫn |
| **Navigational** | Đi tới 1 thương hiệu/trang | "xinh store kem chống nắng" | Trang thương hiệu |
| **Commercial** | So sánh trước khi mua | "kem chống nắng loại nào tốt" | Bài review, so sánh |
| **Transactional** | Mua ngay | "mua kem chống nắng anessa" | Trang sản phẩm/danh mục |

**Mục đích.** Chọn đúng intent để chọn đúng **loại nội dung** và **loại trang** — đây là yếu tố quyết định trang có lên top được không.

**Ví dụ.** Với từ khóa `serum vitamin C`, gõ thử lên Google: nếu top 10 toàn là bài "top 10 serum vitamin C tốt nhất" → intent là **commercial**, bạn phải làm bài review/so sánh chứ không phải nhét vào trang bán 1 sản phẩm.

---

## 2. Tìm từ khóa hạt giống (seed)

**Khái niệm.** *Seed keyword* là từ khóa gốc, ngắn, mô tả sản phẩm/chủ đề chính. Từ đây mới "nở" ra hàng trăm từ khóa con.

**Mục đích.** Có điểm xuất phát để mở rộng.

**Các bước:**
1. Liệt kê sản phẩm/dịch vụ cốt lõi: `kem chống nắng`, `serum vitamin C`, `sữa rửa mặt`...
2. Nghĩ như khách hàng: họ gọi sản phẩm bằng từ gì? (VD dân gian gọi "kem chống nắng" nhưng cũng có "kem chống nắng vật lý", "sunscreen").
3. Khai thác nguồn gợi ý **miễn phí**:
   - **Google Autocomplete**: gõ "kem chống nắng " và xem gợi ý tự động.
   - **People Also Ask (PAA)**: hộp "Mọi người cũng hỏi" trên SERP.
   - **Related searches**: "Tìm kiếm liên quan" cuối trang kết quả.
   - **Google Trends**: so sánh xu hướng, tính mùa vụ.

**Ví dụ — khai thác Autocomplete:**

```
Gõ: "kem chống nắng"
Google gợi ý:
  ├─ kem chống nắng cho da dầu
  ├─ kem chống nắng cho da mụn
  ├─ kem chống nắng anessa
  ├─ kem chống nắng vật lý hay hóa học
  └─ kem chống nắng loại nào tốt
→ Mỗi gợi ý là một từ khóa tiềm năng (và lộ luôn intent).
```

---

## 3. Mở rộng & lấy số liệu từ khóa

**Khái niệm.** Dùng công cụ để biến seed thành **danh sách lớn** kèm số liệu (volume, độ khó).

**Các bước với Google Keyword Planner (miễn phí, cần tài khoản Google Ads):**
1. Vào **Google Ads → Tools → Keyword Planner → Discover new keywords**.
2. Nhập seed: `kem chống nắng`, `serum vitamin c`.
3. Đặt quốc gia = Vietnam, ngôn ngữ = Tiếng Việt.
4. Xuất danh sách → xem cột *Avg. monthly searches* và *Competition*.
5. Export CSV để xử lý tiếp.

> ⚠️ Keyword Planner gộp volume thành khoảng (VD "1K–10K") nếu tài khoản chưa chạy Ads. Muốn số chính xác + độ khó → dùng Ahrefs/Semrush.

**Ví dụ output (rút gọn):**

| Từ khóa | Volume/tháng | Cạnh tranh |
|---|---|---|
| kem chống nắng | 90.500 | Cao |
| kem chống nắng cho da dầu | 8.100 | Trung bình |
| kem chống nắng cho da mụn nhạy cảm | 1.300 | Thấp |
| serum vitamin c là gì | 2.400 | Thấp |

---

## 4. Các chỉ số cần đọc

| Chỉ số | Ý nghĩa | Lưu ý khi chọn |
|---|---|---|
| **Search Volume** | Lượt tìm/tháng | Cao = nhiều traffic nhưng cạnh tranh gắt |
| **Keyword Difficulty (KD)** | Độ khó lên top (0–100, của Ahrefs/Semrush) | Site mới nên nhắm KD thấp (< 30) |
| **CPC** | Giá thầu trung bình nếu chạy Ads | CPC cao ⇒ từ khóa "ra tiền", đáng làm |
| **Intent** | Mục đích tìm | Ưu tiên transactional/commercial khi cần đơn hàng |
| **Trend** | Xu hướng theo thời gian | Tránh từ đang thoái trào; đón mùa vụ |

**Nguyên tắc chọn cho site mới:** ưu tiên ô **"volume vừa phải + KD thấp + intent rõ"**. Đây là các từ dễ "hái quả thấp" (low-hanging fruit) trước khi đấu từ khó.

---

## 5. Long-tail & phân loại theo intent

**Khái niệm.** *Long-tail keyword* là cụm từ dài (3+ từ), cụ thể, volume nhỏ nhưng **tỷ lệ chuyển đổi cao** và **dễ lên top**.

```
        Volume cao, cạnh tranh gắt, intent mơ hồ
   ▲    "kem chống nắng"              (head — 90.500)
   │    "kem chống nắng cho da dầu"   (body  — 8.100)
   │    "kem chống nắng cho da dầu mụn không gây bít lỗ chân lông"
   ▼                                   (long-tail — 210, mua ngay!)
        Volume thấp, dễ top, intent rõ, chuyển đổi cao
```

**Mục đích.** Site mới nên bắt đầu từ long-tail để có traffic & đơn hàng sớm, tích lũy uy tín rồi mới leo lên head keyword.

**Ví dụ.** Thay vì cố top `serum vitamin c` (KD 70), Xinh Store viết bài nhắm `serum vitamin c cho da nhạy cảm loại nào tốt` (KD 15) — dễ top hơn nhiều và người tìm đã sẵn sàng mua.

---

## 6. Lập bản đồ từ khóa (Keyword Mapping) 🔴 nâng cao

**Khái niệm.** *Keyword mapping* = gán **mỗi cụm từ khóa cho đúng 1 URL**, đảm bảo không có 2 trang cùng nhắm 1 từ (tránh **keyword cannibalization** — tự ăn thịt nhau).

**Mục đích.** Tránh việc Google phân vân giữa 2 trang của bạn → chia nhỏ sức mạnh → không trang nào lên top.

**Các bước:**
1. Gom danh sách từ khóa thành **cụm chủ đề** (cùng intent, cùng nghĩa).
2. Mỗi cụm → 1 URL đích.
3. Đặt 1 *từ khóa chính (primary)* + vài *từ khóa phụ (secondary)* cho mỗi URL.
4. Lưu vào bảng để dùng khi viết title/heading/content.

**Ví dụ — bảng keyword map của Xinh Store:**

| URL | Từ khóa chính | Từ khóa phụ | Intent | Loại trang |
|---|---|---|---|---|
| `/kem-chong-nang` | kem chống nắng | kem chống nắng chính hãng | Transactional | Danh mục |
| `/kem-chong-nang-da-dau` | kem chống nắng cho da dầu | kcn cho da dầu mụn | Transactional | Danh mục con |
| `/blog/cach-chon-kem-chong-nang` | cách chọn kem chống nắng | chọn kcn theo loại da | Informational | Blog |
| `/blog/review-serum-vitamin-c` | serum vitamin c loại nào tốt | top serum vitamin c | Commercial | Blog review |

---

## 7. Phân tích khoảng trống đối thủ 🔴 nâng cao

**Khái niệm.** *Content/Keyword Gap Analysis* = tìm từ khóa mà **đối thủ đang top còn bạn thì chưa** có trang nào.

**Mục đích.** "Đi tắt" — biết chính xác cần tạo nội dung gì để cạnh tranh.

**Các bước (dùng Ahrefs/Semrush):**
1. Mở tính năng **Content Gap** (Ahrefs) / **Keyword Gap** (Semrush).
2. Nhập domain của bạn + 2–3 đối thủ (VD `hasaki.vn`, `guardian.com.vn`).
3. Lọc "từ khóa đối thủ có top 10 mà bạn không có".
4. Sắp theo volume × intent → chọn từ đáng làm → thêm vào keyword map.

**Ví dụ.** Phát hiện đối thủ top cho `kem chống nắng nâng tông cho da ngăm` (volume 1.900, KD 12) mà Xinh Store chưa có bài → tạo ngay bài viết + gắn link tới trang sản phẩm liên quan.

---

## 8. Checklist

- [ ] Đã liệt kê seed keyword cho mọi sản phẩm/dịch vụ chính
- [ ] Đã mở rộng bằng Autocomplete + PAA + công cụ
- [ ] Mỗi từ khóa đã xác định **intent**
- [ ] Đã có bảng **keyword map** (1 từ chính ↔ 1 URL), không cannibalization
- [ ] Đã ưu tiên long-tail dễ top cho giai đoạn đầu
- [ ] Đã chạy gap analysis với ít nhất 2 đối thủ

➡️ Tiếp theo: [`02_seo_onpage.md`](./02_seo_onpage.md) — biến từ khóa thành trang tối ưu.
