// 02_thresholds.js
// -----------------------------------------------------------------------------
// THRESHOLDS = NGƯỠNG PASS/FAIL. Đây là thứ biến k6 từ "công cụ đo" thành
// "công cụ kiểm thử": nếu kết quả không đạt ngưỡng, k6 thoát với exit code != 0
// => CI/CD (Jenkins, GitHub Actions...) sẽ đánh dấu build FAIL.
// Chạy:  k6 run 02_thresholds.js
// -----------------------------------------------------------------------------

import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',

  thresholds: {
    // --- Ngưỡng trên thời gian phản hồi của HTTP request ---
    // p(95) = phân vị 95: 95% request phải nhanh hơn 500ms.
    // p(99) = 99% request phải nhanh hơn 1500ms.
    // Dùng phân vị thay vì trung bình vì trung bình che giấu các request chậm bất thường.
    http_req_duration: ['p(95)<500', 'p(99)<1500'],

    // --- Ngưỡng trên tỉ lệ request lỗi ---
    // Tỉ lệ request thất bại (status >= 400 hoặc lỗi mạng) phải < 1%.
    http_req_failed: ['rate<0.01'],

    // Có thể đặt nhiều điều kiện cho 1 metric. `abortOnFail` dừng test NGAY
    // khi vi phạm (tiết kiệm thời gian, không chờ hết duration mới biết fail).
    // http_req_duration: [{ threshold: 'p(95)<500', abortOnFail: true }],
  },
};

export default function () {
  http.get('https://test.k6.io');
  sleep(1);
}

// -----------------------------------------------------------------------------
// CÚ PHÁP NGƯỠNG TỔNG QUÁT:  '<aggregation> <toán tử> <giá trị>'
//   - avg   : trung bình            ->  'avg<200'
//   - min/max                       ->  'max<1000'
//   - med   : trung vị (p50)        ->  'med<150'
//   - p(N)  : phân vị thứ N         ->  'p(90)<400'
//   - rate  : tỉ lệ (cho Rate)      ->  'rate<0.01'  (dưới 1%)
//   - count : tổng số đếm           ->  'count>100'
// -----------------------------------------------------------------------------
