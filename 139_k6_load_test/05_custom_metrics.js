// 05_custom_metrics.js
// -----------------------------------------------------------------------------
// CUSTOM METRICS: tự định nghĩa số liệu riêng ngoài các metric mặc định của k6.
// k6 có 4 loại metric:
//   Counter : đếm cộng dồn (chỉ tăng).            VD: tổng số lỗi, tổng byte gửi.
//   Gauge   : giữ giá trị MỚI NHẤT (lên/xuống).    VD: giá trị tức thời, kích thước.
//   Rate    : tỉ lệ % các lần "true" trên tổng số. VD: tỉ lệ request thành công.
//   Trend   : phân phối (min/avg/med/max/p90/p95). VD: latency của 1 API cụ thể.
// Chạy:  k6 run 05_custom_metrics.js
// -----------------------------------------------------------------------------

import http from 'k6/http';
import { check, sleep } from 'k6';
// Import 4 constructor metric từ module 'k6/metrics'.
import { Counter, Gauge, Rate, Trend } from 'k6/metrics';

// Khởi tạo metric ở phạm vi module (init context) — tên truyền vào sẽ hiện trong báo cáo.
const myErrors = new Counter('my_errors'); // đếm số lỗi nghiệp vụ
const responseSize = new Gauge('response_size_bytes'); // size phản hồi gần nhất
const successRate = new Rate('success_rate'); // tỉ lệ thành công
const loginDuration = new Trend('login_duration', true); // true => đơn vị thời gian (ms)

export const options = {
  vus: 5,
  duration: '20s',
  thresholds: {
    success_rate: ['rate>0.95'], // >95% giao dịch phải thành công
    login_duration: ['p(95)<800'], // p95 thời gian login < 800ms
    my_errors: ['count<10'], // tổng lỗi nghiệp vụ < 10
  },
};

export default function () {
  const res = http.get('https://test.k6.io');

  const ok = res.status === 200;

  // Rate.add(boolean): true tính là "thành công", false là "thất bại".
  successRate.add(ok);

  // Counter.add(số): cộng dồn. Chỉ cộng khi có lỗi.
  if (!ok) {
    myErrors.add(1);
  }

  // Gauge.add(số): ghi đè bằng giá trị mới nhất (kích thước body lần này).
  responseSize.add(res.body ? res.body.length : 0);

  // Trend.add(số): nạp một mẫu vào phân phối — ở đây là thời gian của request.
  loginDuration.add(res.timings.duration);

  check(res, { 'status 200': (r) => r.status === 200 });
  sleep(1);
}
