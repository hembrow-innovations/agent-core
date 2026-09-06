#!/usr/bin/env node
// Repo checks and tests live under tests/. This file is the npm entrypoint.
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    stdio: "inherit",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run("pnpm", ["-r", "--filter", "./packages/**", "test"]);

run("node", [
  "--test",
  join(ROOT, "tests", "profile", "profile.test.mjs"),
  join(ROOT, "tests", "oracle", "oracle-check.test.mjs"),
]);
