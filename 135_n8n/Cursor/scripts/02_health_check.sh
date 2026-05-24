#!/usr/bin/env bash
# Probe cùng URL với workflow 02 để đối chiếu trạng thái.
set -euo pipefail
URL="${1:-https://httpbin.org/status/200}"
echo "Probing $URL"
code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "$URL" || echo "000")
if [ "$code" = "200" ]; then
  echo "OK statusCode=$code"
else
  echo "ALERT statusCode=$code"
fi
