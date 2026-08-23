#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

node --experimental-strip-types --test "$ROOT/scripts/draconic-coms.test.ts"

EXT="$ROOT/pi/extensions/draconic-coms.ts"
cat <<EOF

Two terminals, same machine:

  pi -e "$EXT" --cname planner --purpose "Plans the work"
  pi -e "$EXT" --cname coder --purpose "Writes the code"

In planner, ask it to coms_list, then coms_send a question to coder, then coms_await the msg_id.
EOF
