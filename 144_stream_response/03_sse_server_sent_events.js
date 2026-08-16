/**
 * Level 3 — Server-Sent Events (SSE): server đẩy dữ liệu real-time về browser
 *
 * SSE là chuẩn HTTP một chiều (server -> client) chạy trên chunked encoding.
 * Đặc điểm bắt buộc:
 *   - Header: Content-Type: text/event-stream
 *   - Kết nối giữ mở, mỗi "event" là 1 block text kết thúc bằng dòng trống:
 *         data: nội dung dòng 1\n
 *         data: nội dung dòng 2\n
 *         \n                         <- dòng trống = kết thúc 1 event
 *   - Có thể đặt tên event:  event: tên\n   và id:  id: 123\n
 *
 * SSE vs WebSocket:
 *   - SSE : 1 chiều, tự reconnect, chạy trên HTTP thường, cực đơn giản.
 *           Hợp với: thông báo, tiến độ job, giá cổ phiếu, LLM token stream.
 *   - WS  : 2 chiều, phức tạp hơn. Hợp với: chat 2 chiều, game, collaborative.
 *
 * Chạy: npm run 03:sse   rồi mở http://localhost:3103 trên trình duyệt.
 * Server giữ chạy cho tới khi bạn Ctrl+C.
 */

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 3103;

const server = http.createServer(async (req, res) => {
  // Trang HTML demo
  if (req.url === '/' || req.url === '/index.html') {
    const html = await readFile(join(__dirname, 'public', 'sse.html'));
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  // Endpoint SSE
  if (req.url === '/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    let count = 0;
    // Đẩy 1 event mỗi giây
    const timer = setInterval(() => {
      count++;
      // event có tên "tick" + có id (browser dùng id để resume khi reconnect)
      res.write(`id: ${count}\n`);
      res.write(`event: tick\n`);
      res.write(`data: ${JSON.stringify({ count, time: new Date().toISOString() })}\n\n`);

      if (count >= 20) {
        res.write('event: done\n');
        res.write('data: hết\n\n');
        clearInterval(timer);
        res.end();
      }
    }, 1000);

    // Dọn dẹp khi client đóng tab / mất kết nối
    req.on('close', () => clearInterval(timer));
    return;
  }

  res.writeHead(404).end('Not found\n');
});

server.listen(PORT, () => {
  console.log(`SSE server: mở http://localhost:${PORT} trên trình duyệt`);
  console.log(`Hoặc test bằng CLI:  curl -N http://localhost:${PORT}/events`);
  console.log('Ctrl+C để dừng.');
});
