# 📦 pnpm — Hướng dẫn toàn diện

> **pnpm** = **P**erformant **N**ode **P**ackage **M**anager  
> Ra đời năm 2017 bởi [Zoltan Kochan](https://github.com/zkochan), giải quyết các vấn đề mà npm và yarn để lại.

---

## Mục lục

1. [pnpm là gì?](#1-pnpm-là-gì)
2. [So sánh các package manager](#2-so-sánh-các-package-manager)
3. [Cơ chế hoạt động](#3-cơ-chế-hoạt-động)
4. [Cài đặt](#4-cài-đặt)
5. [Các lệnh cơ bản](#5-các-lệnh-cơ-bản)
6. [Workspace / Monorepo](#6-workspace--monorepo)
7. [Cấu hình nâng cao](#7-cấu-hình-nâng-cao)
8. [Khi nào nên dùng pnpm?](#8-khi-nào-nên-dùng-pnpm)

---

## 1. pnpm là gì?

pnpm là **package manager cho Node.js** — thay thế cho `npm` và `yarn` với ba ưu điểm cốt lõi:

| Ưu điểm | Mô tả |
|---|---|
| ⚡ **Nhanh hơn** | Cài đặt nhanh hơn npm ~3x nhờ hard link và parallel install |
| 💾 **Tiết kiệm đĩa** | Lưu package 1 lần toàn máy, dùng hard link thay vì copy |
| 🔒 **An toàn hơn** | Ngăn chặn phantom dependency — lỗi phổ biến của npm/yarn |

---

## 2. So sánh các package manager

### 2.1 Các loại package manager phổ biến cho Node.js

| Package Manager | Tổ chức | Ra đời | Ngôn ngữ viết |
|---|---|---|---|
| **npm** | npm Inc. / GitHub | 2010 | JavaScript |
| **yarn** (Classic) | Facebook | 2016 | JavaScript |
| **yarn** (Berry/v2+) | Community | 2020 | TypeScript |
| **pnpm** | Community | 2017 | TypeScript |
| **bun** | Oven.sh | 2023 | Zig |

---

### 2.2 Bảng so sánh chi tiết

| Tiêu chí | npm | yarn Classic | yarn Berry | pnpm | bun |
|---|---|---|---|---|---|
| **Tốc độ (cold)** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Tốc độ (cache)** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Dung lượng đĩa** | ❌ Cao | ❌ Cao | ⚠️ Trung bình | ✅ Thấp nhất | ✅ Thấp |
| **node_modules** | Flat | Flat | Không có (PnP) | Virtual store | Flat |
| **Phantom deps** | ❌ Dễ xảy ra | ❌ Dễ xảy ra | ✅ Không có | ✅ Không có | ❌ Dễ xảy ra |
| **Workspace** | ✅ (v7+) | ✅ | ✅ | ✅ Tốt nhất | ✅ |
| **Lock file** | `package-lock.json` | `yarn.lock` | `yarn.lock` | `pnpm-lock.yaml` | `bun.lockb` |
| **Hỗ trợ offline** | ⚠️ Hạn chế | ✅ | ✅ | ✅ | ✅ |
| **Độ ổn định** | ✅ Cao nhất | ✅ Cao | ⚠️ Trung bình | ✅ Cao | ⚠️ Còn mới |
| **Cộng đồng** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |

---

### 2.3 Benchmark tốc độ (theo [pnpm.io](https://pnpm.io/benchmarks))

| Kịch bản | npm | yarn | pnpm |
|---|---|---|---|
| Install (no cache, no lockfile) | 15.1s | 14.5s | **5.4s 🏆** |
| Install (with cache, no lockfile) | 7.8s | 8.2s | **1.1s 🏆** |
| Install (with cache + lockfile) | 5.2s | 4.9s | **1.4s 🏆** |
| Kích thước `node_modules` | 167 MB | 159 MB | **47 MB 🏆** |

---

### 2.4 So sánh cú pháp lệnh

| Hành động | npm | yarn | pnpm |
|---|---|---|---|
| Cài tất cả deps | `npm install` | `yarn` | `pnpm install` |
| Thêm package | `npm install pkg` | `yarn add pkg` | `pnpm add pkg` |
| Thêm devDep | `npm install -D pkg` | `yarn add -D pkg` | `pnpm add -D pkg` |
| Cài global | `npm install -g pkg` | `yarn global add pkg` | `pnpm add -g pkg` |
| Gỡ package | `npm uninstall pkg` | `yarn remove pkg` | `pnpm remove pkg` |
| Chạy script | `npm run dev` | `yarn dev` | `pnpm dev` |
| Cập nhật | `npm update` | `yarn upgrade` | `pnpm update` |
| Xem lỗi thời | `npm outdated` | `yarn outdated` | `pnpm outdated` |
| Xem danh sách | `npm list` | `yarn list` | `pnpm list` |
| Chạy bin | `npx <cmd>` | `yarn dlx <cmd>` | `pnpm dlx <cmd>` |
| Kiểm tra audit | `npm audit` | `yarn audit` | `pnpm audit` |

---

## 3. Cơ chế hoạt động

### 3.1 npm/yarn — Flat `node_modules` (vấn đề)

```
project/
└── node_modules/
    ├── express/          ← bạn cài
    ├── qs/               ← dep của express (KHÔNG khai báo trong package.json!)
    ├── path-to-regexp/   ← dep của express (KHÔNG khai báo trong package.json!)
    └── accepts/          ← dep của express (KHÔNG khai báo trong package.json!)
```

❌ **Phantom dependency**: Bạn có thể `import 'qs'` dù không khai báo trong `package.json`.  
Nếu express cập nhật và bỏ `qs` → code bạn bị lỗi runtime mà không có cảnh báo lúc build!

---

### 3.2 pnpm — Virtual Store + Hard Link (giải pháp)

```
~/.pnpm-store/                    ← Global content-addressable store (toàn máy)
└── v3/files/
    └── express@4.21.2/           ← Lưu 1 lần duy nhất

project/
└── node_modules/
    ├── express → .pnpm/express@4.21.2/  ← symlink (chỉ package bạn khai báo)
    └── .pnpm/
        └── express@4.21.2/
            └── node_modules/
                ├── express/    ← hard link đến store
                ├── qs/         ← deps của express (ẩn, không accessible từ root)
                └── accepts/    ← deps của express (ẩn)
```

✅ **Kết quả**:
- `import 'express'` → ✅ hoạt động (bạn khai báo)
- `import 'qs'` → ❌ lỗi (không khai báo) → an toàn!

---

### 3.3 Tiết kiệm dung lượng — minh họa

**Tình huống**: 3 project cùng dùng Express v4 (~50MB)

```
npm/yarn:                          pnpm:
──────────────────────             ──────────────────────────────────
project-a/node_modules/  50MB      ~/.pnpm-store/express@4  → 50MB
project-b/node_modules/  50MB      project-a/node_modules/  → hard link (~0KB)
project-c/node_modules/  50MB      project-b/node_modules/  → hard link (~0KB)
                       ──────      project-c/node_modules/  → hard link (~0KB)
Tổng:                 150MB                                ──────────
                                   Tổng:                   ~50MB 🏆
```

💡 **Tiết kiệm: 100MB (67%)** — Hiệu quả tăng theo số project!

---

### 3.4 yarn Berry (PnP) — Plug'n'Play

yarn Berry dùng cách tiếp cận khác: **không có `node_modules`** !

```
project/
├── .yarn/
│   ├── cache/          ← packages nén dạng zip
│   └── releases/
├── .pnp.cjs            ← runtime resolver map
└── package.json
```

✅ Ưu điểm: Không cần `node_modules`, cài đặt gần như tức thì  
❌ Nhược điểm: Không tương thích với nhiều tool (IDE, native addons), khó debug

---

## 4. Cài đặt

### Cách 1 — Qua npm (khuyến nghị)
```bash
npm install -g pnpm
```

### Cách 2 — Standalone script

```powershell
# Windows (PowerShell)
iwr https://get.pnpm.io/install.ps1 -useb | iex

# macOS/Linux
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

### Cách 3 — Winget (Windows)
```powershell
winget install pnpm
```

### Cách 4 — Homebrew (macOS)
```bash
brew install pnpm
```

### Cách 5 — Corepack (Node.js 16+, không cần cài thêm)
```bash
# Bật corepack
corepack enable

# Dùng pnpm phiên bản mới nhất
corepack prepare pnpm@latest --activate

# Hoặc khai báo trong package.json
# "packageManager": "pnpm@10.11.0"
# → corepack tự động dùng đúng version
```

### Kiểm tra sau cài đặt
```bash
pnpm --version      # 10.11.0
pnpm store path     # Xem vị trí global store
```

---

## 5. Các lệnh cơ bản

### 5.1 Khởi tạo project

```bash
# Khởi tạo package.json mới
pnpm init

# Khởi tạo với template
pnpm create vite my-app
pnpm create next-app my-app
```

### 5.2 Cài đặt dependencies

```bash
# Cài tất cả deps từ package.json
pnpm install
pnpm i                   # viết tắt

# Thêm package vào dependencies
pnpm add express
pnpm add express@4.21.2  # cài version cụ thể

# Thêm vào devDependencies
pnpm add -D typescript
pnpm add -D eslint prettier

# Thêm vào peerDependencies
pnpm add --save-peer react

# Cài package global
pnpm add -g nodemon
pnpm add -g @nestjs/cli
```

### 5.3 Xóa package

```bash
pnpm remove express
pnpm remove -D typescript   # gỡ khỏi devDeps
pnpm remove -g nodemon      # gỡ global
```

### 5.4 Chạy scripts

```bash
# Chạy script định nghĩa trong package.json
pnpm run dev
pnpm run build
pnpm run test

# Viết tắt (không cần 'run')
pnpm dev
pnpm build
pnpm test

# Chạy binary trong node_modules/.bin
pnpm exec tsc
pnpm exec eslint src/

# Chạy package không cài (giống npx)
pnpm dlx create-react-app my-app
pnpm dlx serve dist/
```

### 5.5 Cập nhật packages

```bash
# Xem packages lỗi thời
pnpm outdated

# Cập nhật tất cả (theo semver trong package.json)
pnpm update

# Cập nhật lên phiên bản mới nhất (bỏ qua semver range)
pnpm update --latest

# Cập nhật package cụ thể
pnpm update express
pnpm update express --latest
```

### 5.6 Xem thông tin

```bash
# Liệt kê packages đã cài
pnpm list
pnpm list --depth=0     # chỉ top-level

# Xem thông tin package
pnpm info express
pnpm info express versions  # xem tất cả versions

# Kiểm tra bảo mật
pnpm audit
pnpm audit --fix
```

### 5.7 Quản lý store

```bash
# Xem vị trí global store
pnpm store path

# Dọn dẹp cache không dùng đến
pnpm store prune

# Kiểm tra tính toàn vẹn của store
pnpm store verify
```

---

## 6. Workspace / Monorepo

pnpm có **hỗ trợ workspace tốt nhất** trong số các package managers.

### 6.1 Cấu trúc

```
my-monorepo/
├── pnpm-workspace.yaml     ← khai báo workspace
├── package.json            ← root (thường không có deps)
├── packages/
│   ├── shared/             ← thư viện dùng chung
│   │   └── package.json    { "name": "@myapp/shared" }
│   ├── api/
│   │   └── package.json    { "name": "@myapp/api" }
│   └── web/
│       └── package.json    { "name": "@myapp/web" }
└── apps/
    └── mobile/
        └── package.json
```

### 6.2 `pnpm-workspace.yaml`

```yaml
packages:
  - 'packages/*'
  - 'apps/*'
  - '!**/test/**'   # loại trừ thư mục test
```

### 6.3 Lệnh workspace

```bash
# Cài deps cho toàn bộ workspace
pnpm install

# Chạy script ở tất cả packages (-r = recursive)
pnpm -r run build
pnpm -r run test
pnpm -r run lint

# Thêm dep cho 1 package cụ thể (-F = --filter)
pnpm -F @myapp/api add express
pnpm -F @myapp/web add react react-dom

# Dùng internal package
pnpm -F @myapp/web add @myapp/shared

# Chạy script ở package cụ thể
pnpm -F @myapp/api run dev
```

### 6.4 Khai báo internal package trong `package.json`

```json
// packages/web/package.json
{
  "name": "@myapp/web",
  "dependencies": {
    "@myapp/shared": "workspace:*"   // dùng version từ workspace
  }
}
```

`workspace:*` → pnpm tự resolve sang package nội bộ thay vì tải từ npm registry.

---

## 7. Cấu hình nâng cao

### 7.1 `.npmrc` — file cấu hình pnpm

```ini
# Khai báo registry
registry=https://registry.npmjs.org/

# Cho phép package ngoài workspace dùng hoist
shamefully-hoist=false          # mặc định: false (strict mode)

# Tắt kiểm tra peer dependencies
strict-peer-dependencies=false

# Số lượng worker song song khi cài
network-concurrency=16

# Lưu store ở vị trí tùy chỉnh
store-dir=/path/to/custom/store

# Tự động cài peer deps
auto-install-peers=true
```

> ⚠️ `shamefully-hoist=true` giúp tương thích với tool cũ nhưng **mất đi lợi ích** của pnpm (phantom deps có thể quay trở lại).

### 7.2 `package.json` — khai báo packageManager

```json
{
  "packageManager": "pnpm@10.11.0"
}
```

Khi có trường này, **corepack** sẽ tự động dùng đúng phiên bản pnpm — tránh lỗi do version khác nhau giữa các máy.

### 7.3 `.pnpmfile.cjs` — hook tuỳ chỉnh

```js
// Chỉnh sửa deps trước khi cài
module.exports = {
  hooks: {
    readPackage(pkg) {
      // Buộc dùng version cụ thể
      if (pkg.dependencies && pkg.dependencies['lodash']) {
        pkg.dependencies['lodash'] = '4.17.21';
      }
      return pkg;
    }
  }
};
```

---

## 8. Khi nào nên dùng pnpm?

### ✅ Nên dùng pnpm khi:

- **Monorepo / Workspace** — pnpm workspace là tốt nhất hiện tại
- **Nhiều project trên cùng một máy** — tiết kiệm đĩa cực lớn
- **CI/CD** — cài nhanh hơn, cache thông minh hơn
- **Team cần kiểm soát dependencies chặt** — ngăn phantom deps
- **Project Node.js mới** — không có lý do gì để không dùng pnpm

### ⚠️ Cân nhắc khi:

- Dự án có nhiều **native addons** (node-gyp) → có thể gặp vấn đề với symlink
- Team không quen → cần thời gian học thêm một chút
- Dùng **Plug'n'Play của yarn Berry** → đã giải quyết vấn đề theo cách khác

### ❌ Không cần pnpm khi:

- Dùng **Bun** làm runtime → dùng `bun install` luôn (nhanh hơn pnpm)
- Project rất nhỏ, không quan tâm dung lượng đĩa

---

### Tóm tắt quyết định

```
Bắt đầu project mới?
├── Dùng Bun runtime? → bun install
├── Monorepo lớn?     → pnpm (tốt nhất cho workspace)
├── Team quen yarn?   → yarn berry (PnP) hoặc pnpm
└── Mặc định?         → pnpm (an toàn, nhanh, tiết kiệm)

Dự án cũ đang dùng npm?
└── Migrate sang pnpm: xóa node_modules + package-lock.json → pnpm import → pnpm install
```

---

## Tài liệu tham khảo

- 📖 [pnpm.io](https://pnpm.io) — Tài liệu chính thức
- 📊 [pnpm Benchmarks](https://pnpm.io/benchmarks) — Kết quả benchmark
- 🐙 [github.com/pnpm/pnpm](https://github.com/pnpm/pnpm) — Source code
- 🔄 [Migrate từ npm sang pnpm](https://pnpm.io/installation#migrating-from-npm)
