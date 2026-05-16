# Ví dụ: MySQL -> Debezium -> Sink Connect -> Elasticsearch

Đây là một ví dụ hoàn chỉnh về Data Pipeline theo đúng mô hình tách rời:
`MySQL` -> `Debezium (Source)` -> `Kafka` -> `Sink Connect (Elasticsearch)` -> `Elasticsearch`

Hệ thống được chia ra 2 tiến trình Connect riêng biệt:
1. **Debezium Server (port 8083):** Chạy image `quay.io/debezium/connect`, chuyên dụng để đọc binlog từ MySQL.
2. **Sink Connect Server (port 8084):** Chạy image `confluentinc/cp-kafka-connect`, chuyên dụng để làm Sink kết nối với Elasticsearch.

## 1. Yêu cầu hệ thống
- Docker và Docker Compose.

## 2. Khởi chạy các dịch vụ
Di chuyển vào thư mục `131_sink_connector` và chạy:
```bash
docker-compose up -d
```
Lệnh này sẽ khởi động: MySQL, Zookeeper, Kafka, **Debezium**, **Sink-Connect**, Elasticsearch, Kibana, và **Kafka-UI**.
*(Chờ khoảng 1-2 phút để các connector khởi động xong).*

## 3. Tạo Source Connector (Trên Debezium Server - Cổng 8083)
Lệnh tạo Source Connector cho Debezium lắng nghe MySQL:
```bash
curl -X POST -H "Content-Type: application/json" --data @connectors/mysql-source.json http://localhost:8083/connectors
```
Kiểm tra trạng thái connector Debezium:
```bash
curl http://localhost:8083/connectors/mysql-source-connector/status
```

## 4. Tạo Sink Connector (Trên Sink Connect Server - Cổng 8084)
Lệnh tạo Sink Connector đọc từ Kafka và đẩy vào Elasticsearch:
```bash
curl -X POST -H "Content-Type: application/json" --data @connectors/elastic-sink.json http://localhost:8084/connectors
```
Kiểm tra trạng thái connector Sink:
```bash
curl http://localhost:8084/connectors/elasticsearch-sink-connector/status
```

## 5. Kiểm tra kết quả
Elasticsearch sẽ nhận các bản ghi (records) từ topic Kafka `dbserver1.mydb.users` (được Debezium đẩy lên).

Truy vấn trên Elasticsearch để xem dữ liệu:
```bash
curl -X GET "http://localhost:9200/dbserver1.mydb.users/_search?pretty"
```

## 6. Giao diện quản lý UI
- **Kafka UI:** Truy cập [http://localhost:8080](http://localhost:8080) để quản lý Kafka Cluster, Topics, và trực tiếp quản lý/kiểm tra Connectors (cả Debezium và Sink Connect).
- **Kibana:** Truy cập [http://localhost:5601](http://localhost:5601) để dùng Dev Tools thực thi truy vấn Elasticsearch.

## 7. Thử nghiệm Real-time
Vào database MySQL và thêm dữ liệu mới:
```bash
docker exec -it mysql mysql -uroot -proot -e "USE mydb; INSERT INTO users (name, email) VALUES ('User D', 'd@example.com');"
```

Sau đó, truy vấn lại Elasticsearch ở bước 5, bạn sẽ thấy record mới ngay lập tức.

## 8. Dọn dẹp
```bash
docker-compose down -v
```
