#!/usr/bin/env node
// Repo checks and tests live under tests/. This file is the npm entrypoint.
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

function listTestFiles(dir) {
  const out = [];
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) {
      out.push(...listTestFiles(full));
      continue;
    }
    if (ent.isFile() && ent.name.endsWith(".test.ts")) out.push(full);
  }
  return out.sort();
}

run("pnpm", ["-r", "--filter", "./packages/**", "test"]);

const hivemindTests = listTestFiles(
  join(ROOT, "frameworks", "hivemind", "src"),
);
run("node", ["--experimental-strip-types", "--test", ...hivemindTests]);

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
