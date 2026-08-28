#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const tests = spawnSync(
  "pnpm",
  ["--filter", "@agentic-core/heio-coms", "test"],
  { cwd: ROOT, stdio: "inherit" },
);
if (tests.status !== 0) process.exit(tests.status ?? 1);

const ext = join(ROOT, "packages", "heio-coms", "src", "index.ts");
process.stdout.write(`
Named tmux panes on top of this transport live in scripts/try-teams.mjs.

Raw two-terminal smoke:

  pi -e "${ext}" --cname planner --purpose "Plans the work" --agent planner
  pi -e "${ext}" --cname coder --purpose "Writes the code" --agent coder

Recorded living-session scenario (install playground first):

  pnpm exec agentic-core install playground --profile agentic-core
  node scripts/run-pi-coms-larder.mjs --smoke
  node scripts/run-pi-coms-larder.mjs
`);
