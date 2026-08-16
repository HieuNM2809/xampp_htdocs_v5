/**
 * Level 1 — Streams API cơ bản: Readable, Writable, pipeline & backpressure
 *
 * "Stream response" bắt đầu từ khái niệm gốc của Node: Stream.
 * Thay vì gom hết dữ liệu vào RAM rồi trả 1 cục, ta xử lý dữ liệu theo
 * TỪNG MẨU (chunk) ngay khi nó có -> ít RAM, phản hồi sớm.
 *
 * 3 loại stream hay gặp:
 *   - Readable : nguồn phát dữ liệu (đọc file, HTTP response, DB cursor...)
 *   - Writable : đích nhận dữ liệu (ghi file, HTTP request body, stdout...)
 *   - Transform: vừa đọc vừa biến đổi (gzip, mã hoá, uppercase...) -> Level 5
 *
 * BACKPRESSURE (áp lực ngược) là điểm quan trọng nhất:
 *   Nếu nguồn phát nhanh hơn đích ghi, stream sẽ TỰ ĐỘNG tạm dừng nguồn
 *   để đích tiêu thụ kịp -> không bao giờ phình RAM. `pipe`/`pipeline` lo việc này.
 *
 * Chạy: npm run 01:basics   (hoặc: node 01_stream_basics.js)
 */

import { Readable, Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { setTimeout as sleep } from 'node:timers/promises';

// ----- 1) Tạo Readable từ một async generator -------------------------------
// Mỗi lần `yield` là một chunk được đẩy vào stream. Có delay để mô phỏng
// dữ liệu "đến dần" (giống response từ mạng / DB).
async function* numberSource() {
  for (let i = 1; i <= 5; i++) {
    await sleep(300);
    yield `số ${i}\n`;
  }
}

// ----- 2) Cách tiêu thụ #1: for-await (async iteration) ---------------------
console.log('== Cách 1: đọc bằng for-await (đơn giản nhất) ==');
const readable = Readable.from(numberSource());
for await (const chunk of readable) {
  process.stdout.write(`  nhận: ${chunk}`);
}

// ----- 3) Cách tiêu thụ #2: pipeline + Writable chậm (thấy backpressure) ----
// Writable này cố tình ghi CHẬM (500ms/chunk) trong khi nguồn phát 300ms/chunk.
// pipeline sẽ tự điều tiết: nguồn bị "ghì" lại chờ đích -> RAM luôn phẳng.
console.log('\n== Cách 2: pipeline vào Writable chậm -> backpressure tự động ==');

const slowWriter = new Writable({
  async write(chunk, _encoding, callback) {
    await sleep(500); // giả lập ghi chậm (ổ đĩa/mạng chậm)
    process.stdout.write(`  đã ghi: ${chunk}`);
    callback(); // báo "xong chunk này" -> stream mới đẩy chunk kế tiếp
  },
});

await pipeline(Readable.from(numberSource()), slowWriter);

console.log('\n✅ Xong. Ghi nhớ: dữ liệu chảy theo chunk, backpressure giữ RAM ổn định.');
