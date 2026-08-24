#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

cat <<EOF
Teams living bar.

Install, then run this script inside tmux:

  pnpm exec agentic-core install . --profile agentic-core
  bash scripts/try-teams.sh

The script writes artifacts under a temp dir and prints that path.
Those files must show pong, one claimed task, and a dead pane id.

Human TUI proof after install, still inside tmux:

  /team create try-teams
  /team spawn researcher reply with the word pong
  coms_list
  coms_send researcher ping
  coms_await

The researcher pane must show [from ...] and answer. read_inbox is a fail.
Shut the pane with /team shutdown researcher before you leave.
EOF

if [[ -z "${TMUX:-}" ]]; then
  echo
  echo "Not inside tmux. Printed the bar only."
  exit 0
fi

echo
node --experimental-strip-types "$ROOT/scripts/try-teams.mjs"
