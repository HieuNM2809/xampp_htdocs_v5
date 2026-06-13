// 04_checks.js
// -----------------------------------------------------------------------------
// CHECKS = xác thực phản hồi (giống "assert" nhưng KHÔNG dừng test khi sai).
// Khác biệt quan trọng với thresholds:
//   - check  : ghi nhận đúng/sai cho TỪNG request, test VẪN tiếp tục dù sai.
//   - threshold: quyết định toàn bộ test PASS/FAIL (exit code).
// Thực tế thường KẾT HỢP: dùng checks để kiểm tra, rồi đặt threshold trên
// metric `checks` để fail test khi tỉ lệ check đúng quá thấp.
// Chạy:  k6 run 04_checks.js
// -----------------------------------------------------------------------------

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 5,
  duration: '20s',
  thresholds: {
    // `checks` là metric tự sinh = tỉ lệ check đúng. Yêu cầu > 99% check phải đúng.
    checks: ['rate>0.99'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const res = http.get('https://test.k6.io');

  // `check(đối_tượng, { 'tên check': hàm_trả_về_boolean })`
  // Mỗi cặp key/value là một điều kiện; trả về true => đúng, false => sai.
  check(res, {
    'status là 200': (r) => r.status === 200,
    'thời gian phản hồi < 500ms': (r) => r.timings.duration < 500,
    'body chứa chữ "Collection"': (r) => r.body.includes('Collection'),
    'header Content-Type là text/html': (r) =>
      r.headers['Content-Type'] && r.headers['Content-Type'].includes('text/html'),
  });

  // VÍ DỤ POST + kiểm tra JSON trả về -----------------------------------------
  const payload = JSON.stringify({ username: 'test', password: '1234' });
  const params = { headers: { 'Content-Type': 'application/json' } };
  const loginRes = http.post('https://test.k6.io/contacts.php', payload, params);

  check(loginRes, {
    'login trả về 200': (r) => r.status === 200,
    // r.json() parse body thành object để kiểm tra field cụ thể:
    // 'có token': (r) => r.json('token') !== undefined,
  });

  sleep(1);
}
