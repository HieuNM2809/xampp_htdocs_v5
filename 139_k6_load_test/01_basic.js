// 01_basic.js
// -----------------------------------------------------------------------------
// VÍ DỤ CƠ BẢN NHẤT: 1 HTTP request + sleep + vòng lặp của Virtual User (VU)
// Chạy:  k6 run 01_basic.js
//        k6 run --vus 10 --duration 30s 01_basic.js   (10 VU chạy trong 30 giây)
// -----------------------------------------------------------------------------

// `http` là module tích hợp sẵn của k6 để gửi request (GET/POST/PUT/...).
import http from 'k6/http';
// `sleep` tạm dừng VU một khoảng giây — mô phỏng "think time" (thời gian người
// dùng thật dừng lại giữa các thao tác). KHÔNG sleep => mỗi VU bắn request liên
// tục hết tốc lực, không giống hành vi người dùng thật.
import { sleep } from 'k6';

// `options` là cấu hình test. Khai báo ở đây thì không cần truyền cờ --vus/--duration.
export const options = {
  vus: 10, // số Virtual User (luồng ảo) chạy đồng thời
  duration: '10s', // tổng thời gian chạy test
};

// Hàm `default` chính là phần thân vòng lặp mà MỖI VU lặp lại liên tục.
// Một lần chạy trọn vẹn hàm này = 1 "iteration" (lần lặp).
export default function () {
  // Gửi GET request. `res` chứa toàn bộ phản hồi: status, body, headers, timings...
  const res = http.get('https://test.k6.io');

  // In status code ra console (chỉ dùng khi debug — bỏ đi khi chạy tải thật vì
  // log nhiều sẽ làm chậm và rối output).
  console.log(`status: ${res.status}`);

  // Mỗi VU nghỉ 1 giây trước khi lặp lại — mô phỏng người dùng thật.
  sleep(1);
}
