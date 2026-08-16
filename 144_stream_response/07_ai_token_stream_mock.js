/**
 * Level 7 — Hiệu ứng "gõ chữ" kiểu ChatGPT/Claude (MÔ PHỏNG, không cần API key)
 *
 * Vì sao chatbot AI phải stream? Model sinh chữ theo TỪNG TOKEN. Nếu chờ
 * sinh xong cả câu mới trả, người dùng đợi hàng chục giây trước màn hình trống.
 * Stream từng token về ngay -> chữ hiện dần -> cảm giác nhanh & sống động.
 *
 * File này KHÔNG gọi API thật. Nó tự "phát" một câu trả lời có sẵn theo
 * từng token qua SSE, nhưng dùng ĐÚNG khung sự kiện của Claude Messages API
 * để bạn quen với shape thật (xem Level 8 để gọi thật):
 *
 *     event: message_start        -> bắt đầu message (metadata)
 *     event: content_block_start  -> mở 1 khối nội dung
 *     event: content_block_delta  -> data.delta.text = 1 mẩu chữ  (lặp nhiều lần)
 *     event: content_block_stop   -> đóng khối
 *     event: message_delta        -> stop_reason + usage tokens
 *     event: message_stop         -> kết thúc
 *
 * Chạy: npm run 07:ai-mock   rồi mở http://localhost:3107
 */

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 3107;

// "Câu trả lời của model" cắt sẵn thành token (chỗ này model thật sẽ sinh động).
function fakeAnswer(question) {
  const text =
    `Bạn vừa hỏi: "${question}". Đây là câu trả lời được stream theo từng token, ` +
    `giống hệt cách một mô hình ngôn ngữ đẩy chữ về client. Mỗi mẩu chữ là một ` +
    `sự kiện content_block_delta trên SSE. Nhờ vậy chữ hiện dần thay vì hiện một lần.`;
  return text.match(/\S+\s*/g) || []; // tách theo "từ + khoảng trắng" làm token
}

function sse(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === '/' || url.pathname === '/index.html') {
    const html = await readFile(join(__dirname, 'public', 'chat.html'));
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  if (url.pathname === '/chat') {
    const question = url.searchParams.get('q') || '(trống)';
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    const tokens = fakeAnswer(question);

    // 1) message_start
    sse(res, 'message_start', {
      type: 'message_start',
      message: { id: 'msg_mock', role: 'assistant', model: 'mock-model', content: [] },
    });
    // 2) content_block_start
    sse(res, 'content_block_start', {
      type: 'content_block_start',
      index: 0,
      content_block: { type: 'text', text: '' },
    });

    // 3) content_block_delta * N  (đây là phần "gõ chữ")
    let closed = false;
    req.on('close', () => (closed = true)); // client đóng tab -> dừng phát
    for (const tok of tokens) {
      if (closed) return;
      sse(res, 'content_block_delta', {
        type: 'content_block_delta',
        index: 0,
        delta: { type: 'text_delta', text: tok },
      });
      await sleep(60); // độ trễ giả để thấy hiệu ứng gõ
    }

    // 4) đóng khối + message_delta (usage) + message_stop
    sse(res, 'content_block_stop', { type: 'content_block_stop', index: 0 });
    sse(res, 'message_delta', {
      type: 'message_delta',
      delta: { stop_reason: 'end_turn' },
      usage: { output_tokens: tokens.length },
    });
    sse(res, 'message_stop', { type: 'message_stop' });
    res.end();
    return;
  }

  res.writeHead(404).end('Not found\n');
});

server.listen(PORT, () => {
  console.log(`Chat demo (mô phỏng): mở http://localhost:${PORT}`);
  console.log('Gõ câu hỏi và xem chữ hiện dần theo từng token.');
  console.log('Muốn gọi Claude API THẬT -> xem Level 8. Ctrl+C để dừng.');
});
