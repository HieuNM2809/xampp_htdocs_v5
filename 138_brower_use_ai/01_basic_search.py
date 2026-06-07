"""
01 - Ví dụ cơ bản nhất.

Giao cho agent MỘT nhiệm vụ bằng ngôn ngữ tự nhiên, để nó tự mở trình duyệt,
thao tác và trả về câu trả lời.

Chạy:  python 01_basic_search.py
"""

import asyncio
import sys

# Console Windows mac dinh cp1252 -> ep UTF-8 de in tieng Viet khong loi
sys.stdout.reconfigure(encoding="utf-8")

from dotenv import load_dotenv

from browser_use import Agent, Browser, ChatGoogle

# Nạp GOOGLE_API_KEY từ file .env
load_dotenv()


async def main():
    # Browser() mặc định mở Chromium hiện hình (headless=False) -> bạn xem được nó chạy.
    browser = Browser()

    agent = Agent(
        task=(
            "Truy cập https://github.com/browser-use/browser-use, "
            "tìm xem repo này đang có bao nhiêu sao (stars) "
            "và trả lời ngắn gọn bằng tiếng Việt."
        ),
        llm=ChatGoogle(model="gemini-2.5-flash"),
        browser=browser,
    )

    # max_steps: giới hạn số bước để tránh agent đi lan man -> tốn token.
    history = await agent.run(max_steps=15)

    # Kết quả cuối cùng agent rút ra:
    print("\n===== KẾT QUẢ =====")
    print(history.final_result())


if __name__ == "__main__":
    asyncio.run(main())
