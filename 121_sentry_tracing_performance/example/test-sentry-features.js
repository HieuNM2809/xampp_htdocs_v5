const Sentry = require('@sentry/node');

// 1. Khởi tạo Sentry SDK v5.5.0
Sentry.init({ 
    dsn: 'http://a9c42eccec6145a1b0d060fa7af5235d@localhost:9000/2' 
});

console.log("🚀 Bắt đầu test các tính năng nâng cao của Sentry 9.1...");

// 2. Gửi một Thông báo (Message) thay vì lỗi (Error)
// Hữu ích khi bạn muốn Log một sự kiện quan trọng (VD: User thanh toán thành công)
Sentry.captureMessage("Sự kiện: Một người dùng vừa đăng ký thành công!", "info");
console.log("👉 Đã gửi một Info Message.");

// 3. Thêm Mẩu bánh mì (Breadcrumbs)
// Breadcrumbs giống như hộp đen máy bay, ghi lại các các hành động dẫn đến lỗi
Sentry.addBreadcrumb({
  category: "auth",
  message: "Người dùng bắt đầu thao tác giỏ hàng",
  level: "info"
});
Sentry.addBreadcrumb({
  category: "payment",
  message: "Người dùng click nút Thanh toán qua thẻ",
  level: "info"
});

// 4. Định danh người dùng (User Context)
Sentry.setUser({ 
    id: "U_9999", 
    email: "vip_user@gmail.com", 
    username: "HieuNM" 
});

// 5. Thêm Thẻ (Tags) - Rất quan trọng để lọc (Filter) lỗi trên giao diện tìm kiếm của Sentry
Sentry.setTag("customer_type", "Premium");
Sentry.setTag("server_region", "Asia");

// 6. Thêm Dữ liệu phụ (Extra Context) - Không thể dùng để filter nhưng sẽ hiển thị ở trang chi tiết lỗi
Sentry.setExtra("cart_items", [
    { id: 1, name: "Sách Node.js", price: 50 },
    { id: 2, name: "Bàn phím cơ", price: 100 }
]);

// 7. Tạo lỗi với toàn bộ dữ liệu trên đính kèm
setTimeout(() => {
    try {
        console.log("💥 Gây ra lỗi thanh toán! Hãy lên Web Sentry kiểm tra dữ liệu đính kèm...");
        throw new Error("Lỗi thanh toán: Thẻ Visa bị từ chối tín dụng!");
    } catch (e) {
        // Lỗi này giờ đây sẽ MANG THEO tất cả Breadcrumbs, User, Tags, Extra ở trên!
        Sentry.captureException(e);
        
        setTimeout(() => {
            console.log("🎉 Hoàn thành test! Mở http://localhost:9000 -> Bấm vào lỗi mới nhất để xem chi tiết Ngữ cảnh.");
            process.exit(1);
        }, 2000);
    }
}, 1000);
