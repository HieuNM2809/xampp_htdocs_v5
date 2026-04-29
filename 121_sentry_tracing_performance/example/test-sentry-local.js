const Sentry = require('@sentry/node');

// Khởi tạo Sentry SDK (v5.5.0 cho Sentry 9) trỏ về máy chủ Docker cục bộ của bạn
Sentry.init({ 
    dsn: 'http://a9c42eccec6145a1b0d060fa7af5235d@localhost:9000/2' 
});

console.log("✅ Đã khởi tạo Sentry SDK. Kết nối tới localhost:9000/2");

// Giả lập một lỗi để bắn lên server
function triggerFakeError() {
    console.log("🔄 Đang tạo một lỗi giả lập (Crash)...");
    throw new Error("Hello Sentry 9! Đây là lỗi thử nghiệm từ Node.js");
}

setTimeout(() => {
    try {
        triggerFakeError();
    } catch (error) {
        console.log("🚨 Đã bắt được lỗi! Đang gửi cục bộ lên Sentry Server của bạn...");
        
        // Gửi Exception lên localhost:9000
        Sentry.captureException(error);
        
        // Sentry phiển bản cũ cần chút thời gian để flush event lên mạng 
        setTimeout(() => {
            console.log("🎉 Hoàn tất! Hãy kiểm tra tab [Issues] trên http://localhost:9000");
            process.exit(1);
        }, 2000);
    }
}, 1500);
