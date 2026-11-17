#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
exec .local/runtime/node/bin/node scripts/local-service.mjs "${1:-start}"
