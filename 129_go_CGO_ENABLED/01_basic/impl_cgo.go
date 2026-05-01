//go:build cgo

package main

/*
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Hàm C đơn giản: cộng hai số
int add(int a, int b) {
    return a + b;
}

// Hàm C: nhân hai số
double multiply(double a, double b) {
    return a * b;
}

// Hàm C: in lời chào từ C
void greet(const char* name) {
    printf("Xin chao tu C: %s!\n", name);
}

// Hàm C: đảo ngược chuỗi (trả về chuỗi mới)
char* reverseString(const char* str) {
    int len = strlen(str);
    char* result = (char*)malloc(len + 1);
    for (int i = 0; i < len; i++) {
        result[i] = str[len - 1 - i];
    }
    result[len] = '\0';
    return result;
}
*/
import "C"

import (
	"fmt"
	"unsafe"
)

func run() {
	fmt.Println("=== VÍ DỤ CƠ BẢN VỀ CGO ===")
	fmt.Println()

	// ---- 1. Gọi hàm C: cộng hai số ----
	fmt.Println("--- 1. Gọi hàm add() từ C ---")
	a, b := C.int(10), C.int(25)
	sum := C.add(a, b)
	fmt.Printf("add(%d, %d) = %d\n", int(a), int(b), int(sum))
	fmt.Println()

	// ---- 2. Gọi hàm C: nhân hai số ----
	fmt.Println("--- 2. Gọi hàm multiply() từ C ---")
	x, y := C.double(3.14), C.double(2.0)
	product := C.multiply(x, y)
	fmt.Printf("multiply(%.2f, %.2f) = %.4f\n", float64(x), float64(y), float64(product))
	fmt.Println()

	// ---- 3. Gọi hàm C: in lời chào ----
	fmt.Println("--- 3. Gọi hàm greet() từ C ---")
	name := C.CString("Golang Developer") // Chuyển Go string → C string
	defer C.free(unsafe.Pointer(name))    // QUAN TRỌNG: giải phóng bộ nhớ C
	C.greet(name)
	fmt.Println()

	// ---- 4. Gọi hàm C: đảo ngược chuỗi ----
	fmt.Println("--- 4. Gọi hàm reverseString() từ C ---")
	input := C.CString("Hello, CGO!")
	defer C.free(unsafe.Pointer(input))

	reversed := C.reverseString(input)
	defer C.free(unsafe.Pointer(reversed)) // Giải phóng bộ nhớ do C cấp phát

	goStr := C.GoString(reversed) // Chuyển C string → Go string
	fmt.Printf("reverseString(%q) = %q\n", "Hello, CGO!", goStr)
	fmt.Println()

	// ---- 5. Kiểu dữ liệu C trong Go ----
	fmt.Println("--- 5. Các kiểu dữ liệu C tương ứng trong Go ---")
	var cInt C.int = 42
	var cFloat C.float = 3.14
	var cDouble C.double = 2.71828
	var cChar C.char = 65 // 'A'

	fmt.Printf("C.int(%d)    → Go: %d\n", cInt, int(cInt))
	fmt.Printf("C.float(%f) → Go: %f\n", cFloat, float32(cFloat))
	fmt.Printf("C.double(%f) → Go: %f\n", cDouble, float64(cDouble))
	fmt.Printf("C.char(%d)  → Go rune: %c\n", cChar, rune(cChar))

	fmt.Println()
	fmt.Println("[Mode: CGO (CGO_ENABLED=1)]")
}
