# 01 — Cài đặt Husky

## Bước 1: Cài package

```bash
npm install --save-dev husky
```

Trong project này Husky đã có trong `package.json` (`^9.1.7`).

## Bước 2: `husky init` (cách nhanh)

Lệnh chuẩn từ [Get started](https://typicode.github.io/husky/get-started.html):

```bash
npx husky init
```

Tác dụng:

1. Tạo `.husky/pre-commit` mẫu
2. Thêm `"prepare": "husky"` vào `package.json`

Project 136 dùng biến thể an toàn hơn cho repo lồng nhau:

```json
"prepare": "node scripts/prepare-husky.mjs"
```

`prepare-husky.mjs` chỉ chạy `husky` khi **git root trùng** thư mục project. Điều này đúng trong 2 trường hợp: (1) folder `136_husky_git_hooks` đã `git init` thành repo độc lập, hoặc (2) bên trong `sandbox/` sau `npm run setup:sandbox`. Trong các trường hợp khác (vd. `npm install` từ repo cha lồng folder này) nó sẽ bỏ qua để **không ghi đè hook repo cha**.

## Bước 3: `prepare` và `npm install`

Sau mỗi `npm install`, npm chạy script `prepare` → Husky gán `core.hooksPath` trỏ tới `.husky/`.

Kiểm tra (trong `sandbox/`):

```bash
git config core.hooksPath
# .husky/_  (hoặc tương đương tùy phiên bản)
```

## Bước 4: Thử hook

```bash
git commit -m "feat: hello husky"
```

## Tắt hook tạm thời

| Cách | Khi nào dùng |
|------|----------------|
| `git commit --no-verify` | Một lần, bỏ qua mọi hook |
| `HUSKY=0` (env) | Tắt Husky cho session / CI |
| `HUSKY_SKIP_HOOKS=1` | Bỏ qua hook nhưng vẫn cài Husky |

Trên PowerShell:

```powershell
$env:HUSKY = "0"
git commit -m "skip hooks"
Remove-Item Env:HUSKY
```

## CI / Docker

Trên CI thường đặt `HUSKY=0` để không cài hook. Nếu chỉ cài `dependencies` (không có `devDependencies`), script `prepare` có thể fail — xem [How To — CI](https://typicode.github.io/husky/how-to.html).

## Windows

- Hook file trong `.husky/` là shell script; Husky 9 hỗ trợ Windows.
- Nếu dùng Git GUI, có thể cần `~/.config/husky/init.sh` để load nvm/fnm (docs upstream).
