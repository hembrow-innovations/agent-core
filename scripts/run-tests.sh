#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

node --test "$ROOT/tests/profile/profile.test.mjs" "$ROOT/tests/pi"/*.mjs
bun test "$ROOT/tests/orch" "$ROOT/tests/watch-pr"
