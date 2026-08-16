/**
 * Level 2 — HTTP streaming bằng "Transfer-Encoding: chunked"
 *
 * Đây là nền tảng của MỌI "stream response" qua HTTP.
 *   - Response bình thường: server tính sẵn toàn bộ body -> gửi kèm
 *     header `Content-Length` -> client chờ nhận đủ mới xử lý.
 *   - Response dạng stream: server KHÔNG biết trước độ dài -> bỏ Content-Length,
 *     mỗi lần `res.write()` là một chunk gửi ngay. Node tự thêm
 *     header `Transfer-Encoding: chunked`. Client thấy dữ liệu tới DẦN.
 *
 * File này vừa dựng server, vừa tự chạy một client (fetch) để bạn thấy
 * từng chunk đến ở các mốc thời gian khác nhau, rồi tự thoát.
 *
 * Chạy: npm run 02:chunked
 * Test tay: mở terminal khác gõ  ->  curl -N http://localhost:3102/stream
 *           (cờ -N tắt buffer của curl để thấy chunk đến ngay)
 */

import http from 'node:http';
import { setTimeout as sleep } from 'node:timers/promises';

const PORT = 3102;

const server = http.createServer(async (req, res) => {
  if (req.url !== '/stream') {
    res.writeHead(404).end('Not found\n');
    return;
  }

  // KHÔNG set Content-Length => Node dùng Transfer-Encoding: chunked.
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });

  // Mỗi res.write() đẩy 1 chunk ra dây ngay lập tức.
  for (let i = 1; i <= 5; i++) {
    res.write(`chunk ${i} lúc ${new Date().toLocaleTimeString('vi-VN')}\n`);
    await sleep(500); // giả lập server tính toán / gọi DB giữa các chunk
  }
  res.end('-- hết stream --\n');
});

server.listen(PORT, async () => {
  console.log(`Server chạy ở http://localhost:${PORT}/stream`);
  console.log('Client tự động đang đọc stream (chú ý mốc +ms):\n');

  // ----- Client: đọc body theo chunk bằng Web Streams API của fetch -----
  const res = await fetch(`http://localhost:${PORT}/stream`);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const start = Date.now();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const ms = Date.now() - start;
    // In ngay khi chunk tới -> thấy rõ dữ liệu "chảy" chứ không tới 1 lần.
    process.stdout.write(`  [+${String(ms).padStart(4)}ms] ${decoder.decode(value)}`);
  }

  console.log('\n✅ Nếu server trả 1 cục, mọi dòng sẽ hiện cùng lúc ở ~0ms.');
  console.log('   Ở đây mỗi dòng cách nhau ~500ms => đó chính là streaming.');
  server.close(() => process.exit(0));
});
