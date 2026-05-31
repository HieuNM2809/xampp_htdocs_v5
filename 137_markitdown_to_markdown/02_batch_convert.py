"""
Ví dụ 2: Chuyển hàng loạt file trong 1 thư mục sang Markdown.

Use case thực tế: số hoá toàn bộ tài liệu nội bộ (báo cáo .docx, sheet .xlsx,
slide .pptx) để feed vào RAG / knowledge base.

Cách dùng:
    python 02_batch_convert.py samples
    python 02_batch_convert.py samples --pattern "*.csv"
    python 02_batch_convert.py samples -o output/batch
"""
import argparse
import sys
import time
from pathlib import Path

from markitdown import MarkItDown

sys.stdout.reconfigure(encoding="utf-8")

SUPPORTED_EXT = {
    ".pdf", ".docx", ".doc", ".pptx", ".ppt", ".xlsx", ".xls",
    ".html", ".htm", ".csv", ".json", ".xml", ".txt", ".md",
    ".png", ".jpg", ".jpeg", ".gif", ".bmp",
    ".mp3", ".wav", ".m4a",
    ".zip", ".epub", ".msg",
}


def iter_files(folder: Path, pattern: str):
    for path in sorted(folder.rglob(pattern)):
        if path.is_file() and path.suffix.lower() in SUPPORTED_EXT:
            yield path


def main() -> None:
    parser = argparse.ArgumentParser(description="Chuyển hàng loạt file sang Markdown")
    parser.add_argument("folder", type=Path, help="Thư mục chứa file đầu vào")
    parser.add_argument("--pattern", default="*", help="Glob pattern (mặc định: *)")
    parser.add_argument(
        "-o", "--output",
        type=Path,
        default=Path("output"),
        help="Thư mục đầu ra (mặc định: output/)",
    )
    args = parser.parse_args()

    if not args.folder.is_dir():
        raise SystemExit(f"Không phải thư mục: {args.folder}")

    args.output.mkdir(parents=True, exist_ok=True)
    md = MarkItDown()

    ok, fail = 0, 0
    started = time.perf_counter()

    for src in iter_files(args.folder, args.pattern):
        rel = src.relative_to(args.folder)
        dst = args.output / rel.with_name(rel.name + ".md")
        dst.parent.mkdir(parents=True, exist_ok=True)
        try:
            result = md.convert(str(src))
            dst.write_text(result.text_content, encoding="utf-8")
            print(f"[OK]   {src} -> {dst}")
            ok += 1
        except Exception as exc:
            print(f"[FAIL] {src}: {exc}")
            fail += 1

    elapsed = time.perf_counter() - started
    print(f"\nXong: {ok} thành công, {fail} lỗi, trong {elapsed:.2f}s")


if __name__ == "__main__":
    main()
