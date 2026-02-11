## Ví dụ Cobra CLI với Go

Repo này minh họa cách dùng thư viện Cobra để viết CLI trong Go, tham khảo từ dự án gốc [`github.com/spf13/cobra`](https://github.com/spf13/cobra).

### 1. Cài đặt

```bash
go mod tidy
```

### 2. Cấu trúc hiện tại

Toàn bộ logic nằm trong `main.go` và `api.go`:

- **Root command**: `app`
  - Flag chung: `-v, --verbose` để bật log `[DEBUG]`.
- **Subcommand**:
  - `hello` – in lời chào, flag `--name` / `-n`.
  - `time` – in thời gian hiện tại, flag `--format` / `-f` (`full|date|time`).
  - `api` – gọi HTTP API demo + hiển thị thanh progress dạng text.

### 3. Cách chạy nhanh

- **Xem help & danh sách lệnh**:

```bash
go run . --help
go run . api --help
```

- **Lệnh `hello`**:

```bash
go run . hello
go run . hello --name=Hoang
go run . hello -n Hoang -v
```

- **Lệnh `time`**:

```bash
go run . time
go run . time --format=date
go run . time -f time -v
```

- **Lệnh `api` (gọi HTTP API + progress bar)**:

```bash
go run . api
go run . api --url=https://jsonplaceholder.typicode.com/todos/2
go run . api --timeout=2s -v
```

Lệnh `api` mặc định gọi JSONPlaceholder (`/todos/1`), vẽ thanh tiến trình từ 0% → 100%, sau đó parse JSON và in các field ra màn hình.

### 4. Gợi ý nâng cấp thêm

- Tách code sang package `cmd` theo style generator của Cobra (`cmd/root.go`, `cmd/hello.go`, `cmd/api.go`…).
- Dùng thêm:
  - `Args` để validate tham số (`cobra.MinimumNArgs`, `cobra.ExactArgs`…).
  - Đọc config thật bằng `viper`.
  - Sinh autocomplete shell, man page… giống hướng dẫn trong repo Cobra gốc.

