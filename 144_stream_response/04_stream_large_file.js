/**
 * Level 4 — Stream file lớn: tại sao streaming tiết kiệm RAM
 *
 * Sai lầm kinh điển khi trả file lớn:
 *     const data = await fs.readFile(bigFile);   // nạp CẢ file vào RAM
 *     res.end(data);                             // 500MB file = 500MB RAM/req
 *
 * Cách đúng: fs.createReadStream(file).pipe(res)
 *   - Đọc file theo chunk (mặc định 64KB), đẩy thẳng ra response.
 *   - RAM chỉ giữ vài chunk tại một thời điểm, bất kể file to cỡ nào.
 *   - pipe() tự lo backpressure: client mạng chậm -> đọc đĩa chậm lại.
 *
 * File này: tạo 1 file tạm ~20MB, ĐO trực tiếp RAM của 2 cách (readFile vs
 * stream) để thấy khác biệt, rồi phục vụ file qua HTTP + demo Range.
 *
 * Chạy: npm run 04:file
 */

import http from 'node:http';
import fs from 'node:fs';
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PORT = 3104;
const BIG_FILE = join(tmpdir(), 'stream_demo_big.txt');
const TARGET_MB = 20;

const rss = () => process.memoryUsage().rss;
const mb = (bytes) => (bytes / 1024 / 1024).toFixed(1) + 'MB';

// ----- Tạo file lớn bằng stream (không giữ toàn bộ trong RAM) ---------------
async function makeBigFile() {
  const oneKb = 'x'.repeat(1023) + '\n';
  async function* gen() {
    for (let i = 0; i < TARGET_MB * 1024; i++) yield oneKb; // 1KB * (MB*1024)
  }
  await pipeline(Readable.from(gen()), createWriteStream(BIG_FILE));
  const { size } = await fs.promises.stat(BIG_FILE);
  console.log(`Đã tạo file tạm ${mb(size)} tại ${BIG_FILE}\n`);
}

// ----- So sánh RAM: đọc cả file vào RAM vs. đọc theo chunk (streaming) ------
async function compareMemory() {
  // (a) Cách SAI: readFileSync -> buffer 20MB sống trong RAM.
  const before = rss();
  let whole = fs.readFileSync(BIG_FILE); // giữ toàn bộ file
  const heldByReadFile = rss() - before;
  console.log(`(a) fs.readFileSync giữ trong RAM: +${mb(heldByReadFile)} (≈ kích thước file)`);
  whole = null; // thả tham chiếu

  // (b) Cách ĐÚNG: đọc theo chunk, không bao giờ giữ quá 1 chunk 64KB.
  // Chỉ cần lặp qua stream rồi bỏ đi (không ghi ra đâu cả) là đủ để đo.
  let maxChunk = 0;
  let total = 0;
  for await (const chunk of createReadStream(BIG_FILE)) {
    maxChunk = Math.max(maxChunk, chunk.length);
    total += chunk.length;
  }
  console.log(`(b) createReadStream đọc ${mb(total)} nhưng chunk lớn nhất chỉ ${(maxChunk / 1024).toFixed(0)}KB`);
  console.log('    => RAM giữ vài chục KB tại một thời điểm, bất kể file to cỡ nào.\n');
}

// ----- Server: phục vụ file qua stream + hỗ trợ HTTP Range -----------------
const server = http.createServer((req, res) => {
  const { size } = fs.statSync(BIG_FILE);
  const range = req.headers.range; // vd: "bytes=0-1048575"

  if (range) {
    const [startStr, endStr] = range.replace('bytes=', '').split('-');
    const start = parseInt(startStr, 10);
    const end = endStr ? parseInt(endStr, 10) : size - 1;
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': end - start + 1,
      'Content-Type': 'text/plain',
    });
    createReadStream(BIG_FILE, { start, end }).pipe(res);
    return;
  }

  res.writeHead(200, { 'Content-Length': size, 'Content-Type': 'text/plain' });
  createReadStream(BIG_FILE).pipe(res); // <-- điểm mấu chốt: KHÔNG readFile
});

async function main() {
  await makeBigFile();
  await compareMemory();

  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`Server: http://localhost:${PORT}/`);

  // Client 1: tải toàn bộ qua HTTP (server dùng stream nên RAM server phẳng).
  const res = await fetch(`http://localhost:${PORT}/`);
  let received = 0;
  for await (const chunk of res.body) received += chunk.length;
  console.log(`Tải full qua HTTP: nhận ${mb(received)} (server phục vụ bằng stream, không readFile)`);

  // Client 2: HTTP Range - chỉ lấy 1MB đầu.
  const partial = await fetch(`http://localhost:${PORT}/`, { headers: { Range: 'bytes=0-1048575' } });
  const buf = await partial.arrayBuffer();
  console.log(`Range (bytes=0-1048575): HTTP ${partial.status}, nhận ${mb(buf.byteLength)} -> nền tảng tua video / resume\n`);

  server.close();
  await fs.promises.unlink(BIG_FILE); // dọn file tạm
  console.log('✅ Đã xoá file tạm. Xong.');
  process.exit(0);
}

main();
