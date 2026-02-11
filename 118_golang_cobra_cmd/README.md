## Ví dụ Cobra CLI với Go

Repo này minh họa cách dùng thư viện Cobra để viết CLI trong Go, tham khảo từ dự án gốc [`github.com/spf13/cobra`](https://github.com/spf13/cobra).

### 1. Cài đặt

```bash
go mod tidy
```

### 2. Ví dụ cơ bản (đang trong `main.go`)

Hiện tại app có **1 root command**:

```bash
go run .
go run . --name=Hoang
go run . -n Hoang
```

Chức năng: in lời chào, nhận flag `--name` / `-n`.

### 3. Ví dụ nâng cao (gợi ý cấu trúc)

Để nâng cấp thành CLI “xịn” hơn, bạn có thể:

- **Tách `rootCmd` ra package `cmd`** (theo style Cobra):
  - `main.go` chỉ gọi `cmd.Execute()`.
  - Trong `cmd/root.go` định nghĩa root command, persistent flags (`--config`, `--verbose`…).
- **Thêm subcommand**:
  - `hello` : in lời chào, có flag `--name`.
  - `serve` : chạy HTTP server demo, có flag `--port`, `--host`.
  - `task` : nhóm lệnh `task add`, `task list` để minh họa subcommand lồng nhau.
- **Dùng các tính năng Cobra khác**:
  - `PersistentPreRun` / `PreRun` để xử lý chung (log, đọc config…).
  - `Args` để validate tham số (`cobra.MinimumNArgs`, `cobra.ExactArgs`…).
  - Tự sinh help: `app --help`, `app help task`.

Ví dụ skeleton nâng cao (ý tưởng ngắn gọn):

```go
rootCmd := &cobra.Command{ Use: "app" }

helloCmd := &cobra.Command{
  Use: "hello",
  Run: func(cmd *cobra.Command, args []string) { /* ... */ },
}

serveCmd := &cobra.Command{
  Use: "serve",
  RunE: func(cmd *cobra.Command, args []string) error { /* ... */ return nil },
}

rootCmd.AddCommand(helloCmd, serveCmd)
```

Bạn có thể dùng README này để làm “ghi chú” rồi chỉnh `main.go` thành ví dụ nhiều command khi cần.

