# Teleport Demo - Docker Setup

## Cấu trúc thư mục

```
teleport-demo/
├── docker-compose.yml       # Docker Compose config
├── config/
│   └── teleport.yaml        # Teleport configuration
├── data/                    # Runtime data (certificates, DB) - auto populated
└── logs/                    # Log files - auto populated
```

## Chạy Teleport

```bash
# Bước 1: Khởi động container
docker-compose up -d

# Bước 2: Xem logs để chờ ready
docker-compose logs -f teleport

# Bước 3: Tạo admin user (sau khi container chạy ổn)
docker exec teleport-demo \
  tctl users add admin \
  --roles=editor,access \
  --logins=root,ubuntu,ec2-user

# Bước 4: Mở URL từ output lệnh trên trong browser
# Ví dụ: https://localhost/web/invite/xxxxxxxx
```

## Lệnh Hữu Ích

```bash
# Xem status cluster
docker exec teleport-demo tctl status

# Xem danh sách nodes
docker exec teleport-demo tctl nodes ls

# Xem danh sách users
docker exec teleport-demo tctl users ls

# Xem tokens hiện có
docker exec teleport-demo tctl tokens ls

# Restart
docker-compose restart teleport

# Dừng và xóa container (data vẫn giữ trong ./data/)
docker-compose down

# Xóa toàn bộ kể cả data
docker-compose down && rm -rf ./data/* ./logs/*
```

## Kết Nối Bằng tsh CLI

```bash
# Login (--insecure vì đang dùng self-signed cert)
tsh login --proxy=localhost:443 --insecure --user=admin

# Xem nodes
tsh ls

# SSH vào node (all-in-one mode, node chính là container này)
tsh ssh ubuntu@teleport-demo

# Logout
tsh logout
```

## Lưu Ý

- Port `443` cần quyền admin trên Linux/Mac. Nếu gặp lỗi, đổi sang `8443:443`
- Self-signed certificate → browser sẽ cảnh báo, bấm "Advanced > Proceed"
- `data/` folder KHÔNG nên xóa → chứa CA certificates của cluster
- Token `demo-node-token-12345` chỉ dùng cho môi trường test, **không dùng production**
