# Chiến Lược Debug Theo Loại Bug

Chiến lược debug cụ thể cho từng loại bug hay gặp.

---

## 1. Bug Async / Promise

**Triệu chứng:** Data trả về `undefined`, `.then()` không chạy, request xong nhưng UI không cập nhật.

**Chiến lược:**
```javascript
// Bước 1: Log toàn bộ lifecycle của async
async function fetchUser(id) {
  console.log('[fetchUser] BẮT ĐẦU, id:', id);
  try {
    const res = await fetch(`/api/users/${id}`);
    console.log('[fetchUser] status phản hồi:', res.status);
    const data = await res.json();
    console.log('[fetchUser] data nhận được:', data);
    return data;
  } catch (err) {
    console.error('[fetchUser] LỖI:', err);
    throw err;
  }
}

// Bước 2: Kiểm tra caller có await không
// SAI:
const user = fetchUser(1); // user = Promise, không phải data!
// ĐÚNG:
const user = await fetchUser(1);
```

**Checklist:**
- [ ] Mọi `async` function đều được `await` ở nơi gọi?
- [ ] Có `try/catch` để lỗi không bị nuốt chửng?
- [ ] Promise chain có `.catch()` chưa?

---

## 2. Bug State / Mutation

**Triệu chứng:** Data thay đổi bất ngờ, hoạt động tốt lần đầu rồi fail, giá trị sai sau vài thao tác.

**Chiến lược:**
```javascript
// Bước 1: Đóng băng object để phát hiện mutation
const state = Object.freeze({ count: 0, items: [] });
// Nếu có code mutate → throw Error ngay lập tức

// Bước 2: Deep clone trước khi chỉnh sửa
const newState = JSON.parse(JSON.stringify(state)); // clone đơn giản
// hoặc
const newState = structuredClone(state); // JS hiện đại

// Bước 3: Log state tại mọi điểm thay đổi
console.log('[trước]', JSON.stringify(state));
doSomething(state);
console.log('[sau]', JSON.stringify(state));
```

**Dành riêng cho React:**
```javascript
// SAI - mutate state trực tiếp
state.items.push(newItem); // React không biết có thay đổi
setState(state);

// ĐÚNG - luôn trả về object mới
setState(prev => ({ ...prev, items: [...prev.items, newItem] }));
```

---

## 3. Bug Type / Coercion

**Triệu chứng:** `NaN`, `"5" + 3 = "53"`, `null` không bằng `undefined`, so sánh cho kết quả sai.

**Chiến lược:**
```javascript
// Luôn log TYPE cùng với giá trị
console.log(typeof value, value);

// Kiểm tra coercion trước khi tính toán
function congAnToan(a, b) {
  console.log('a:', typeof a, a, '| b:', typeof b, b);
  const soA = Number(a);
  const soB = Number(b);
  if (isNaN(soA) || isNaN(soB)) {
    throw new Error(`congAnToan: đầu vào không hợp lệ a=${a}, b=${b}`);
  }
  return soA + soB;
}

// PHP: dùng === thay vì ==
if ($value === 0) { /* ... */ }    // ĐÚNG
if ($value == false) { /* ... */ } // SAI — "0", "", và null đều match!
```

---

## 4. Bug Môi Trường / Cấu Hình

**Triệu chứng:** Chạy tốt ở local, fail trên server. Tốt cho mình, không tốt cho người khác.

**Chiến lược:**
```bash
# Bước 1: So sánh môi trường
node --version   # local vs server
npm --version
echo $NODE_ENV   # development vs production?

# Bước 2: Dump tất cả env vars (cẩn thận với secrets!)
node -e "console.log(JSON.stringify(process.env, null, 2))"

# Bước 3: Kiểm tra đường dẫn file
# Windows dùng \, Linux/Mac dùng /
# Dùng path.join() thay vì nối chuỗi thủ công
const duongDan = path.join(__dirname, 'data', 'file.json');
```

**Checklist:**
- [ ] File `.env` có trên server không? (không commit `.env` lên git!)
- [ ] Tất cả dependencies đã `npm install`?
- [ ] Phiên bản Node/PHP có khớp nhau không?
- [ ] Quyền truy cập file có đúng không?

---

## 5. Bug Race Condition

**Triệu chứng:** Xuất hiện không thường xuyên (intermittent), khó tái hiện, chỉ xảy ra khi tải cao hoặc nhiều người dùng cùng lúc.

**Chiến lược:**
```javascript
// Bước 1: Thêm timestamp vào mọi log
const t = () => new Date().toISOString();
console.log(t(), '[request-A] bắt đầu');
// ...
console.log(t(), '[request-B] bắt đầu');
console.log(t(), '[request-A] xong');

// Bước 2: Tìm shared state bị thay đổi bởi nhiều async op
// SAI:
let currentUser = null;
async function login(id) {
  currentUser = await fetchUser(id); // race condition!
}

// ĐÚNG: Dùng local scope
async function login(id) {
  const user = await fetchUser(id);
  return user; // không thay đổi global state
}
```

---

## 6. Bug CSS / Layout

**Triệu chứng:** Element sai vị trí, ẩn khi không nên ẩn, overlay không đúng, responsive bị vỡ.

**Chiến lược:**
```css
/* Bước 1: Tạm thời highlight element đang debug */
.debug {
  outline: 2px solid red !important;
  background: rgba(255, 0, 0, 0.1) !important;
}

/* Bước 2: Kiểm tra box model */
* { box-sizing: border-box; } /* đảm bảo nhất quán */

/* Bước 3: Comment bớt CSS từng phần để khoanh vùng */
```

```javascript
// Trong DevTools console: kiểm tra computed style
const el = document.querySelector('.element-loi');
console.log(window.getComputedStyle(el).display);
console.log(el.getBoundingClientRect()); // vị trí thực tế trên màn hình
```

---

## 7. Bug Database / Query

**Triệu chứng:** Query trả về data sai, JOIN bị duplicate rows, UPDATE không có hiệu lực.

**Chiến lược:**
```sql
-- Bước 1: Chạy query trực tiếp trong DB client (không qua code)
SELECT * FROM users WHERE id = 123;

-- Bước 2: EXPLAIN để xem query plan
EXPLAIN SELECT * FROM orders WHERE user_id = 123;

-- Bước 3: Kiểm tra transaction
-- Bug thường xảy ra khi quên COMMIT hoặc bị rollback âm thầm
BEGIN;
UPDATE items SET stock = stock - 1 WHERE id = 1;
-- Kiểm tra kết quả trước khi COMMIT
SELECT stock FROM items WHERE id = 1;
COMMIT;
```
