#!/usr/bin/env node
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const ext = join(
  ROOT,
  "deprecated",
  "packages",
  "heio-coms",
  "src",
  "index.ts",
);
process.stdout.write(`
Parked. Not in the workspace. Not installed.

Named tmux panes on top of this transport live in deprecated/scripts/try-teams.mjs.

Raw two-terminal smoke:

  pi -e "${ext}" --cname planner --purpose "Plans the work" --agent planner
  pi -e "${ext}" --cname coder --purpose "Writes the code" --agent coder

Recorded living-session scenario:

  node deprecated/scripts/run-pi-coms-larder.mjs --smoke
  node deprecated/scripts/run-pi-coms-larder.mjs
`);
