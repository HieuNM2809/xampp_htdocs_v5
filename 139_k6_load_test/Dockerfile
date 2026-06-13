# Dockerfile — đóng gói script test k6 vào một image để chạy ở bất kỳ đâu (CI/CD).
#
# Build:  docker build -t my-k6-test .
# Run:    docker run --rm my-k6-test run /scripts/01_basic.js
#
# Lưu ý: image chính thức `grafana/k6` đã có sẵn binary k6, ENTRYPOINT là `k6`.
# Vì vậy khi `docker run` ta truyền THẲNG các tham số con của k6 (run/cloud...).

FROM grafana/k6:latest

# Copy toàn bộ script + thư mục data vào image.
# WORKDIR mặc định của image grafana/k6 là /home/k6, ta đặt script ở /scripts.
COPY . /scripts

# Không cần CMD/ENTRYPOINT: image grafana/k6 đã set ENTRYPOINT ["k6"].
# => `docker run my-k6-test run /scripts/01_basic.js` tương đương `k6 run ...`.
