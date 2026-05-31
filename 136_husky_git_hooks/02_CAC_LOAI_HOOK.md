# 02 — Các loại hook trong demo

Husky hỗ trợ **13 client-side Git hooks**. Demo 136 dùng 3 hook hay gặp nhất.

## pre-commit

Chạy **trước** khi Git tạo commit (sau khi bạn gõ message, trước khi ghi object).

File: `.husky/pre-commit` → `npm run hook:pre-commit` → `lib/check-staged.js`

- Quét file **đang staged**
- Fail nếu nội dung chứa chuỗi `FORBIDDEN` (ví dụ học cách chặn secret/debug)

## commit-msg

Chạy với **đường dẫn file** chứa message commit (tham số `$1`).

File: `.husky/commit-msg` → `npm run hook:commit-msg -- "$1"`

- Bắt format: `type: mô tả` với `type` ∈ `feat|fix|docs|chore|refactor|test`
- Ví dụ hợp lệ: `feat: thêm hook demo`

## pre-push

Chạy **trước** `git push` (kiểm tra test, build…).

File: `.husky/pre-push` → `npm run hook:pre-push` → `npm test`

## Thêm hook mới

Tạo file trong `.husky/` (không cần extension):

```bash
# Linux/macOS/Git Bash
echo "npm run lint" > .husky/pre-commit
```

Hoặc copy từ hook có sẵn và sửa lệnh.

Danh sách đầy đủ: https://git-scm.com/docs/githooks

## Kết hợp lint-staged (gợi ý production)

Pre-commit thường gọi:

```json
"lint-staged": { "*.js": "eslint --fix" }
```

Và trong `.husky/pre-commit`:

```sh
npx lint-staged
```

Demo 136 cố ý **không** thêm lint-staged để giữ dependency tối thiểu.
