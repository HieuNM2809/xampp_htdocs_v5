# 📄 MarkItDown to Markdown — Demo thực tế (Python)

Ví dụ tích hợp [Microsoft MarkItDown](https://github.com/microsoft/markitdown) để chuyển nhiều định dạng tài liệu (PDF, DOCX, PPTX, XLSX, HTML, CSV, JSON, ảnh, audio, YouTube...) sang **Markdown** — phục vụ feed dữ liệu cho LLM, xây knowledge base, tóm tắt nội dung.

> MarkItDown là package Python **chính chủ Microsoft**, không có bản Node.js. Repo này dùng đúng package gốc.

## 🎯 Mục tiêu demo

| Bước | File | Use case thực tế | Độ khó |
|------|------|------------------|--------|
| 1 | `01_basic_convert.py` | Chuyển 1 file lẻ qua CLI | ⭐ |
| 2 | `02_batch_convert.py` | Số hoá cả thư mục tài liệu (RAG ingest) | ⭐⭐ |
| 3 | `03_url_convert.py`  | Crawl URL + transcript YouTube | ⭐⭐ |
| 4 | `04_fastapi_server.py` | HTTP service nội bộ dùng chung | ⭐⭐⭐ |

---

## 🔧 Cài đặt

> Yêu cầu: **Python 3.10+** (MarkItDown bắt buộc).
>
> Máy chưa có Python? Cài qua winget (user-scope, không cần admin):
> ```powershell
> winget install Python.Python.3.12
> ```
> Mở terminal mới sau khi cài để PATH cập nhật.

### Trên Windows (PowerShell)

```powershell
cd E:\xampp_htdocs_v5\137_markitdown_to_markdown

python -m venv .venv
.\.venv\Scripts\Activate.ps1

pip install -r requirements.txt
```

> 💡 Nếu PowerShell chặn script activate, mở quyền tạm thời:
> `Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned`

### Trên Linux / macOS

```bash
cd 137_markitdown_to_markdown
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

---

## ▶️ Chạy thử từng ví dụ

### Ví dụ 1 — Convert 1 file

```powershell
python 01_basic_convert.py samples\sample.html
python 01_basic_convert.py samples\sample.csv
python 01_basic_convert.py samples\sample.json -o output\q1.md
```

### Ví dụ 2 — Batch convert cả thư mục

```powershell
python 02_batch_convert.py samples
python 02_batch_convert.py samples --pattern "*.csv"
python 02_batch_convert.py samples -o output\batch
```

### Ví dụ 3 — Convert URL / YouTube

```powershell
python 03_url_convert.py https://en.wikipedia.org/wiki/Markdown
python 03_url_convert.py https://www.youtube.com/watch?v=jNQXAC9IVRw
```

### Ví dụ 4 — HTTP service (FastAPI)

```powershell
python -m uvicorn 04_fastapi_server:app --reload --port 8137
```

Terminal khác:

```powershell
curl.exe -X POST http://localhost:8137/convert -F "file=@samples\sample.html"
curl.exe -X POST http://localhost:8137/convert-url -d "url=https://en.wikipedia.org/wiki/Markdown"
curl.exe http://localhost:8137/
```

Swagger UI auto-generated: <http://localhost:8137/docs>

---

## 🧪 Cách kiểm tra kết quả

1. **So sánh trực quan**: mở `samples\sample.html` trong browser, so với `output\sample.html.md` trong VS Code Markdown Preview (`Ctrl+Shift+V`) — phải thấy:
   - `# Báo cáo doanh thu Q1/2026` (h1)
   - Bảng Markdown `Kênh | Doanh thu | Tăng trưởng`
   - Danh sách bullet `- ...`
   - Blockquote `> "Quý 1 là minh chứng..."`

2. **Stats từ script**: mỗi script in `[OK] input -> output` + số ký tự/dòng/tiêu đề.

3. **Test batch**: chạy `02_batch_convert.py samples` rồi `dir output` — có 3 file `.md`.

4. **Test HTTP service**:
   ```powershell
   $resp = curl.exe -X POST http://localhost:8137/convert -F "file=@samples\sample.csv"
   $resp  # Markdown table của CSV
   ```

---

## 📋 CLI gốc của MarkItDown

Ngoài Python API, MarkItDown cài kèm CLI:

```powershell
markitdown samples\sample.html > output\via-cli.md
markitdown samples\sample.csv -o output\via-cli.md
```

---

## 🗂️ Cấu trúc

```
137_markitdown_to_markdown/
├── README.md
├── requirements.txt           # markitdown[all] + fastapi + uvicorn
├── .gitignore
├── samples/
│   ├── sample.html
│   ├── sample.csv
│   └── sample.json
├── output/                    # gitignore
│   └── .gitkeep
├── 01_basic_convert.py
├── 02_batch_convert.py
├── 03_url_convert.py
└── 04_fastapi_server.py
```

---

## 🔍 Định dạng MarkItDown hỗ trợ

| Nhóm | Định dạng |
|------|-----------|
| Office | `.docx`, `.pptx`, `.xlsx`, `.xls`, `.doc`, `.ppt` |
| PDF | `.pdf` |
| Web | `.html`, `.htm`, URL bất kỳ |
| Data | `.csv`, `.json`, `.xml`, `.txt`, `.md` |
| Ảnh | `.png`, `.jpg`, `.jpeg`, `.gif`, `.bmp` (EXIF + OCR khi nối LLM) |
| Audio | `.mp3`, `.wav`, `.m4a` (transcription) |
| Khác | `.zip`, `.epub`, `.msg` (Outlook), YouTube URL |

> Image OCR / audio transcription cần thêm LLM client. Demo này dùng cấu hình mặc định (không LLM) — đủ cho các case thường gặp.

---

## ⚠️ Lưu ý

- `markitdown[all]` pull khá nhiều dependency (ffmpeg-python, pydub, pdfminer, python-docx, openpyxl, youtube-transcript-api, ...). Lần đầu cài có thể mất 1–2 phút.
- Trên Windows, một số converter PDF/audio cần Visual C++ Build Tools nếu cài từ source. Khuyến nghị Python từ python.org / winget thay vì Microsoft Store stub.
- Output Markdown cho file Excel/PowerPoint có thể rất dài — file `.pptx` 200 slide → `.md` cũng tương ứng.
- Cảnh báo `RuntimeWarning: Couldn't find ffmpeg or avconv` xuất hiện khi import `markitdown` là **vô hại** — chỉ ảnh hưởng nếu convert file `.mp3/.wav` (cần cài ffmpeg). Convert PDF/Office/HTML/CSV/JSON/URL không cần.
- Các script đã `sys.stdout.reconfigure("utf-8")` để in tiếng Việt được trên console Windows (mặc định cp1252).
