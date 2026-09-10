#!/bin/sh
set -eu

# Run against a live chat container; no service restart or data mutation.
container=${1:-openim-chat}
script=$(dirname "$0")/healthcheck.sh

docker exec -i "$container" sh -s < "$script"
echo 'PASS: live client configuration API is ready'

for url in http://127.0.0.1:1/client_config/get http://127.0.0.1:10008/not-a-health-endpoint http://127.0.0.1:10008/account/login; do
  if docker exec -i "$container" sh -s -- "$url" < "$script"; then
    echo "FAIL: accepted unavailable or invalid API: $url" >&2
    exit 1
  fi
done
echo 'PASS: refused connection, HTTP 404, and application error are unhealthy'
