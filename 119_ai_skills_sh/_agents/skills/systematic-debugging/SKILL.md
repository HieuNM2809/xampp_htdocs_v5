---
name: systematic-debugging
description: "Dùng khi người dùng gặp bug, lỗi, hành vi không mong muốn, hoặc 'không hiểu tại sao lại vậy'. Dùng khi họ nói 'bị lỗi', 'không chạy được', 'tại sao lại thế này', 'không như kỳ vọng', hoặc paste stack trace. KHÔNG dùng cho code review, tối ưu hiệu năng, hay thêm tính năng. Dừng lại và dùng skill này thay vì đoán mò."
metadata:
  version: 1.2.0
---

# Debug Có Hệ Thống

Bạn là chuyên gia debug. Nhiệm vụ của bạn không phải là đoán — mà là **khoanh vùng, chứng minh, và sửa** đúng nguyên nhân gốc rễ của bug. Đừng bao giờ kết luận vội. Hãy làm theo phương pháp khoa học.

## Nguyên Tắc Cốt Lõi

> **Không bao giờ đoán. Đặt ra giả thuyết. Kiểm tra. Chứng minh nguyên nhân trước khi sửa.**

Phần lớn bug tốn hàng giờ vì dev bỏ qua các bước. Họ thay đổi code trước khi hiểu code đang làm gì. Skill này ngăn điều đó xảy ra.

---

## Trước Khi Bắt Đầu

Đọc các file context liên quan:
- `.agents/product-context.md` hoặc tương tự — hiểu codebase
- Git commits gần đây — có gì thay đổi trước khi bug xuất hiện?
- Error logs — đọc đầy đủ, không chỉ dòng cuối

**Hỏi nếu chưa có:**
1. Thông báo lỗi **chính xác** là gì? Hoặc hành vi sai cụ thể?
2. Hành vi **mong muốn** là gì?
3. Bắt đầu từ khi nào? Có gì thay đổi trước đó?
4. Bug xảy ra **mọi lúc** hay chỉ thỉnh thoảng (intermittent)?
5. Môi trường là gì? (OS, Node version, trình duyệt, v.v.)

---

## Giai Đoạn 1 — Tái Hiện (Reproduce)

**Quy tắc: Nếu không tái hiện được bug, bạn chưa bắt đầu debug.**

```
Có thể tái hiện bug nhất quán không?
├── CÓ → Sang Giai đoạn 2
└── KHÔNG → Tìm cách tái hiện trước
          - Đơn giản hóa scenario từng bước
          - Ghi chú MỌI điều kiện: thời gian, data, trạng thái user, env vars
          - Bug intermittent = race condition, caching, hoặc state
```

**Checklist tái hiện:**
- [ ] Viết ra các bước chính xác để kích hoạt bug
- [ ] Xác nhận nó fail mỗi lần với những bước đó
- [ ] Tạo test case nhỏ nhất có thể mà vẫn fail

---

## Giai Đoạn 2 — Khoanh Vùng (Locate)

Thu hẹp vị trí bug nằm ở đâu. Dùng tìm kiếm nhị phân trên call stack.

**Chiến lược: Chia để trị**

```
Toàn bộ hệ thống
    ↓ thêm log ở điểm giữa
Bug xảy ra trước hay sau đây?
    ↓ thu hẹp vào nửa có bug
    ↓ lặp lại cho đến khi tìm được đúng dòng
```

**Công cụ khoanh vùng bug:**

| Ngôn ngữ | Logging | Breakpoints | Kiểm tra State |
|----------|---------|------------|----------------|
| JavaScript | `console.log()` / `debugger` | Chrome DevTools | `JSON.stringify(obj, null, 2)` |
| Python | `print()` / `logging` | `pdb.set_trace()` | `vars(obj)` |
| PHP | `var_dump()` / `error_log()` | xdebug | `print_r($var, true)` |
| Node.js | `console.log()` | flag `--inspect` | `util.inspect()` |

**Cần log gì ở mỗi bước:**
- Giá trị đầu vào — có đúng như kỳ vọng không?
- Giá trị đầu ra — có đúng như kỳ vọng không?
- Control flow — nhánh `if/else` nào được thực thi?

Xem chiến lược chi tiết theo từng loại bug: [references/bug-type-strategies.md](references/bug-type-strategies.md)

---

## Giai Đoạn 3 — Đặt Giả Thuyết (Hypothesize)

Viết ra các phỏng đoán tốt nhất **trước khi** chạm vào code.

```markdown
## Các giả thuyết của tôi (xếp theo xác suất):
1. [Nguyên nhân khả năng nhất] — vì [bằng chứng]
2. [Phỏng đoán thứ hai] — vì [bằng chứng]
3. [Ít khả năng nhưng có thể] — vì [bằng chứng]
```

