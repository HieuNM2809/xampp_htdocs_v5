package main

import (
	"fmt"
	"os"
	"time"

	"github.com/spf13/cobra"
)

// Biến dùng chung cho các lệnh
var (
	verbose bool
	name    string
	format  string
)

// Root command
var rootCmd = &cobra.Command{
	Use:   "app",
	Short: "Ví dụ Cobra nâng cao (nhiều command)",
	Long:  `Demo: root command + subcommand hello/time/api, có flags & log đơn giản.`,
	PersistentPreRun: func(cmd *cobra.Command, args []string) {
		if verbose {
			fmt.Println("[DEBUG] running command:", cmd.Name())
		}
	},
}

// Subcommand: hello
var helloCmd = &cobra.Command{
	Use:   "hello",
	Short: "In lời chào",
	Run: func(cmd *cobra.Command, args []string) {
		if name == "" {
			name = "bạn"
		}
		fmt.Printf("Xin chào, %s!\n", name)
	},
}

// Subcommand: time
var timeCmd = &cobra.Command{
	Use:   "time",
	Short: "In thời gian hiện tại",
	Run: func(cmd *cobra.Command, args []string) {
		now := time.Now()
		switch format {
		case "date":
			fmt.Println(now.Format("2006-01-02"))
		case "time":
			fmt.Println(now.Format("15:04:05"))
		default:
			fmt.Println(now.Format(time.RFC3339))
		}
	},
}

// init: cấu hình flags và gắn subcommand
func init() {
	// Flags chung cho mọi lệnh
	rootCmd.PersistentFlags().BoolVarP(&verbose, "verbose", "v", false, "Bật log chi tiết")

	// Flags cho hello
	helloCmd.Flags().StringVarP(&name, "name", "n", "", "Tên để chào")

	// Flags cho time
	timeCmd.Flags().StringVarP(&format, "format", "f", "full", "Định dạng (full|date|time)")

	// Gắn subcommand vào root
	rootCmd.AddCommand(helloCmd)
	rootCmd.AddCommand(timeCmd)
}

// main: chỉ việc Execute rootCmd
func main() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}

