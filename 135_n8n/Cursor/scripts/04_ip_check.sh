#!/usr/bin/env bash
# Test workflow 04 — IP reputation. ./04_ip_check.sh 8.8.8.8
set -euo pipefail
IP="${1:-8.8.8.8}"
curl -sS -X POST "http://localhost:5678/webhook/ip-check" \
  -H "Content-Type: application/json" \
  -d "{\"ip\":\"$IP\"}" | jq .
