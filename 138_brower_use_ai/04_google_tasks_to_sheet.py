r"""
04 - TU DONG HOA: Google Tasks  ->  Google Sheets (DSM)
========================================================

Luong cong viec (chay tuan tu, co log + kiem tra thanh cong tung buoc):

  Buoc 1. Mo Google Tasks.
  Buoc 2. Vao list "Work", lay task DANG LAM (chua xong) va task DA HOAN THANH
          (completed) cua ngay gan nhat co du lieu.
  Buoc 3. Viet lai moi dau viec thanh 1 cau ngan gon, ro rang (giu nguyen y).
          -> Buoc 2 + 3 gop trong 1 agent (tra ve JSON co cau truc).
  Buoc 4. Mo Google Sheets (file DSM).
  Buoc 5. Tim tab theo NGAY HOM NAY (dinh dang dd-mm-yyyy); neu chua co thi
          tao sheet moi sao chep cau truc cua sheet ngay truoc.
  Buoc 6. Trong sheet hom nay, tim dong "Nguyen Minh Hieu":
            - cot "Last day"  <- danh sach task DA HOAN THANH
            - cot "To-do"     <- danh sach task DANG LAM


CONG CU SU DUNG
---------------
- browser-use 0.12.9  : khung agent dieu khien trinh duyet (vong lap nhin/nghi/lam).
- Playwright/Chromium : browser-use dieu khien Chromium ben duoi (qua CDP).
- ChatGoogle (Gemini) : "bo nao" LLM ra quyet dinh tung buoc (can GOOGLE_API_KEY).


XAC THUC DANG NHAP GOOGLE (quan trong)
--------------------------------------
Google chan dang nhap tren trinh duyet bi dieu khien. Co 2 cach (script ho tro ca 2):

  CACH A - CDP (KHUYEN DUNG, on dinh nhat) -------------------------------------
  Dung chinh Chrome that cua ban (da dang nhap Google san):
    1. Dong het cua so Chrome dang mo.
    2. Mo Chrome voi cong debug (PowerShell):
         & "C:\Program Files\Google\Chrome\Application\chrome.exe" `
           --remote-debugging-port=9222 --user-data-dir="C:\chrome-debug"
       (Lan dau dang nhap Google trong cua so nay; cac lan sau giu nguyen.)
    3. Dat bien moi truong roi chay script:
         $env:CDP_URL = "http://localhost:9222"
         .\.venv\Scripts\python.exe 04_google_tasks_to_sheet.py
    -> Script se connect (khong tao browser moi), bo qua buoc dang nhap tay.

  CACH B - PROFILE BEN VUNG (khong can CDP) ------------------------------------
  Khong set CDP_URL. Script tu mo Chromium voi profile luu o PROFILE_DIR.
    - Lan chay DAU: cua so mo ra -> ban dang nhap Google bang tay -> nhan ENTER.
    - Cac lan sau: cookie da luu trong PROFILE_DIR -> khong can dang nhap lai.
  Luu y: KHONG dat channel="chrome" o cach nay, vi browser-use se copy profile
  sang thu muc temp (mat phien dang nhap sau khi dong).


CHAY
----
  .\.venv\Scripts\python.exe 04_google_tasks_to_sheet.py
"""

import asyncio
import os
import sys
from datetime import datetime
from pathlib import Path

# Console Windows mac dinh cp1252 -> ep UTF-8 de in tieng Viet khong loi
sys.stdout.reconfigure(encoding="utf-8")

from dotenv import load_dotenv
from pydantic import BaseModel

from browser_use import Agent, Browser, ChatGoogle

load_dotenv()


# ============================================================
#  Cau hinh
# ============================================================
TASKS_URL = "https://tasks.google.com/u/0/tasks/"
SHEET_URL = (
    "https://docs.google.com/spreadsheets/d/"
    "1YeZf2Q-z8caegIOchRpJObvRK4D95lS7/edit?pli=1&gid=382459816#gid=382459816"
)
PERSON = "Nguyễn Minh Hiếu"          # dong can dien trong sheet
TODAY = datetime.now().strftime("%d-%m-%Y")   # vd: 07-06-2026 (dung dinh dang tab sheet)

# Profile ben vung de giu phien dang nhap Google giua cac lan chay (Cach B)
PROFILE_DIR = str(Path.home() / ".browseruse_google_profile")

