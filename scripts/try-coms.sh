#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

pnpm --filter @agentic-core/draconic-coms test

EXT="$ROOT/packages/draconic-coms/src/index.ts"
cat <<EOF

Print three pasteable living-session commands:

  node "$ROOT/pi/roles/argv.mjs" researcher architect coder

Paste each printed line into its own terminal. After they are up, ask one to coms_list, then coms_send, then coms_await.

Raw two-terminal smoke without role files:

  pi -e "$EXT" --cname planner --purpose "Plans the work"
  pi -e "$EXT" --cname coder --purpose "Writes the code"

Recorded living-session scenario (install playground first):

  pnpm exec agentic-core install playground --profile pi
  node scripts/run-pi-coms-larder.mjs --smoke
  node scripts/run-pi-coms-larder.mjs
EOF
