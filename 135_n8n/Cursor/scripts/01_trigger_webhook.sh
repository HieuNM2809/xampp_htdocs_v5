#!/usr/bin/env bash
# Gọi webhook workflow 01 sau khi đã Activate trong n8n UI
set -euo pipefail
curl -sS -X POST "http://localhost:5678/webhook/hello" \
  -H "Content-Type: application/json" \
  -d '{"name":"Hiếu"}' | jq .
