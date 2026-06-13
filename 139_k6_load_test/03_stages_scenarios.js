// 03_stages_scenarios.js
// -----------------------------------------------------------------------------
// STAGES & SCENARIOS: kiểm soát tải thay đổi theo thời gian.
//
//  - `stages`    : cách ĐƠN GIẢN — tăng/giảm số VU theo các mốc thời gian
//                  (ramp-up -> giữ -> ramp-down). Dùng executor `ramping-vus`.
//  - `scenarios` : cách NÂNG CAO — chạy NHIỀU kịch bản song song, mỗi kịch bản
//                  có executor riêng (ramping-vus, constant-arrival-rate, ...).
//
// Chạy:  k6 run 03_stages_scenarios.js
// -----------------------------------------------------------------------------

import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  // ===========================================================================
  // CÁCH 1 — STAGES (đơn giản, đủ dùng cho đa số load test)
  // Bỏ comment khối này VÀ comment khối `scenarios` bên dưới để dùng.
  // ===========================================================================
  // stages: [
  //   { duration: '30s', target: 20 },  // ramp-up: 0 -> 20 VU trong 30s
  //   { duration: '1m',  target: 20 },  // giữ ổn định 20 VU trong 1 phút
  //   { duration: '10s', target: 0  },  // ramp-down: 20 -> 0 VU trong 10s
  // ],

  // ===========================================================================
  // CÁCH 2 — SCENARIOS (nhiều kịch bản, nhiều executor)
  // ===========================================================================
  scenarios: {
    // --- Kịch bản A: ramping-vus ---
    // Điều khiển theo SỐ VU. Phù hợp khi muốn "có bao nhiêu người dùng đồng thời".
    // Nhược điểm: RPS phụ thuộc tốc độ phản hồi của server (server chậm => ít request hơn).
    browsing: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 10 },
        { duration: '40s', target: 10 },
        { duration: '10s', target: 0 },
      ],
      exec: 'browse', // gọi hàm export tên `browse` (không phải `default`)
      tags: { scenario: 'browsing' }, // gắn tag để lọc metric theo kịch bản
    },

    // --- Kịch bản B: constant-arrival-rate ---
    // Điều khiển theo TỐC ĐỘ ĐẾN (số request/giây) — KHÔNG phụ thuộc thời gian
    // phản hồi của server. Đây là cách ĐÚNG để test "hệ thống chịu được bao nhiêu RPS".
    // k6 tự tăng/giảm số VU để giữ đúng rate; nếu thiếu VU sẽ cảnh báo "insufficient VUs".
    api_load: {
      executor: 'constant-arrival-rate',
      rate: 50, // mục tiêu: 50 lần lặp ...
      timeUnit: '1s', // ... mỗi 1 giây => 50 RPS
      duration: '1m', // chạy trong 1 phút
      preAllocatedVUs: 20, // số VU cấp phát sẵn (dự trù đủ để đạt rate)
      maxVUs: 100, // trần VU k6 được phép tăng thêm nếu server chậm
      exec: 'callApi',
      startTime: '10s', // bắt đầu trễ 10s so với lúc test khởi động
      tags: { scenario: 'api_load' },
    },
  },
};

// Hàm cho kịch bản A
export function browse() {
  http.get('https://test.k6.io');
  sleep(1);
}

// Hàm cho kịch bản B
export function callApi() {
  http.get('https://test.k6.io/contacts.php');
  // Không sleep: với arrival-rate, chính k6 điều phối nhịp độ, không cần think-time.
}

// -----------------------------------------------------------------------------
// CÁC EXECUTOR PHỔ BIẾN (chọn theo "muốn kiểm soát điều gì"):
//   shared-iterations        : chia N iteration cho các VU (chạy xong là dừng).
//   per-vu-iterations        : mỗi VU chạy đúng N iteration.
//   constant-vus             : số VU cố định trong suốt duration.
//   ramping-vus              : tăng/giảm VU theo stages (kiểm soát SỐ NGƯỜI DÙNG).
//   constant-arrival-rate    : giữ RPS cố định (kiểm soát THÔNG LƯỢNG).
//   ramping-arrival-rate     : tăng/giảm RPS theo stages — chuẩn cho spike/stress test.
// -----------------------------------------------------------------------------