**Quy tắc:**
- Tối đa 3 giả thuyết mỗi lần
- Mỗi giả thuyết phải **kiểm tra được** — nếu không thể chứng minh sai, thì không phải giả thuyết
- Nếu không giả thuyết nào phù hợp với bằng chứng — quay lại Giai đoạn 2

---

## Giai Đoạn 4 — Kiểm Tra (Test)

Kiểm tra từng giả thuyết một. **Không thay đổi hai thứ cùng lúc.**

```
Chọn Giả thuyết #1
    ↓ Thiết kế test tối giản CHỨNG MINH HOẶC BÁC BỎ nó
    ↓ Chạy test
    ↓ Kết quả chứng minh giả thuyết?
        ├── CÓ → Ghi lại bằng chứng. Sang Giai đoạn 5.
        └── KHÔNG → Gạch bỏ. Chọn Giả thuyết #2.
                    Nếu tất cả fail → quay lại Giai đoạn 3.
```

**Test tái hiện tối giản:**
```javascript
// XẤU — test quá nhiều thứ
runFullApp();

// TỐT — cô lập đúng function cần kiểm tra
console.log(processPayment({ amount: 0 })); // Hàm này có trả về NaN không?
```

Xem các mẫu test phổ biến: [references/test-patterns.md](references/test-patterns.md)

---

## Giai Đoạn 5 — Sửa (Fix)

Giờ bạn đã BIẾT nguyên nhân, hãy sửa nó.

**Quy tắc sửa:**
1. Thực hiện **thay đổi nhỏ nhất có thể** để sửa nguyên nhân gốc rễ
2. Không refactor trong khi sửa bug — tách biệt hai việc
3. Chạy lại reproduction case để xác nhận đã sửa
4. Kiểm tra các **bug liên quan** — bug thường xuất hiện thành nhóm

**Viết regression test:**
```javascript
// Test để bug này không bao giờ xuất hiện lại
test('processPayment xử lý đúng khi amount = 0', () => {
  expect(processPayment({ amount: 0 })).toBe(0); // không phải NaN
});
```

---

## Giai Đoạn 6 — Ghi Lại (Document)

Viết post-mortem ngắn. Paste vào chat hoặc lưu vào file.

```markdown
## Bug Post-mortem

**Nguyên nhân gốc rễ:** [1 câu]
**Phát hiện như thế nào:** [Giai đoạn nào đã lộ ra]
**Cách sửa:** [Thay đổi gì và tại sao]
**Thời gian xử lý:** [Phút/giờ]
**Đã thêm regression test:** Có/Không
**Có thể phát hiện sớm hơn bằng cách:** [Test tốt hơn / type check / validation]
```

Điều này ngăn bug tương tự xuất hiện lại.

---

## Các Mẫu Bug Phổ Biến — Tham Khảo Nhanh

| Triệu chứng | Nguyên nhân có thể | Kiểm tra đầu tiên |
|-------------|-------------------|--------------------|
| Chạy tốt ở local, fail trên server | Khác biệt môi trường | So sánh env vars, versions |
| Tốt lần đầu, lỗi lần sau | State không reset / caching | Log state trước mỗi lần chạy |
| `undefined is not a function` | Thiếu import hoặc typo | Kiểm tra đường dẫn import |
| Kết quả lệch 1 đơn vị | Array index, vòng lặp | Log index tại điểm fail |
| Async trả về rỗng | Chưa await Promise | Thêm `await`, kiểm tra `.then()` |
| `NaN` trong phép tính | Chia cho 0 hoặc parse sai | Log từng toán hạng |
| Race condition | 2 async ops sửa cùng state | Thêm timestamp vào logs |
| Admin OK, user lỗi | Kiểm tra quyền/role | Log object user |
| Chỉ fail với data thật | Edge case trong data | Log input đang fail |

---

## Những Điều KHÔNG Nên Làm

- ❌ **Không thay đổi code với hy vọng nó sẽ sửa** — thay đổi phải có bằng chứng
- ❌ **Không thêm log lung tung khắp nơi** — phải có chủ đích
- ❌ **Không bỏ qua Giai đoạn 1** — chưa tái hiện được = chưa bắt đầu debug
- ❌ **Không sửa triệu chứng** — tìm nguyên nhân gốc rễ
- ❌ **Không đóng bug mà không có regression test**

---

## Skills Liên Quan

- **code-review**: Để review chất lượng code (không phải bug đang hoạt động)
- **performance-optimization**: Cho code chạy chậm (không phải code bị lỗi)
- **test-driven-development**: Để viết test ngăn bug trong tương lai
- **security-best-practices**: Cho các bug liên quan đến bảo mật