# Neu set bien moi truong CDP_URL -> connect vao Chrome dang chay (Cach A)
CDP_URL = os.getenv("CDP_URL")  # vd: http://localhost:9222

# Co the doi model qua bien moi truong GEMINI_MODEL.
# Mac dinh flash-lite vi free tier nhieu quota hon & it bi 503/429 hon flash thuong.
MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite")


# ============================================================
#  Tien ich: log + kiem tra dieu kien thanh cong
# ============================================================
def log(step: str, msg: str) -> None:
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] [{step}] {msg}", flush=True)


def require(condition: bool, fail_msg: str) -> None:
    """Neu dieu kien khong dat -> dung toan bo luong (khong sang buoc sau)."""
    if not condition:
        raise RuntimeError(fail_msg)


# ============================================================
#  Schema du lieu mong muon o Buoc 2+3
# ============================================================
class TaskItem(BaseModel):
    original: str          # noi dung goc tren Google Tasks
    concise: str           # ban viet lai ngan gon, ro rang (tieng Viet)


class WorkTasks(BaseModel):
    completed_date: str            # ngay gan nhat co task completed (text tuy y)
    in_progress: list[TaskItem]    # task dang lam (chua hoan thanh)
    completed_recent: list[TaskItem]  # task da hoan thanh cua ngay gan nhat


# ============================================================
#  Buoc 1-3: Trich xuat & viet lai task tu Google Tasks
# ============================================================
async def extract_work_tasks(browser: Browser) -> WorkTasks:
    log("EXTRACT", "Mo Google Tasks va lay task trong list 'Work'...")

    task = f"""
Mo trang {TASKS_URL} (neu chua dang nhap Google thi dung lai - nguoi dung da dang nhap san).

1. O cot/list co ten chinh xac la "Work", doc TAT CA cac task DANG LAM (chua tick hoan thanh)
   o phan tren cua list.
2. Bam vao muc "Completed" cua list "Work" de mo ra danh sach task DA HOAN THANH.
   Chi lay cac task da hoan thanh thuoc NGAY GAN NHAT (ngay completed moi nhat co du lieu).
3. Voi MOI task lay duoc, hay viet lai noi dung thanh MOT cau tieng Viet ngan gon, ro rang,
   de hieu nhung GIU NGUYEN y nghia goc (bo bot ky tu thua, gach dau dong lon xon).
   QUAN TRONG: BO QUA cac nhan giao dien cua Google Tasks nhu "Details", "Chi tiet",
   "Add a task", "Completed" - day KHONG phai noi dung task. Chi lay tieu de task that
   va ghi chu phu ben duoi no (neu co). Neu task chi co tieu de (vd "Limit") thi giu nguyen "Limit".

Tra ve dung JSON theo schema:
  - completed_date: ngay gan nhat cua nhom task da hoan thanh (vd "07-06" hoac mo ta).
  - in_progress: danh sach task dang lam, moi phan tu co {{original, concise}}.
  - completed_recent: danh sach task da hoan thanh ngay gan nhat, moi phan tu co {{original, concise}}.

Neu list "Work" khong co task dang lam thi tra ve in_progress = [].
""".strip()

    agent = Agent(
        task=task,
        llm=ChatGoogle(model=MODEL),
        browser=browser,
        output_model_schema=WorkTasks,
        use_vision=True,
    )
    history = await agent.run(max_steps=25)

    result = history.final_result()
    require(bool(result), "Agent khong tra ve du lieu task nao (final_result rong).")

    data = WorkTasks.model_validate_json(result)
    require(
        len(data.in_progress) + len(data.completed_recent) > 0,
        "Khong trich xuat duoc task nao tu list 'Work'.",
    )

    log("EXTRACT", f"OK - dang lam: {len(data.in_progress)}, "
                   f"da xong (ngay {data.completed_date}): {len(data.completed_recent)}")
    return data


