/**
 * Level 5 — Transform stream & pipeline: biến đổi dữ liệu trên đường chảy
 *
 * Transform = vừa Readable vừa Writable: dữ liệu đi vào, được biến đổi, đi ra.
 * Rất nhiều thứ trong Node là Transform: zlib.createGzip(), crypto cipher,
 * các parser CSV/JSON streaming...
 *
 * Ta ghép một "dây chuyền" (pipeline):
 *     nguồn dòng chữ -> Transform (viết hoa) -> Gzip (nén) -> ghi file
 * rồi đọc ngược lại:
 *     đọc file .gz -> Gunzip (giải nén) -> in ra màn hình
 *
 * Dùng stream.pipeline (bản promises) thay vì .pipe() thủ công vì pipeline:
 *   - Tự truyền lỗi giữa các stage (một stage lỗi -> cả dây được dọn dẹp).
 *   - Tự đóng mọi stream, tránh rò rỉ file descriptor.
 *
 * Chạy: npm run 05:transform
 */

import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createGzip, createGunzip } from 'node:zlib';
import { createWriteStream, createReadStream } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import fs from 'node:fs/promises';

const GZ_FILE = join(tmpdir(), 'stream_demo.txt.gz');

// ----- Nguồn: phát vài dòng chữ thường -----
async function* lines() {
  const data = ['xin chao', 'day la transform stream', 'nen gzip on the fly', 'ket thuc'];
  for (const l of data) yield l + '\n';
}

// ----- Transform tuỳ biến: viết hoa từng chunk -----
const toUpper = new Transform({
  transform(chunk, _enc, callback) {
    // chunk là Buffer -> đổi sang chữ hoa rồi đẩy ra bằng callback(null, data)
    callback(null, chunk.toString().toUpperCase());
  },
});

async function main() {
  // ---- Chiều nén: source -> uppercase -> gzip -> file .gz ----
  await pipeline(Readable.from(lines()), toUpper, createGzip(), createWriteStream(GZ_FILE));

  const gzStat = await fs.stat(GZ_FILE);
  console.log(`Đã ghi file nén: ${GZ_FILE} (${gzStat.size} bytes)\n`);

  // ---- Chiều giải nén: file .gz -> gunzip -> gom ra chuỗi ----
  console.log('Đọc lại + giải nén (dữ liệu đã được viết hoa trên đường đi):');
  const chunks = [];
  const collector = new Transform({
    transform(chunk, _enc, cb) {
      chunks.push(chunk);
      cb(null, chunk); // vẫn cho chảy tiếp (ở đây chỉ để gom)
    },
  });
  await pipeline(createReadStream(GZ_FILE), createGunzip(), collector);
  process.stdout.write(Buffer.concat(chunks).toString());

  await fs.unlink(GZ_FILE);
  console.log('\n✅ Ý chính: Transform cho phép nén/mã hoá/parse NGAY trên luồng,');
  console.log('   không cần nạp hết dữ liệu vào RAM trước khi xử lý.');
}

main().catch((err) => {
  // pipeline tự dọn dẹp; ta chỉ cần log lỗi.
  console.error('Lỗi pipeline:', err);
  process.exit(1);
});
