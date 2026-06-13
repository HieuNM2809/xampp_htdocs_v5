// 06_env_data.js
// -----------------------------------------------------------------------------
// BIẾN MÔI TRƯỜNG (__ENV) + NẠP DỮ LIỆU TEST (SharedArray, đọc JSON/CSV).
//
// VÌ SAO CẦN SharedArray?
//   k6 chạy MỖI VU trong một runtime JS riêng. Nếu mỗi VU đọc & giữ bản sao
//   của file dữ liệu => tốn RAM gấp N lần. SharedArray nạp dữ liệu MỘT LẦN và
//   CHIA SẺ (chỉ-đọc) cho mọi VU => tiết kiệm bộ nhớ với data lớn (10k+ dòng).
//
// Chạy:
//   k6 run 06_env_data.js
//   k6 run -e BASE_URL=https://test.k6.io -e THINK_TIME=2 06_env_data.js
// -----------------------------------------------------------------------------

import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
// `papaparse` để parse CSV — k6 không có sẵn, nạp từ jslib qua URL (k6 tự cache).
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';

// --- BIẾN MÔI TRƯỜNG: đọc qua __ENV.<TÊN>; luôn đặt giá trị mặc định ---------
// __ENV.X lấy từ cờ `-e X=...` hoặc biến môi trường của hệ điều hành.
const BASE_URL = __ENV.BASE_URL || 'https://test.k6.io';
const THINK_TIME = Number(__ENV.THINK_TIME || 1);

// --- Nạp JSON một lần, chia sẻ cho mọi VU -----------------------------------
// Callback bên trong CHỈ chạy 1 lần ở init context. open() đọc file thành chuỗi.
const usersJson = new SharedArray('users from json', function () {
  return JSON.parse(open('./data/users.json'));
});

// --- Nạp CSV một lần và parse thành mảng object ------------------------------
const usersCsv = new SharedArray('users from csv', function () {
  // header:true => dòng đầu là tên cột, kết quả là mảng {username, password}.
  return papaparse.parse(open('./data/users.csv'), { header: true }).data
    // lọc dòng rỗng cuối file (nếu có)
    .filter((row) => row.username);
});

export const options = {
  vus: 5,
  duration: '20s',
};

export default function () {
  // __VU   : số thứ tự VU hiện tại (bắt đầu từ 1).
  // __ITER : số thứ tự iteration của VU đó (bắt đầu từ 0).
  // Dùng để chọn dữ liệu khác nhau cho mỗi VU/iteration (data parameterization),
  // tránh mọi VU dùng chung 1 user => không thực tế và dễ bị cache.
  const user = usersJson[(__VU - 1) % usersJson.length];

  const res = http.post(
    `${BASE_URL}/contacts.php`,
    JSON.stringify({ username: user.username, password: user.password }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(res, { 'status 200': (r) => r.status === 200 });

  // Chỉ in 1 lần ở VU 1, iteration 0 để minh hoạ dữ liệu CSV đã nạp.
  if (__VU === 1 && __ITER === 0) {
    console.log(`Đã nạp ${usersCsv.length} user từ CSV. Ví dụ: ${usersCsv[0].username}`);
  }

  sleep(THINK_TIME);
}
