# Hướng dẫn cài đặt & clone website bằng AI Website Cloner Template

Tài liệu này hướng dẫn cách cài đặt template [`ai-website-cloner-template`](https://github.com/JCodesMore/ai-website-cloner-template)
và dùng nó để **clone (dựng lại) một website** bằng AI coding agent (Claude Code, Cursor, Gemini…).

Cuối tài liệu có **ví dụ thực tế**: clone trang <http://hsco-furniture.com/> — kèm cách xử lý khi
môi trường **không có browser MCP**.

---

## 1. Template này là gì?

Là một **dự án Next.js dựng sẵn** (scaffold) + một **skill `/clone-website`** cho AI agent.
Bạn đưa 1 URL, agent sẽ tự động khảo sát trang gốc rồi dựng lại thành mã nguồn Next.js sạch.

| Thành phần | Phiên bản / công nghệ |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript strict |
| UI | shadcn/ui (Radix primitives) + Tailwind CSS v4 (oklch tokens) |
| Icon | Lucide React (được thay dần bằng SVG trích xuất từ site gốc) |
| Runtime | **Node.js ≥ 24** (xem `.nvmrc` = `24`) |

**Mục đích chính đáng:** di dời nền tảng (platform migration), khôi phục mã nguồn đã mất,
học hỏi qua việc "mổ xẻ" giao diện. **KHÔNG dùng** cho phishing, giả mạo thương hiệu,
đánh cắp thiết kế, hay vi phạm điều khoản của website gốc (xem `LICENSE` / `SECURITY.md`).

---

## 2. Yêu cầu hệ thống

- **Node.js ≥ 24** và **npm** — kiểm tra: `node -v` (phải ≥ v24).
- **Git**.
- **Một AI coding agent** hỗ trợ skill (Claude Code khuyến nghị dùng Opus).
- **Browser automation (browser MCP)** — **bắt buộc cho quy trình chuẩn**: Chrome MCP,
  Playwright MCP, Puppeteer MCP hoặc Browserbase. Skill cần nó để chụp ảnh màn hình và
  đọc `getComputedStyle()` từ trang gốc.
  > Nếu **không có** browser MCP, vẫn clone được các site tĩnh/SSR bằng cách thủ công —
  > xem [Mục 7](#7-ví-dụ-thực-tế-clone-hsco-furniturecom).
- *(Tùy chọn)* **Docker** nếu muốn chạy bằng container.

---

## 3. Cài đặt template

### Cách A — Dùng làm template trên GitHub (khuyến nghị cho dự án mới)
Vào trang repo → bấm **“Use this template”** → tạo repo mới của bạn → rồi:

```bash
git clone https://github.com/YOUR-USERNAME/YOUR-NEW-REPO.git
cd YOUR-NEW-REPO
npm install
```

### Cách B — Clone trực tiếp (như trong repo học tập này)
```bash
git clone https://github.com/JCodesMore/ai-website-cloner-template.git 143_ai_website_cloner_template
cd 143_ai_website_cloner_template
npm install
```

### Kiểm tra scaffold chạy được
```bash
npm run dev       # server dev tại http://localhost:3000
npm run build     # build production
npm run lint      # ESLint
npm run typecheck # kiểm tra TypeScript
npm run check     # chạy cả lint + typecheck + build
```

### Chạy bằng Docker (tùy chọn)
```bash
docker compose up app --build   # bản production → http://localhost:3000
docker compose up dev --build   # bản dev (hot-reload) → http://localhost:3001
```

---

## 4. Clone một website — quy trình chuẩn

Trong AI agent (ví dụ Claude Code) đang mở tại thư mục dự án, gõ:

```
/clone-website <url>
```

Ví dụ:
```
/clone-website https://example.com
/clone-website https://example.com https://example.com/about   # nhiều trang một lần
```

Nếu agent không hỗ trợ slash command, dùng câu lệnh tự nhiên:
```
Clone https://example.com using the clone-website workflow
```

Agent sẽ hỏi/tự quyết các mặc định: **fidelity pixel-perfect**, giữ nguyên nội dung & ảnh thật,
không thêm backend/auth thật, không tùy biến thiết kế (emulation thuần).

---

## 5. Quy trình 5 giai đoạn (agent tự chạy)

| Giai đoạn | Việc làm | Kết quả (artifact) |
|---|---|---|
| **1. Reconnaissance** | Chụp ảnh (desktop 1440 / mobile 390), trích design token (màu, font, spacing), quét tương tác (scroll/click/hover/responsive) | `docs/design-references/…`, `BEHAVIORS.md`, `PAGE_TOPOLOGY.md` |
| **2. Foundation** | Nạp font + màu vào `globals.css`, tạo TypeScript types, trích SVG icon, **tải toàn bộ asset** | `src/app/globals.css`, `public/…`, script tải asset trong `scripts/` |
| **3. Component Spec & Dispatch** | Với mỗi section: viết file spec (CSS chính xác + hành vi + nội dung) rồi giao cho **builder agent** dựng trong git worktree | `docs/research/…/components/*.spec.md`, `src/components/…` |
| **4. Assembly** | Ghép các worktree, lắp section vào route, nối nội dung thật | `src/app/page.tsx` (hoặc route tương ứng) |
| **5. Visual QA** | So sánh clone ↔ bản gốc từng section ở 1440px & 390px, sửa sai lệch | Báo cáo QA |

**Nguyên tắc cốt lõi của skill:** *Completeness beats speed* — builder phải nhận **đủ** ảnh,
CSS chính xác (không đoán), asset đã tải, nội dung thật; task nhỏ → kết quả chuẩn; luôn
`npx tsc --noEmit` và `npm run build` xanh trước khi coi là xong.

---

## 6. Data sau khi clone nằm ở đâu?

Mọi thứ nằm **trong thư mục dự án**, theo quy ước namespace của skill
(`<site-key>` = slug tên miền, `<page-key>` = slug đường dẫn):

```
<dự-án>/
├── docs/
│   ├── research/<site-key>/<page-key>/     # HTML/CSS/JS thô, manifest, spec component
│   └── design-references/<site-key>/<page-key>/   # ảnh chụp màn hình tham chiếu
├── public/
│   └── sites/<site-key>/…                  # ảnh/video/logo/icon TẢI VỀ dùng cho clone
├── src/
│   ├── app/…                               # route (trang) của clone
│   ├── components/sites/<site-key>/…       # component React từng section
│   └── app/globals.css                     # font + design token của site gốc
└── scripts/                                # script tải asset (đặt tên theo từng trang)
```

> `docs/research` = **dữ liệu thô & tài liệu** (để kiểm chứng);
> `public/sites` = **asset thật** dùng khi render;
> `src` = **mã nguồn clone**.

---

## 7. Ví dụ thực tế: clone `hsco-furniture.com`

Trang **HUONG SON INTERNATIONAL** (nội thất thiết kế Ý, tiếng Việt) là một site
**server-rendered** — chỉ **1 file CSS** và **1 file JS**, ảnh được **nhúng base64** thẳng vào
HTML (nên trang chủ nặng **~41 MB**). Đây là ca lý tưởng để clone.

### Bối cảnh: môi trường KHÔNG có browser MCP
Skill chuẩn cần browser MCP để chụp ảnh + đọc computed style. Khi không có, ta thay bằng
`curl` + `node` — vì đây là site tĩnh/SSR nên tải HTTP là lấy đủ HTML/CSS/JS/asset.
(Với SPA nặng JavaScript thì cách này không đủ, vẫn cần browser MCP.)

### Các bước đã thực hiện

**B1. Khảo sát nhanh (thay Phase 1):**
```bash
# Tải HTML gốc về file (đừng đổ 41MB vào màn hình)
curl -sSL "http://hsco-furniture.com/" -o docs/research/hsco-furniture-com/root/index.raw.html

# Tải CSS + JS gốc
curl -sSL "http://hsco-furniture.com/static/css/style.css" -o docs/research/hsco-furniture-com/root/style.css
curl -sSL "http://hsco-furniture.com/static/js/main.js"    -o docs/research/hsco-furniture-com/root/main.js
```
- Server: **nginx + Helmet.js** (Node/Express), có rate-limit → gọi lịch sự, đừng spam.
- Đọc header thấy `Content-Type: text/html`, CSP cho phép `img-src data:` → ảnh inline base64.

**B2. Tạo bản HTML “sạch” để đọc cấu trúc** (cắt chuỗi base64 dài):
```bash
perl -pe "s/data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+\/=]+/[BASE64_IMG]/g" \
  index.raw.html > index.clean.html    # 41MB → 48KB, đọc được toàn bộ 13 section
```

**B3. Bóc ảnh base64 thành file thật + localize HTML** — bằng script Node
[`scripts/extract-assets-hsco-root.mjs`](scripts/extract-assets-hsco-root.mjs):
```bash
node scripts/extract-assets-hsco-root.mjs
# → 65 lần nhúng base64 gộp còn 51 ảnh unique (dedupe theo hash nội dung)
# → ghi ra public/sites/hsco/images/img-<hash>.<ext>
# → sinh index.local.html (đường dẫn ảnh đã trỏ về file thật) + ASSET_MANIFEST.json
```

**B4. Tải asset tĩnh còn lại** (logo, icon khối “công năng”):
```bash
for f in images/logo.png images/hs-logo.jpg \
         icons/leaf.svg icons/weather.svg icons/diamond.svg icons/shield.svg; do
  curl -sSL "http://hsco-furniture.com/static/$f" -o "public/sites/hsco/static/$f"
done
```

### Kết quả data đã clone về

```
143_ai_website_cloner_template/
├── docs/research/hsco-furniture-com/root/
│   ├── index.raw.html        # 41 MB — HTML gốc (ảnh base64)
│   ├── index.clean.html      # 48 KB — bản cắt base64 để đọc cấu trúc
│   ├── index.local.html      # 50 KB — bản đã trỏ ảnh về file thật (dùng dựng component)
│   ├── style.css             # 140 KB — CSS gốc (2.479 dòng, :root có đủ design token)
│   ├── main.js               # 24 KB — JS gốc (452 dòng)
│   └── ASSET_MANIFEST.json   # bảng kê 51 ảnh unique + hash + dung lượng
└── public/sites/hsco/        # 27 MB tổng
    ├── images/               # 51 ảnh bóc từ base64
    └── static/
        ├── images/           # logo.png, hs-logo.jpg
        └── icons/            # leaf / weather / diamond / shield .svg
```

### Design token trích được (từ `:root` của CSS gốc)
| Token | Giá trị | Dùng cho |
|---|---|---|
| `--accent` | `#c39a5e` | màu nhấn (vàng đồng) — chủ đạo thương hiệu |
| `--accent-dark` | `#a97f45` | nhấn đậm (hover) |
| `--ink` | `#241f1b` | màu chữ chính |
| `--muted` | `#6f665c` | chữ phụ |
| `--soft` / `--line` | `#f6f2ec` / `#ece6dc` | nền phụ / đường kẻ |
| `--radius` | `0px` | bo góc (thiết kế vuông) |
| `--container` | `1200px` | bề rộng nội dung |
| Font | Be Vietnam Pro / Poppins / Cormorant Garamond | body / tiêu đề hero / tiêu đề khối |

### Bản đồ 13 section của trang chủ
Header (utility + nav + logo + search) → Drawer menu → Hero slideshow (3 slide) →
Features (4 icon) → Showcase “Sản phẩm nổi bật” (8 sản phẩm) → Intro công ty →
Why × 2 (Nội thất / Đồ gốm + sub-category) → Gallery collage (8 ô) →
News “Xu hướng của mùa” (2 bài) → Partners (12 logo) → Certificates (6 giấy) →
Footer (công ty + liên hệ + Google Map) → nút “lên đầu trang”.

### Hành vi JS cần cho trang chủ (từ `main.js`)
1. **Drawer menu** — mở/đóng, panel con, bẫy focus, đóng bằng `Esc`.
2. **Hero slideshow** — tự chạy 5s, vòng lặp vô tận (nhân bản 2 đầu), mũi tên + dot, dừng khi hover.
3. **Collage** — ô nhiều ảnh tự đổi lệch pha (trang chủ mỗi ô 1 ảnh → gần như no-op).
4. **Category jump** — bấm “Nội thất/Đồ gốm” cuộn mượt tới `#why-<id>`.
5. **Horizontal scroll** — nút ‹ › cuộn ngang showcase & dải sub-category.
6. **To-top** — hiện nút khi cuộn quá 400px.

---

## 8. Xử lý sự cố (Troubleshooting)

| Vấn đề | Cách xử lý |
|---|---|
| `npm install` lỗi engine | Node phải ≥ 24. Dùng `nvm use` (đọc `.nvmrc`) hoặc cài Node 24. |
| Skill báo “cần browser automation” | Kết nối một browser MCP (Chrome/Playwright/Puppeteer/Browserbase), hoặc dùng cách thủ công ở Mục 7 cho site tĩnh. |
| HTML tải về quá lớn (ảnh base64) | Tạo bản “clean” (B2) để đọc; bóc base64 ra file (B3) trước khi dựng component. |
| Bị chặn / rate-limit | Site có giới hạn request/phút — tải tuần tự, thêm độ trễ, không quét ồ ạt. |
| Ảnh trong clone bị trống | Kiểm tra đã tải cả **ảnh overlay/nhiều lớp** trong cùng một khối chưa (skill nhấn mạnh điểm này). |

---

## 9. Lệnh bảo trì template

```bash
bash scripts/sync-agent-rules.sh   # tạo lại file hướng dẫn cho từng nền tảng từ AGENTS.md
node scripts/sync-skills.mjs       # đồng bộ skill /clone-website sang mọi nền tảng
```

---

## 10. Tham khảo trong repo này
- `README.md` — giới thiệu template (tiếng Anh).
- `AGENTS.md` / `CLAUDE.md` — chỉ dẫn cho agent.
- `.claude/skills/clone-website/SKILL.md` — định nghĩa skill 5 giai đoạn (chi tiết đầy đủ).
- `docs/research/INSPECTION_GUIDE.md` — checklist khảo sát website.
- `docs/research/hsco-furniture-com/root/` — toàn bộ artifact của ví dụ HSCO.
