# So sánh 4 AI Coding Agent — OpenClaw vs Claude Code vs Codex vs Antigravity 2.0

> Tài liệu phân tích kỹ thuật + ví dụ từ cơ bản đến nâng cao.
> Ngữ cảnh: team dev Hasaki, môi trường Windows + PowerShell.
> File mục tiêu thực hành: [`product.php`](product.php)

---

## Mục lục

1. [OpenClaw là gì](#1-openclaw-là-gì)
2. [Bảng so sánh tổng quan](#2-bảng-so-sánh-tổng-quan)
3. [Hai điểm dễ nhầm cần làm rõ](#3-hai-điểm-dễ-nhầm)
4. [SKILL.md — chuẩn chung giữa OpenClaw & Claude Code](#4-skillmd-chuẩn-chung)
5. [Setup 4 tool trên Windows](#5-setup-trên-windows)
6. [Ví dụ cơ bản — Cấp 1 → 3](#6-ví-dụ-cơ-bản)
7. [Ví dụ nâng cao — Cấp 4 → 7](#7-ví-dụ-nâng-cao)
8. [Workflow Hasaki kết hợp 4 tool](#8-workflow-hasaki-kết-hợp)
9. [Cost analysis (10 dev)](#9-cost-analysis)
10. [Decision matrix](#10-decision-matrix)
11. [Limitations & rủi ro](#11-limitations--rủi-ro)
12. [TL;DR](#12-tldr)

---

## 1. OpenClaw là gì

**OpenClaw** (tác giả: **Peter Steinberger**, mã nguồn mở, Node.js) là một **agent gateway chạy local** — đóng vai trò cầu nối giữa LLM (Claude, GPT, Gemini, Ollama) với hệ điều hành và các ứng dụng nhắn tin (WhatsApp, Telegram, Discord, Slack).

OpenClaw mở rộng năng lực qua cơ chế **Skills**: mỗi skill là 1 thư mục chứa `SKILL.md` (YAML frontmatter + Markdown playbook) và các script bổ trợ tùy chọn.

### Cấu trúc 1 skill OpenClaw

```text
my-log-analyzer/
├── SKILL.md          # Bắt buộc — config + playbook
└── scripts/
    └── parse_logs.py # Tùy chọn — agent gọi khi cần
```

### Nội dung `SKILL.md` mẫu (phân tích log Hasaki)

```yaml
---
name: hsk-log-analyzer
description: Phân tích log nginx Hasaki và alert lỗi nghiêm trọng qua Slack.
requires:
  env: [SLACK_API_TOKEN]
  bins: [python, grep]
metadata:
  openclaw: {"os": ["macos", "linux", "windows"], "version": ">=1.0.0"}
---
# Hướng dẫn agent

Khi kỹ năng kích hoạt:
1. Xác định path log từ message user.
2. Nếu file > 50MB → `grep -E "ERROR|CRITICAL"` lọc trước.
3. Chạy `{baseDir}/scripts/parse_logs.py` để định dạng JSON.
4. POST summary tới Slack `#devops-alerts` qua `SLACK_API_TOKEN`.
5. Báo lại user kèm số lỗi tìm thấy.
```

### Lệnh CLI cơ bản

```powershell
# Gọi agent với skill cụ thể
openclaw agent --message "Chạy skill hsk-log-analyzer trên /var/log/nginx/error.log" --thinking high

# Audit cấu hình & bảo mật hệ thống
openclaw doctor

# Liệt kê skills đã cài
openclaw skills list
```

---

## 2. Bảng so sánh tổng quan

| Tiêu chí | **OpenClaw** | **Claude Code** | **Codex (2025)** | **Antigravity 2.0** |
|---|---|---|---|---|
| Bản chất | Agent gateway local | Agent gateway CLI/IDE ext | Agent gateway CLI + Cloud | **IDE Multi-Agent** standalone |
| Tác giả | Peter Steinberger | Anthropic | OpenAI | Google DeepMind |
| Open-source | ✅ | ❌ | ✅ (Codex CLI - Apache 2.0) | ❌ |
| Model hỗ trợ | **BYO** — Claude/GPT/Gemini/Ollama/Local | Chỉ Claude | Chỉ OpenAI (GPT-5/o-series) | Chỉ Gemini (3 Pro/Flash) |
| Runtime | Node.js, local | Node.js, local | Rust binary, local + Cloud | App desktop (fork VS Code) |
| Mở rộng | `SKILL.md` (YAML+MD) | Skills + Hooks + MCP + Sub-agents | MCP + approval modes | Artifacts + Multi-agent + SDK |
| Tự trị | Trung-cao | Cao | Cao | **Rất cao** (parallel agents) |
| Sandbox | ❌ (chạy với quyền user) | ⚠️ permission mode | ✅ Sandbox tự động | ✅ Managed env |
| MCP | ✅ | ✅ (core) | ✅ | ✅ |
| Plan mode | ✅ | ✅✅ Shift+Tab | ✅ approval gates | ✅✅ Manager view |
| Browser control | ❌ (qua skill custom) | ⚠️ qua MCP | ⚠️ | ✅✅ Native |
| IDE integration | ❌ | ✅ VS Code/JetBrains | ✅ | ✅✅ IDE riêng |
| Tích hợp messaging | ✅✅ Native | ⚠️ qua MCP custom | ❌ | ❌ |
| Điểm mạnh | Switch model linh hoạt, bridge tới Slack/WA | Hooks sâu, terminal nhanh, ecosystem | Sandbox an toàn, GPT-5 reasoning | UI đẹp, multi-agent song song, browser |
| Điểm yếu | Plugin ít, không sandbox | Lock Anthropic | Lock OpenAI | Nặng, lock Gemini |

---

## 3. Hai điểm dễ nhầm

### 3.1 Claude ≠ Claude Code

| | **Claude** (model) | **Claude Code** (CLI agent) |
|---|---|---|
| Truy cập qua | claude.ai, API | Terminal `claude`, IDE ext |
| Tự chạy lệnh terminal | ❌ | ✅ |
| Đọc/ghi file local | ❌ | ✅ |
| Skills SKILL.md | ❌ | ✅ |
| MCP | Qua client app | ✅ Native |
| Hooks (event-driven) | ❌ | ✅ |

→ So sánh OpenClaw đúng phải đặt cạnh **Claude Code**, không phải Claude.

### 3.2 Codex không "deprecated" — đã relaunch 2025

- **Codex cũ** (2021, `code-davinci-002`) — Đã EOL 2023.
- **Codex 2025** — OpenAI relaunch dưới 3 hình thái:
  - `@openai/codex` — CLI Rust open-source
  - **Codex Cloud** — Parallel agents trên web
  - VS Code/JetBrains extension

### 3.3 Antigravity Artifacts ≠ Claude Artifacts

| | Claude Artifacts (claude.ai) | Antigravity Artifacts |
|---|---|---|
| Bản chất | UI panel preview code/markdown | **Bằng chứng task done** (test report, screenshot, video) |
| Mục đích | Interactive view | Audit + approval gate |
| Lưu trữ | Session-scoped | Workspace-scoped, versioned |

---

## 4. SKILL.md — chuẩn chung

So sánh format skill giữa OpenClaw và Claude Code:

| | OpenClaw SKILL.md | Claude Code Skill |
|---|---|---|
| YAML frontmatter | ✅ | ✅ |
| `name`, `description` | ✅ | ✅ |
| Markdown playbook | ✅ | ✅ |
| Script bổ trợ cùng folder | ✅ | ✅ |
| `requires.env / bins` | ✅ | ⚠️ Cú pháp khác |
| `metadata` block | ✅ | ✅ |

→ **Hệ quả:** Skill viết cho OpenClaw có thể **port sang Claude Code** chỉ với chỉnh sửa nhỏ. Anthropic là bên chuẩn hóa format này; Peter Steinberger follow theo.

✅ **Lời khuyên Hasaki:** Khi viết skill team (`hsk-deploy-staging`, `hsk-query-orders`, `hsk-pms-sync`), giữ structure SKILL.md chuẩn → dùng cross-tool dễ.

---

## 5. Setup trên Windows

### OpenClaw

```powershell
# Cài qua npm
npm install -g openclaw

# Set API key (chọn 1 hoặc nhiều)
$env:ANTHROPIC_API_KEY = "sk-ant-..."
$env:OPENAI_API_KEY    = "sk-..."

# Skills mặc định ở ~/.openclaw/skills/
openclaw doctor   # check config
openclaw agent --message "hello"
```

### Claude Code (đang dùng để tạo file này)

```powershell
npm install -g @anthropic-ai/claude-code
claude   # login qua browser, hoặc set ANTHROPIC_API_KEY
```

### Codex CLI

```powershell
npm install -g @openai/codex
# hoặc: winget install OpenAI.Codex
$env:OPENAI_API_KEY = "sk-..."
codex
```

### Antigravity 2.0

- Tải installer từ `antigravity.google` → cài như app desktop.
- Mở app → login Google → import folder `E:\xampp_htdocs_v5\133_open_claw`.

---

## 6. Ví dụ cơ bản

> Tất cả ví dụ thao tác trên file [`product.php`](product.php) trong project này.

### 🟢 Cấp 1 — Edit file đơn giản

**Task:** Trong `product.php`, chỉ in ra sản phẩm còn hàng (`stock > 0`). Giữ format giá.

| Tool | Cách chạy | Đặc điểm |
|---|---|---|
| OpenClaw | `openclaw agent --message "Sửa product.php: chỉ in sản phẩm stock>0"` | Hỏi confirm trước edit |
| Claude Code | `claude` → gõ prompt | Hiện diff màu, tự apply |
| Codex CLI | `codex "lọc sản phẩm còn hàng trong product.php"` | Sandbox + ask-approval |
| Antigravity | Mở IDE → chat panel → prompt | Tạo Artifact mô tả change |

**Output dự kiến (cả 4):**

```php
foreach ($products as $p) {
    if ($p['stock'] <= 0) continue;
    echo $p['name'] . ' - ' . formatPrice($p['price']) . ' (stock: ' . $p['stock'] . ")\n";
}
```

### 🟢 Cấp 2 — Tạo file mới

**Task:** "Tạo `product_test.php` test `formatPrice` với 3 cases: 0, số nhỏ, hàng triệu."

| Tool | Khác biệt |
|---|---|
| OpenClaw | Hỏi xác nhận tạo file mới (y/N) |
| Claude Code | Tạo luôn; trong plan mode thì trình bày plan trước |
| Codex | `--ask-for-approval` → hỏi từng bước |
| Antigravity | Tạo file + Artifact giải thích test strategy |

### 🟢 Cấp 3 — Đọc & giải thích code

❌ **Prompt mơ hồ:**
> "Giải thích code này"

✅ **Prompt rõ context:**
> "Đọc `product.php`. Giải thích hàm `formatPrice` từng tham số cho người mới học PHP, tiếng Việt."

→ Cả 4 đều cho explanation. Claude Code/Antigravity sâu hơn (Opus/Gemini 3 Pro). OpenClaw phụ thuộc model bạn chọn — chọn Haiku/Flash thì nhanh nhưng nông.

---

## 7. Ví dụ nâng cao

### 🔴 Cấp 4 — Refactor multi-file

**Task:** Tách `product.php` → `Product.php` (class), `ProductRepository.php`, `index.php`.

```powershell
# OpenClaw
openclaw agent --message "/plan refactor product.php sang OOP 3 file" --thinking high

# Claude Code
claude
# Shift+Tab vào plan mode
# > Refactor product.php thành Product.php (class), ProductRepository.php, index.php

# Codex
codex --ask-for-approval "refactor product.php sang OOP 3 file"

# Antigravity - Manager mode
# > Manager: refactor product.php to OOP with 3 files + tests
# → Multi-agent: 1 tạo class, 1 viết test, 1 cập nhật docs (song song)
```

| | Plan trước | Diff preview | Rollback |
|---|---|---|---|
| OpenClaw | ✅ `/plan` | ✅ inline TUI | Git-based |
| Claude Code | ✅✅ Plan mode dedicated | ✅✅ Per-file | Git + harness |
| Codex | ✅ approval mode | ✅ | Sandbox + git |
| Antigravity | ✅✅✅ Artifacts | ✅✅ Visual | Workspace snapshots |

### 🔴 Cấp 5 — MCP (Model Context Protocol)

Cho agent query thật MySQL Hasaki:

**Claude Code** — `.mcp.json`:
```json
{
  "mcpServers": {
    "hasaki-db": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-mysql"],
      "env": { "MYSQL_URL": "mysql://user:pass@localhost:3306/hasaki" }
    }
  }
}
```

**OpenClaw** — `~/.openclaw/config.json`, cùng MCP block.

**Codex** — `~/.codex/config.toml`:
```toml
[mcp_servers.hasaki-db]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-mysql"]
```

**Antigravity** — Settings UI → MCP Servers (GUI).

> 💡 **Prompt thực tế:**
> "Dùng MCP `hasaki-db`, query top 10 SKU bán chạy tháng 5/2026, update `ProductRepository.php` để hardcode 10 SKU đó làm sample data."

### 🔴 Cấp 6 — Hooks / Skills / Sub-agents

Đây là điểm **Claude Code đi xa nhất**:

```jsonc
// ~/.claude/settings.json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Edit|Write",
      "hooks": [{ "type": "command", "command": "php -l \"$CLAUDE_FILE_PATH\"" }]
    }]
  }
}
```
→ Mỗi lần Claude edit file PHP, hook tự `php -l` lint.

| Feature | OpenClaw | Claude Code | Codex | Antigravity |
|---|---|---|---|---|
| Hooks (event-driven) | ⚠️ Plugin | ✅✅ Native, 8+ events | ⚠️ Limited | ⚠️ Workflows |
| Skills SKILL.md | ✅✅ | ✅✅ | ❌ | ✅ "Playbooks" |
| Sub-agents | ⚠️ | ✅✅ Parallel | ✅ Codex Cloud | ✅✅ Manager |
| Custom commands | ✅ `/cmd` | ✅✅ `.claude/commands/` | ⚠️ | ✅ |

### 🔴 Cấp 7 — Multi-agent song song (Antigravity mạnh nhất)

```text
Antigravity Manager mode:
> Agent 1: refactor product.php → OOP
> Agent 2: viết PHPUnit tests cho ProductRepository
> Agent 3: build REST endpoint /api/products
→ 3 agent chạy parallel trong 3 worktree riêng, manager view tổng hợp
```

Claude Code làm được tương tự bằng `Agent` tool + `run_in_background`, nhưng UX kém visual hơn.
OpenClaw/Codex CLI: phải tự orchestrate bằng nhiều terminal hoặc script wrapper.

---

## 8. Workflow Hasaki kết hợp

Tình huống thực tế: **Cảnh báo lỗi 500 từ `hasaki.vn/api/checkout`**.

```text
┌─ Background 24/7 ───────────────────────────────────┐
│ OpenClaw + skill `hsk-log-watcher`                  │
│ → grep nginx error log mỗi 5 phút                   │
│ → khi thấy 500 spike → ping Slack + WhatsApp dev    │
└────────────────────┬────────────────────────────────┘
                     │ (Dev nhận alert)
                     ▼
┌─ Investigation (dev mở laptop) ─────────────────────┐
│ Claude Code trong systemShipper/example-app/        │
│ → Hook PHP lint tự chạy                             │
│ → MCP query staging DB                              │
│ → Plan mode: phân tích root cause                   │
│ → Edit code + tạo PR                                │
└────────────────────┬────────────────────────────────┘
                     │ (Đẩy PR lên GitHub)
                     ▼
┌─ Review độc lập ────────────────────────────────────┐
│ Codex CLI Cloud: sandbox run test                   │
│ Antigravity: parallel agent review security         │
└─────────────────────────────────────────────────────┘
```

**Vai trò mỗi tool:**
- **OpenClaw** = "always-on monitoring agent", rẻ, chạy như cron
- **Claude Code** = "dev workstation agent", sâu, có hooks/MCP
- **Codex/Antigravity** = "independent reviewer", sandbox/multi-agent

---

## 9. Cost analysis

Ước tính cho **team 10 dev Hasaki, mức dùng moderate**:

| Tool | Phí license/sub | Phí token | Tổng /tháng/dev |
|---|---|---|---|
| **OpenClaw** | $0 (open-source) | Pay-as-you-go model bạn chọn | $20–60 (Claude Haiku) hoặc **$0** (Ollama local) |
| **Claude Code** | Pro $20 / Max $100–200 / API | API tương đương | $20–200 |
| **Codex CLI** | ChatGPT Plus $20 / API | API GPT-5 | $20–150 |
| **Antigravity 2.0** | Free preview | Gemini API (có free tier) | $0–50 |

> 💡 POC/học: **OpenClaw + Ollama local** = $0 thực sự. Quality thấp hơn Claude Sonnet/GPT-5 nhưng đủ thử concept.

---

## 10. Decision matrix

| Tình huống Hasaki | Tool đề xuất | Lý do |
|---|---|---|
| Sửa nhanh bug PHP trong `systemShipper/example-app` | **Claude Code** | Đang sẵn, hooks PHP lint, MCP |
| So output cùng task giữa Claude vs Gemini vs GPT | **OpenClaw** | Switch model 1 dòng config |
| Refactor lớn, cần audit từng step | **Codex CLI** | Sandbox + approval mode chặt |
| Build feature có UI, cần screenshot/browser test | **Antigravity** | Browser control + Artifacts |
| Cron job log monitoring + Slack alert | **OpenClaw** | Bridge messaging app native |
| CI tự động fix lint mỗi PR | **OpenClaw hoặc Codex** | CLI open-source, dễ tích hợp GH Actions |
| Đào tạo junior xem AI suggest code | **Antigravity** | UI dễ hiểu cho người không quen CLI |
| Skill cá nhân (auto format markdown, scrape giá đối thủ) | **OpenClaw** | Local, free, viết skill nhanh |

---

## 11. Limitations & rủi ro

### OpenClaw — hạn chế chưa rõ trong tài liệu thường

| Hạn chế | Tác động |
|---|---|
| Node.js runtime overhead | Khởi động ~1–3s/lần, không phù hợp realtime |
| Không có IDE integration native | Phải dùng terminal — junior team có thể ngại |
| **Không sandbox** | Script trong skill chạy full quyền user. `doctor` chỉ audit, không cô lập |
| Ecosystem nhỏ | Số skill có sẵn ít hơn MCP servers cho Claude Code |
| Vẫn phải trả API model | "Local" chỉ là runtime — token vẫn gọi cloud trừ khi Ollama |

### ❌ Không nên dùng OpenClaw khi

- Edit code trực tiếp trong large codebase (Claude Code/Codex CLI có context management tốt hơn)
- Team junior không quen CLI/YAML
- Yêu cầu sandbox bảo mật cao (PCI-DSS, dữ liệu khách Hasaki)
- Cần SSO/audit log enterprise

### ✅ Phù hợp dùng OpenClaw khi

- Tự động hóa cá nhân (notify, scrape, format, monitor)
- Bridge LLM ↔ messaging app (Slack/Telegram/Discord/WhatsApp)
- POC nhanh, prototype skill
- Học cách agent system hoạt động (đọc được source)

---

## 12. TL;DR

> **OpenClaw** = "Tasker/Shortcuts cho LLM" — local, free, viết skill bằng Markdown.
> **Bổ trợ chứ không thay thế Claude Code.**
> So sánh đúng phải là **OpenClaw ↔ Claude Code (skills)** vì cả hai cùng là agent gateway, cùng chuẩn `SKILL.md`.
>
> **Khuyến nghị Hasaki:** Kết hợp:
> - Claude Code (workstation chính)
> - OpenClaw (background automation + messaging bridge)
> - Codex/Antigravity (reviewer độc lập khi cần)

---

## Phụ lục — files trong project demo

- [product.php](product.php) — mock 4 sản phẩm Hasaki để thực hành cấp 1–4
- [README.md](README.md) — note ngắn
- [SO_SANH_OPENCLAW.md](SO_SANH_OPENCLAW.md) — file này
