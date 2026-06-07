# So sánh: "Claude điều khiển trình duyệt" vs **browser-use**

> Câu hỏi thường gặp: *"Claude đã tự điều khiển được trình duyệt rồi, vậy browser-use khác gì?"*
>
> **Trả lời ngắn:** Chúng ở **hai tầng khác nhau**. browser-use **không thay thế** Claude — nó *thuê* Claude (hoặc LLM khác) làm "bộ não". Một bên là **sản phẩm**, một bên là **khung lập trình (framework)**.

---

## 1. Hai thứ này thật ra là gì?

### A. "Claude điều khiển trình duyệt"
Đây không phải một thứ duy nhất, mà là vài **sản phẩm/tính năng của Anthropic**:

| Dạng | Mô tả |
|---|---|
| **Computer Use** (API) | Claude nhìn **ảnh chụp màn hình** của cả máy/VM rồi trả về hành động (click toạ độ X-Y, gõ phím). Tổng quát: làm được cả app desktop, không chỉ web. |
| **Claude for Chrome** | Extension trình duyệt, Claude thao tác ngay trên tab bạn đang mở. |
| **Claude Code + Playwright MCP** | Trợ lý code gọi tool điều khiển trình duyệt trong lúc làm việc. |

Điểm chung: **Anthropic dựng sẵn vòng lặp agent**, bạn chỉ việc ra lệnh bằng hội thoại. Bộ não **bắt buộc là Claude**.

### B. browser-use
Một **thư viện mã nguồn mở** (Python, và bản port TypeScript) mà **bạn tự cài vào code của mình**. Nó cung cấp sẵn: vòng lặp *nhìn → nghĩ → hành động*, cách bóc tách trang web, bộ hành động (click/type/scroll/tab...).

Điểm khác cốt lõi: **bạn cắm LLM nào cũng được** (Claude, GPT, Gemini, Llama local...) và **bạn kiểm soát toàn bộ bằng code**.

---

## 2. Bảng so sánh

| Tiêu chí | "Claude điều khiển trình duyệt" | **browser-use** |
|---|---|---|
| **Bản chất** | Sản phẩm / tính năng đóng gói | Thư viện mã nguồn mở bạn tự chạy |
| **Bộ não (LLM)** | Bắt buộc Claude | Bất kỳ: Claude, GPT, Gemini, Groq, Ollama (local)... |
| **Ai giữ vòng lặp agent** | Anthropic lo sẵn | Bạn — trong code của bạn |
| **Cách "nhìn" trang** | Chủ yếu **ảnh** → click theo toạ độ pixel | **DOM / cây accessibility** (đánh số element) + ảnh khi cần |
| **Độ chính xác khi click** | Đoán toạ độ → dễ trượt | Chọn theo ID element → chính xác |
| **Tốc độ & chi phí token** | Nặng hơn (gửi ảnh mỗi bước) | Nhẹ hơn (gửi text DOM rút gọn) |
| **Phạm vi** | Cả màn hình / app desktop | Tập trung **web** |
| **Tích hợp lập trình** | Khó nhúng vào pipeline | Gọi trong script, chạy headless, lên cron, lặp N lần |
| **Đầu ra** | Hội thoại, làm hộ tại chỗ | **Dữ liệu có cấu trúc (JSON)**, kết quả máy đọc được |
| **Tuỳ biến hành động** | Hạn chế | Tự định nghĩa action/function riêng |
| **Mã nguồn / kiểm soát** | Đóng, do Anthropic vận hành | Mở, tự host, sửa được |
| **Chi phí** | Theo gói/API của Anthropic | Miễn phí thư viện, chỉ trả token LLM bạn chọn |

---

## 3. Khác biệt kỹ thuật quan trọng nhất: **cách "nhìn" trang**

```
Computer Use (Claude thuần)          browser-use
────────────────────────────         ─────────────────────────────
   📸 Ảnh chụp màn hình                 🌳 Bóc DOM / accessibility tree
        │                                     │
   "Nút Login ở đâu?"                   Gắn số: [12] <button>Login</button>
        │                                     │
   Đoán toạ độ (x=540, y=320)          "Click element số 12"
        │                                     │
   ❗ Dễ trượt, tốn token ảnh           ✅ Chính xác, ít token, nhanh
   ✅ Làm được cả app desktop          ❗ Chỉ cho web
```

- **Computer Use**: nhìn bằng *mắt* (ảnh) → vạn năng nhưng tốn kém, chậm, dễ sai toạ độ.
- **browser-use**: đọc *cấu trúc* trang → chuyên web nên nhanh/rẻ/chính xác hơn.

---

## 4. Quan trọng: chúng **bổ trợ**, không đối đầu

browser-use **có thể dùng chính Claude** làm bộ não:

```ts
import { Agent } from 'browser-use';
import { ChatAnthropic } from 'browser-use/llm/anthropic';

const agent = new Agent({
  task: 'Vào hasaki.vn, tìm giá sữa rửa mặt CeraVe',
  llm: new ChatAnthropic({ model: 'claude-sonnet-4-6' }), // 👈 thuê Claude
});
await agent.run();
```

→ Đây là **browser-use (khung) + Claude (não)** hoạt động chung. Bạn vừa có sự thông minh của Claude, vừa có khả năng lập trình/tự động hoá của browser-use.

---

## 5. Khi nào dùng cái nào?

| Tình huống | Nên dùng |
|---|---|
| Làm nhanh 1 việc lẻ ngay bây giờ, không lặp lại | **Claude / Claude Code** điều khiển trực tiếp |
| Cần thao tác cả app desktop (không chỉ web) | **Computer Use** |
| Tự động hoá lặp lại, scraping hàng loạt | **browser-use** |
| Nhúng agent web vào ứng dụng/hệ thống của bạn | **browser-use** |
| Muốn chọn LLM rẻ hơn / chạy local (Ollama) | **browser-use** |
| Cần đầu ra JSON có cấu trúc để xử lý tiếp | **browser-use** |
| Cần kiểm soát từng bước, custom action | **browser-use** |

---

## 6. Tóm tắt một câu

> **"Claude điều khiển trình duyệt"** là một *trợ lý làm hộ*.
> **browser-use** là một *khung để bạn tự xây con robot web của riêng mình* — và bạn có thể cắm chính Claude vào làm bộ não.
