"""
02 - Trích xuất dữ liệu CÓ CẤU TRÚC.

Thay vì nhận về một đoạn văn, ta ép agent trả về JSON đúng schema (Pydantic).
Rất hữu ích khi muốn dùng kết quả cho bước xử lý tiếp theo.

Chạy:  python 02_extract_data.py
"""

import asyncio
import sys

# Console Windows mac dinh cp1252 -> ep UTF-8 de in tieng Viet khong loi
sys.stdout.reconfigure(encoding="utf-8")

from dotenv import load_dotenv
from pydantic import BaseModel

from browser_use import Agent, Browser, ChatGoogle

load_dotenv()


# ---- Định nghĩa "khuôn" dữ liệu mong muốn ----
class Story(BaseModel):
    rank: int
    title: str
    points: int
    url: str


class TopStories(BaseModel):
    stories: list[Story]


async def main():
    browser = Browser()

    agent = Agent(
        task=(
            "Vào https://news.ycombinator.com, lấy 5 bài viết đầu tiên ở trang chủ. "
            "Với mỗi bài lấy: thứ hạng, tiêu đề, số điểm (points), và URL bài viết."
        ),
        llm=ChatGoogle(model="gemini-2.5-flash"),
        browser=browser,
        # Ép agent trả về đúng schema TopStories:
        output_model_schema=TopStories,
    )

    history = await agent.run(max_steps=15)

    # Parse kết quả ra object Pydantic:
    result = history.final_result()
    if result:
        data = TopStories.model_validate_json(result)
        print("\n===== TOP 5 HACKER NEWS =====")
        for s in data.stories:
            print(f"#{s.rank} [{s.points}đ] {s.title}\n     {s.url}")
    else:
        print("Không lấy được dữ liệu.")


if __name__ == "__main__":
    asyncio.run(main())
