"""
Ví dụ 1: Chuyển 1 file sang Markdown bằng MarkItDown.

Cách dùng:
    python 01_basic_convert.py samples/sample.html
    python 01_basic_convert.py samples/sample.csv -o output/q1_products.md
    python 01_basic_convert.py samples/sample.json
"""
import argparse
import sys
from pathlib import Path

from markitdown import MarkItDown

sys.stdout.reconfigure(encoding="utf-8")


def convert(input_path: Path, output_path: Path) -> None:
    md = MarkItDown()
    result = md.convert(str(input_path))

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(result.text_content, encoding="utf-8")

    char_count = len(result.text_content)
    line_count = result.text_content.count("\n") + 1
    print(f"[OK] {input_path} -> {output_path}")
    print(f"     {char_count:,} ký tự, {line_count:,} dòng")
    if getattr(result, "title", None):
        print(f"     Tiêu đề: {result.title}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Chuyển 1 file sang Markdown")
    parser.add_argument("input", type=Path, help="Đường dẫn file đầu vào")
    parser.add_argument(
        "-o", "--output",
        type=Path,
        default=None,
        help="File Markdown đầu ra (mặc định: output/<tên-gốc>.md)",
    )
    args = parser.parse_args()

    if not args.input.exists():
        raise SystemExit(f"Không tìm thấy file: {args.input}")

    output = args.output or Path("output") / f"{args.input.name}.md"
    convert(args.input, output)


if __name__ == "__main__":
    main()
