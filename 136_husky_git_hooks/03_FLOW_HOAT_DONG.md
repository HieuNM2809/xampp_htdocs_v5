# 03 — Flow hoạt động của Husky

Tài liệu này mô tả **cơ chế chạy** của Husky từ A→Z, bám theo đúng các file
thực tế trong demo 136. Đọc sau khi đã xem `01_HUONG_DAN_CAI_DAT.md` (cài đặt)
và `02_CAC_LOAI_HOOK.md` (các loại hook).

## Tóm tắt 1 câu

Husky **không** chép script vào `.git/hooks`. Nó trỏ `core.hooksPath` của Git
sang `.husky/_`, đặt sẵn ở đó các file **wrapper** nhỏ; khi Git kích hoạt một
hook, wrapper "nhảy ngược" ra gọi file hook bạn viết tay trong `.husky/`, rồi
**dùng exit code** để cho phép hoặc chặn thao tác Git.

```
                 ┌─────────────────────────────────────────────┐
   git commit ──▶│ Git đọc core.hooksPath = .husky/_            │
                 └───────────────────┬─────────────────────────┘
                                     ▼
            .husky/_/pre-commit  (wrapper) ──▶ .husky/_/h  (runtime)
                                                      │
                                                      ▼
                              .husky/pre-commit  (HOOK BẠN VIẾT TAY)
                                                      │
                                   exit 0 ◀───────────┴──────────▶ exit ≠ 0
                                   commit OK                       HỦY commit
```

---

## Phần 1 — Flow cài đặt (install-time)

Đây là bước gắn Husky vào Git. Chỉ chạy 1 lần sau khi clone / cài deps.

```
npm install   (hoặc: npm run prepare)
   │
   └─ npm tự chạy lifecycle script "prepare"        ← package.json
         │
         └─ "prepare": "husky"   (lệnh husky làm 2 việc bên dưới)
               │
               ├─ (1) git config core.hooksPath .husky/_
               │
               └─ (2) sinh thư mục .husky/_ :
                        ├─ wrapper cho 13 hook (pre-commit, commit-msg, …)
                        ├─ h           ← runtime
                        ├─ husky.sh    ← shim deprecated (chỉ in cảnh báo)
                        └─ .gitignore  ← nội dung "*"  (ignore cả thư mục _)
```

Kiểm chứng:

```powershell
git config core.hooksPath
# .husky/_
```

### Hai điểm cốt lõi của bước cài đặt

1. **`core.hooksPath = .husky/_` là "công tắc"** khiến mọi thứ chạy.
   Nhờ redirect này, hook nằm trong source tree (commit được) thay vì bị chôn
   trong `.git/hooks`. Đây là khác biệt nền tảng so với Git hook truyền thống.

2. **`.husky/_/.gitignore` có nội dung `*`** → toàn bộ thư mục `_` bị git
   ignore. Vì vậy:
   - Chỉ các file bạn **viết tay** trong `.husky/` (`pre-commit`, `commit-msg`,
     `pre-push`) được commit.
   - Phần `_` (wrapper + runtime) là **sinh lại mỗi lần `prepare`**.
   - ⇒ Bắt buộc phải `npm install` sau khi clone, nếu không `_` chưa tồn tại và
     hook **không** chạy (Git im lặng bỏ qua vì `core.hooksPath` chưa được set).

> **Biến thể an toàn cho repo lồng nhau:** demo bản gốc dùng
> `"prepare": "node scripts/prepare-husky.mjs"`. Script này chỉ chạy `husky`
> **khi git-root trùng project-root** (chặn việc ghi đè `core.hooksPath` của
> repo cha khi folder còn nằm trong `xampp_htdocs_v5`). Xem
> `01_HUONG_DAN_CAI_DAT.md` mục Bước 2.

---

## Phần 2 — Flow khi commit (run-time)

Khi gõ `git commit`, chuỗi gọi đầy đủ như sau:

```
git commit -m "feat: ..."
   │  Git đọc core.hooksPath = .husky/_  →  chạy .husky/_/pre-commit
   ▼
.husky/_/pre-commit                         (wrapper, ~39 byte — husky sinh)
   #!/usr/bin/env sh
   . "$(dirname "$0")/h"                     →  nạp runtime .husky/_/h
   ▼
.husky/_/h                                   (runtime ~551 byte — "bộ não")
   • n = basename "$0"            → "pre-commit"          (tên hook đang chạy)
   • s = .husky/pre-commit       → đường dẫn HOOK BẠN VIẾT TAY
   • [ ! -f "$s" ] && exit 0     → không có hook đó ⇒ thoát êm (exit 0)
   • nạp ~/.config/husky/init.sh nếu có      (load nvm/fnm cho Git GUI)
   • [ "$HUSKY" = "0" ] && exit 0            → tôn trọng biến môi trường HUSKY=0
   • export PATH="node_modules/.bin:$PATH"   → gọi được eslint/lint-staged local
   • sh -e "$s" "$@"             → CHẠY hook của bạn, forward tham số "$@"
   • c=$?  ;  exit $c            → trả NGUYÊN exit code về cho Git
   ▼
.husky/pre-commit                            (file bạn viết, vd: npm run hook:pre-commit)
   exit 0   →  Git tiếp tục tạo commit
   exit ≠0  →  Git HỦY commit
```

