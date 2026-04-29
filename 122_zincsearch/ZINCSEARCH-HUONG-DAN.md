# ZincSearch — ví dụ và so sánh từ cơ bản đến nâng cao

## Bối cảnh nhanh

**ZincSearch** là engine full-text (Bluge), một binary, API gần giống Elasticsearch cho **ingest** và **search**. Tài liệu: [zincsearch-docs.zinc.dev](https://zincsearch-docs.zinc.dev/). Nếu ưu tiên **log/metrics/traces** ở quy mô lớn, team upstream gợi ý xem [OpenObserve](https://github.com/openobserve/openobserve).

**Xác thực API:** mọi request nên có header `Authorization: Basic base64("user:password")`, hoặc dùng `-u user:password` với `curl`. Production nên dùng HTTPS.

Biến dưới đây dùng cho ví dụ:

- `ZINC=http://localhost:4080`
- User / pass mẫu: `admin` / `Complexpass#123`

---

## Phần A — Ví dụ theo cấp độ

### 1. Cơ bản

#### 1.1 Khởi động (Windows)

```bat
set ZINC_FIRST_ADMIN_USER=admin
set ZINC_FIRST_ADMIN_PASSWORD=Complexpass#123
mkdir data
zincsearch.exe
```

Truy cập UI: `http://localhost:4080`.

#### 1.2 Ghi một document (tạo index ngầm nếu chưa có)

`POST /api/:index/_doc`

```bash
curl -u admin:Complexpass#123 -X POST "http://localhost:4080/api/products/_doc" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Áo thun\",\"price\":199000}"
```

*(Trên bash/Linux, bỏ dấu `^` và xuống dòng một dòng `-d '...'`.)*

#### 1.3 Bulk nạp nhiều bản ghi (tương thích bulk ES)

```bash
curl -L https://github.com/zincsearch/zincsearch/releases/download/v0.1.1/olympics.ndjson.gz -o olympics.ndjson.gz
gzip -d olympics.ndjson.gz
curl -u admin:Complexpass#123 "http://localhost:4080/api/_bulk" --data-binary "@olympics.ndjson"
```

#### 1.4 Tìm kiếm đơn giản qua UI

1. Đăng nhập UI.
2. Chọn index (ví dụ `olympics`).
3. Gõ từ khóa (ví dụ `Gold`) và Enter.
4. Xem gợi ý cú pháp qua nút **info** cạnh ô search.

#### 1.5 Tìm bằng API — `match` + phân trang

`POST /api/:index/_search`

```bash
curl -u admin:Complexpass#123 -X POST "http://localhost:4080/api/olympics/_search" ^
  -H "Content-Type: application/json" ^
  -d "{\"search_type\":\"match\",\"query\":{\"term\":\"Gold\",\"field\":\"_all\"},\"from\":0,\"max_results\":10,\"_source\":[]}"
```

- `from` + `max_results`: phân trang.
- `_source`: `[]` = trả mọi field; hoặc liệt kê tên field cần lấy.

---

### 2. Trung cấp

#### 2.1 Các kiểu `search_type` (rút gọn từ docs)

| Giá trị `search_type` | Ý nghĩa gợi ý |
|----------------------|----------------|
| `match` / `matchphrase` | Full-text kiểu khớp từ / cụm từ |
| `term` | Khớp chính xác hơn (tùy field) |
| `querystring` | Cú pháp query string (ví dụ `+City:Turin +Silver`) |
| `prefix` / `wildcard` / `fuzzy` | Tiền tố, ký tự đại diện, mờ |
| `daterange` | Lọc theo khoảng thời gian trong `query` |
| `matchall` | Lấy toàn bộ (kết hợp filter/agg) |

Khi dùng khoảng thời gian, `query` có thể có `start_time` / `end_time` (ISO 8601).

#### 2.2 Ví dụ `querystring` + sắp xếp

```json
{
  "search_type": "querystring",
  "query": {
    "term": "+City:Turin +Silver",
    "start_time": "2021-06-02T14:28:31.894Z",
    "end_time": "2021-12-02T15:28:31.894Z"
  },
  "sort_fields": ["-@timestamp"],
  "from": 0,
  "max_results": 20,
  "_source": ["Athlete", "City", "Medal", "Year"]
}
```

- `sort_fields`: thêm `-` trước tên field để sort giảm dần.

#### 2.3 Schema-less và mapping

- Document mới có field lạ vẫn được index (schema-less).
- Khi cần kiểm soát kiểu dữ liệu / analyzer: dùng API **Get/Update Mapping** và **Settings** (xem [API Index](https://zincsearch-docs.zinc.dev/api/)).

#### 2.4 So sánh “trung cấp”: ZincSearch vs Elasticsearch (vận hành)

| Tiêu chí | ZincSearch | Elasticsearch |
|----------|------------|----------------|
| Cài đặt | Một binary, ít cấu hình | JVM, heap, node roles, thường nhiều file cấu hình |
| RAM/CPU | Thấp | Cao hơn rõ rệt ở cùng quy mô index |
| Kibana | Không; UI Zinc đủ dùng cơ bản | Kibana / OpenSearch Dashboards |
| Tương thích client | Bulk/search kiểu ES; không phải 100% mọi API ES | Đầy đủ ecosystem |

---

### 3. Nâng cao

#### 3.1 Aggregation trên cùng endpoint `_search`

Thêm khóa `aggs`: bucket (`term`, `range`, `date_range`) và metric (`min`, `max`, `avg`, `sum`, `count`, `weighted_avg`, …).

Ví dụ (rút gọn từ docs — index `olympics`):

```json
{
  "search_type": "match",
  "query": { "term": "Ice Hockey" },
  "sort_fields": ["-@timestamp"],
  "from": 0,
  "max_results": 20,
  "aggs": {
    "theo_huy_chuong": {
      "agg_type": "term",
      "field": "Medal",
      "size": 10
    },
    "nam_theo_khoang": {
      "agg_type": "range",
      "field": "Year",
      "size": 10,
      "ranges": [
        { "from": 1900, "to": 1920 },
        { "from": 2000, "to": 2021 }
      ]
    },
    "max_Year": { "agg_type": "max", "field": "Year" },
    "avg_Year": { "agg_type": "avg", "field": "Year" }
  }
}
```

Response trả `aggregations` kèm `hits` (có thể chỉ cần một trong hai tùy use case).

#### 3.2 Giới hạn cần nắm (nâng cao = chọn đúng công cụ)

| Chủ đề | ZincSearch | Ghi chú |
|--------|------------|---------|
| HA / cluster | Không có như ES cluster | Một hoặc vài instance đơn giản; backup dữ liệu thư mục `data` |
| Quy mô | Hàng trăm GB (mô tả chính thức) | Vượt ngưỡng → cân nhắc kiến trúc khác |
| Plugin / ILM | Không tương đương ES | ES/OpenSearch mạnh hơn cho lifecycle, security plugin, … |

#### 3.3 Bảng so sánh ZincSearch vs OpenObserve (theo README upstream)

| Khía cạnh | ZincSearch | OpenObserve |
|-----------|------------|-------------|
| Use case lý tưởng | **App search** | **Logs, metrics, traces** |
| Dữ liệu điển hình | Document đổi thường xuyên, tìm theo sản phẩm | Log append-heavy, immutable |
| Quy mô | ~100s GB | Petabyte |
| High availability | Không (theo bảng upstream) | Có |
| Lưu trữ | Chủ yếu disk | Disk + S3/MinIO/GCS/… |
| GUI | Cơ bản | Dashboard, observability đầy đủ hơn |

#### 3.4 Khi nào chọn gì?

| Nhu cầu | Gợi ý |
|---------|--------|
| Tìm kiếm trong app, wiki, catalog, ít TB | **ZincSearch** |
| Log tập trung, SLA HA, lưu object storage | **OpenObserve** (hoặc stack ELK tùy tổ chức) |
| Đội đã dùng ES nặng, cần plugin/ILM/security | **Elasticsearch / OpenSearch** |

---

## Phần B — Tóm tắt nhanh

| Cấp độ | Bạn làm gì | So sánh ngắn |
|--------|------------|--------------|
| **Cơ bản** | Chạy binary → `_doc` / `_bulk` → UI hoặc `POST .../_search` | Đơn giản hơn ES rất nhiều cho bước đầu |
| **Trung cấp** | Nhiều `search_type`, sort, `_source`, mapping | Đủ cho hầu hết app search; ES vẫn hơn về tool và plugin |
| **Nâng cao** | `aggs`, hiểu giới hạn HA/quy mô | Zinc cho SMB/side project; observability petabyte → OpenObserve |

---

## Liên kết tham khảo

- [Quickstart](https://zincsearch-docs.zinc.dev/quickstart/)
- [API Index](https://zincsearch-docs.zinc.dev/api/)
- [Search](https://zincsearch-docs.zinc.dev/api/search/search/)
- [Aggregations](https://zincsearch-docs.zinc.dev/api/search/aggregation/)
- [ZincSearch — GitHub](https://github.com/zincsearch/zincsearch)
