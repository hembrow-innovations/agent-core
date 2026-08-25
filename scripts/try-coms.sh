#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

pnpm --filter @agentic-core/draconic-coms test

EXT="$ROOT/packages/draconic-coms/src/index.ts"
cat <<EOF

Named tmux panes on top of this transport live in scripts/try-teams.sh.

Raw two-terminal smoke:

  pi -e "$EXT" --cname planner --purpose "Plans the work" --agent planner
  pi -e "$EXT" --cname coder --purpose "Writes the code" --agent coder

Recorded living-session scenario (install playground first):

  pnpm exec agentic-core install playground --profile agentic-core
  node scripts/run-pi-coms-larder.mjs --smoke
  node scripts/run-pi-coms-larder.mjs
EOF