### Cơ chế quyết định: exit code

Đây là điểm mấu chốt. Runtime `h` chạy hook của bạn bằng `sh -e "$s" "$@"`
(cờ `-e` = gặp lệnh lỗi là dừng ngay), rồi `exit $c` trả đúng mã thoát về Git.

- Hook trả **0** → Git xem là "pass", thao tác tiếp tục.
- Hook trả **≠ 0** → Git **hủy** thao tác (commit/push bị chặn).

Runtime còn in thông báo thân thiện khi lỗi:

```
husky - pre-commit script failed (code 1)
husky - command not found in PATH=...        (riêng khi code = 127)
```

### Forward tham số `"$@"` — vì sao `commit-msg` nhận được đường dẫn message

Một số hook được Git gọi **kèm tham số**. Ví dụ `commit-msg`:

```
Git gọi:        commit-msg  <đường-dẫn-tới-COMMIT_EDITMSG>
   ▼ (wrapper → h)
h chạy:         sh -e .husky/commit-msg  "$@"      ← forward nguyên tham số
   ▼
.husky/commit-msg:   npm run hook:commit-msg -- "$1"   ← $1 = đường dẫn file message
   ▼
lib/check-commit-msg.js   đọc file đó, validate format Conventional Commits
```

Chuỗi `"$@"` → `"$1"` → `-- "$1"` chính là cách đường dẫn file message đi từ Git
xuyên qua Husky tới script Node.

---

## Phần 3 — Bên trong runtime `.husky/_/h` (giải thích từng dòng)

```sh
#!/usr/bin/env sh
[ "$HUSKY" = "2" ] && set -x          # HUSKY=2 → bật debug (in từng lệnh)
n=$(basename "$0")                    # tên hook, vd "pre-commit"
s=$(dirname "$(dirname "$0")")/$n     # từ .husky/_ lùi 1 cấp → .husky/<n>

[ ! -f "$s" ] && exit 0               # không có hook người dùng ⇒ exit 0 (no-op)

if [ -f "$HOME/.huskyrc" ]; then      # cảnh báo file cấu hình cũ đã deprecated
  echo "husky - '~/.huskyrc' is DEPRECATED, ..."
fi
i="${XDG_CONFIG_HOME:-$HOME/.config}/husky/init.sh"
[ -f "$i" ] && . "$i"                 # nạp init.sh: nơi set PATH/nvm/fnm cho GUI

[ "${HUSKY-}" = "0" ] && exit 0       # HUSKY=0 ⇒ bỏ qua, hook thành no-op

export PATH="node_modules/.bin:$PATH" # ưu tiên bin local của project
sh -e "$s" "$@"                       # >>> CHẠY HOOK NGƯỜI DÙNG <<<
c=$?                                  # lưu exit code

[ $c != 0 ] && echo "husky - $n script failed (code $c)"
[ $c = 127 ] && echo "husky - command not found in PATH=$PATH"
exit $c                               # trả exit code về Git ⇒ Git quyết định
```

Ý nghĩa thiết kế:

- **`[ ! -f "$s" ] && exit 0`**: bạn chỉ cần tạo những hook mình dùng. 13 wrapper
  luôn tồn tại trong `_`, nhưng wrapper nào không có file tương ứng trong
  `.husky/` thì thoát ngay ⇒ không gây lỗi.
- **`init.sh`**: khi commit từ Git GUI (SourceTree, GitHub Desktop…), môi trường
  shell thường thiếu PATH của nvm/fnm. Đặt code load vào `~/.config/husky/init.sh`
  để runtime tự nạp.
- **`export PATH="node_modules/.bin:$PATH"`**: nhờ dòng này hook có thể gọi thẳng
  `eslint`, `lint-staged`, `prettier`… mà không cần `npx`.

> File `.husky/_/husky.sh` (~160 byte) hiện chỉ **in cảnh báo DEPRECATED** — nó
> phục vụ hook kiểu Husky v9 cũ còn dòng `. ".../_/husky.sh"`. Hook trong demo đã
> ở format mới (one-liner sạch) nên **không** đụng tới file này.

---

## Phần 4 — 3 hook của demo ánh xạ ra gì

