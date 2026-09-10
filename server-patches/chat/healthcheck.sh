#!/bin/sh
set -eu

# Existing read-only API exercises HTTP, admin RPC and its configuration store.
url=${1:-http://127.0.0.1:10008/client_config/get}
response=$(wget -q -O - -T 3 \
  --header='Content-Type: application/json' \
  --header='operationID: docker-healthcheck' \
  --post-data='{}' "$url") || exit 1
printf '%s\n' "$response" | grep -Eq '^[[:space:]]*\{[[:space:]]*"errCode"[[:space:]]*:[[:space:]]*0[[:space:]]*[,}]'
