"""
03 - Tự động điền & submit form nhiều bước.

Demo dùng trang luyện tập công khai (the-internet.herokuapp.com) nên an toàn,
không đụng tới website thật.

Chạy:  python 03_form_fill.py
"""

import asyncio
import sys

# Console Windows mac dinh cp1252 -> ep UTF-8 de in tieng Viet khong loi
sys.stdout.reconfigure(encoding="utf-8")

from dotenv import load_dotenv

from browser_use import Agent, Browser, ChatGoogle

load_dotenv()


async def main():
    browser = Browser()

    agent = Agent(
        task=(
            "Vào https://the-internet.herokuapp.com/login. "
            "Đăng nhập với username 'tomsmith' và password 'SuperSecretPassword!'. "
            "Sau khi đăng nhập, đọc thông báo trên trang và cho biết "
            "đăng nhập thành công hay thất bại."
        ),
        llm=ChatGoogle(model="gemini-2.5-flash"),
        browser=browser,
    )

    history = await agent.run(max_steps=15)

    print("\n===== KẾT QUẢ =====")
    print(history.final_result())


if __name__ == "__main__":
    asyncio.run(main())
