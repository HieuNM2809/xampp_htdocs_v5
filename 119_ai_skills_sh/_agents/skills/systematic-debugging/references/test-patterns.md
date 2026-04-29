# Các Mẫu Test Khi Debug

Templates để tạo minimal test case trong quá trình debug.

---

## Mẫu 1: Isolation Test (Cô Lập Hàm)

Tách function ra khỏi toàn bộ hệ thống và test riêng lẻ.

```javascript
// Thay vì chạy toàn bộ app, test function đó trực tiếp
// File: debug-test.js (tạm thời, xóa sau khi debug xong)

const { processOrder } = require('./orderService');

// Test với data tối thiểu nhất có thể
const inputToiThieu = {
  userId: 1,
  items: [{ id: 1, qty: 1 }],
  total: 100
};

console.log('--- ISOLATION TEST ---');
console.log('Đầu vào:', JSON.stringify(inputToiThieu));

try {
  const ketQua = processOrder(inputToiThieu);
  console.log('Đầu ra:', JSON.stringify(ketQua));
} catch (err) {
  console.error('Lỗi:', err.message);
  console.error('Stack:', err.stack);
}
```

Chạy: `node debug-test.js`

---

## Mẫu 2: Binary Search Debug (Tìm Nhị Phân)

Tìm dòng code gây lỗi bằng cách thu hẹp từng nửa.

```javascript
function hamPhucTap(data) {
  const buoc1 = transform1(data);
  console.log('Sau bước 1:', buoc1); // ← thêm log

  const buoc2 = transform2(buoc1);
  console.log('Sau bước 2:', buoc2); // ← thêm log

  // Nếu bước 2 OK nhưng bước 3 fail → bug nằm trong transform3
  const buoc3 = transform3(buoc2);
  console.log('Sau bước 3:', buoc3); // ← thêm log

  return finalize(buoc3);
}
```

---

## Mẫu 3: Before/After State Snapshot (Chụp Trạng Thái)

So sánh state trước và sau khi thực thi.

```javascript
function debugWrapper(fn, tenHam) {
  return function(...args) {
    console.group(`[DEBUG] ${tenHam}`);
    console.log('Tham số:', JSON.stringify(args, null, 2));
    const ketQua = fn.apply(this, args);
    console.log('Kết quả:', JSON.stringify(ketQua, null, 2));
    console.groupEnd();
    return ketQua;
  };
}

// Bọc function cần debug
const hamGoc = processPayment;
processPayment = debugWrapper(hamGoc, 'processPayment');
```

---

## Mẫu 4: Minimal Reproduction HTML (HTML Tái Hiện Tối Giản)

Dành cho bug CSS/JS — tạo file HTML tối thiểu.

```html
<!DOCTYPE html>
<html>
<head>
  <title>Debug Test</title>
  <style>
    /* Chỉ paste CSS liên quan đến bug */
    .container { display: flex; }
    .item { flex: 1; }
  </style>
</head>
<body>
  <!-- Chỉ HTML tối thiểu để tái hiện bug -->
  <div class="container">
    <div class="item">Mục 1</div>
    <div class="item">Mục 2</div>
  </div>
  <script>
    // Chỉ JS liên quan
    console.log(document.querySelector('.item').getBoundingClientRect());
  </script>
</body>
</html>
```

---

## Mẫu 5: Async Timeline Logger (Log Dòng Thời Gian)

Debug race conditions bằng cách ghi lại timeline chính xác.

```javascript
const log = (nhan, data = '') => {
  const thoiGian = performance.now().toFixed(2);
  console.log(`[${thoiGian}ms] ${nhan}`, data);
};

async function debugRaceCondition() {
  log('BẮT ĐẦU request-A');
  const promiseA = fetchData('A').then(r => { log('XONG request-A', r); return r; });

  log('BẮT ĐẦU request-B');
  const promiseB = fetchData('B').then(r => { log('XONG request-B', r); return r; });

  const [a, b] = await Promise.all([promiseA, promiseB]);
  log('CẢ HAI XONG', { a, b });
}
```

Kết quả mẫu:
```
[0.00ms] BẮT ĐẦU request-A
[1.20ms] BẮT ĐẦU request-B
[145.32ms] XONG request-B  ← B xong trước A!
[312.45ms] XONG request-A
[312.46ms] CẢ HAI XONG
```

---

## Mẫu 6: PHP Debug Helper

```php
<?php
// Thêm vào đầu file cần debug
function dd($bien, $nhan = '') {
    echo '<pre style="background:#1a1a2e;color:#00ff88;padding:10px;margin:5px">';
    echo '<strong>' . ($nhan ?: 'Debug') . ':</strong>' . PHP_EOL;
    var_dump($bien);
    echo '</pre>';
    // Bỏ comment dòng dưới để dừng thực thi
    // die('--- DỪNG LẠI ---');
}

// Cách dùng:
dd($request->all(), 'Dữ liệu Request');
dd($user->toArray(), 'Object User');
dd(DB::getQueryLog(), 'Các câu SQL đã chạy');

// Bật query log để xem SQL:
DB::enableQueryLog();
// ... code ...
dd(DB::getQueryLog()); // xem tất cả SQL đã thực thi
?>
```
