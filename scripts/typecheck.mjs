#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const result = spawnSync(
  "pnpm",
  ["-r", "--filter", "./packages/**", "typecheck"],
  {
    cwd: ROOT,
    stdio: "inherit",
  },
);
if (result.status !== 0) process.exit(result.status ?? 1);
const hivemind = spawnSync(
  "pnpm",
  ["exec", "tsc", "--noEmit", "-p", "frameworks/hivemind/tsconfig.json"],
  {
    cwd: ROOT,
    stdio: "inherit",
  },
);
if (hivemind.status !== 0) process.exit(hivemind.status ?? 1);
