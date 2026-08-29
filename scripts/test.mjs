#!/usr/bin/env node
import { readdirSync } from "node:fs";
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

const piTests = readdirSync(join(ROOT, "tests", "pi"))
  .filter((name) => name.endsWith(".mjs"))
  .sort()
  .map((name) => join(ROOT, "tests", "pi", name));

run("node", [
  "--test",
  join(ROOT, "tests", "profile", "profile.test.mjs"),
  join(ROOT, "tests", "oracle", "oracle-check.test.mjs"),
  ...piTests,
]);

run("bun", [
  "test",
  join(ROOT, "tests", "orch"),
  join(ROOT, "tests", "watch-pr"),
]);
