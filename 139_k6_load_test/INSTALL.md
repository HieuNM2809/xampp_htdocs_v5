# Hướng dẫn cài đặt — 139 k6 Load Test

Tài liệu cài đặt và chạy bộ kịch bản kiểm thử tải (load test) bằng **k6** trong thư mục `139_k6_load_test`. Để hiểu lý thuyết và phân tích kết quả, xem thêm [`README.md`](./README.md).

## Mục lục

1. [Giới thiệu dự án](#1-giới-thiệu-dự-án)
2. [Yêu cầu môi trường](#2-yêu-cầu-môi-trường)
3. [Cài đặt k6 trực tiếp theo hệ điều hành](#3-cài-đặt-k6-trực-tiếp-theo-hệ-điều-hành)
4. [Cài đặt và chạy qua Docker](#4-cài-đặt-và-chạy-qua-docker)
5. [Thiết lập biến môi trường và dữ liệu đầu vào](#5-thiết-lập-biến-môi-trường-và-dữ-liệu-đầu-vào)
6. [Cách chạy từng kịch bản test](#6-cách-chạy-từng-kịch-bản-test)
7. [Xử lý lỗi thường gặp](#7-xử-lý-lỗi-thường-gặp)

---

## 1. Giới thiệu dự án

Đây là bộ **kịch bản kiểm thử tải (load test)** sử dụng công cụ **k6** (https://k6.io/) của Grafana Labs. Mỗi kịch bản được viết bằng **JavaScript (ES6)** và chạy bằng engine k6 (viết bằng Go).

- **Mục đích**: học và minh hoạ cách dùng k6 để đo hiệu năng hệ thống — độ trễ (latency), thông lượng (RPS) và tỉ lệ lỗi — qua các ví dụ từ cơ bản đến nâng cao.
- **Phạm vi sử dụng**: tài liệu học tập / demo. Các kịch bản nhắm tới hai API công khai để chạy được ngay mà không cần dựng server:
  - `https://test.k6.io` — site demo của Grafana dành cho học k6.
  - `https://jsonplaceholder.typicode.com` — REST API giả lập (dùng ở [`08_load_test_api.js`](./08_load_test_api.js)).
- **Cấu trúc thư mục**:

```text
139_k6_load_test/
├── 01_basic.js              # request cơ bản, sleep, vòng lặp VU
├── 02_thresholds.js         # ngưỡng pass/fail
├── 03_stages_scenarios.js   # stages & scenarios (ramping-vus, constant-arrival-rate)
├── 04_checks.js             # check() xác thực phản hồi
├── 05_custom_metrics.js     # Counter, Gauge, Rate, Trend
├── 06_env_data.js           # __ENV, SharedArray, đọc CSV/JSON
├── 07_test_types.js         # 4 loại test: load/stress/spike/soak
├── 08_load_test_api.js      # load test thực tế jsonplaceholder API
├── data/
│   ├── users.csv            # dữ liệu test dạng CSV
│   └── users.json           # dữ liệu test dạng JSON
├── Dockerfile               # đóng gói script vào image grafana/k6
├── README.md                # lý thuyết & phân tích kết quả
└── INSTALL.md               # tài liệu này
```

---

## 2. Yêu cầu môi trường

Bạn chỉ cần **một trong hai** cách: cài k6 trực tiếp, **hoặc** dùng Docker.

### Phần mềm

| Phần mềm | Phiên bản tối thiểu | Bắt buộc? | Ghi chú |
|---|---|---|---|
| **k6** | **v0.50.0** trở lên | Bắt buộc (nếu chạy trực tiếp) | Engine chạy test. Đã kiểm chứng trên v0.50.0. |
| **Docker** | **20.10** trở lên | Bắt buộc (nếu chạy qua Docker) | Dùng image chính thức `grafana/k6:latest` (xem [`Dockerfile`](./Dockerfile)). |

> k6 **không chạy trên Node.js** và **không cần cài Node.js/npm**. Engine đã nhúng sẵn runtime JavaScript (goja). Thư viện ngoài (vd `papaparse` trong `06_env_data.js`) được nạp từ `jslib.k6.io`.

### Yêu cầu hệ thống

- **Hệ điều hành**: Windows 10/11, macOS, hoặc Linux (64-bit).
- **RAM**: tối thiểu ~512 MB cho các ví dụ trong dự án (vài chục VU). Tải lớn hơn cần nhiều RAM hơn.
- **Kết nối Internet**: cần thiết vì các kịch bản gọi API công khai (`test.k6.io`, `jsonplaceholder.typicode.com`) và nạp `papaparse` từ CDN `jslib.k6.io`.

---

## 3. Cài đặt k6 trực tiếp theo hệ điều hành

Tham khảo chính thức: https://grafana.com/docs/k6/latest/set-up/install-k6/

### Windows

**Cách A — Chocolatey:**

```powershell
choco install k6
```

**Cách B — winget:**

```powershell
winget install k6 --source winget --accept-source-agreements
```

**Cách C — tải binary thủ công (không cần trình quản lý gói):**

```powershell
# Tải file zip, giải nén, rồi thêm thư mục chứa k6.exe vào PATH
# (Tải tại: https://github.com/grafana/k6/releases)
```

### macOS

**Homebrew:**

```bash
brew install k6
```

### Linux

**Debian / Ubuntu (kho APT của Grafana):**

```bash
sudo gpg -k
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642DAA767751277A8F16881
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Fedora / CentOS (dnf):**

```bash
sudo dnf install https://dl.k6.io/rpm/repo.rpm
sudo dnf install k6
```

### Kiểm tra cài đặt

Sau khi cài (mọi hệ điều hành), kiểm tra phiên bản:

```bash
k6 version
# Kết quả mong đợi, ví dụ: k6.exe v0.50.0 (commit/..., go1.21.8, ...)
```

---

## 4. Cài đặt và chạy qua Docker

Image chính thức `grafana/k6` đã chứa sẵn binary k6 với `ENTRYPOINT` là `k6`. Vì vậy khi `docker run` ta truyền **thẳng** các lệnh con của k6 (`run`, `cloud`...).

### Cách 1 — Chạy trực tiếp bằng image chính thức (không cần build)

Mount thư mục dự án vào container để truy cập được script và thư mục `data/`:

```bash
# Từ bên trong thư mục 139_k6_load_test
docker run --rm -v "$PWD:/scripts" grafana/k6 run /scripts/01_basic.js

# Truyền biến môi trường vào test
docker run --rm -v "$PWD:/scripts" grafana/k6 run -e TYPE=spike /scripts/07_test_types.js
```

> Trên **Windows (Git Bash)** nếu `$PWD` không mount đúng, dùng đường dẫn tuyệt đối kiểu Unix, ví dụ: `-v "/e/xampp_htdocs_v5/139_k6_load_test:/scripts"`. Trên **PowerShell** dùng `-v "${PWD}:/scripts"`.

### Cách 2 — Build image riêng chứa sẵn script (phù hợp CI/CD)

[`Dockerfile`](./Dockerfile) copy toàn bộ dự án vào `/scripts` của image:

```bash
# Build (chạy trong thư mục 139_k6_load_test, nơi có Dockerfile)
docker build -t my-k6-test .

# Chạy các kịch bản từ image vừa build
docker run --rm my-k6-test run /scripts/01_basic.js
docker run --rm my-k6-test run --vus 20 --duration 1m /scripts/02_thresholds.js
docker run --rm my-k6-test run -e BASE_URL=https://jsonplaceholder.typicode.com /scripts/08_load_test_api.js
```

> Nếu test nhắm tới service chạy trong Docker khác: thêm `--network host` (Linux), hoặc dùng hostname `host.docker.internal` (Windows/macOS) để gọi service trên máy host.

---

## 5. Thiết lập biến môi trường và dữ liệu đầu vào

### Thư mục `data/`

Chứa dữ liệu đầu vào cho kịch bản [`06_env_data.js`](./06_env_data.js):

- `data/users.json` — danh sách user dạng JSON.
- `data/users.csv` — cùng dữ liệu dạng CSV (parse bằng `papaparse`).

Script nạp dữ liệu **một lần** qua `SharedArray` rồi chia sẻ chỉ-đọc cho mọi VU (tiết kiệm RAM). Bạn có thể **thêm/sửa dòng** trong hai file này để đổi dữ liệu test — giữ nguyên cột `username,password` trong CSV và cấu trúc object trong JSON.

> Đường dẫn `open('./data/users.json')` là **tương đối so với file script**. Vì vậy hãy chạy `k6 run` **từ bên trong thư mục `139_k6_load_test`** để k6 tìm đúng thư mục `data/`.

### Biến môi trường

k6 đọc biến qua `__ENV.<TÊN>`, truyền bằng cờ `-e TÊN=GIÁ_TRỊ`. Dự án này dùng các biến sau (tất cả đều **tùy chọn** vì đã có giá trị mặc định):

| Biến | Dùng ở file | Mặc định | Ý nghĩa |
|---|---|---|---|
| `BASE_URL` | `06_env_data.js` | `https://test.k6.io` | URL gốc của hệ thống cần test |
| `BASE_URL` | `08_load_test_api.js` | `https://jsonplaceholder.typicode.com` | URL gốc của API cần test |
| `THINK_TIME` | `06_env_data.js` | `1` | Số giây `sleep` giữa các iteration |
| `TYPE` | `07_test_types.js` | `load` | Loại test: `load` / `stress` / `spike` / `soak` |

**Truyền biến trực tiếp khi chạy:**

```bash
k6 run -e BASE_URL=https://jsonplaceholder.typicode.com -e THINK_TIME=2 06_env_data.js
```

**Dùng file `.env` (qua biến môi trường của shell):** k6 không tự đọc file `.env`, nên nạp vào shell trước khi chạy.

```bash
# Linux/macOS — tạo file .env rồi export vào shell hiện tại
cat > .env << 'EOF'
BASE_URL=https://jsonplaceholder.typicode.com
THINK_TIME=2
TYPE=load
EOF

export $(grep -v '^#' .env | xargs)   # nạp .env vào shell
k6 run 08_load_test_api.js            # k6 đọc các biến từ môi trường
```

```powershell
# Windows PowerShell — set biến môi trường cho phiên hiện tại
$env:BASE_URL = "https://jsonplaceholder.typicode.com"
$env:THINK_TIME = "2"
k6 run 08_load_test_api.js
```

> Lưu ý: với k6, biến lấy từ môi trường hệ điều hành chỉ được dùng khi truyền cờ `--include-system-env-vars` (mặc định đã bật) — nếu tắt thì phải dùng `-e`.

---

## 6. Cách chạy từng kịch bản test

Trước hết, **vào thư mục dự án** (quan trọng để các đường dẫn `./data/...` hoạt động):

```bash
cd 139_k6_load_test
```

Mỗi lệnh dưới đây có thể sao chép chạy ngay.

### 01_basic.js — Kịch bản cơ bản

HTTP request đơn giản + `sleep` + vòng lặp VU. Điểm khởi đầu để hiểu cách k6 chạy.

```bash
k6 run 01_basic.js
# Ghi đè số VU và thời lượng từ dòng lệnh:
k6 run --vus 10 --duration 30s 01_basic.js
```

### 02_thresholds.js — Ngưỡng pass/fail

Đặt tiêu chí pass/fail (p95, p99, tỉ lệ lỗi). Vi phạm ngưỡng → k6 thoát với **exit code 99** (CI/CD báo FAIL).

```bash
k6 run 02_thresholds.js
echo "Exit code: $?"   # 0 = PASS, 99 = FAIL
```

### 03_stages_scenarios.js — Stages & Scenarios

Chạy nhiều kịch bản song song với các executor `ramping-vus` và `constant-arrival-rate`.

```bash
k6 run 03_stages_scenarios.js
```

### 04_checks.js — Xác thực phản hồi

Dùng `check()` kiểm tra status code và nội dung body (không dừng test khi sai).

```bash
k6 run 04_checks.js
```

### 05_custom_metrics.js — Custom metrics

Định nghĩa và dùng Counter, Gauge, Rate, Trend.

```bash
k6 run 05_custom_metrics.js
```

### 06_env_data.js — Biến môi trường & dữ liệu test

Đọc `__ENV`, nạp `data/users.json` và `data/users.csv` qua `SharedArray`.

```bash
# Chạy với giá trị mặc định
k6 run 06_env_data.js
# Truyền biến môi trường
k6 run -e BASE_URL=https://test.k6.io -e THINK_TIME=2 06_env_data.js
```

### 07_test_types.js — 4 loại test

Chọn loại test bằng biến `TYPE`.

```bash
k6 run -e TYPE=load  07_test_types.js   # load test (mặc định)
k6 run -e TYPE=stress 07_test_types.js  # stress test
k6 run -e TYPE=spike 07_test_types.js   # spike test
k6 run -e TYPE=soak  07_test_types.js   # soak test (CHẠY RẤT LÂU — nhiều giờ!)
```

### 08_load_test_api.js — Load test API thực tế

Mô phỏng user journey trên `jsonplaceholder.typicode.com` (GET list → GET chi tiết + comment → POST tạo bài).

```bash
# Bản đầy đủ: ramp 30s → giữ 20 VU/1m → giảm 20s
k6 run 08_load_test_api.js
# Đổi API mục tiêu
k6 run -e BASE_URL=https://jsonplaceholder.typicode.com 08_load_test_api.js
# Smoke test nhanh (ghi đè stages bằng cờ --stage)
k6 run --stage 10s:10 --stage 10s:0 08_load_test_api.js
```

### Xuất kết quả để phân tích / lưu trữ

```bash
k6 run --summary-export=summary.json 02_thresholds.js   # xuất summary ra JSON
k6 run --out json=results.json 02_thresholds.js         # xuất chi tiết từng điểm dữ liệu
```

### Web dashboard tích hợp (`K6_WEB_DASHBOARD=true`)

Từ k6 v0.49.0 trở lên có sẵn web dashboard xem biểu đồ trực quan, không cần cài thêm:

```bash
# Dashboard real-time tại http://127.0.0.1:5665 trong lúc test chạy
K6_WEB_DASHBOARD=true k6 run 01_basic.js

# Xuất báo cáo HTML tĩnh sau khi chạy xong
K6_WEB_DASHBOARD=true K6_WEB_DASHBOARD_EXPORT=k6-report.html k6 run 01_basic.js
```

```powershell
# Windows PowerShell
$env:K6_WEB_DASHBOARD="true"; k6 run 01_basic.js
```

> Biến tùy chỉnh: `K6_WEB_DASHBOARD_PORT` (mặc định 5665), `K6_WEB_DASHBOARD_HOST`,
> `K6_WEB_DASHBOARD_PERIOD`, `K6_WEB_DASHBOARD_OPEN`, `K6_WEB_DASHBOARD_EXPORT`.
> Chi tiết xem mục "Web dashboard tích hợp sẵn" trong [`README.md`](./README.md).

---

## 7. Xử lý lỗi thường gặp

### 7.1 `k6: command not found` / `'k6' is not recognized`

- **Nguyên nhân**: chưa cài k6 hoặc thư mục chứa `k6` chưa nằm trong `PATH`.
- **Khắc phục**: cài lại theo [mục 3](#3-cài-đặt-k6-trực-tiếp-theo-hệ-điều-hành), rồi kiểm tra `k6 version`. Nếu cài bằng binary thủ công, thêm thư mục chứa `k6`/`k6.exe` vào biến `PATH`. Hoặc chuyển sang chạy qua [Docker (mục 4)](#4-cài-đặt-và-chạy-qua-docker).

### 7.2 `The moduleSpecifier "./data/users.json" couldn't be found` (sai đường dẫn file)

- **Nguyên nhân**: chạy `k6 run` từ thư mục khác, nên đường dẫn tương đối `./data/...` trỏ sai.
- **Khắc phục**: `cd` vào thư mục `139_k6_load_test` trước khi chạy. Với Docker, đảm bảo đã mount đúng (`-v "$PWD:/scripts"`) và chạy script bằng đường dẫn `/scripts/06_env_data.js`.

### 7.3 Test "fail" do vi phạm threshold (`thresholds ... have been crossed`)

- **Nguyên nhân**: hệ thống/đường truyền không đạt ngưỡng đặt trong `options.thresholds` (ví dụ mạng chậm khiến `p(95)` vượt giới hạn). Đây là hành vi **đúng thiết kế**, không phải lỗi cài đặt.
- **Khắc phục**: nếu thật sự do hiệu năng kém → tối ưu hệ thống. Nếu chỉ muốn xem luồng chạy trên mạng chậm → nới ngưỡng tạm thời trong file, ví dụ `http_req_duration: ['p(95)<8000']`.

### 7.4 Lỗi kết nối API (`dial: i/o timeout`, `connection refused`, `lookup ... no such host`)

- **Nguyên nhân**: mất kết nối Internet, bị chặn bởi proxy/firewall, hoặc URL trong `BASE_URL` sai.
- **Khắc phục**:
  - Kiểm tra mạng: `curl -I https://jsonplaceholder.typicode.com`.
  - Kiểm tra lại `BASE_URL` truyền vào (không thừa dấu `/`, đúng `https://`).
  - Sau proxy doanh nghiệp: đặt biến `HTTPS_PROXY` / `HTTP_PROXY` trước khi chạy k6.
  - Nếu chứng chỉ TLS nội bộ gây lỗi (chỉ dùng cho test, KHÔNG dùng production): thêm cờ `--insecure-skip-tls-verify`.

### 7.5 Cảnh báo `Insufficient VUs` với executor arrival-rate

- **Nguyên nhân**: server phản hồi chậm nên số VU `preAllocatedVUs`/`maxVUs` không đủ để giữ đúng `rate` (gặp ở `03_stages_scenarios.js`).
- **Khắc phục**: tăng `preAllocatedVUs` và `maxVUs` trong `options.scenarios`, hoặc giảm `rate` mục tiêu.

### 7.6 Lỗi nạp `papaparse` từ jslib (`couldn't load ... jslib.k6.io`)

- **Nguyên nhân**: không truy cập được CDN `jslib.k6.io` (mạng/proxy) khi chạy `06_env_data.js`.
- **Khắc phục**: đảm bảo có Internet; hoặc tải file `index.js` của papaparse về cục bộ và sửa `import` sang đường dẫn nội bộ.

### 7.7 Docker không truy cập được file/`data` (`no such file or directory`)

- **Nguyên nhân**: chưa mount thư mục dự án vào container, hoặc đường dẫn mount sai trên Windows.
- **Khắc phục**: dùng `-v "$PWD:/scripts"` (Git Bash) / `-v "${PWD}:/scripts"` (PowerShell) và chạy script qua đường dẫn `/scripts/...`. Hoặc dùng [Cách 2 — build image](#cách-2--build-image-riêng-chứa-sẵn-script-phù-hợp-cicd) đã copy sẵn `data/` vào image.
