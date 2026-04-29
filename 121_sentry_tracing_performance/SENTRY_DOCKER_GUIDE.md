# Hướng dẫn thiết lập Sentry bằng Docker (Local)

Dự án này cung cấp **2 phương pháp** để chạy Sentry trên máy của bạn (thông qua Docker). Tuỳ vào mục đích học tập của bạn, hãy chọn 1 trong 2 cách dưới đây:

---

## Cách 1: Sử dụng Bản Siêu Nhẹ (Sentry 9.1.2 Legacy)
_**Trạng thái:** File `docker-compose.yml` đã được đính kèm sẵn trong thư mục._

Đây là phiên bản cũ, được tối giản lại chỉ dùng duy nhất 1 file Compose. 
* ❌ **Nhược điểm:** KHÔNG hỗ trợ tính năng Performance Tracing (Ví dụ 3). 
* ✅ **Ưu điểm:** SIÊU NHẸ, phù hợp để bạn học cách Config, Gửi Môi trường / Bắt lỗi cơ bản (Ví dụ 1 và 2) mà không sợ treo máy.

### Các bước khởi chạy:

**Bước 1: Khởi tạo Cấu trúc Cơ sở dữ liệu (BẮT BUỘC CHẠY GIAI ĐOẠN ĐẦU)**
Sentry cần tạo các bảng trong Database (và giúp bạn tránh được lỗi Database Error khó chịu). Bật Terminal tại thư mục hiện tại và chạy:
```bash
docker-compose run --rm sentry-web upgrade
```
*(Lưu ý: Khi tiến trình dừng lại và hỏi: `Would you like to create a user account now?`, hãy gõ phím **Y** -> Nhấn Enter -> Điền Email và Password tùy ý. Đây chính là tài khoản Admin của bạn).*

**Bước 2: Khởi động Máy chủ**
Sau khi Bước 1 báo thành công, bạn bật hệ thống lên chạy ngầm bằng lệnh:
```bash
docker-compose up -d
```

**Bước 3: Đăng nhập**
Truy cập trình duyệt: `http://localhost:9000` và đăng nhập bằng tài khoản bạn đã tạo ở Bước 1. *(Lưu ý: Bạn chọn Create Project ở góc trên bên phải để tạo dự án và lấy mã DSN Key nha)*.

**Tắt máy chủ khi không dùng:**
```bash
docker-compose down
```

---

## Cách 2: Sử dụng Bản Full (Sentry V24+ Self-Hosted)
_**Trạng thái:** Dành cho môi trường Mới, Hệ thống thật._

Vì Sentry phiên bản mới nhất hỗ trợ tính năng **Tracing Performance** vô cùng tối tân, nó là một hệ sinh thái vi dịch vụ khổng lồ với hơn 30 containers liên kết với nhau (Kafka, ClickHouse, Redis, Snuba...).

> ⚠️ **CẢNH BÁO QUAN TRỌNG TỪ NHÀ PHÁT TRIỂN:**
> - Máy của tính của bạn CẦN đảm bảo có ít nhất **16GB RAM**, và cấu hình Docker Desktop / WSL2 đã được Settings nhường ít nhất **8GB RAM + 4 CPU Cores**. Nếu không cấp đủ, ứng dụng Sentry sẽ load rất chậm hoặc Crash (Báo lỗi 502 Bad Gateway liên tục).

### Các bước cài đặt:

**Bước 1:** Clone Mã Nguồn Docker Chuẩn từ kho lưu trữ về:
```bash
git clone https://github.com/getsentry/self-hosted.git sentry-local
cd sentry-local
```

**Bước 2:** Chạy Script tự động thiết lập Toàn Bộ Môi Trường:
```bash
./install.sh
# Hoặc nếu chạy từ Windows PowerShell nguyên gốc: .\install.ps1
```
*(Quá trình này tải hàng GB dữ liệu, hãy kiên nhẫn. Đoạn cuối Sentry cũng sẽ nhắc bạn điền lại Email và Password để làm tài khoản Admin).*

**Bước 3:** Bật Server Full lên và tận hưởng!
```bash
docker compose up -d
# Bản Full này cũng sẽ tự động chạy trên giao diện http://localhost:9000
```
