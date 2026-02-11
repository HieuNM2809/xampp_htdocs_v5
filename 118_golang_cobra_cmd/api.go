package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/spf13/cobra"
)

var (
	apiURL     string
	apiTimeout time.Duration
)

// Cấu trúc JSON demo (phù hợp với https://jsonplaceholder.typicode.com/todos/1)
type demoTodo struct {
	UserID    int    `json:"userId"`
	ID        int    `json:"id"`
	Title     string `json:"title"`
	Completed bool   `json:"completed"`
}

// apiCmd: command nâng cao - gọi HTTP API + thanh progress
var apiCmd = &cobra.Command{
	Use:   "api",
	Short: "Gọi HTTP API demo và hiển thị kết quả",
	Long: `Ví dụ nâng cao: gọi HTTP API (GET) và hiển thị thanh tiến trình dạng text. Mặc định gọi JSONPlaceholder (fake API) để lấy 1 todo.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		if verbose {
			fmt.Println("[DEBUG] URL:", apiURL)
			fmt.Println("[DEBUG] Timeout:", apiTimeout)
		}

		fmt.Println("Bắt đầu gọi API:", apiURL)
		fmt.Println("Đang xử lý, vui lòng đợi...")

		// Thanh progress giả lập (0 -> 100%)
		for i := 0; i <= 100; i += 10 {
			drawProgressBar(i)
			time.Sleep(80 * time.Millisecond)
		}
		fmt.Println() // xuống dòng sau progress bar

		client := &http.Client{
			Timeout: apiTimeout,
		}

		resp, err := client.Get(apiURL)
		if err != nil {
			return fmt.Errorf("lỗi khi gọi API: %w", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			body, _ := io.ReadAll(resp.Body)
			return fmt.Errorf("API trả về status %d: %s", resp.StatusCode, string(body))
		}

		data, err := io.ReadAll(resp.Body)
		if err != nil {
			return fmt.Errorf("lỗi đọc body: %w", err)
		}

		var todo demoTodo
		if err := json.Unmarshal(data, &todo); err != nil {
			return fmt.Errorf("lỗi parse JSON: %w", err)
		}

		fmt.Println("Kết quả JSON:")
		fmt.Printf("  ID       : %d\n", todo.ID)
		fmt.Printf("  UserID   : %d\n", todo.UserID)
		fmt.Printf("  Title    : %s\n", todo.Title)
		fmt.Printf("  Completed: %v\n", todo.Completed)

		return nil
	},
}

// Hàm vẽ thanh progress đơn giản
func drawProgressBar(percent int) {
	const width = 30
	filled := percent * width / 100
	bar := strings.Repeat("█", filled) + strings.Repeat(" ", width-filled)
	fmt.Printf("\r[%s] %3d%%", bar, percent)
}

func init() {
	// Gắn command api vào root
	rootCmd.AddCommand(apiCmd)

	// Flags cho api
	apiCmd.Flags().StringVar(&apiURL, "url", "https://jsonplaceholder.typicode.com/todos/1", "URL API để gọi")
	apiCmd.Flags().DurationVar(&apiTimeout, "timeout", 5*time.Second, "Timeout khi gọi API")
}

