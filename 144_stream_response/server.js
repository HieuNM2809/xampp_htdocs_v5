/**
 * Chat streaming demo (MOCK) — câu trả lời hiện dần từng chữ, giống ChatGPT/Claude.
 *
 * Ý tưởng: thay vì chờ sinh xong cả câu rồi mới trả (người dùng nhìn màn hình
 * trống hàng giây), server đẩy TỪNG MẨU CHỮ về client ngay khi có, qua một HTTP
 * response streaming. Trình duyệt đọc dần và "gõ" chữ ra màn hình.
 *
 * Đây là bản MÔ PHỎNG: câu trả lời do server tự bịa (không gọi API nào), nên
 * chạy được ngay, không cần key, không cần cài gì.
 *
 * Vì sao POST + đọc stream bằng fetch (không dùng EventSource)?
 *   - Chat nhiều lượt cần gửi CẢ lịch sử hội thoại lên server -> phải POST body.
 *   - EventSource chỉ GET được, nên ta dùng fetch() rồi tự đọc response.body.
 *   Đây đúng là cách web chat thật (ChatGPT/Claude) làm.
 *
 * Khung dữ liệu server -> client (một dòng SSE mỗi sự kiện, JSON trong `data:`):
 *   { "type": "delta", "text": "..." }   // 1 mẩu chữ (lặp N lần) — phần "gõ chữ"
 *   { "type": "done",  "usage": {...} }  // kết thúc + số "token"
 *   { "type": "error", "message": "..." }// nếu có lỗi
 *
 * CHẠY:  node server.js   rồi mở http://localhost:3144
 */

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 3144;

// Đọc toàn bộ body và parse JSON (giới hạn ~1MB cho an toàn).
function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (c) => {
      raw += c;
      if (raw.length > 1_000_000) reject(new Error('Body quá lớn'));
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

// Ghi 1 sự kiện SSE. Bỏ qua nếu client đã đóng kết nối (tránh ghi vào socket chết).
function sse(res, obj) {
  if (res.writableEnded || res.destroyed) return;
  res.write(`data: ${JSON.stringify(obj)}\n\n`);
}

// Tạo câu trả lời giả lập dựa trên tin nhắn cuối của người dùng.
function fakeReply(question) {
  const q = question.toLowerCase();
  if (/(^|\s)(chào|hi|hello|hey|xin chào)(\s|$|!)/.test(q)) {
    return 'Chào bạn! 👋 Mình là chatbot demo (mock). Gõ gì đó và xem câu trả lời hiện dần theo từng chữ nhé.';
  }
  if (q.includes('stream')) {
    return (
      'Stream response là kiểu trả dữ liệu theo từng mẩu ngay khi có, thay vì gom ' +
      'hết rồi trả một cục. Nhờ vậy chữ hiện dần, người dùng không phải chờ màn hình trống.'
    );
  }
  return (
    `Bạn vừa hỏi: "${question}". Đây là câu trả lời MÔ PHỎNG được đẩy về theo ` +
    `từng chữ, y hệt cách một mô hình ngôn ngữ stream token. Đây chỉ là demo nên ` +
    `mình chưa hiểu nội dung — mục tiêu là cho bạn thấy hiệu ứng "gõ chữ".`
  );
}

// "Gõ" câu trả lời theo từng chữ qua SSE.
async function streamMock(messages, res) {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  const answer = fakeReply(lastUser?.content || '(trống)');

  const tokens = answer.match(/\S+\s*/g) || []; // tách "từ + khoảng trắng" làm token giả
  for (const tok of tokens) {
    if (res.writableEnded || res.destroyed) return; // client đã đóng -> dừng
    sse(res, { type: 'delta', text: tok });
    await sleep(45); // độ trễ giả để thấy hiệu ứng gõ chữ
  }
  sse(res, { type: 'done', usage: { output_tokens: tokens.length } });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // Trang chat
  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
    const html = await readFile(join(__dirname, 'public', 'chat.html'));
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  // Endpoint stream: nhận { messages: [...] }, trả "token" dần qua SSE.
  if (req.method === 'POST' && url.pathname === '/chat') {
    let body;
    try {
      body = await readJsonBody(req);
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'JSON body không hợp lệ' }));
      return;
    }

    const messages = Array.isArray(body?.messages) ? body.messages : [];
    if (messages.length === 0) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Thiếu "messages"' }));
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    try {
      await streamMock(messages, res);
    } catch (err) {
      sse(res, { type: 'error', message: err?.message || String(err) });
    } finally {
      if (!res.writableEnded) res.end();
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not found\n');
});

server.listen(PORT, () => {
  console.log(`Chat streaming demo (mock) -> http://localhost:${PORT}`);
  console.log('Gõ tin nhắn và xem chữ hiện dần theo từng token. Ctrl+C để dừng.');
});
