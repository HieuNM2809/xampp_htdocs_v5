/**
 * Level 8 — Stream response THẬT từ Claude API (Anthropic SDK)
 *
 * Đây là bản "đời thực" của Level 7: thay câu trả lời mô phỏng bằng model thật.
 * SDK Anthropic bọc sẵn SSE stream, cho ta 2 cách dùng:
 *   - stream.on('text', delta => ...) : nhận từng mẩu chữ (đơn giản nhất)
 *   - for await (const event of stream): nhận sự kiện thô (message_start,
 *     content_block_delta, ...) nếu cần kiểm soát chi tiết.
 *
 * CHUẨN BỊ:
 *   1) npm install                       (cài @anthropic-ai/sdk)
 *   2) copy .env.example -> .env, điền ANTHROPIC_API_KEY
 *      (hoặc: export ANTHROPIC_API_KEY=sk-ant-...   trước khi chạy)
 *   3) npm run 08:claude
 *
 * LƯU Ý BẢO MẬT: .env đã nằm trong .gitignore của folder này. TUYỆT ĐỐI
 * không commit key lên repo (repo này là public).
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- .env loader mini (không cần thư viện) ----------------------------------
// Node 20.6+ có sẵn cờ `--env-file=.env`; hàm này để chạy `node 08_...js` cũng được.
async function loadEnv() {
  try {
    const raw = await readFile(join(__dirname, '.env'), 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {
    /* không có .env cũng không sao, sẽ đọc từ biến môi trường sẵn có */
  }
}

async function main() {
  await loadEnv();

  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('⚠️  Chưa có ANTHROPIC_API_KEY.');
    console.log('   1) cp .env.example .env  rồi điền key');
    console.log('   2) hoặc: export ANTHROPIC_API_KEY=sk-ant-...');
    console.log('   Level 1–7 chạy được ngay mà không cần key này.');
    process.exit(0);
  }

  // import động: nếu chưa `npm install` thì báo rõ thay vì crash khó hiểu.
  let Anthropic;
  try {
    ({ default: Anthropic } = await import('@anthropic-ai/sdk'));
  } catch {
    console.log('⚠️  Chưa cài SDK. Chạy: npm install');
    process.exit(0);
  }

  const client = new Anthropic(); // tự đọc ANTHROPIC_API_KEY từ env

  console.log('Đang stream câu trả lời từ Claude (chữ hiện dần):\n');

  // Có thể đổi sang 'claude-haiku-4-5' cho nhanh & rẻ khi test.
  const stream = client.messages.stream({
    model: 'claude-opus-5',
    max_tokens: 1024,
    messages: [
      { role: 'user', content: 'Giải thích "stream response" trong 3 câu ngắn, bằng tiếng Việt.' },
    ],
  });

  // Cách 1 (khuyến nghị): lắng nghe từng mẩu text và in ngay.
  stream.on('text', (delta) => process.stdout.write(delta));

  // .finalMessage() trả về message hoàn chỉnh sau khi stream xong.
  const final = await stream.finalMessage();
  console.log(`\n\n✅ Xong. Tokens output: ${final.usage.output_tokens}`);

  /*
   * Cách 2 (thô hơn) nếu cần bắt từng loại sự kiện:
   *
   *   for await (const event of stream) {
   *     if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
   *       process.stdout.write(event.delta.text);
   *     }
   *   }
   */
}

main().catch((err) => {
  console.error('Lỗi khi gọi Claude:', err?.message || err);
  process.exit(1);
});
