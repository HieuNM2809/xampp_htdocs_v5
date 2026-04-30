# NATS vs Apache Kafka – So sánh toàn diện

> **Mục tiêu:** Hiểu khi nào dùng NATS, khi nào dùng Kafka, và tại sao.

---

## Mục lục

1. [Tổng quan kiến trúc](#1-tổng-quan-kiến-trúc)
2. [So sánh nhanh](#2-so-sánh-nhanh)
3. [Hiệu năng & Throughput](#3-hiệu-năng--throughput)
4. [Delivery Guarantees](#4-delivery-guarantees)
5. [Persistence & Storage](#5-persistence--storage)
6. [Consumer Model](#6-consumer-model)
7. [Ordering Guarantees](#7-ordering-guarantees)
8. [Ecosystem & Tooling](#8-ecosystem--tooling)
9. [Operations & DevOps](#9-operations--devops)
10. [Use Cases](#10-use-cases)
11. [Kết luận](#11-kết-luận)

---

## 1. Tổng quan kiến trúc

### NATS

```
Client A                    NATS Server                  Client B
   │                            │                            │
   │── publish("orders.>) ──────▶│── deliver to subscriber ──▶│
   │                            │                            │
   │                       [in-memory]                       │
   │                       [JetStream]  ← optional persist   │
```

- **Core NATS**: In-memory message broker thuần túy – cực nhanh, fire-and-forget
- **JetStream**: Layer persistence tùy chọn ngay trên Core NATS
- **Topology**: Mesh network (server cluster tự heal, không cần ZooKeeper)
- **Protocol**: Text-based (NATS protocol), rất lightweight
- **Server binary**: ~20MB, Go single binary

### Kafka

```
Producer                   Kafka Broker                   Consumer Group
   │                      ┌──────────────┐                     │
   │── send(topic,key) ──▶│  Partition 0 │── poll ────────────▶│ Consumer 1
   │                      │  Partition 1 │── poll ────────────▶│ Consumer 2
   │                      │  Partition 2 │── poll ────────────▶│ Consumer 3
   │                      └──────────────┘                     │
   │                      (append-only log)
   │
   └── ZooKeeper / KRaft ──▶ metadata management
```

- **Append-only log**: Messages ghi vĩnh viễn vào disk theo thứ tự
- **Partition-based**: Scale bằng cách tăng số partition
- **Consumer Group**: Multiple consumers chia nhau partition
- **Topology**: Requires ZooKeeper (cũ) hoặc KRaft (mới)
- **JVM-based**: Cần Java runtime, nặng hơn

---

## 2. So sánh nhanh

| Tiêu chí | NATS | Kafka |
|---|---|---|
| **Latency** | < 1ms (microseconds) | 1–10ms |
| **Throughput** | Hàng triệu msg/s (nhẹ) | Hàng triệu msg/s (với tuning) |
| **Persistence** | Tùy chọn (JetStream) | Mặc định, bắt buộc |
| **Message Replay** | Có (JetStream) | Có (offset) |
| **Ordering** | Per-subject (JS) | Per-partition |
| **Delivery** | At-most / At-least / Exactly-once (JS) | Exactly-once (transactions) |
| **Protocol** | NATS (text), binary | Kafka binary protocol |
| **Setup** | Cực đơn giản | Phức tạp (ZK/KRaft) |
| **Resource** | ~20MB RAM/server | GB RAM thông thường |
| **Language clients** | 40+ languages | 30+ languages |
| **Streams (built-in)** | Có (JetStream) | Có (Kafka Streams) |
| **Schema Registry** | Không (tự xây) | Confluent Schema Registry |
| **Auth** | Token, NKey, JWT, TLS | SASL, mTLS |
| **Cloud native** | NATS.io, Synadia Cloud | MSK, Confluent Cloud |
| **License** | Apache 2.0 | Apache 2.0 |

---

## 3. Hiệu năng & Throughput

### NATS – Latency Champion

```
Benchmark (single node, 1KB messages):
┌──────────────────┬──────────────┬──────────────┐
│ Scenario         │ Throughput   │ Latency P99  │
├──────────────────┼──────────────┼──────────────┤
│ Core pub/sub     │ 6M msg/s     │ < 0.5ms      │
│ JetStream pub    │ 800K msg/s   │ < 2ms        │
│ Request/Reply    │ 1M req/s     │ < 1ms        │
│ KV operations    │ 500K ops/s   │ < 1ms        │
└──────────────────┴──────────────┴──────────────┘
```

### Kafka – Throughput Champion

```
Benchmark (3-broker cluster, 1KB messages):
┌──────────────────┬──────────────┬──────────────┐
│ Scenario         │ Throughput   │ Latency P99  │
├──────────────────┼──────────────┼──────────────┤
│ Producer (async) │ 2M msg/s     │ 5–10ms       │
│ Producer (acks=1)│ 800K msg/s   │ 3–5ms        │
│ Producer (acks=all)│ 400K msg/s │ 10–30ms      │
│ Consumer (batch) │ 3M msg/s     │ 10–50ms      │
└──────────────────┴──────────────┴──────────────┘
```

> 💡 NATS thắng về **latency**, Kafka thắng về **sustained high-throughput** với large batches và sequential disk I/O.

---

## 4. Delivery Guarantees

### NATS

| Mode | Delivery | Khi nào dùng |
|------|----------|--------------|
| **Core NATS** | At-most-once | Telemetry, logs, realtime data không quan trọng |
| **JetStream (ack=none)** | At-most-once | Fast event streaming |
| **JetStream (ack=explicit)** | At-least-once | Order processing, payments |
| **JetStream (ack=double)** | Exactly-once | Financial transactions |

```javascript
// At-least-once với JetStream
const consumer = await js.consumers.get("STREAM", "my-consumer");
for await (const msg of await consumer.consume()) {
  await processMessage(msg.data);
  msg.ack();  // nếu crash trước đây → redeliver
}
```

### Kafka

| Mode | Delivery | Config |
|------|----------|--------|
| **acks=0** | At-most-once | Metrics, logs |
| **acks=1** | At-least-once (default) | Most use cases |
| **acks=all + idempotent** | Exactly-once | Financial |
| **Transactions** | Exactly-once end-to-end | Critical data pipelines |

```javascript
// Kafka exactly-once với transactions (kafkajs)
await producer.transaction(async (txn) => {
  await txn.send({ topic: "orders", messages: [{ value: "order-data" }] });
  await txn.sendOffsets({ consumerGroupId: "group-1", topics: [...] });
  await txn.commit();
});
```

---

## 5. Persistence & Storage

### NATS JetStream

```
Stream Configuration:
├── storage: File | Memory
├── retention: Limits | Interest | WorkQueue
├── max_msgs: 1_000_000
├── max_bytes: 10GB
├── max_age: 7 days
├── num_replicas: 1 | 3 (HA)
└── subjects: ["orders.>", "events.*"]
```

- **Retention Policies**:
  - `Limits`: Giữ theo size/count/age
  - `Interest`: Xóa khi không còn consumer nào
  - `WorkQueue`: Xóa sau khi được ack (queue semantic)

- **Replay**: Consumer có thể consume từ `DeliverAll`, `DeliverLast`, `DeliverNew`, hoặc specific `StartSequence`/`StartTime`

### Kafka

```
Topic Configuration:
├── partitions: 12
├── replication-factor: 3
├── retention.ms: 604800000   (7 days)
├── retention.bytes: 10737418240  (10GB)
├── cleanup.policy: delete | compact
└── min.insync.replicas: 2
```

- **Log compaction**: Kafka có thể compact log (giữ latest value mỗi key) → giống KV store
- **Infinite retention**: Có thể giữ mãi mãi (event sourcing)
- **Offset management**: Consumer tự quản lý offset hoặc commit lên `__consumer_offsets`

---

## 6. Consumer Model

### NATS – Push-based

```
NATS Server ──push──▶ Consumer (messages delivered automatically)

JetStream Consumer types:
├── Push consumer: server push vào subject
└── Pull consumer: consumer chủ động fetch batch
```

```javascript
// Pull consumer – tốt cho batch processing
const msgs = await consumer.fetch({ max_messages: 100, expires: 1000 });
for await (const msg of msgs) {
  await processInBatch(msg);
  msg.ack();
}
```

### Kafka – Pull-based

```
Consumer ──poll──▶ Kafka Broker (consumer chủ động kéo)

Benefits:
├── Consumer kiểm soát tốc độ
├── Batch processing hiệu quả
└── Back-pressure tự nhiên
```

```javascript
// Kafka consumer với backpressure
await consumer.run({
  eachBatch: async ({ batch, heartbeat }) => {
    for (const msg of batch.messages) {
      await processMessage(msg);
      await heartbeat(); // tránh rebalance timeout
    }
  },
});
```

**So sánh:**
| | NATS (Push) | Kafka (Pull) |
|---|---|---|
| Latency | Thấp hơn | Cao hơn (poll interval) |
| Back-pressure | Khó kiểm soát | Tự nhiên |
| Simple use case | ✅ Dễ | Cần config |
| High-volume batch | Tốt với pull consumer | ✅ Tốt nhất |

---

## 7. Ordering Guarantees

### NATS

- **Core NATS**: Không đảm bảo ordering nếu nhiều publisher
- **JetStream**: Ordered per-subject (một subject = một sequence)
- Muốn global ordering → dùng một subject duy nhất

```javascript
// Ordered consumer – strict sequential delivery
const consumer = await js.consumers.get("ORDERS", {
  ordered: true,    // guaranteed sequential, no redelivery
  filter_subject: "orders.region.asia",
});
```

### Kafka

- **Per-partition ordering**: Messages trong một partition luôn có thứ tự
- **Global ordering**: Chỉ có với 1 partition (giảm throughput)
- **Key-based routing**: Same key → same partition → ordered

```javascript
// Kafka: đảm bảo ordering với key
await producer.send({
  topic: "orders",
  messages: [
    { key: "user-123", value: JSON.stringify(order) }
    //  ↑ same key → same partition → ordered
  ]
});
```

---

## 8. Ecosystem & Tooling

### NATS Ecosystem

| Tool | Mô tả |
|------|-------|
| `nats` CLI | Admin, publish, subscribe, bench |
| NATS Surveyor | Prometheus metrics exporter |
| Prometheus + Grafana | Monitoring dashboard |
| nats-account-server | JWT auth management |
| Leafnodes | Edge/IoT connectivity |
| WebSocket support | Browser clients |
| NATS.ws | JavaScript browser client |

### Kafka Ecosystem

| Tool | Mô tả |
|------|-------|
| Kafka Connect | Data integration (databases, S3, etc.) |
| Kafka Streams | Stream processing in Java |
| ksqlDB | SQL over Kafka streams |
| Schema Registry | Avro/Protobuf/JSON Schema |
| Kafka UI / AKHQ | GUI management |
| Confluent Platform | Enterprise Kafka |
| Debezium | CDC (Change Data Capture) |
| Flink + Kafka | Advanced stream processing |

> 💡 Kafka có **ecosystem phong phú hơn** đáng kể, đặc biệt cho data engineering. NATS ecosystem **nhỏ hơn nhưng đủ dùng** cho hầu hết use cases.

---

## 9. Operations & DevOps

### NATS – Simplicity First

```yaml
# docker-compose.yml – NATS cluster 3 nodes
services:
  nats-1:
    image: nats:2.10-alpine
    command: -js -cluster nats://0.0.0.0:6222 -routes nats://nats-2:6222,nats://nats-3:6222
```

- ✅ Single binary, không dependency
- ✅ Auto cluster formation
- ✅ Built-in health endpoint `/healthz`
- ✅ Kubernetes friendly (StatefulSet)
- ✅ Leaf node cho edge deployment
- ⚠️ Ít tooling monitoring hơn Kafka

### Kafka – Complex but Powerful

```yaml
# docker-compose.yml – Kafka + KRaft (no ZooKeeper)
services:
  kafka:
    image: confluentinc/cp-kafka:7.6.0
    environment:
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_NODE_ID: 1
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@kafka:9093
```

- ⚠️ Cần ZooKeeper (legacy) hoặc KRaft (mới)
- ⚠️ Phức tạp hơn khi scale
- ✅ Mature tooling (JMX, Prometheus JMX Exporter)
- ✅ Confluent Cloud managed service
- ✅ AWS MSK (managed Kafka)
- ✅ Battle-tested ở scale cực lớn (LinkedIn, Netflix)

**Resource requirements (3-node cluster):**

| | NATS | Kafka |
|---|---|---|
| RAM | 256MB–1GB | 4–16GB |
| Disk | Optional | Required (large) |
| CPU | Low | Medium–High |
| Setup time | 5 phút | 30–60 phút |
| Ops complexity | ⭐⭐ | ⭐⭐⭐⭐ |

---

## 10. Use Cases

### Dùng NATS khi:

```
✅ Microservices messaging (request/reply, pub/sub)
✅ IoT / Edge computing (lightweight, Leafnode)
✅ Realtime notifications, chat, gaming
✅ Service mesh / API gateway messaging
✅ Command & Control systems
✅ Low-latency trading systems
✅ Configuration distribution (KV store)
✅ Kubernetes-native messaging
✅ Multi-cloud / edge connectivity
✅ Startup/small team (đơn giản vận hành)
```

### Dùng Kafka khi:

```
✅ Data pipelines (ETL, ELT)
✅ Event sourcing & CQRS
✅ Audit logging (immutable append-only log)
✅ Stream processing (analytics, ML features)
✅ CDC (Change Data Capture từ databases)
✅ Data lake ingestion (S3, GCS, BigQuery)
✅ Replay events cho debugging/recovery
✅ Integration hub (Kafka Connect ecosystem)
✅ Regulatory compliance (long retention)
✅ Big data analytics pipeline
```

### Hybrid Architecture (NATS + Kafka):

```
IoT Devices ──▶ NATS ──▶ Edge Processing ──▶ Kafka ──▶ Data Lake
                  │                              │
                  ▼                              ▼
           Microservices              Stream Processing (Flink)
           (low latency)              (batch analytics)
```

> Dùng NATS cho **real-time messaging** và **service communication**, Kafka cho **durable event log** và **data pipeline**.

---

## 11. Kết luận

### Decision Matrix

| Bạn cần... | Chọn |
|---|---|
| Latency < 1ms | **NATS** |
| Đơn giản setup & vận hành | **NATS** |
| IoT / Edge / Mobile | **NATS** |
| Microservices RPC pattern | **NATS** |
| Event sourcing lâu dài | **Kafka** |
| Data pipeline phức tạp | **Kafka** |
| SQL trên stream (ksqlDB) | **Kafka** |
| CDC từ database | **Kafka** |
| Audit log, compliance | **Kafka** |
| Team nhỏ, startup | **NATS** |
| Enterprise data platform | **Kafka** |
| Cả hai: messaging + pipeline | **NATS + Kafka** |

### TL;DR

```
NATS  = "Xe thể thao" – nhanh, nhẹ, linh hoạt, dễ lái
Kafka = "Xe tải hạng nặng" – chở được nhiều, bền bỉ, nhưng cần bằng lái đặc biệt
```

- **NATS** là lựa chọn tốt nhất cho **messaging, microservices, và real-time systems** khi bạn cần tốc độ và đơn giản.
- **Kafka** là lựa chọn đúng đắn khi bạn cần **durable event log, data pipelines, và stream processing** ở quy mô lớn.
- Chúng **không loại trừ nhau** – nhiều hệ thống enterprise dùng cả hai cho mục đích khác nhau.

---

*Generated: 2026-04-30 | NATS v2.10 | Kafka 3.7*
