/**
 * Level 6 — Streaming JSON theo chuẩn NDJSON (Newline-Delimited JSON)
 *
 * Vấn đề: trả một mảng JSON khổng lồ `[{...},{...}, ...]` buộc:
 *   - Server: build cả mảng trong RAM rồi mới gửi.
 *   - Client: chờ nhận đủ toàn bộ rồi JSON.parse() 1 lần -> chậm & tốn RAM.
 *
 * Giải pháp NDJSON: MỖI DÒNG là một JSON object độc lập, cách nhau bằng '\n'.
 *     {"id":1,"name":"A"}
 *     {"id":2,"name":"B"}
 * Server phát từng record ngay khi có; client parse & xử lý ngay từng dòng
 * mà không cần chờ hết. Đây là format chuẩn cho log, export dữ liệu lớn,
 * và cũng là "họ hàng" của cách LLM stream (mỗi delta 1 dòng).
 *
 * Chạy: npm run 06:ndjson
 */

import http from 'node:http';
import { setTimeout as sleep } from 'node:timers/promises';

const PORT = 3106;

const server = http.createServer(async (req, res) => {
  if (req.url !== '/records') {
    res.writeHead(404).end('Not found\n');
    return;
  }
  // Content-Type quy ước cho NDJSON:
  res.writeHead(200, { 'Content-Type': 'application/x-ndjson; charset=utf-8' });

  // Giả lập lấy từng record từ DB rồi phát ngay (không gom mảng).
  for (let id = 1; id <= 8; id++) {
    const record = { id, name: `user-${id}`, at: new Date().toISOString() };
    res.write(JSON.stringify(record) + '\n'); // 1 object = 1 dòng
    await sleep(300);
  }
  res.end();
});

server.listen(PORT, async () => {
  console.log(`Server NDJSON: http://localhost:${PORT}/records\n`);
  console.log('Client parse & xử lý TỪNG record ngay khi tới:\n');

  const res = await fetch(`http://localhost:${PORT}/records`);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const start = Date.now();
  let buffer = ''; // giữ phần dòng chưa hoàn chỉnh giữa 2 chunk

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Một chunk mạng có thể chứa nhiều dòng, hoặc cắt giữa dòng.
    // -> tách theo '\n', giữ lại phần đuôi chưa có '\n'.
    const parts = buffer.split('\n');
    buffer = parts.pop(); // phần cuối có thể còn dở -> để lại cho vòng sau

    for (const line of parts) {
      if (!line.trim()) continue;
      const record = JSON.parse(line); // parse NGAY từng dòng
      const ms = Date.now() - start;
      console.log(`  [+${String(ms).padStart(4)}ms] xử lý record #${record.id} (${record.name})`);
    }
  }

  console.log('\n✅ Mỗi record được xử lý ngay khi tới, không chờ toàn bộ mảng.');
  console.log('   Ưu điểm: RAM thấp + bắt đầu xử lý sớm (streaming pipeline).');
  server.close(() => process.exit(0));
});
