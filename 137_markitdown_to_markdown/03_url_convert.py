"""
Ví dụ 3: Chuyển URL (web page, YouTube transcript) sang Markdown.

Use case thực tế:
- Crawl bài blog / docs về dạng .md để index cho LLM.
- Lấy transcript YouTube để tóm tắt video.

Cách dùng:
    python 03_url_convert.py https://en.wikipedia.org/wiki/Markdown
    python 03_url_convert.py https://www.youtube.com/watch?v=jNQXAC9IVRw
    python 03_url_convert.py https://example.com -o output/example.md
"""
import argparse
import re
import sys
from pathlib import Path

from markitdown import MarkItDown

sys.stdout.reconfigure(encoding="utf-8")


def slugify(text: str) -> str:
    """Tạo tên file an toàn từ tiêu đề trang."""
    text = re.sub(r"[^\w\s-]", "", text.lower())
    return re.sub(r"[\s_-]+", "-", text).strip("-")[:80] or "page"


def main() -> None:
    parser = argparse.ArgumentParser(description="Chuyển URL sang Markdown")
    parser.add_argument("url", help="URL trang web hoặc video YouTube")
    parser.add_argument("-o", "--output", type=Path, default=None)
    args = parser.parse_args()

    md = MarkItDown()
    result = md.convert(args.url)

    title = getattr(result, "title", None) or "page"
    output = args.output or Path("output") / f"{slugify(title)}.md"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(result.text_content, encoding="utf-8")

    print(f"[OK] {args.url}")
    print(f"     Tiêu đề: {title}")
    print(f"     Lưu vào: {output}")
    print(f"     Dung lượng: {len(result.text_content):,} ký tự")


if __name__ == "__main__":
    main()
