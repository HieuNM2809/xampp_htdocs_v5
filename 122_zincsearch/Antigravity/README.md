# ZincSearch — Ví dụ từ Cơ bản đến Nâng cao

> **ZincSearch** là search engine mã nguồn mở viết bằng Go, nhẹ hơn Elasticsearch ~100x, có sẵn UI, tương thích một phần với Elasticsearch API.

---

## 🐳 Cài đặt ZincSearch bằng Docker

```bash
# 1. Khởi động ZincSearch (chạy lần đầu sẽ tự pull image)
docker compose up -d

# 2. Kiểm tra container đang chạy
docker compose ps

# 3. Xem log
docker compose logs -f zincsearch

# 4. Dừng
docker compose down

# 5. Dừng và xóa luôn data
docker compose down -v
```

Sau khi chạy:
- **API**: http://localhost:4080
- **Web UI**: http://localhost:4080/ui
- **Tài khoản**: `admin` / `Complexpass#123`

> **Cài thủ công (không dùng Docker):** Tải binary tại https://github.com/zincsearch/zincsearch/releases
> ```bash
> # Windows (PowerShell)
> set ZINC_FIRST_ADMIN_USER=admin
> set ZINC_FIRST_ADMIN_PASSWORD=Complexpass#123
> set ZINC_DATA_PATH=./data
> zincsearch.exe
> ```

---

## 📦 Cài đặt Node.js dependencies

```bash
npm install
```

## ⚙️ Cấu hình kết nối

Chỉnh thông tin kết nối tại `config.js` nếu khác mặc định:
```js
baseURL: 'http://localhost:4080',
auth: { username: 'admin', password: 'Complexpass#123' }
```

---

## 📚 Cấu trúc bài học

| Bài | File | Nội dung |
|-----|------|----------|
| 1 | `01_basic/01_index_management.js` | Tạo, liệt kê, xóa index |
| 2 | `02_crud/02_document_crud.js` | Create, Read, Update, Delete document |
| 3 | `03_search/03_basic_search.js` | match, term, range, prefix, pagination |
| 4 | `04_advanced_search/04_advanced_search.js` | bool, fuzzy, wildcard, highlight |
| 5 | `05_aggregation/05_aggregation.js` | min/max/avg, terms, range agg, nested |
| 6 | `06_bulk/06_bulk_operations.js` | Bulk import, update, delete, chunking |
| 7 | `07_mapping/07_mapping_analyzer.js` | Mapping types, text vs keyword |
| 8 | `08_realworld/08_ecommerce_search.js` | E-commerce search thực tế |

---

## ▶️ Chạy từng bài

```bash
node 01_basic/01_index_management.js
node 02_crud/02_document_crud.js
node 03_search/03_basic_search.js
node 04_advanced_search/04_advanced_search.js
node 05_aggregation/05_aggregation.js
node 06_bulk/06_bulk_operations.js
node 07_mapping/07_mapping_analyzer.js
node 08_realworld/08_ecommerce_search.js
```

Hoặc dùng npm scripts:
```bash
npm run basic
npm run crud
npm run search
npm run advanced-search
npm run aggregation
npm run bulk
npm run mapping
npm run realworld
```

---

## 🔄 ZincSearch vs Elasticsearch — Tổng quan

| Tiêu chí | ZincSearch | Elasticsearch |
|----------|-----------|---------------|
| Ngôn ngữ | Go | Java |
| RAM tối thiểu | ~50MB | ~1GB+ (JVM) |
| Cài đặt | 1 binary | Cần JDK, complex config |
| UI tích hợp | ✅ Có sẵn | ❌ Cần Kibana |
| Cluster | ❌ | ✅ |
| Schema-less | ✅ | Khuyến nghị có mapping |
| API compat | Một phần | Đầy đủ (native) |
| Query DSL | Cơ bản | Đầy đủ |
| Aggregations | Hạn chế | Đầy đủ |
| Nested docs | ❌ | ✅ |
| Partial update | ❌ | ✅ (`_update`) |
| Vector/kNN | ❌ | ✅ (8.x+) |
| Use case | Small-medium, logging, app search | Enterprise, petabyte scale |

### API Endpoints

| Endpoint | ZincSearch | Elasticsearch |
|----------|-----------|---------------|
| Tạo index | `PUT /api/index` | `PUT /:index` |
| Index doc | `POST /api/:idx/_doc` | `POST /:idx/_doc` |
| Bulk | `POST /api/_bulk` | `POST /_bulk` |
| Search (native) | `POST /api/:idx/_search` | — |
| Search (ES compat) | `POST /es/:idx/_search` | `POST /:idx/_search` |
| Get doc | `GET /es/:idx/_doc/:id` | `GET /:idx/_doc/:id` |
| Delete doc | `DELETE /api/:idx/_doc/:id` | `DELETE /:idx/_doc/:id` |
| Mapping | `GET /api/:idx/mapping` | `GET /:idx/_mapping` |

---

## 📌 Khi nào dùng ZincSearch?

✅ **Phù hợp** khi:
- App search, product search, blog search
- Log analytics nhỏ/vừa (< vài chục GB)
- Resource hạn chế, muốn cài đặt đơn giản
- Team nhỏ, không có DevOps phức tạp

❌ **Không phù hợp** khi:
- Cần cluster/HA (High Availability)
- Data petabyte scale
- Cần ML features, cross-cluster
- Cần ecosystem đầy đủ (Kibana, Logstash, Beats)
