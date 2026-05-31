"""
Ví dụ 4: Expose MarkItDown qua HTTP service (FastAPI).

Use case thực tế: cả công ty dùng chung 1 endpoint duy nhất để chuyển tài liệu
sang Markdown, không phải mỗi team tự cài lại pip + dependency PDF/Office.

Cách chạy:
    python -m uvicorn 04_fastapi_server:app --reload --port 8137

Test:
    curl.exe -X POST http://localhost:8137/convert -F "file=@samples/sample.html"
    curl.exe -X POST http://localhost:8137/convert-url -d "url=https://en.wikipedia.org/wiki/Markdown"
    curl.exe http://localhost:8137/

Hoặc mở Swagger UI: http://localhost:8137/docs
"""
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import PlainTextResponse
from markitdown import MarkItDown

app = FastAPI(
    title="MarkItDown HTTP Service",
    version="1.0.0",
    description="Chuyển file/URL sang Markdown qua HTTP",
)
converter = MarkItDown()


@app.get("/")
def root():
    return {
        "service": "markitdown",
        "endpoints": ["/convert (POST file)", "/convert-url (POST url)", "/docs"],
    }


@app.post("/convert", response_class=PlainTextResponse)
async def convert_file(file: UploadFile = File(...)):
    """Nhận file qua multipart/form-data, trả Markdown thuần."""
    suffix = Path(file.filename or "").suffix or ".bin"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name
    try:
        result = converter.convert(tmp_path)
        return result.text_content
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Convert failed: {exc}") from exc
    finally:
        Path(tmp_path).unlink(missing_ok=True)


@app.post("/convert-url", response_class=PlainTextResponse)
async def convert_url(url: str = Form(...)):
    """Nhận URL trong form, trả Markdown."""
    try:
        result = converter.convert(url)
        return result.text_content
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Convert failed: {exc}") from exc
