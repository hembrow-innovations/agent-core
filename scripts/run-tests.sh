#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

node --experimental-strip-types --test "$ROOT/tests/coms/draconic-coms.test.ts"
node --test "$ROOT/tests/profile/profile.test.mjs"
bun test "$ROOT/tests/orch" "$ROOT/tests/watch-pr"
