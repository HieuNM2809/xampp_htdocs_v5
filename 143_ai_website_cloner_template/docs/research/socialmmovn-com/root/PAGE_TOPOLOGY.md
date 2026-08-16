# socialmmovn.com — Bản đồ trang chủ (recon)

> Site-key: `socialmmovn` · Page-key: `root` · URL: <https://socialmmovn.com/>
> Trạng thái: **Phase 1–2 xong** (recon + mirror toàn bộ asset). Phase 3–4 (port React) chưa làm.

## Tech stack (phát hiện)
- **WordPress 6.9.7** + **WooCommerce 10.7.0** (thương mại điện tử) + Site Kit by Google.
- Theme **Flatsome** (dựng bằng UX Builder — trang `page-id-557`, template `page-blank`).
- Server LiteSpeed + **Cloudflare** CDN, host **Hostinger** (hpanel), PHP 8.1.34.
- CSS/JS được **LiteSpeed gộp** thành 1 file mỗi loại.
- Thư viện: **jQuery**, **Swiper 11** (slider), gtag (GA4), Cloudflare email-decode.
- Song ngữ **VN/EN** (footer + payment render 2 lần, đổi theo "Ngôn ngữ").

## Nội dung / thương hiệu
- **SocialMMO** — "Nền Tảng MMO: Mua Nhanh – Bán Dễ – Giao Dịch An Toàn".
- Bán dịch vụ/tài khoản social (MMO). Có login/register, "Check scam", chat.

## Bố cục section (trên → dưới)
| # | Section | Vai trò |
|---|---|---|
| 0 | `header#header.has-sticky` | Top-bar (contact + nút) & nav chính (sticky) |
| 1 | `section_300865001` | Banner/notice đầu trang |
| 2 | `.smm-hero-slider-section` | **Hero slider** (Swiper) |
| 3 | `.section-hot` (`section_884181272`) | **"Sản Phẩm Hot"** — lưới sản phẩm WooCommerce |
| 4 | `section_1681107667` | Khối nội dung (bảng xếp hạng / danh mục) |
| 5 | `section_1323686709` | Khối nội dung |
| 6 | `.featured-seller-section` | Người bán nổi bật |
| 7 | `.payment-section` + `.payment-logos-section` | Thanh toán + logo cổng thanh toán |
| 8 | `.footer-socialmmo` | Footer (Giới Thiệu / Chính Sách / Hỗ Trợ) |
| 8b | (bản EN lặp lại: `section_306675856`, footer `1372244261`) | Phiên bản tiếng Anh |
| 9 | Modal Đăng nhập / Đăng ký | Popup auth |

## Menu điều hướng
- VN: Trang Chủ · Giới Thiệu · TẤT CẢ SẢN PHẨM · Chia Sẻ (99+) · FAQs · Chính Sách Mua Hàng · Liên Hệ
- EN: About · Our Stores · Blog · Contact · FAQ
- Tiện ích: Ngôn ngữ · Đăng nhập · Check scam

## Asset đã mirror (Phase 2)
- **192/206** asset tải được (26 MB) → `public/sites/socialmmovn/assets/<host>/<path>`
  - ~97 ảnh `socialmmovn.com/wp-content/uploads/` (2026/01–05)
  - Swiper 11 css/js (jsdelivr), CSS gộp Flatsome (`style.local.css` đã rewrite url())
  - Vài ảnh hotlink: shortpixel/hanoidep, cellphones, vdrive, antimatter (avatar/testimonial)
- **14 "lỗi"** đều là rác regex bắt nhầm (meta `content="WordPress 6.9.7"`, email-decode của Cloudflare, `xmlrpc.php`, 1 avatar `nsl_avatars` đã 404) — **không phải asset thật**. Xem `MIRROR_MANIFEST.json`.

## Xem thử bản snapshot tĩnh
`public/sites/socialmmovn/index.html` là HTML đã localize (mọi asset trỏ về bản local).
Vì nằm trong `public/` (Next.js phục vụ ở web-root):
```bash
npm install && npm run dev
# mở http://localhost:3000/sites/socialmmovn/index.html
```
> Đây là **ảnh chụp tĩnh trung thực** (HTML + CSS + JS + ảnh gốc), CHƯA phải bản port React
> của template. Analytics/gtag của bên thứ ba sẽ không chạy offline (vô hại).

## Giới hạn (fidelity)
Session **không có browser MCP** → không chụp được screenshot / đọc `getComputedStyle()` /
quét tương tác động như quy trình chuẩn của skill. Với WooCommerce, các phần **động**
(giá, tồn kho, giỏ hàng, kết quả tìm kiếm, nội dung đăng nhập) là server-side nên bản mirror
tĩnh chỉ giữ được trạng thái tại thời điểm tải.
