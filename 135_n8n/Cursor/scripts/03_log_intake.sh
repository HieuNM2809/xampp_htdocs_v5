#!/usr/bin/env bash
# Gửi log mẫu vào workflow 03. Truyền tham số: service level msg
set -euo pipefail
SERVICE="${1:-api-gateway}"
LEVEL="${2:-error}"
MSG="${3:-Upstream 502 from auth-svc}"

curl -sS -X POST "http://localhost:5678/webhook/log" \
  -H "Content-Type: application/json" \
  -d "$(jq -nc --arg s "$SERVICE" --arg l "$LEVEL" --arg m "$MSG" '{service:$s, level:$l, msg:$m}')" | jq .
