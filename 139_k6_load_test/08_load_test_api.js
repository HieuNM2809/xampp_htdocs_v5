// 08_load_test_api.js
// -----------------------------------------------------------------------------
// LOAD TEST THỰC TẾ một REST API công khai: https://jsonplaceholder.typicode.com
// (API giả lập miễn phí, hỗ trợ GET/POST/PUT/DELETE — dùng để học & demo).
//
// Mô phỏng một "user journey" (hành trình người dùng) điển hình:
//   1) GET danh sách bài viết (/posts)
//   2) GET chi tiết 1 bài viết ngẫu nhiên (/posts/:id)
//   3) GET các comment của bài đó (/posts/:id/comments)
//   4) POST tạo bài viết mới (/posts)
//
// Chạy:
//   k6 run 08_load_test_api.js
//   k6 run -e BASE_URL=https://jsonplaceholder.typicode.com 08_load_test_api.js
// -----------------------------------------------------------------------------

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'https://jsonplaceholder.typicode.com';

// --- Custom metric: tách riêng latency của endpoint tạo bài (POST) ----------
// Giúp theo dõi riêng API ghi (thường chậm hơn API đọc) thay vì gộp chung.
const createPostDuration = new Trend('create_post_duration', true);
const bizErrors = new Rate('business_errors'); // tỉ lệ lỗi nghiệp vụ tự định nghĩa

export const options = {
  // ĐƯỜNG TẢI ĐẶC TRƯNG CỦA LOAD TEST: tăng dần -> giữ ổn định -> giảm dần.
  stages: [
    { duration: '30s', target: 20 }, // ramp-up: 0 -> 20 VU
    { duration: '1m', target: 20 }, // giữ 20 VU (tải kỳ vọng) trong 1 phút
    { duration: '20s', target: 0 }, // ramp-down về 0
  ],

  thresholds: {
    // SLA tổng thể: 95% request < 800ms, 99% < 1500ms
    http_req_duration: ['p(95)<800', 'p(99)<1500'],
    // Tỉ lệ request HTTP lỗi (status>=400) phải < 1%
    http_req_failed: ['rate<0.01'],
    // > 99% các check phải đúng
    checks: ['rate>0.99'],
    // Ngưỡng riêng cho endpoint POST (ghi dữ liệu thường chậm hơn đọc)
    create_post_duration: ['p(95)<1200'],
    // Lỗi nghiệp vụ phải < 1%
    business_errors: ['rate<0.01'],
  },
};

export default function () {
  // `group` gom các bước thành nhóm logic, dễ đọc trong báo cáo & trace.
  group('01 - Lấy danh sách bài viết', function () {
    const res = http.get(`${BASE_URL}/posts`);
    const ok = check(res, {
      'GET /posts status 200': (r) => r.status === 200,
      'trả về mảng > 0 phần tử': (r) => Array.isArray(r.json()) && r.json().length > 0,
    });
    bizErrors.add(!ok); // ghi nhận lỗi nghiệp vụ nếu check sai
  });

  sleep(1); // think-time: người dùng đọc danh sách trước khi click

  // Chọn 1 bài viết ngẫu nhiên (1..100). __VU/__ITER cũng có thể dùng để đa dạng dữ liệu.
  const postId = ((__VU + __ITER) % 100) + 1;

  group('02 - Xem chi tiết & comment', function () {
    // Gửi 2 request song song bằng http.batch (nhanh hơn gửi tuần tự).
    const responses = http.batch([
      ['GET', `${BASE_URL}/posts/${postId}`],
      ['GET', `${BASE_URL}/posts/${postId}/comments`],
    ]);

    check(responses[0], {
      'GET /posts/:id status 200': (r) => r.status === 200,
      'đúng id bài viết': (r) => r.json('id') === postId,
    });
    check(responses[1], {
      'GET comments status 200': (r) => r.status === 200,
      'comments là mảng': (r) => Array.isArray(r.json()),
    });
  });

  sleep(1);

  group('03 - Tạo bài viết mới (POST)', function () {
    const payload = JSON.stringify({
      title: `bài test từ VU ${__VU}`,
      body: 'nội dung kiểm thử tải',
      userId: (__VU % 10) + 1,
    });
    const params = { headers: { 'Content-Type': 'application/json; charset=UTF-8' } };

    const res = http.post(`${BASE_URL}/posts`, payload, params);

    // Nạp latency của riêng POST vào Trend tùy biến.
    createPostDuration.add(res.timings.duration);

    const ok = check(res, {
      // jsonplaceholder trả về 201 Created cho POST thành công.
      'POST /posts status 201': (r) => r.status === 201,
      'trả về id mới': (r) => r.json('id') !== undefined,
    });
    bizErrors.add(!ok);
  });

  sleep(1);
}
