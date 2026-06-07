# 138 — Browser-Use AI

> AI agent điều khiển trình duyệt web bằng ngôn ngữ tự nhiên.
> Repo gốc: https://github.com/browser-use/browser-use

## 1. Browser-Use là gì?

**Browser-use** là một thư viện Python mã nguồn mở giúp **kết nối một LLM (Claude, Gemini, GPT...) với một trình duyệt thật** (Chromium qua Playwright).

Thay vì bạn phải viết code Playwright/Selenium chi tiết (`click selector này`, `gõ vào input kia`), bạn chỉ cần **mô tả nhiệm vụ bằng tiếng người**:

> "Vào google.com, tìm 'browser-use github', mở kết quả đầu tiên và cho tôi biết repo có bao nhiêu sao."

Agent sẽ tự:
1. **Nhìn** trang web (đọc DOM + ảnh chụp màn hình).
2. **Suy nghĩ** bước tiếp theo (LLM quyết định).
3. **Hành động** (click, gõ phím, cuộn, mở tab, điền form...).
4. Lặp lại cho đến khi xong nhiệm vụ rồi trả kết quả.

### So sánh nhanh

| | Playwright/Selenium thuần | Browser-use |
|---|---|---|
| Cách ra lệnh | Code selector cụ thể | Mô tả bằng ngôn ngữ tự nhiên |
| Khi web đổi giao diện | Code gãy, phải sửa selector | Agent tự thích nghi |
| Phù hợp | Test tự động ổn định, lặp lại | Tác vụ linh hoạt, scraping, RPA, research |
| Chi phí | Miễn phí | Tốn token LLM mỗi bước |

### Dùng để làm gì?
- Scraping / trích xuất dữ liệu có cấu trúc từ web.
- Tự động điền form, đặt hàng, đăng nhập (RPA).
- Research: gom thông tin từ nhiều trang.
- So sánh giá, theo dõi sản phẩm.

---

## 2. Yêu cầu

- **Python >= 3.11** (bắt buộc). Máy bạn hiện **chưa cài Python thật** (chỉ có alias Microsoft Store).
  Tải tại https://www.python.org/downloads/ → khi cài nhớ tick **"Add python.exe to PATH"**.
- Một **API key của LLM**. Có nhiều lựa chọn:
  - `ANTHROPIC_API_KEY` — dùng Claude (ví dụ trong project này).
  - `GOOGLE_API_KEY` — dùng Gemini.
  - `BROWSER_USE_API_KEY` — dùng model `ChatBrowserUse` tối ưu sẵn của họ.

---

## 3. Cài đặt

### Cách A — pip + venv (đơn giản, quen thuộc)

```powershell
# Trong thư mục này
python -m venv .venv
.\.venv\Scripts\Activate.ps1      # PowerShell

pip install -r requirements.txt
playwright install chromium        # tải trình duyệt Chromium cho Playwright
```

### Cách B — uv (cách repo gốc khuyên dùng, nhanh hơn)

```powershell
uv init
uv add browser-use
uv sync
uvx browser-use install            # cài Chromium
```

---

## 4. Cấu hình API key

Copy `.env.example` thành `.env` rồi điền key thật:

```powershell
Copy-Item .env.example .env
notepad .env
```

```
ANTHROPIC_API_KEY=sk-ant-...
```

> ⚠️ File `.env` đã được `.gitignore` — đừng commit key lên git.

---

## 5. Chạy ví dụ

Đọc/chạy theo thứ tự từ cơ bản đến nâng cao:

```powershell
python 01_basic_search.py      # tìm kiếm cơ bản, in kết quả
python 02_extract_data.py      # trích xuất dữ liệu CÓ CẤU TRÚC (Pydantic)
python 03_form_fill.py         # điền & submit form tự động

.\.venv\Scripts\python.exe 02_extract_data.py    # trích xuất JSON từ Hacker News
.\.venv\Scripts\python.exe 03_form_fill.py       # tự đăng nhập form demo

```

| File | Demo |
|---|---|
| `01_basic_search.py` | Agent tối thiểu: giao 1 task, để nó tự làm và trả lời. |
| `02_extract_data.py` | Ép agent trả về JSON đúng schema (Pydantic `output_model`). |
| `03_form_fill.py` | Agent điền form nhiều bước trên trang demo. |
| `04_google_tasks_to_sheet.py` | **Thực chiến**: đọc list "Work" trên Google Tasks → viết gọn → ghi vào Google Sheets DSM (dòng "Nguyễn Minh Hiếu"). |

---

## 5b. Script thực chiến: Google Tasks → Google Sheets (`04_*.py`)

**Công cụ**: `browser-use` (khung agent) + Chromium/Playwright (điều khiển trình duyệt) + `ChatGoogle`/Gemini (bộ não).

**Đăng nhập Google** — Google chặn login trên trình duyệt bị điều khiển, nên có 2 cách (script hỗ trợ cả hai):

| Cách | Khi nào | Cách dùng |
|---|---|---|
| **A — CDP** (khuyên dùng) | Ổn định nhất, dùng Chrome thật đã đăng nhập | Mở Chrome với cổng debug rồi set `CDP_URL` |
| **B — Profile bền vững** | Không muốn động tới Chrome chính | Để trống `CDP_URL`, đăng nhập tay lần đầu |

**Cách A (CDP):**
```powershell
# 1) Đóng hết Chrome, rồi mở Chrome với cổng debug (đăng nhập Google trong cửa sổ này lần đầu)
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\chrome-debug"

# 2) Cửa sổ khác: trỏ script vào Chrome đó rồi chạy
$env:CDP_URL = "http://localhost:9222"
.\.venv\Scripts\python.exe 04_google_tasks_to_sheet.py
```

**Cách B (profile bền vững):**
```powershell
.\.venv\Scripts\python.exe 04_google_tasks_to_sheet.py
# Lần đầu: cửa sổ Chromium mở ra → đăng nhập Google bằng tay → quay lại terminal nhấn ENTER.
# Các lần sau: phiên đã lưu trong ~/.browseruse_google_profile, không cần đăng nhập lại.
```

> ⚠️ Script này **ghi vào Google Sheet công việc thật**. Nên chạy thử/đọc kỹ trước; mỗi bước đều log và kiểm tra điều kiện thành công trước khi sang bước sau.

---

## 6. Lưu ý / Mẹo

- Mỗi bước agent gọi LLM ⇒ **tốn token**. Đặt `task` rõ ràng, giới hạn `max_steps` để khỏi tốn.
- Thêm `headless=False` (mặc định của `Browser()`) để **xem trình duyệt chạy live** — rất dễ debug.
- Agent không hoàn hảo: với web phức tạp / có captcha, nó có thể đi sai. Hãy mô tả task càng cụ thể càng tốt.
- Đừng dùng để vượt rào bảo mật, spam, hay vi phạm điều khoản của website.
