//go:build !cgo

package main

import "fmt"

// --- Pure Go implementations (fallback khi CGO_ENABLED=0) ---

func goAdd(a, b int) int {
	return a + b
}

func goMultiply(a, b float64) float64 {
	return a * b
}

func goGreet(name string) {
	fmt.Printf("Xin chào từ Go (Pure): %s!\n", name)
}

func goReverseString(s string) string {
	runes := []rune(s)
	for i, j := 0, len(runes)-1; i < j; i, j = i+1, j-1 {
		runes[i], runes[j] = runes[j], runes[i]
	}
	return string(runes)
}

func run() {
	fmt.Println("=== VÍ DỤ CƠ BẢN VỀ CGO ===")
	fmt.Println()

	// ---- 1. Cộng hai số ----
	fmt.Println("--- 1. Gọi hàm add() ---")
	a, b := 10, 25
	sum := goAdd(a, b)
	fmt.Printf("add(%d, %d) = %d\n", a, b, sum)
	fmt.Println()

	// ---- 2. Nhân hai số ----
	fmt.Println("--- 2. Gọi hàm multiply() ---")
	x, y := 3.14, 2.0
	product := goMultiply(x, y)
	fmt.Printf("multiply(%.2f, %.2f) = %.4f\n", x, y, product)
	fmt.Println()

	// ---- 3. In lời chào ----
	fmt.Println("--- 3. Gọi hàm greet() ---")
	goGreet("Golang Developer")
	fmt.Println()

	// ---- 4. Đảo ngược chuỗi ----
	fmt.Println("--- 4. Gọi hàm reverseString() ---")
	input := "Hello, CGO!"
	reversed := goReverseString(input)
	fmt.Printf("reverseString(%q) = %q\n", input, reversed)
	fmt.Println()

	// ---- 5. Kiểu dữ liệu ----
	fmt.Println("--- 5. Các kiểu dữ liệu trong Go ---")
	var goInt int = 42
	var goFloat32 float32 = 3.14
	var goFloat64 float64 = 2.71828
	var goRune rune = 65 // 'A'

	fmt.Printf("int(%d)      → %d\n", goInt, goInt)
	fmt.Printf("float32(%f) → %f\n", goFloat32, goFloat32)
	fmt.Printf("float64(%f) → %f\n", goFloat64, goFloat64)
	fmt.Printf("rune(%d)    → %c\n", goRune, goRune)

	fmt.Println()
	fmt.Println("[Mode: Pure Go (CGO_ENABLED=0)]")
}