# ============================================================
#  Buoc 4-6: Ghi vao Google Sheets
# ============================================================
async def write_to_sheet(browser: Browser, data: WorkTasks) -> None:
    log("SHEET", f"Mo Google Sheets, dien cho dong '{PERSON}', tab ngay {TODAY}...")

    completed_lines = "\n".join(f"- {t.concise}" for t in data.completed_recent) or "(khong co)"
    inprogress_lines = "\n".join(f"- {t.concise}" for t in data.in_progress) or "(khong co)"

    task = f"""
Mo file Google Sheets tai: {SHEET_URL}

1. Tim tab (sheet) o thanh duoi cung co ten dung bang ngay hom nay: "{TODAY}".
   - Neu CHUA co tab "{TODAY}": tao tab moi bang cach nhan chuot phai vao tab ngay GAN NHAT
     truoc do, chon "Duplicate" (Nhan ban), roi doi ten tab moi thanh "{TODAY}".
     Phai giu nguyen cau truc cot giong cac sheet ngay truoc
     (cot STT, PIC, "Last day", "To-do", "EST Time", "Note").
2. Mo tab "{TODAY}". Tim dong co PIC (cot ho ten) la "{PERSON}".
3. Tai dong cua "{PERSON}":
   - Dien vao o thuoc cot "Last day" (cong viec ngay truoc / da hoan thanh) noi dung sau:
{completed_lines}
   - Dien vao o thuoc cot "To-do" (viec dang/se lam) noi dung sau:
{inprogress_lines}
   Goi y: bam vao Name Box (o dia chi o ben trai thanh cong thuc) de nhay toi dung o,
   hoac bam truc tiep vao o roi go noi dung. Dung Alt+Enter de xuong dong trong cung 1 o.
4. Sau khi dien xong, kiem tra lai noi dung da nam dung o cua dong "{PERSON}".

Bao cao ket qua: da dien thanh cong hay khong, va tom tat nhung gi da ghi.
""".strip()

    agent = Agent(
        task=task,
        llm=ChatGoogle(model=MODEL),
        browser=browser,
        use_vision=True,
    )
    history = await agent.run(max_steps=40)

    result = history.final_result()
    require(bool(result), "Agent ghi sheet khong tra ve ket qua.")
    log("SHEET", f"Ket qua: {result}")


# ============================================================
#  Dieu phoi tong
# ============================================================
async def main() -> None:
    # 1 browser dung chung cho ca 2 pha; keep_alive de khong dong giua chung.
    if CDP_URL:
        # --- Cach A: connect vao Chrome that dang chay (da dang nhap san) ---
        log("INIT", f"Hom nay = {TODAY}. Che do CDP -> connect {CDP_URL}")
        browser = Browser(cdp_url=CDP_URL, keep_alive=True)
        need_manual_login = False
    else:
        # --- Cach B: tu mo Chromium voi profile ben vung (KHONG dat channel) ---
        log("INIT", f"Hom nay = {TODAY}. Che do profile ben vung: {PROFILE_DIR}")
        browser = Browser(
            user_data_dir=PROFILE_DIR,   # giu phien dang nhap Google (persistent)
            headless=False,              # hien hinh de ban xem / dang nhap tay
            keep_alive=True,
        )
        need_manual_login = True

    try:
        await browser.start()
        log("INIT", "Da mo/connect trinh duyet.")

        # --- Cong dang nhap thu cong (chi voi Cach B, lan dau / khi het phien) ---
        if need_manual_login:
            print("\n" + "=" * 60)
            print(" Neu cua so trinh duyet CHUA dang nhap Google, hay dang nhap")
            print(" bang tay NGAY BAY GIO, sau do quay lai day va nhan ENTER.")
            print("=" * 60)
            await asyncio.get_event_loop().run_in_executor(None, input, ">> Nhan ENTER de tiep tuc: ")

        # --- Buoc 1-3 ---
        data = await extract_work_tasks(browser)

        print("\n----- TASK DANG LAM -----")
        for t in data.in_progress:
            print(f"  • {t.concise}")
        print("----- TASK DA HOAN THANH (ngay gan nhat) -----")
        for t in data.completed_recent:
            print(f"  • {t.concise}")
        print()

        # --- Buoc 4-6 ---
        await write_to_sheet(browser, data)

        log("DONE", "Hoan tat toan bo quy trinh.")

    except Exception as e:
        log("ERROR", f"Dung lai do loi: {type(e).__name__}: {e}")
        raise
    finally:
        # keep_alive=True nen phai dong thu cong khi xong
        await browser.stop()
        log("INIT", "Da dong trinh duyet.")


if __name__ == "__main__":
    asyncio.run(main())