| Git event   | File `.husky/`        | Lệnh trong file                  | Đích cuối & tác dụng |
|-------------|-----------------------|----------------------------------|----------------------|
| `pre-commit`| `.husky/pre-commit`   | `npm run hook:pre-commit`        | `lib/check-staged.js` — quét file **staged** (`git diff --cached` + `git show :path`), **exit 1 nếu nội dung chứa `FORBIDDEN`** |
| `commit-msg`| `.husky/commit-msg`   | `npm run hook:commit-msg -- "$1"`| `lib/check-commit-msg.js` — bắt format Conventional Commits (`feat\|fix\|docs\|chore\|refactor\|test: ...`) |
| `pre-push`  | `.husky/pre-push`     | `npm run hook:pre-push`          | `npm test` → `lib/run-tests.js` chạy trước khi push |

### Sequence chi tiết — `pre-commit` chặn `FORBIDDEN`

```
git add bad.txt   (bad.txt chứa chữ FORBIDDEN)
git commit -m "feat: demo"
   ▼
.husky/_/pre-commit → h → .husky/pre-commit → npm run hook:pre-commit
   ▼
node lib/check-staged.js
   • git diff --cached --name-only --diff-filter=ACMR   → danh sách file staged
   • với mỗi file: git show :<file>                     → đọc nội dung BẢN STAGED
   • nếu chứa "FORBIDDEN":  process.exit(1)             → in lỗi + thoát ≠ 0
   ▼
h trả exit 1 về Git  →  COMMIT BỊ HỦY
```

> Lưu ý self-reference (đã ghi trong README): chính file nguồn của demo cố ý chứa
> chuỗi `FORBIDDEN` để minh hoạ, nên khi sửa/seed các file này phải dùng
> `git commit --no-verify`. Hook chỉ nên áp cho nội dung **bạn** thêm vào.

---

## Phần 5 — Cơ chế bypass (và vì sao chúng hoạt động)

| Cách | Cơ chế thực sự |
|------|----------------|
| `git commit --no-verify` (`-n`) | **Git tự** bỏ qua `pre-commit` & `commit-msg`, không thèm đọc `core.hooksPath` ⇒ Husky không tham gia. |
| `HUSKY=0` (env) | Runtime `h` gặp `[ "$HUSKY" = "0" ] && exit 0` ⇒ hook thành no-op (vẫn cài nhưng không làm gì). `prepare-husky.mjs` cũng skip **cài** khi `HUSKY=0` hoặc `CI=true`. |
| `HUSKY=2` (env) | Không bỏ qua — ngược lại **bật debug** (`set -x`), in từng lệnh shell. Dùng khi soi lỗi hook. |
| Xóa thư mục `.husky/_` | `core.hooksPath` trỏ vào chỗ trống ⇒ Git không tìm thấy hook (chạy `npm run prepare` để tạo lại). |

PowerShell:

```powershell
$env:HUSKY = "0"
git commit -m "skip hooks"
Remove-Item Env:HUSKY
```

---

## Phần 6 — Vì sao thiết kế kiểu này (lợi ích)

- **Hook version-controlled**: nằm trong `.husky/` nên commit & review được; cả
  team dùng chung, không phải chép tay vào `.git/hooks`.
- **Tự cài qua `prepare`**: `npm install` là đủ, không cần bước thủ công.
- **Một runtime chung (`h`)**: mọi hook dùng chung logic (skip, PATH, init.sh,
  exit-code), file hook người dùng chỉ cần ghi đúng 1 dòng lệnh.
- **`exit code` làm hợp đồng**: hook chỉ cần "trả 0 hoặc khác 0" — đơn giản, hợp
  với mọi ngôn ngữ script.

---

## Phụ lục — Bản đồ file liên quan

```
136_husky_git_hooks/
├── package.json              # "prepare" → cài husky; "hook:*" → logic từng hook
├── .husky/
│   ├── pre-commit            # ① bạn viết: npm run hook:pre-commit
│   ├── commit-msg            # ① bạn viết: npm run hook:commit-msg -- "$1"
│   ├── pre-push              # ① bạn viết: npm run hook:pre-push
│   └── _/                    # ② husky sinh (gitignored toàn bộ)
│       ├── h                 #    runtime "bộ não" — chạy hook + gác exit code
│       ├── husky.sh          #    shim deprecated (chỉ cảnh báo)
│       ├── .gitignore        #    nội dung "*"
│       └── pre-commit, …     #    13 wrapper, mỗi file gọi  . "$0/../h"
├── lib/
│   ├── check-staged.js       # logic pre-commit (chặn FORBIDDEN)
│   ├── check-commit-msg.js   # logic commit-msg (Conventional Commits)
│   └── run-tests.js          # logic test cho pre-push
└── scripts/
    ├── prepare-husky.mjs     # chỉ cài husky khi git-root == project-root
    └── setup-sandbox.mjs     # tạo repo sandbox để thử commit an toàn
```

Chú thích: ① = bạn viết tay & commit · ② = husky sinh tự động khi `prepare`.
