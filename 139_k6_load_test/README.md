# 139 — k6: Kiểm thử hiệu năng (Performance Testing)

Hướng dẫn chi tiết và toàn diện về **k6** (https://k6.io/) — công cụ kiểm thử hiệu năng mã nguồn mở của Grafana Labs. Tài liệu dựa trên cú pháp k6 phiên bản mới (v0.5x trở lên).

> Các file ví dụ trong thư mục này được đánh số theo thứ tự học từ cơ bản → nâng cao. Mỗi file chạy độc lập bằng `k6 run <tên_file>.js`.

## Mục lục

1. [Tổng quan](#1-tổng-quan)
2. [Các loại kiểm thử hiệu năng](#2-các-loại-kiểm-thử-hiệu-năng)
3. [Các ví dụ thực tế](#3-các-ví-dụ-thực-tế)
4. [Phân tích kết quả đầu ra](#4-phân-tích-kết-quả-đầu-ra)
5. [Cài đặt & chạy nhanh](#5-cài-đặt--chạy-nhanh)

---

## 1. Tổng quan

### k6 là gì?

**k6** là công cụ kiểm thử tải/hiệu năng (load & performance testing) mã nguồn mở, hướng tới lập trình viên (developer-centric). Mục đích: mô phỏng **nhiều người dùng ảo (Virtual User — VU)** truy cập hệ thống đồng thời để đo xem hệ thống chịu tải ra sao — về **độ trễ (latency)**, **thông lượng (throughput/RPS)** và **tỉ lệ lỗi (error rate)** — trước khi đưa ra môi trường thật.

k6 dùng để trả lời các câu hỏi như:
- Hệ thống chịu được bao nhiêu người dùng đồng thời trước khi chậm/lỗi?
- API có đạt SLA (ví dụ p95 < 500ms) ở mức tải đỉnh không?
- Khi có cú sốc lưu lượng (flash sale), hệ thống phản ứng và phục hồi thế nào?
- Chạy liên tục nhiều giờ có bị rò rỉ bộ nhớ (memory leak) không?

### Kiến trúc cơ bản

k6 có thiết kế **lai (hybrid)** rất đặc trưng:

| Thành phần | Ngôn ngữ | Vai trò |
|---|---|---|
| **Engine** | **Go** | Tạo và điều phối hàng nghìn VU, gửi request, gom số liệu. Nhờ goroutine của Go nên rất nhẹ và hiệu quả, một máy có thể tạo hàng chục nghìn VU. |
| **Kịch bản test (script)** | **JavaScript (ES6)** | Bạn viết logic test bằng JS. k6 nhúng runtime JS **goja** (viết bằng Go) để thực thi — **KHÔNG phải Node.js**. |

> ⚠️ **Quan trọng**: vì k6 KHÔNG chạy trên Node.js nên **không dùng được `npm`/module Node** (như `fs`, `axios`). Thay vào đó dùng module tích hợp của k6 (`k6/http`, `k6/metrics`...) hoặc thư viện riêng cho k6 tại **jslib.k6.io**. Việc I/O file dùng hàm `open()` của k6 (chỉ ở init context).

**Vòng đời thực thi một test** chia làm các "context":

```
1. init context   — chạy 1 LẦN cho mỗi VU: import module, open() file, khởi tạo metric.
                     (Không gửi được HTTP request ở đây.)
2. setup()        — chạy 1 LẦN cho cả test, TRƯỚC khi VU bắt đầu. Trả về data dùng chung.
3. default()      — phần thân vòng lặp, MỖI VU lặp lại liên tục (= iteration).
4. teardown()     — chạy 1 LẦN cho cả test, SAU khi tất cả VU kết thúc (dọn dẹp).
```

```js
// Minh hoạ vòng đời đầy đủ
export function setup() {       // 2) chuẩn bị: login lấy token, seed dữ liệu...
  return { token: 'abc123' };   //    giá trị trả về được truyền vào default & teardown
}
export default function (data) {// 3) data.token dùng được ở đây
  // ... gửi request ...
}
export function teardown(data) {// 4) dọn dẹp sau cùng
}
```

### Tính năng chính

- **Thresholds** — định nghĩa tiêu chí pass/fail, trả exit code để tích hợp CI/CD.
- **Checks** — xác thực phản hồi (status, body) mà không dừng test.
- **Scenarios & executors** — mô hình hoá nhiều dạng tải (số VU cố định, ramping, arrival-rate...).
- **Custom metrics** — Counter, Gauge, Rate, Trend.
- **Hỗ trợ nhiều giao thức** — HTTP/1.1, HTTP/2, WebSocket, gRPC, qua extension còn có Kafka, SQL, Redis, MQTT...
- **Mở rộng bằng xk6** — biên dịch extension viết bằng Go vào binary k6.
- **Tích hợp output** — JSON, CSV, Prometheus, InfluxDB + Grafana, Grafana Cloud k6.
- **Goal-oriented, as-code** — toàn bộ test là code, dễ version control & review.

### Vì sao chọn k6 thay vì JMeter?

| Tiêu chí | **k6** | **JMeter** |
|---|---|---|
| Cách viết test | **Code JavaScript** — git, review, tái sử dụng dễ | XML/GUI (kéo thả) — khó review, khó merge |
| Hiệu năng / tài nguyên | Rất nhẹ (Go, goroutine) — nhiều VU trên 1 máy | Nặng (mỗi luồng = 1 thread JVM) — tốn RAM |
| Đường cong học | Thân thiện với dev (JS quen thuộc) | Quen với QA dùng GUI |
| CI/CD | Sinh ra để chạy headless, exit code rõ ràng | Chạy headless được nhưng cồng kềnh |
| Giao diện | CLI (có Grafana Cloud cho biểu đồ) | GUI phong phú sẵn có |
| Giao thức | HTTP, WS, gRPC + extension | Rất nhiều plugin sẵn (JDBC, JMS...) |

**Tóm lại**: chọn **k6** khi bạn muốn test-as-code, tích hợp CI/CD, nhẹ và thân thiện với lập trình viên. Chọn **JMeter** khi cần GUI, đội QA không code, hoặc cần plugin giao thức đặc thù có sẵn.

---

## 2. Các loại kiểm thử hiệu năng

Điểm khác biệt cốt lõi giữa các loại nằm ở **hình dạng đường tải theo thời gian** (cấu hình `stages`). Xem file [`07_test_types.js`](./07_test_types.js) — gộp cả 4 loại, chọn bằng `-e TYPE=...`.

### a) Load test (kiểm thử tải)

- **Định nghĩa**: mô phỏng tải ở mức **bình thường/đỉnh thông thường** mà hệ thống được kỳ vọng phục vụ.
- **Mục tiêu**: xác minh hệ thống đáp ứng SLA (độ trễ, RPS, tỉ lệ lỗi) ở mức tải kỳ vọng. Đây là phép kiểm thử nền tảng, chạy thường xuyên.
- **Tình huống áp dụng**: kiểm tra trước release, regression hiệu năng định kỳ.
- **Cấu hình đặc trưng**: tăng dần (ramp-up) → giữ ổn định ở mức đỉnh → giảm dần. Ví dụ: 0→50 VU trong 1 phút, giữ 50 VU trong vài phút, rồi về 0.

### b) Stress test (kiểm thử áp lực)

- **Định nghĩa**: đẩy tải **vượt xa** mức bình thường, tăng dần qua nhiều bậc cho đến khi hệ thống quá tải.
- **Mục tiêu**: tìm **điểm gãy (breaking point)** — ngưỡng mà hệ thống bắt đầu suy giảm/lỗi — và quan sát nó suy giảm có "duyên dáng" (graceful) hay sập đột ngột.
- **Tình huống áp dụng**: xác định giới hạn năng lực (capacity planning), kiểm tra cơ chế auto-scaling, circuit breaker.
- **Cấu hình đặc trưng**: tăng theo nhiều bậc 100 → 200 → 300 VU..., mỗi bậc giữ vài phút, cho tới khi tỉ lệ lỗi/độ trễ tăng vọt.

### c) Spike test (kiểm thử đột biến)

- **Định nghĩa**: tải tăng **vọt cực nhanh** lên mức rất cao trong thời gian ngắn rồi rút về.
- **Mục tiêu**: kiểm tra phản ứng trước **cú sốc lưu lượng đột ngột** và khả năng **phục hồi** sau đó.
- **Tình huống áp dụng**: flash sale, mở bán vé, nội dung viral, thông báo đẩy hàng loạt.
- **Cấu hình đặc trưng**: từ mức thấp (50 VU) tăng vọt lên 1000 VU gần như tức thời, giữ ngắn, rồi rút về thấp và quan sát hệ thống có phục hồi bình thường không.

### d) Soak test (kiểm thử ngâm / endurance)

- **Định nghĩa**: tải **vừa phải** nhưng duy trì trong thời gian **rất dài** (nhiều giờ).
- **Mục tiêu**: phát hiện vấn đề tích luỹ theo thời gian: **rò rỉ bộ nhớ**, đầy disk/log, cạn kiệt connection pool, suy giảm hiệu năng dần dần.
- **Tình huống áp dụng**: kiểm tra độ ổn định dài hạn trước khi đưa vào production lâu dài.
- **Cấu hình đặc trưng**: tăng lên mức tải trung bình (vd 80 VU) rồi **giữ nguyên trong 2–8 giờ**, sau đó giảm về 0.

| Loại | Mức tải | Thời lượng | Câu hỏi trả lời |
|---|---|---|---|
| Load | Bình thường/đỉnh | Vài phút | "Đạt SLA ở tải kỳ vọng không?" |
| Stress | Vượt mức, tăng dần | Vài phút–chục phút | "Gãy ở đâu? Gãy thế nào?" |
| Spike | Tăng vọt đột ngột | Ngắn | "Chịu được cú sốc & phục hồi không?" |
| Soak | Trung bình, kéo dài | Nhiều giờ | "Ổn định lâu dài, có leak không?" |

---

## 3. Các ví dụ thực tế

| File | Nội dung |
|---|---|
| [`01_basic.js`](./01_basic.js) | HTTP request đơn giản, `sleep`, vòng lặp VU. |
| [`02_thresholds.js`](./02_thresholds.js) | Ngưỡng pass/fail (p95, tỉ lệ lỗi). |
| [`03_stages_scenarios.js`](./03_stages_scenarios.js) | `stages` & `scenarios` với executor `ramping-vus`, `constant-arrival-rate`. |
| [`04_checks.js`](./04_checks.js) | `check()` xác thực status code & nội dung body. |
| [`05_custom_metrics.js`](./05_custom_metrics.js) | Counter, Gauge, Rate, Trend. |
| [`06_env_data.js`](./06_env_data.js) | `__ENV`, `SharedArray`, đọc CSV/JSON. |
| [`07_test_types.js`](./07_test_types.js) | 4 loại test trong 1 file (chọn bằng `-e TYPE=`). |

### 3.1 Kịch bản cơ bản — request, sleep, vòng lặp VU

Xem [`01_basic.js`](./01_basic.js). Cốt lõi: hàm `default` là thân vòng lặp mà **mỗi VU lặp lại liên tục**; `sleep(1)` mô phỏng think-time.

```js
import http from 'k6/http';
import { sleep } from 'k6';

export const options = { vus: 10, duration: '30s' };

export default function () {
  const res = http.get('https://test.k6.io'); // res chứa status, body, timings...
  sleep(1);                                    // nghỉ 1s, mô phỏng người dùng thật
}
```

Chạy: `k6 run 01_basic.js` hoặc ghi đè cấu hình `k6 run --vus 10 --duration 30s 01_basic.js`.

### 3.2 Thresholds — tiêu chí pass/fail

Xem [`02_thresholds.js`](./02_thresholds.js). Threshold quyết định **exit code** → tích hợp CI/CD.

```js
export const options = {
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1500'], // 95% request < 500ms
    http_req_failed: ['rate<0.01'],                  // < 1% request lỗi
  },
};
```

Vi phạm threshold → k6 thoát với **exit code 99** → build CI **FAIL**. Thêm `abortOnFail: true` để dừng ngay khi vi phạm.

### 3.3 Stages & Scenarios — kiểm soát tải theo thời gian

Xem [`03_stages_scenarios.js`](./03_stages_scenarios.js).

- **`ramping-vus`**: điều khiển theo **số VU** ("bao nhiêu người dùng đồng thời"). RPS phụ thuộc tốc độ server.
- **`constant-arrival-rate`**: điều khiển theo **tốc độ đến (RPS)** — k6 tự co giãn số VU để giữ đúng rate. Đây là cách **đúng** để test "hệ thống chịu bao nhiêu RPS".

```js
scenarios: {
  api_load: {
    executor: 'constant-arrival-rate',
    rate: 50, timeUnit: '1s',   // 50 lần lặp / giây = 50 RPS
    duration: '1m',
    preAllocatedVUs: 20, maxVUs: 100,
    exec: 'callApi',
  },
},
```

### 3.4 Checks — xác thực phản hồi

Xem [`04_checks.js`](./04_checks.js). Khác threshold: check **không dừng test** khi sai, chỉ ghi nhận tỉ lệ đúng/sai.

```js
check(res, {
  'status là 200': (r) => r.status === 200,
  'body chứa "Collection"': (r) => r.body.includes('Collection'),
});
```

**Mẹo phổ biến**: kết hợp check với threshold trên metric `checks`: `thresholds: { checks: ['rate>0.99'] }`.

### 3.5 Custom metrics — Counter, Gauge, Rate, Trend

Xem [`05_custom_metrics.js`](./05_custom_metrics.js).

| Loại | Ý nghĩa | Ví dụ dùng |
|---|---|---|
| **Counter** | Đếm cộng dồn (chỉ tăng) | Tổng số lỗi nghiệp vụ, tổng byte |
| **Gauge** | Giữ giá trị **mới nhất** | Kích thước phản hồi gần nhất |
| **Rate** | Tỉ lệ % các lần `true` | Tỉ lệ giao dịch thành công |
| **Trend** | Phân phối (min/avg/p90/p95/max) | Latency của 1 API cụ thể |

```js
import { Counter, Gauge, Rate, Trend } from 'k6/metrics';
const successRate = new Rate('success_rate');
const loginDuration = new Trend('login_duration', true); // true = đơn vị ms
// ...trong default:
successRate.add(res.status === 200);
loginDuration.add(res.timings.duration);
```

### 3.6 Biến môi trường & nạp dữ liệu test

Xem [`06_env_data.js`](./06_env_data.js) + thư mục [`data/`](./data).

- **`__ENV.X`**: đọc biến từ cờ `-e X=...`. VD: `k6 run -e BASE_URL=https://api.dev 06_env_data.js`.
- **`SharedArray`**: nạp dữ liệu **một lần** và chia sẻ chỉ-đọc cho mọi VU → tiết kiệm RAM với data lớn.
- **`open()`**: đọc file (chỉ ở init context). Parse CSV bằng `papaparse` từ jslib.

```js
const users = new SharedArray('users', () => JSON.parse(open('./data/users.json')));
// Chọn user khác nhau cho mỗi VU (data parameterization):
const user = users[(__VU - 1) % users.length];
```

> `__VU` = số thứ tự VU (từ 1), `__ITER` = số thứ tự iteration của VU đó (từ 0).

### 3.7 Mô phỏng nhiều VU & kiểm soát tải đồng thời

Có 3 cách kiểm soát mức tải đồng thời, từ đơn giản đến tinh vi:

```js
// (a) Cố định: 50 VU suốt 5 phút
export const options = { vus: 50, duration: '5m' };

// (b) Ramping VU theo stages (kiểm soát SỐ người dùng đồng thời)
export const options = {
  stages: [
    { duration: '1m', target: 100 }, // tăng 0 -> 100 VU
    { duration: '3m', target: 100 }, // giữ 100 VU
    { duration: '1m', target: 0 },   // giảm về 0
  ],
};

// (c) Arrival-rate (kiểm soát THÔNG LƯỢNG, độc lập tốc độ server) — xem 3.3
```

### 3.8 Tích hợp Docker

Xem [`Dockerfile`](./Dockerfile). Image chính thức `grafana/k6` đã có sẵn binary, ENTRYPOINT là `k6`.

**Cách 1 — chạy trực tiếp bằng image chính thức (không cần build), mount thư mục hiện tại:**

```bash
# Linux/macOS
docker run --rm -i grafana/k6 run - < 01_basic.js

# Mount thư mục để dùng được file data (Windows Git Bash dùng //$PWD hoặc đường dẫn tuyệt đối)
docker run --rm -v "$PWD:/scripts" grafana/k6 run /scripts/06_env_data.js

# Truyền biến môi trường vào test
docker run --rm -v "$PWD:/scripts" grafana/k6 run -e TYPE=spike /scripts/07_test_types.js
```

**Cách 2 — build image riêng chứa sẵn script (tốt cho CI/CD):**

```bash
docker build -t my-k6-test .
docker run --rm my-k6-test run /scripts/01_basic.js
docker run --rm my-k6-test run --vus 20 --duration 1m /scripts/02_thresholds.js
```

> Nếu test nhắm tới service chạy trong Docker khác, dùng chung network: thêm `--network host` (Linux) hoặc `host.docker.internal` làm hostname (Windows/macOS).

---

## 4. Phân tích kết quả đầu ra

Sau khi chạy, k6 in ra một **summary** ở cuối. Ví dụ (rút gọn):

```
     ✓ status là 200
     ✓ body chứa "Collection"

     checks.........................: 100.00% ✓ 1200      ✗ 0
     data_received..................: 45 MB   1.5 MB/s
     data_sent......................: 120 kB  4.0 kB/s
     http_req_blocked...............: avg=1.2ms   min=0s     med=2µs   max=210ms p(90)=4µs   p(95)=8µs
     http_req_connecting............: avg=0.5ms   ...
   ✓ http_req_duration..............: avg=187ms   min=89ms   med=170ms max=1.1s  p(90)=250ms p(95)=320ms
       { expected_response:true }...: avg=185ms   ...
   ✓ http_req_failed................: 0.40%   ✓ 5         ✗ 1195
     http_req_receiving.............: avg=0.8ms   ...
     http_req_sending...............: avg=0.1ms   ...
     http_req_waiting...............: avg=186ms   ...   (đây là TTFB)
     http_reqs......................: 1200    40.1/s
     iteration_duration.............: avg=1.18s   ...
     iterations.....................: 1200    40.1/s
     vus............................: 10      min=10      max=10
     vus_max........................: 10      min=10      max=10
```

### Ý nghĩa các chỉ số quan trọng

| Chỉ số | Ý nghĩa | Cách đọc |
|---|---|---|
| **http_req_duration** | **Tổng thời gian phản hồi** của request (sending + waiting + receiving). Quan trọng nhất. | Nhìn **p(95)/p(99)**, không nhìn avg — avg che giấu đuôi chậm. |
| **http_req_waiting** | Thời gian chờ byte đầu tiên (**TTFB**) — phản ánh thời gian xử lý của server. | Cao = server xử lý chậm (DB, logic). |
| **http_req_failed** | **Tỉ lệ request thất bại** (status ≥ 400 hoặc lỗi mạng). | < 1% thường là tốt; tăng vọt = quá tải. |
| **http_reqs** | Tổng số request + **RPS** (số request/giây) — chính là **throughput**. | RPS càng cao = thông lượng càng lớn. |
| **iterations** | Tổng số lần lặp hoàn thành + tốc độ lặp/giây. | Một iteration có thể chứa nhiều request. |
| **iteration_duration** | Thời gian trọn một vòng `default()` (gồm cả `sleep`). | |
| **vus** / **vus_max** | Số VU đang hoạt động / tối đa cấp phát. | Theo dõi để biết tải thực tế. |
| **data_received/sent** | Băng thông vào/ra. | Hữu ích khi nghi ngờ nghẽn mạng. |
| **checks** | Tỉ lệ check đúng. | < 100% nghĩa là có phản hồi sai kỳ vọng. |

### Phân vị (percentile) p90/p95/p99 — vì sao quan trọng

- **p95 < 500ms** nghĩa là **95% request** nhanh hơn 500ms; 5% còn lại chậm hơn.
- Dùng phân vị thay vì trung bình vì **trung bình che giấu các request chậm bất thường**. Một vài request 5s có thể không làm avg tăng nhiều nhưng lại là trải nghiệm tệ của người dùng thật.
- **p99** phản ánh trải nghiệm của 1% người dùng tệ nhất — quan trọng với hệ thống lớn (1% của hàng triệu request là rất nhiều người).

### RPS (Requests Per Second)

= **throughput** của hệ thống, đọc từ dòng `http_reqs` (vd `40.1/s`). Với load test theo VU, RPS phụ thuộc cả tốc độ server; muốn cố định RPS để đo capacity thì dùng executor `constant-arrival-rate`.

### Đọc summary & đánh giá pass/fail

1. **Dấu `✓` / `✗` đầu dòng metric** cho biết **threshold** của metric đó đạt hay không. Chỉ cần **một** threshold `✗` → toàn bộ test **FAIL** (exit code 99).
2. Kiểm tra **`http_req_failed`** trước: tỉ lệ lỗi cao đồng nghĩa số liệu latency không còn đáng tin (nhiều request lỗi nhanh sẽ làm đẹp giả tạo p95).
3. Đối chiếu **`http_req_duration` p(95)/p(99)** với SLA đã cam kết.
4. Xem **RPS (`http_reqs`)** có đạt mục tiêu thông lượng không.
5. Với **stress test**: tìm mốc tải mà p95/error bắt đầu tăng vọt → đó là điểm gãy.
6. Với **soak test**: so sánh latency **đầu** và **cuối** test — tăng dần theo thời gian = dấu hiệu memory leak.

**Kiểm tra exit code trong CI/CD:**

```bash
k6 run 02_thresholds.js
echo "Exit code: $?"   # 0 = PASS (đạt mọi threshold), 99 = FAIL (vi phạm threshold)
```

**Xuất kết quả để phân tích sâu / lưu trữ:**

```bash
# Xuất summary ra JSON
k6 run --summary-export=summary.json 02_thresholds.js

# Xuất chi tiết từng điểm dữ liệu ra JSON (file lớn)
k6 run --out json=results.json 02_thresholds.js

# Gửi sang Prometheus / InfluxDB để vẽ biểu đồ Grafana theo thời gian
k6 run --out experimental-prometheus-rw 02_thresholds.js
```

### Web dashboard tích hợp sẵn (`K6_WEB_DASHBOARD=true`)

Từ **k6 v0.49.0** trở lên, k6 có sẵn **web dashboard** xem biểu đồ trực quan — KHÔNG cần cài
thêm extension. Bật bằng biến môi trường `K6_WEB_DASHBOARD=true`:

```bash
# 1) Dashboard real-time: mở trình duyệt xem biểu đồ ngay trong lúc test chạy
K6_WEB_DASHBOARD=true k6 run 01_basic.js
#    => k6 in ra dòng:  web dashboard: http://127.0.0.1:5665
#    => mở link đó trên trình duyệt để xem latency/RPS/VUs cập nhật theo thời gian thực

# 2) Xuất báo cáo HTML tĩnh (lưu trữ / gửi cho người khác — không cần chạy lại test)
K6_WEB_DASHBOARD=true K6_WEB_DASHBOARD_EXPORT=k6-report.html k6 run 01_basic.js
```

Các biến môi trường tùy chỉnh kèm theo:

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `K6_WEB_DASHBOARD` | `false` | Bật/tắt web dashboard |
| `K6_WEB_DASHBOARD_PORT` | `5665` | Cổng phục vụ dashboard real-time |
| `K6_WEB_DASHBOARD_HOST` | `localhost` | Host lắng nghe (đặt `0.0.0.0` nếu xem từ máy khác) |
| `K6_WEB_DASHBOARD_PERIOD` | `10s` | Tần suất cập nhật biểu đồ |
| `K6_WEB_DASHBOARD_OPEN` | `false` | Tự mở trình duyệt khi test bắt đầu |
| `K6_WEB_DASHBOARD_EXPORT` | (trống) | Đường dẫn file HTML report xuất ra sau khi chạy xong |

> Trên Windows (Git Bash) cú pháp đặt biến ở đầu dòng như trên hoạt động bình thường.
> Với PowerShell dùng: `$env:K6_WEB_DASHBOARD="true"; k6 run 01_basic.js`.

---

## 5. Cài đặt & chạy nhanh

**Cài đặt k6** (xem https://grafana.com/docs/k6/latest/set-up/install-k6/):

```bash
# Windows (Chocolatey)
choco install k6
# hoặc winget
winget install k6 --source winget

# macOS
brew install k6

# Linux (Debian/Ubuntu) — qua kho APT của Grafana
sudo gpg -k && sudo apt-get install k6
```

**Chạy các ví dụ:**

```bash
cd 139_k6_load_test

k6 run 01_basic.js                              # ví dụ cơ bản
k6 run --vus 20 --duration 1m 01_basic.js       # ghi đè VU & thời lượng
k6 run 02_thresholds.js                         # có ngưỡng pass/fail
k6 run 03_stages_scenarios.js                   # nhiều scenario
k6 run -e BASE_URL=https://test.k6.io 06_env_data.js  # truyền biến môi trường
k6 run -e TYPE=spike 07_test_types.js           # chọn loại test
```

> Các ví dụ nhắm tới `https://test.k6.io` — site demo công khai do Grafana cung cấp để học k6, có thể chạy ngay mà không cần dựng server.
