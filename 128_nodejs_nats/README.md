# 🚀 NATS with Node.js – Từ cơ bản đến nâng cao

> Bộ ví dụ thực hành NATS messaging system với Node.js và Docker.

## 📁 Cấu trúc project

```
128_nodejs_nats/
├── docker-compose.yml          # NATS server + monitoring
├── package.json
├── NATS_vs_Kafka.md            # So sánh NATS vs Kafka
└── src/
    ├── 01_basic/               # Pub/Sub cơ bản + wildcards
    │   ├── publisher.js
    │   └── subscriber.js
    ├── 02_request_reply/       # RPC pattern
    │   ├── server.js
    │   └── client.js
    ├── 03_queue_groups/        # Load balancing
    │   ├── worker.js
    │   └── sender.js
    ├── 04_jetstream/           # Persistent messaging
    │   ├── publisher.js
    │   └── subscriber.js
    ├── 05_key_value/           # Distributed KV store
    │   └── kv_store.js
    ├── 06_object_store/        # Binary object storage
    │   └── obj_store.js
    ├── 07_microservices/       # Microservices orchestration
    │   └── service.js
    └── 08_headers_auth/        # Headers & authentication
        └── headers_demo.js
```

---

## ⚡ Quick Start

### 1. Cài dependencies

```bash
npm install
```

### 2. Khởi động NATS server

```bash
npm run docker:up
# hoặc
docker compose up -d
```

NATS server sẽ chạy tại:
- `nats://localhost:4222` – Client port
- `http://localhost:8222` – Monitoring HTTP API
- `http://localhost:7777` – NATS Surveyor UI

---

## 📚 Các ví dụ

### 01 – Basic Pub/Sub

Pattern cơ bản nhất: publisher gửi message, subscriber nhận.

```bash
# Terminal 1: chạy subscriber trước
npm run 01:sub

# Terminal 2: chạy publisher
npm run 01:pub
```

**Khái niệm:**
- Subject: địa chỉ routing message (vd: `app.events.user.created`)
- Wildcard `*`: match 1 token (vd: `app.events.user.*`)
- Wildcard `>`: match nhiều token (vd: `app.>`)

---

### 02 – Request / Reply (RPC)

Giống HTTP request nhưng qua NATS. Server xử lý và trả kết quả.

```bash
# Terminal 1: khởi động service
npm run 02:reqrep

# Terminal 2: gọi service
npm run 02:client
```

**Khái niệm:**
- `nc.request()`: gửi và chờ reply
- `msg.respond()`: trả kết quả
- Timeout: nếu server không reply trong thời gian quy định

---

### 03 – Queue Groups (Load Balancing)

Nhiều worker cùng nhóm, NATS tự phân phối message.

```bash
# Terminal 1, 2, 3: chạy 3 workers
WORKER_ID=W1 npm run 03:queue
WORKER_ID=W2 npm run 03:queue
WORKER_ID=W3 npm run 03:queue

# Terminal 4: gửi orders
npm run 03:sender
```

**Khái niệm:**
- Queue group: nhóm subscribers cùng tên
- Chỉ 1 member trong group nhận mỗi message (random/round-robin)
- Scale horizontal: thêm worker mà không cần thay đổi code

---

### 04 – JetStream (Persistent Messaging)

Messages được lưu vào disk, consumer có thể replay.

```bash
# Bước 1: publish (lưu vào stream)
npm run 04:jetstream:pub

# Bước 2: consume (có thể chạy sau khi publish)
npm run 04:jetstream:sub
```

**Khái niệm:**
- **Stream**: container lưu messages theo subjects
- **Consumer**: view vào stream với tracking riêng
- **Durable consumer**: giữ progress khi restart
- **ACK/NAK**: xác nhận hoặc từ chối message

---

### 05 – Key/Value Store

Distributed KV store với watch, history, và TTL.

```bash
npm run 05:kv
```

**Khái niệm:**
- Built on JetStream
- `put/get/delete`: CRUD operations
- `watch()`: observe changes realtime
- `history()`: xem lịch sử thay đổi của key
- Optimistic concurrency với `revision`

---

### 06 – Object Store

Lưu binary data lớn (files, blobs) qua NATS.

```bash
npm run 06:obj
```

**Khái niệm:**
- Built on JetStream
- Tự động chunking cho large objects
- Metadata: name, description, digest
- Dùng cho: config files, images, ML models

---

### 07 – Microservices Pattern

Ví dụ thực tế: e-commerce order processing với nhiều services.

```bash
npm run 07:microservice
```

**Flow:**
```
Client → order.create → Order Service
                              ├── inventory.check → Inventory Service
                              ├── payment.process → Payment Service
                              └── notification.send → Notification Service
```

---

### 08 – Headers & Authentication

Truyền metadata qua headers, cấu hình auth.

```bash
npm run 08:headers
```

**Khái niệm:**
- Headers: key-value metadata (tracing, content-type, auth)
- Token auth: `nats://token@localhost:4222`
- NKey: Ed25519 keypair authentication
- JWT: Decentralized auth với accounts

---

## 🔍 Monitoring

### HTTP API (built-in)

```bash
# Server info
curl http://localhost:8222

# Connections
curl http://localhost:8222/connz

# Subscriptions
curl http://localhost:8222/subsz

# Routes (cluster)
curl http://localhost:8222/routez

# JetStream info
curl http://localhost:8222/jsz
```

### NATS CLI

```bash
# Install NATS CLI
# Windows: scoop install nats
# Mac: brew install nats-io/nats-tools/nats

# Subscribe
nats sub ">"

# Publish
nats pub greetings "Hello from CLI"

# Stream info
nats stream info EVENTS

# Consumer info
nats consumer info EVENTS event-processor-v1
```

---

## 🔬 NATS Core Concepts

| Concept | Mô tả |
|---------|-------|
| **Subject** | Routing address (vd: `foo.bar.baz`) |
| **Publisher** | Gửi message vào subject |
| **Subscriber** | Nhận message từ subject |
| **Queue Group** | Load balancing group |
| **Request/Reply** | Synchronous-style messaging |
| **JetStream** | Persistence layer |
| **Stream** | Ordered log of messages |
| **Consumer** | Subscription with state tracking |
| **KV Store** | Key-value store (built on JS) |
| **Object Store** | Blob storage (built on JS) |
| **Leafnode** | Edge/IoT connectivity |
| **Cluster** | HA deployment |
| **Account** | Multi-tenancy isolation |

---

## 📖 Tài liệu tham khảo

- [NATS Documentation](https://docs.nats.io)
- [NATS.js Client](https://github.com/nats-io/nats.js)
- [JetStream Concepts](https://docs.nats.io/nats-concepts/jetstream)
- [NATS by Example](https://natsbyexample.com)
- [NATS vs Kafka Comparison](./NATS_vs_Kafka.md)
