const Sentry = require('@sentry/node');
const express = require('express');

// Khởi tạo Sentry SDK v5.5.0
Sentry.init({ 
    dsn: 'http://a9c42eccec6145a1b0d060fa7af5235d@localhost:9000/2',
    environment: 'development',
    serverName: 'api-server-01' // Tên máy chủ để tra cứu
});

const app = express();
app.use(express.json());

// 1. [QUAN TRỌNG] Request Handler của Sentry PHẢI LÀ MIDDLEWARE ĐẦU TIÊN
// Tác dụng: Tự động trích xuất mọi thông tin của Request (URL, Method, Browser, IP, Headers...) và gắn vào bộ lưu trữ
app.use(Sentry.Handlers.requestHandler());

console.log("🚀 Bắt đầu test Sentry cực kỳ chi tiết với Express.js...");

// API 1: Test "Cô lập Scope" (Isolation) và "Gom nhóm lỗi" (Fingerprint)
// Lý thuyết: Trong Backend, hàng nghìn Request chạy song song. 
// Nếu dùng chung Sentry.setUser() thông thường -> Dữ liệu User A sẽ vô tình bị gắn nhầm vào lỗi của User B.
app.post('/api/order', (req, res) => {
    const { userId, item } = req.body;

    // Giải pháp: Dùng withScope để tạo 1 "Bong bóng" chứa dữ liệu, chỉ tồn tại duy nhất trong 1 API Request này.
    Sentry.withScope(scope => {
        
        // Gắn dữ liệu an toàn vào Scope
        scope.setUser({ id: userId, username: "Khách hàng " + userId });
        scope.setTag("api_endpoint", "/api/order");
        scope.setExtra("order_payload", req.body);

        // Giả lập logic sinh lỗi
        if (item === 'bom') {
            const error = new Error("Sản phẩm bị cấm kinh doanh!");
            
            // 2. Chỉnh sửa Fingerprint (Gom nhóm Issues)
            // Bình thường Sentry gộp lỗi dựa trên dòng code (Stacktrace). 
            // Ở đây, ta ÉP Sentry: "Bất kể dòng code nào bị lỗi cấm bán hàng, hãy gộp chung chúng vào 1 Issue tên là 'hang-cam-order'"
            // Điều này giúp tab Issues trên Sentry không bị rác (Spam).
            scope.setFingerprint(['hang-cam-order']);
            
            // Gửi lỗi Thủ công trong Scope này
            Sentry.captureException(error);
            return res.status(400).json({ 
                success: false, 
                message: error.message 
            });
        }

        res.json({ success: true, message: "Đặt hàng thành công!" });
    });
});

// API 2: Lỗi Hệ thống sập (Tự động tóm (Auto-Catch) Unhandled Exceptions)
app.get('/api/users', () => {
    // Chúng ta giả vờ gõ sai tên biến processUserData (Biến vốn không tồn tại)
    // Code sẽ sập tung toé (ReferenceError), Sentry Error Handler ở dưới sẽ đứng ra ôm trọn lỗi này
    console.log(processUserData.name); 
});

// 3. [QUAN TRỌNG] Error Handler của Sentry PHẢI LÀ MIDDLEWARE CUỐI CÙNG 
// Nhưng trước các Error Handler tuỳ chỉnh khác của Express
app.use(Sentry.Handlers.errorHandler());

// 4. Custom Error Handler trả về cho Client
app.use(function onError(err, req, res, next) {
    // Sentry đã bắt lỗi ở middleware ngay trước đó rồi.
    // Tại đây ta chỉ làm nhiệm vụ an ủi khách hàng.
    res.status(500).json({ 
        message: "Hệ thống đang bảo trì, vui lòng mang mã Lỗi này báo cho đội chăm sóc khách hàng!", 
        errorId: res.sentry // Tuyệt chiêu: Sentry tự chèn ID duy nhất của sự thay đổi sự cố này để hỗ trợ Ticket IT
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✅ Server Express đang chạy tại http://localhost:${PORT}`);
    console.log(`\n👉 Bài Test 1 (Trường hợp dữ liệu an toàn & Gom nhóm):`);
    console.log(`  [Mở terminal CMD hoặc PowerShell] và chạy lệnh:`);
    console.log(`  curl -X POST http://localhost:3000/api/order -H "Content-Type: application/json" -d "{\\"userId\\":\\"U01\\", \\"item\\":\\"bom\\"}"`);
    console.log(`\n👉 Bài Test 2 (Trường hợp Server ngỏm củ tỏi ngẫu nhiên):`);
    console.log(`  [Mở Trình duyệt] gõ URL: http://localhost:3000/api/users`);
});
