#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
if [ ! -x .local/runtime/node/bin/node ]; then
  echo 'Local Node runtime is missing. See docs/local-setup.md.' >&2
  exit 1
fi
export PATH="$PWD/.local/runtime/node/bin:$PATH"
exec node scripts/local-run.mjs
