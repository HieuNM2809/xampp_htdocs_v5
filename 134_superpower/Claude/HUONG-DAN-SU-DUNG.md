# Hướng dẫn sử dụng Superpowers

> **Mục đích:** Tài liệu tiếng Việt dành cho dev tại Hasaki (hoặc bất kỳ ai) muốn dùng plugin **Superpowers** cùng Claude Code để phát triển phần mềm bài bản, ít sai sót, có quy trình.
>
> **Đối tượng:** Senior/Mid dev đã quen Git, TDD, code review.
>
> **Phiên bản plugin tham chiếu:** 5.1.0 (xem `.claude-plugin/plugin.json`)
>
> **Repo gốc:** https://github.com/obra/superpowers

---

## Mục lục

1. [Superpowers là gì](#1-superpowers-là-gì)
2. [Cài đặt](#2-cài-đặt)
3. [Cơ chế hoạt động](#3-cơ-chế-hoạt-động)
4. [14 skills cốt lõi](#4-14-skills-cốt-lõi)
5. [Workflow mẫu — Build 1 feature từ đầu đến cuối](#5-workflow-mẫu--build-1-feature-từ-đầu-đến-cuối)
6. [Ví dụ thực tế tại Hasaki](#6-ví-dụ-thực-tế-tại-hasaki)
7. [Best practices](#7-best-practices)
8. [Troubleshooting](#8-troubleshooting)
9. [Tham khảo](#9-tham-khảo)

---

## 1. Superpowers là gì

**Superpowers** là plugin cho Claude Code (và các coding agent khác: Codex, Gemini, Cursor, Copilot CLI…) ép Claude phải đi theo một **methodology phát triển phần mềm** cụ thể thay vì nhảy thẳng vào code.

### Triết lý cốt lõi

| Nguyên tắc | Ý nghĩa |
|---|---|
| **TDD bắt buộc** | Test trước, code sau — không có ngoại lệ |
| **Systematic over ad-hoc** | Quy trình thay cho việc đoán mò |
| **Complexity reduction** | Đơn giản là mục tiêu hàng đầu |
| **Evidence over claims** | Phải verify, không được nói "đã xong" mà chưa chạy test |

### So sánh: có và không có Superpowers

| Tình huống | ❌ Không có Superpowers | ✅ Có Superpowers |
|---|---|---|
| User: "Viết API đăng nhập" | Claude code ngay → đoán mò field, validation | Hỏi rõ: OAuth hay password? remember-me? 2FA? → ghi spec → duyệt → mới code |
| Có bug ở prod | Claude đoán fix, có khi sửa đúng symptom sai root cause | 4 phase: REPRODUCE → ISOLATE → DIAGNOSE → FIX + viết test regression |
| Refactor file 500 dòng | Sửa tuốt 1 lần, dễ vỡ test | Chia task 2–5 phút, mỗi task có test riêng, commit từng bước |
| Claude nói "Done!" | Không verify, có khi build fail | Bắt chạy test/lint/typecheck trước khi tuyên bố done |

---

## 2. Cài đặt

### 2.1. Khuyến nghị: Cài qua plugin marketplace

Mở Claude Code và gõ **một trong hai cách**:

**Cách A — Marketplace chính thức của Anthropic (đơn giản nhất):**

```bash
/plugin install superpowers@claude-plugins-official
```

**Cách B — Marketplace của tác giả (kèm plugins phụ liên quan):**

```bash
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

Sau khi cài, **restart Claude Code**. Các skill sẽ tự kích hoạt khi bạn nói chuyện — không cần lệnh đặc biệt.

### 2.2. Folder đã clone về máy

Folder `E:\xampp_htdocs_v5\134_superpower\Claude` chứa **source code** của plugin. Không cần để cài, nhưng hữu ích cho:

| Mục đích | Cách dùng folder clone |
|---|---|
| Đọc hiểu nội dung từng skill | Mở các file `skills/<tên-skill>/SKILL.md` |
| Tự viết skill mới cho team | Tham khảo `skills/writing-skills/SKILL.md` |
| Fork + customize cho Hasaki | Sửa trực tiếp trong folder này rồi cài plugin từ local |
| Đối chiếu khi update phiên bản mới | `git pull` rồi `git diff` xem có gì thay đổi |

### 2.3. Cài đặt cho các harness khác

| Harness | Lệnh |
|---|---|
| **Codex CLI** | Gõ `/plugins` → search `superpowers` → Install |
| **Codex App** | Sidebar → Plugins → Coding → Superpowers → `+` |
| **Gemini CLI** | `gemini extensions install https://github.com/obra/superpowers` |
| **Cursor** | Trong Cursor Agent chat: `/add-plugin superpowers` |
| **Copilot CLI** | `copilot plugin marketplace add obra/superpowers-marketplace` rồi `copilot plugin install superpowers@superpowers-marketplace` |
| **Factory Droid** | `droid plugin marketplace add https://github.com/obra/superpowers` rồi `droid plugin install superpowers@superpowers` |

---

## 3. Cơ chế hoạt động

### 3.1. Auto-trigger

Bạn **không cần gõ lệnh** để gọi skill. Mỗi skill có phần `description` ở đầu file, Claude tự đọc context cuộc hội thoại và quyết định kích hoạt skill phù hợp.

Ví dụ — khi bạn nói:

| Câu nói của bạn | Skill tự kích hoạt |
|---|---|
| "Tôi muốn xây tính năng…" | `brainstorming` |
| "Có bug, không hiểu sao…" | `systematic-debugging` |
| "Review giúp tôi code này" | `requesting-code-review` |
| "Merge nhánh này nhé" | `finishing-a-development-branch` |
| "Viết test cho hàm này" | `test-driven-development` |

### 3.2. Hard gates — không vượt qua được

Một số skill có **HARD-GATE** — Claude bị chặn không cho làm bước sau cho đến khi bạn duyệt bước trước:

```
brainstorming có HARD-GATE:
  → KHÔNG được viết code / scaffold project / gọi skill khác
    cho đến khi đã trình spec và bạn duyệt.
```

Cái này khá nghiêm — đôi khi feel "cồng kềnh" cho task nhỏ, nhưng tránh được hậu quả tai hại của việc đoán sai requirements.

### 3.3. Subagent-driven development

Với plan có nhiều task, Claude **dispatch mỗi task cho 1 subagent fresh** (không nhớ context cuộc nói chuyện), kèm 2 vòng review:

1. **Spec compliance review** — Có đúng yêu cầu không?
2. **Code quality review** — Code có sạch, đúng convention không?

Subagent fresh tránh được việc Claude "tự đồng tình với chính mình" sau khi đã code nhiều giờ.

---

## 4. 14 skills cốt lõi

### Nhóm Collaboration (Hợp tác con người ↔ AI)

#### 4.1. `brainstorming` — Tinh chỉnh ý tưởng thành spec

- **Khi nào:** Trước khi viết bất kỳ dòng code nào cho feature mới
- **Làm gì:**
  1. Khám phá project context (đọc files, docs, commit gần đây)
  2. Hỏi clarifying questions từng cái một
  3. Đề xuất 2–3 approaches kèm trade-offs
  4. Trình design theo từng section
  5. Lưu spec vào `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
- **Output:** File spec đã commit vào repo

#### 4.2. `writing-plans` — Lập plan triển khai

- **Khi nào:** Sau khi spec được duyệt
- **Làm gì:** Chia spec thành các task **2–5 phút mỗi cái**, có:
  - File path chính xác
  - Code mẫu đầy đủ (không phải pseudo-code)
  - Bước verify cụ thể (`php artisan test --filter X`, kỳ vọng output gì)
- **Triết lý:** Plan phải đủ chi tiết để "junior dev không biết gì về project" cũng làm được

#### 4.3. `executing-plans` — Chạy plan theo batch

- **Khi nào:** Khi đã có plan, muốn chạy theo nhóm + có checkpoint với người dùng
- **Khác `subagent-driven-development`:** Có checkpoint thủ công giữa các batch

#### 4.4. `subagent-driven-development` — Chạy plan bằng nhiều subagent

- **Khi nào:** Muốn Claude làm autonomous nhiều giờ, không cần can thiệp
- **Đặc điểm:** Mỗi task → 1 subagent fresh + 2-stage review (spec + code quality)

#### 4.5. `dispatching-parallel-agents` — Chạy song song

- **Khi nào:** Có nhiều task độc lập, muốn song song hoá để tiết kiệm thời gian
- **Cẩn thận:** Chỉ song song được task **không phụ thuộc nhau** (vd không cùng sửa 1 file)

#### 4.6. `requesting-code-review` — Tự review trước khi mời người khác

- **Khi nào:** Trước khi mời teammate review
- **Làm gì:** Đối chiếu code vs plan, list issues theo severity (critical / major / minor)

#### 4.7. `receiving-code-review` — Phản hồi review

- **Khi nào:** Sau khi teammate (hoặc bot) comment review
- **Làm gì:** Phân loại từng comment (accept / push back / clarify), sửa hoặc đối thoại có dẫn chứng

#### 4.8. `using-git-worktrees` — Cô lập branch

- **Khi nào:** Bắt đầu nhánh mới
- **Làm gì:**
  - Tạo worktree riêng (`git worktree add ../<branch> <branch>`)
  - Chạy project setup (vd `composer install`, `npm ci`)
  - Verify baseline test xanh **trước** khi sửa gì

#### 4.9. `finishing-a-development-branch` — Đóng branch

- **Khi nào:** Tất cả task trong plan đã xong
- **Làm gì:**
  1. Chạy full test
  2. Hỏi bạn chọn: **merge / mở PR / giữ lại / bỏ**
  3. Cleanup worktree

### Nhóm Testing & Debugging

#### 4.10. `test-driven-development` — RED-GREEN-REFACTOR

- **Khi nào:** Trong lúc implement
- **Vòng cycle:**

| Phase | Hành động | Verify |
|---|---|---|
| **RED** | Viết test trước | Test **fail** |
| **GREEN** | Viết code tối thiểu để pass | Test **pass** |
| **REFACTOR** | Tidy lại | Test vẫn pass |
| **COMMIT** | `git commit` atomic | History sạch |

- ⚠️ Nếu code đã viết **trước** khi có test → skill này **xóa code đi**, bắt làm lại đúng thứ tự.

#### 4.11. `systematic-debugging` — Debug có hệ thống

- **Khi nào:** Có bug
- **4 phase:**

```
1. REPRODUCE  → Có repro ổn định chưa? (test fail được, không random pass/fail)
2. ISOLATE    → Bisect commit / disable feature flag / minify input
3. DIAGNOSE   → Tìm root cause THẬT (không phải symptom)
4. FIX + VERIFY → Sửa + viết test regression chống bug tái phát
```

#### 4.12. `verification-before-completion` — Verify trước khi nói "done"

- **Khi nào:** Trước khi báo cáo task hoàn thành
- **Bắt buộc:** Chạy test/lint/typecheck/build → có evidence mới được nói done

### Nhóm Meta

#### 4.13. `writing-skills` — Viết skill mới

- **Khi nào:** Bạn muốn tạo skill riêng cho team (vd workflow Hasaki)
- **Đầu ra:** Skill .md theo format chuẩn, có description trigger được Claude pick up

#### 4.14. `using-superpowers` — Bootstrap

- **Khi nào:** Tự động khi session bắt đầu
- **Làm gì:** Load toàn bộ system, đảm bảo các skill auto-trigger đúng lúc

---

## 5. Workflow mẫu — Build 1 feature từ đầu đến cuối

Giả sử bạn muốn build feature **"Đánh giá sản phẩm có upload ảnh"** cho website Hasaki.

```
┌────────────────────────────────────────────────────────────────┐
│ Bạn: "Add review có upload ảnh cho module HskChat"             │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│ [1] brainstorming (skill auto-trigger)                         │
│                                                                │
│ Claude hỏi từng câu một:                                       │
│   • Ai được upload? guest hay phải login?                      │
│   • Max bao nhiêu ảnh / 1 review?                              │
│   • Format nào? size max?                                      │
│   • Lưu S3 hay disk local? CDN của Hasaki?                     │
│   • Moderation: tự động (AI) hay duyệt thủ công?               │
│   • Có cho phép xoá ảnh sau khi đăng không?                    │
│                                                                │
│ Claude đề xuất 2-3 approaches:                                 │
│   A. Upload trực tiếp → backend xử lý                          │
│   B. Pre-signed URL → upload trực tiếp lên S3                  │
│   C. Hybrid: thumbnail backend, full-size S3                   │
│                                                                │
│ Bạn duyệt approach B.                                          │
│                                                                │
│ Claude ghi spec → docs/superpowers/specs/                      │
│   2026-05-23-review-image-upload-design.md                     │
│ → git commit                                                   │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│ [2] using-git-worktrees                                        │
│                                                                │
│ git worktree add ../HskChat-review-image feat/review-image     │
│ cd ../HskChat-review-image                                     │
│ composer install                                               │
│ npm ci                                                         │
│ php artisan test     ← baseline phải XANH trước khi đụng       │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│ [3] writing-plans                                              │
│                                                                │
│ Plan chia thành 8 task nhỏ (2-5 phút mỗi cái):                 │
│   Task 1: Migration tạo bảng review_images                     │
│   Task 2: Model + relationship Review hasMany ReviewImage      │
│   Task 3: API route POST /api/review/upload-url                │
│   Task 4: Controller generate pre-signed URL                   │
│   Task 5: API route POST /api/review (tạo review + link ảnh)   │
│   Task 6: FormRequest validate (max 5 ảnh, size, mime)         │
│   Task 7: Test integration end-to-end                          │
│   Task 8: Vue component upload UI                              │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│ [4] subagent-driven-development                                │
│                                                                │
│ Mỗi task được dispatch cho 1 subagent fresh:                   │
│   Subagent 1 → Task 1 → review spec → review quality → commit  │
│   Subagent 2 → Task 2 → ... → commit                           │
│   ...                                                          │
│                                                                │
│ Trong từng task, test-driven-development bắt:                  │
│   1. RED: viết test fail trước                                 │
│   2. GREEN: code tối thiểu pass test                           │
│   3. REFACTOR: tidy                                            │
│   4. COMMIT                                                    │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│ [5] requesting-code-review                                     │
│                                                                │
│ Claude self-review toàn bộ diff:                               │
│   • Đối chiếu với plan: thiếu gì không?                        │
│   • Critical / Major / Minor issues                            │
│   • Đảm bảo không có placeholder, debug code, secrets          │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│ [6] finishing-a-development-branch                             │
│                                                                │
│ Chạy full test → tất cả xanh.                                  │
│ Claude hỏi: Merge / mở PR / Giữ branch / Bỏ?                   │
│ Bạn chọn "mở PR" → tạo PR, cleanup worktree.                   │
└────────────────────────────────────────────────────────────────┘
```

---

## 6. Ví dụ thực tế tại Hasaki

### Ví dụ 1 — Sửa bug "promotion bị áp 2 lần"

**Trước (không Superpowers):**

> "Sửa bug promotion bị áp 2 lần khi user có voucher + sale chương trình"

❌ Claude đoán: có thể là logic OR thay vì XOR → sửa thử → push → vẫn lỗi → đoán tiếp…

**Sau (có Superpowers, kích hoạt `systematic-debugging`):**

✅ Theo 4 phase:

```
1. REPRODUCE
   - Test case: user có voucher GIAM50K + sản phẩm đang sale 20%
   - Expected: chỉ áp 1 trong 2 (cái lớn hơn)
   - Actual: áp cả 2 → giảm 70%
   - Tạo test PHPUnit reproduce được → xanh khi mở, đỏ khi điều kiện đủ ✓

2. ISOLATE
   - git bisect → commit a3f4b21 introduced bug
   - Commit này refactor PromotionService → tách cart và line discount

3. DIAGNOSE
   - Root cause: trong PromotionService::apply(), cart-level discount
     được tính sau line-level discount, nhưng base price chưa được reset
     → cộng dồn
   - KHÔNG phải symptom "voucher hiển thị sai" như user báo

4. FIX + VERIFY
   - Sửa PromotionService::apply() reset base price giữa các tier
   - Viết test regression test_promotion_does_not_stack_voucher_and_sale
   - Toàn bộ test suite vẫn xanh
   - Commit kèm reference issue
```

### Ví dụ 2 — Refactor module Elasticsearch

**Yêu cầu:** Refactor `modules/Elasticseach` (tên gốc có typo) thành `modules/Elasticsearch`, đồng thời tách query builder ra class riêng.

**Workflow:**

1. `brainstorming` hỏi: backward compatibility? alias? migration path cho production data?
2. `writing-plans` chia thành 6 task: rename folder, update autoload, tạo alias class deprecated, tách QueryBuilder, viết test, update docs
3. `using-git-worktrees` cô lập trong nhánh `refactor/elasticsearch-naming`
4. Từng task qua `test-driven-development` — đặc biệt rename phải có test đảm bảo route cũ vẫn hoạt động (alias)
5. `finishing-a-development-branch` → mở PR

### Ví dụ 3 — Thêm endpoint mới cho HSKAuth

**Yêu cầu:** "Thêm endpoint POST /api/auth/refresh-token"

✅ Với Superpowers, Claude **không** code ngay. Hỏi:

- Refresh token lưu ở đâu? (Redis? DB?)
- TTL? rotation policy?
- Có blacklist khi logout không?
- Rate limit thế nào?
- Có phải tuân theo OAuth2 RFC 6749 không?

Sau khi rõ → spec → plan → TDD → PR. Phòng trường hợp implement xong mới phát hiện thiếu blacklist hoặc sai TTL convention của team Backend Hasaki.

---

## 7. Best practices

### ✅ Nên làm

| Practice | Lý do |
|---|---|
| **Để skill auto-trigger** — đừng cố gọi tay | Skill đã được tune cho behavior tự động |
| **Trả lời clarifying questions thật kỹ** | Càng kỹ → spec càng chuẩn → code càng đúng |
| **Đọc spec Claude viết trước khi duyệt** | Đây là điểm catch sai hiểu lầm rẻ nhất |
| **Tin vào TDD ngay cả với task nhỏ** | "Task nhỏ" thường là nơi giấu bug |
| **Dùng worktree cho mọi feature** | Tránh confict, baseline test rõ ràng |
| **Verify trước khi merge** | Run test/lint, đừng tin lời "Done" |

### ❌ Tránh

| Anti-pattern | Hậu quả |
|---|---|
| Bỏ qua brainstorming vì "task đơn giản" | Hiểu sai requirement, code lại |
| Skip TDD vì "không có thời gian" | Bug ẩn quay lại cắn về sau |
| Cho phép Claude "Done" mà không verify | Build fail, regression |
| Chạy parallel cho task có dependency | Conflict, lỗi khó debug |
| Thay đổi skill mặc định không có evidence | Phá behavior đã được tune |

---

## 8. Troubleshooting

### Skill không tự kích hoạt?

```bash
# Check plugin có cài chưa
/plugin list

# Nếu chưa thấy superpowers → cài lại
/plugin install superpowers@claude-plugins-official

# Restart Claude Code
```

### Claude vẫn nhảy thẳng vào code, không brainstorm?

→ Có thể bootstrap `using-superpowers` chưa load. Restart session. Nếu vẫn không, kiểm tra harness có hỗ trợ plugin marketplace đúng cách không (xem mục 2.3).

### Plan chia task quá to (>5 phút)?

→ Yêu cầu rõ: "Plan này task #3 to quá, chia nhỏ ra dưới 5 phút mỗi task." Skill `writing-plans` sẽ revise.

### Test xanh nhưng feature không chạy thực tế?

→ Skill `verification-before-completion` chưa được trigger. Yêu cầu thẳng: "Verify feature này bằng cách thực sự chạy app, không chỉ test." Claude sẽ start dev server và thao tác qua browser/curl.

### Subagent chạy autonomous bị lạc hướng?

→ Dừng lại bằng Esc. Check `docs/superpowers/specs/` xem spec còn đúng không. Nếu spec lệch → quay lại bước brainstorming.

---

## 9. Tham khảo

### Tài liệu chính thức

- **Repo:** https://github.com/obra/superpowers
- **Bài giới thiệu của tác giả:** https://blog.fsck.com/2025/10/09/superpowers/
- **Discord:** https://discord.gg/35wsABTejz
- **Issues:** https://github.com/obra/superpowers/issues

### Files quan trọng trong folder đã clone

| File | Nội dung |
|---|---|
| `README.md` | Giới thiệu chính thức (tiếng Anh) |
| `RELEASE-NOTES.md` | Changelog các phiên bản |
| `CLAUDE.md` | Contributor guidelines (đọc TRƯỚC khi định PR) |
| `.claude-plugin/plugin.json` | Metadata plugin (version, author…) |
| `skills/<tên>/SKILL.md` | Nội dung từng skill |
| `docs/` | Docs chi tiết cho từng harness |

### Cheatsheet lệnh thường dùng

```bash
# Cài plugin
/plugin install superpowers@claude-plugins-official

# Liệt kê plugin đang có
/plugin list

# Gỡ plugin
/plugin uninstall superpowers

# Update plugin (thường auto)
/plugin update superpowers

# Trong session, gọi skill cụ thể (nếu muốn force)
"Áp dụng skill brainstorming cho task này"
"Dùng skill systematic-debugging để fix bug này"
```

---

## Phụ lục — Customize cho Hasaki (gợi ý)

Nếu muốn fork và customize cho workflow Hasaki, đề xuất:

1. **Tạo skill `hasaki-laravel-conventions`** — bắt Claude theo PSR-4 `App\` + module structure HSKAuth/HskChat/Elasticseach…
2. **Tạo skill `hasaki-pr-template`** — auto fill PR template kiểu Hasaki (link Jira ticket, screenshot UAT…)
3. **Tạo skill `hasaki-deploy-checklist`** — checklist trước khi deploy lên prod Hasaki (migration backward-compatible, feature flag…)

Cách tạo: xem `skills/writing-skills/SKILL.md` để học format. **Lưu ý:** Skill custom này KHÔNG nên PR upstream — repo gốc không nhận skill domain-specific.

---

**Tác giả tài liệu:** Tổng hợp từ Superpowers v5.1.0 — phục vụ team Hasaki
**Cập nhật lần cuối:** 2026-05-23
