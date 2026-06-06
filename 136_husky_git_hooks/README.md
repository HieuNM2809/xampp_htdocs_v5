# Husky — Git hooks dễ dàng (demo 136)

Học [Husky](https://github.com/typicode/husky): gắn script vào Git hooks (`pre-commit`, `commit-msg`, `pre-push`) qua thư mục `.husky/`, cài tự động sau `npm install` nhờ script `prepare`.

> Repo tham khảo: https://github.com/typicode/husky · Docs: https://typicode.github.io/husky

## Cấu trúc

```
136_husky_git_hooks/
├── README.md
├── 01_HUONG_DAN_CAI_DAT.md      # Cài đặt, husky init, prepare
├── 02_CAC_LOAI_HOOK.md          # pre-commit / commit-msg / pre-push
├── package.json
├── .husky/
│   ├── pre-commit
│   ├── commit-msg
│   └── pre-push
├── lib/
│   ├── check-staged.js          # Chặn commit nếu file staged có "FORBIDDEN"
│   └── check-commit-msg.js      # Conventional Commits đơn giản
├── scripts/
│   ├── prepare-husky.mjs        # Chỉ chạy husky khi thư mục này là git root
│   └── setup-sandbox.mjs        # Tạo repo demo riêng để thử commit
└── sandbox/                     # (sau setup) repo Git mini, an toàn để học
```

## Yêu cầu

- Node.js 18+
- Git 2.13+ (`core.hooksPath`)
- npm (hoặc pnpm/yarn — xem `01_HUONG_DAN_CAI_DAT.md`)

## Quick start

> **Cập nhật setup:** Folder `136_husky_git_hooks` giờ là **git repo độc lập** (đã `git init` riêng). Vì git-root trùng project-root nên `prepare-husky.mjs` **tự cài hook** sau `npm install` / `npm run prepare`. Commit ngay trong folder này sẽ **tự** chạy hook — không bắt buộc sandbox. Repo cha `xampp_htdocs_v5` **không** bị ảnh hưởng (nó có `core.hooksPath` riêng, không bị đụng).

### Cách 1 — commit trực tiếp trong 136 (mặc định)

```powershell
cd E:\xampp_htdocs_v5\136_husky_git_hooks
npm install                 # prepare → husky cài hook vào .husky/_
git config core.hooksPath   # kỳ vọng in ra: .husky/_
```

Sau đó commit (mục "Thử commit" bên dưới) sẽ tự kích hoạt pre-commit + commit-msg.

### Cách 2 — sandbox tách biệt (tùy chọn)

Khi muốn một repo "trắng" hoàn toàn, không vướng file nguồn của chính demo:

```powershell
npm run setup:sandbox
cd sandbox
```

Thử commit **thành công**:

```powershell
echo "ok" > demo.txt
git add demo.txt
git commit -m "feat: thử hook husky"
```

Thử commit **bị chặn** (pre-commit):

```powershell
echo "FORBIDDEN demo" > bad.txt
git add bad.txt
git commit -m "feat: sẽ fail pre-commit"
```

Thử message **sai format** (commit-msg):

```powershell
git add demo.txt
git commit -m "sai format commit"
```

Bỏ qua hook (khẩn cấp):

```powershell
git commit -m "wip" --no-verify
# hoặc: $env:HUSKY=0; git commit -m "wip"
```

> ⚠️ **Lưu ý self-reference:** chính file nguồn của demo (`README.md`, `02_CAC_LOAI_HOOK.md`, `lib/check-staged.js`) **cố ý chứa chuỗi `FORBIDDEN`** để minh hoạ. Vì vậy commit baseline / chỉnh sửa các file này sẽ bị pre-commit chặn — dùng `git commit --no-verify` khi seed hoặc bảo trì source của demo. Hook chỉ nên áp dụng cho nội dung **bạn** thêm vào (như trong sandbox).

## Scripts npm

| Script | Mô tả |
|--------|--------|
| `npm run setup:sandbox` | Copy cấu hình + `git init` + `npm install` trong `sandbox/` |
| `npm run hook:pre-commit` | Logic pre-commit (gọi từ `.husky/pre-commit`) |
| `npm run hook:commit-msg` | Kiểm tra message (nhận file path từ Git) |
| `npm run hook:pre-push` | Chạy test demo trước push |
| `npm test` | Test đơn giản cho pre-push |
| `npm run docs:01` | In hướng dẫn bước 1 |
| `npm run docs:02` | In hướng dẫn bước 2 |

## Liên quan

- **lint-staged**: chỉ lint file đang staged (thường dùng cùng Husky).
- **Husky v4 → v9**: config cũ trong `package.json` → file trong `.husky/` (xem docs upstream).
