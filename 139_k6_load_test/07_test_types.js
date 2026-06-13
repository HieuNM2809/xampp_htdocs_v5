// 07_test_types.js
// -----------------------------------------------------------------------------
// 4 LOẠI KIỂM THỬ HIỆU NĂNG trong MỘT file — chọn loại bằng biến môi trường:
//   k6 run -e TYPE=load  07_test_types.js
//   k6 run -e TYPE=stress 07_test_types.js
//   k6 run -e TYPE=spike 07_test_types.js
//   k6 run -e TYPE=soak  07_test_types.js   (chú ý: soak chạy rất lâu!)
//
// Khác nhau cốt lõi nằm ở HÌNH DẠNG ĐƯỜNG TẢI (stages) theo thời gian.
// -----------------------------------------------------------------------------

import http from 'k6/http';
import { check, sleep } from 'k6';

const TYPE = __ENV.TYPE || 'load';

// Mỗi profile = một mảng stages khác nhau (ramp + hold).
const profiles = {
  // LOAD TEST: tải dự kiến ở mức bình thường/đỉnh thông thường. Mục tiêu: xác minh
  // hệ thống đáp ứng SLA ở tải kỳ vọng. Tăng từ từ -> giữ -> giảm.
  load: [
    { duration: '1m', target: 50 },
    { duration: '3m', target: 50 },
    { duration: '1m', target: 0 },
  ],

  // STRESS TEST: đẩy QUÁ tải bình thường để tìm ĐIỂM GÃY (breaking point) và xem
  // hệ thống suy giảm/sập như thế nào. Tăng dần qua nhiều bậc vượt mức đỉnh.
  stress: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '5m', target: 200 },
    { duration: '2m', target: 300 }, // vượt xa tải thường để ép hệ thống
    { duration: '5m', target: 300 },
    { duration: '2m', target: 0 },
  ],

  // SPIKE TEST: tải tăng VỌT đột ngột trong thời gian rất ngắn rồi rút về.
  // Mục tiêu: kiểm tra phản ứng trước cú sốc (flash sale, viral...) và khả năng phục hồi.
  spike: [
    { duration: '10s', target: 50 },
    { duration: '1m', target: 1000 }, // tăng vọt gần như tức thời
    { duration: '10s', target: 1000 },
    { duration: '1m', target: 50 }, // rút về và quan sát phục hồi
    { duration: '10s', target: 0 },
  ],

  // SOAK / ENDURANCE TEST: tải vừa phải nhưng kéo DÀI (giờ). Mục tiêu: phát hiện
  // rò rỉ bộ nhớ (memory leak), đầy log/disk, suy giảm hiệu năng theo thời gian.
  soak: [
    { duration: '5m', target: 80 },
    { duration: '3h', target: 80 }, // giữ tải nhiều giờ liền
    { duration: '5m', target: 0 },
  ],
};

export const options = {
  stages: profiles[TYPE],
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.05'],
  },
  // Đặt tên test trong báo cáo Grafana Cloud k6 (nếu dùng `k6 cloud`).
  // tags: { test_type: TYPE },
};

export default function () {
  const res = http.get('https://test.k6.io');
  check(res, { 'status 200': (r) => r.status === 200 });
  sleep(1);
}

// In ra loại test đang chạy ở init (1 lần).
console.log(`>>> Đang chạy loại test: ${TYPE.toUpperCase()}`);
