package main

import (
	"fmt"
	"math/rand"
	"strings"
	"sync"
	"time"

	"github.com/spf13/cobra"
)

var (
	jobCount       int
	jobConcurrency int
	jobFailAfter   int
)

// jobCmd: ví dụ nâng cao - chạy nhiều "task" song song với progress tổng
var jobCmd = &cobra.Command{
	Use:   "job",
	Short: "Chạy nhiều tác vụ song song (demo concurrency + progress)",
	Long: `Ví dụ nâng cao: tạo N tác vụ giả lập chạy song song với số worker cấu hình được.
Hiển thị progress tổng số task đã xong / tổng số task, và có thể mô phỏng lỗi.`,
	Args: cobra.NoArgs,
	RunE: func(cmd *cobra.Command, args []string) error {
		if jobCount <= 0 {
			jobCount = 10
		}
		if jobConcurrency <= 0 {
			jobConcurrency = 3
		}

		if verbose {
			fmt.Printf("[DEBUG] job count=%d, concurrency=%d, fail-after=%d\n", jobCount, jobConcurrency, jobFailAfter)
		}

		tasks := make(chan int)
		results := make(chan error)

		var wg sync.WaitGroup

		// Worker goroutines
		for w := 0; w < jobConcurrency; w++ {
			wg.Add(1)
			go func(workerID int) {
				defer wg.Done()
				rnd := rand.New(rand.NewSource(time.Now().UnixNano() + int64(workerID)))
				for id := range tasks {
					// Giả lập thời gian xử lý mỗi task
					delay := time.Duration(200+rnd.Intn(800)) * time.Millisecond
					time.Sleep(delay)

					// Mô phỏng lỗi nếu vượt ngưỡng fail-after
					if jobFailAfter > 0 && id >= jobFailAfter {
						results <- fmt.Errorf("task %d failed (demo lỗi)", id)
					} else {
						results <- nil
					}
				}
			}(w + 1)
		}

		// Gửi task
		go func() {
			for i := 1; i <= jobCount; i++ {
				tasks <- i
			}
			close(tasks)
		}()

		// Đóng results khi tất cả worker xong
		go func() {
			wg.Wait()
			close(results)
		}()

		// Thu kết quả + vẽ progress
		done := 0
		failed := 0
		for err := range results {
			done++
			if err != nil {
				failed++
				if verbose {
					fmt.Println("\n[ERROR]", err)
				}
			}
			drawJobProgress(done, jobCount, failed)
		}
		fmt.Println()

		if failed > 0 {
			return fmt.Errorf("%d/%d task failed (demo lỗi)", failed, jobCount)
		}

		fmt.Println("Tất cả task đã hoàn thành thành công.")
		return nil
	},
}

// drawJobProgress hiển thị progress bar cho nhiều task
func drawJobProgress(done, total, failed int) {
	if total <= 0 {
		return
	}
	percent := done * 100 / total
	const width = 30
	filled := percent * width / 100
	bar := strings.Repeat("█", filled) + strings.Repeat(" ", width-filled)
	fmt.Printf("\r[%s] %3d%%  (%d/%d, failed=%d)", bar, percent, done, total, failed)
}

func init() {
	// Gắn command job vào root
	rootCmd.AddCommand(jobCmd)

	// Flags cho job
	jobCmd.Flags().IntVar(&jobCount, "count", 10, "Số lượng task cần chạy")
	jobCmd.Flags().IntVar(&jobConcurrency, "concurrency", 3, "Số worker chạy song song")
	jobCmd.Flags().IntVar(&jobFailAfter, "fail-after", 0, "Bắt đầu mô phỏng lỗi từ task N (0 = không lỗi)")
}

