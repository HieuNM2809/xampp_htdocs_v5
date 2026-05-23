#!/usr/bin/env bash
# Gọi webhook workflow 01 sau khi đã Activate trong n8n UI
set -euo pipefail
curl -sS -X POST "http://localhost:5678/webhook/claude" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Tóm tắt n8n là gì trong 2 câu tiếng Việt."}' | jq .
