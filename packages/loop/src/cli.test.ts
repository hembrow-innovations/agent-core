import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const SRC = dirname(fileURLToPath(import.meta.url));
const PKG = join(SRC, "..");
const BIN = join(SRC, "cli.ts");
const PKG_JSON = join(PKG, "package.json");

function runCli(args: string[]) {
  return spawnSync(process.execPath, [BIN, ...args], { encoding: "utf8" });
}

test("package bin name is opencode-loop", () => {
  assert.match(
    readFileSync(PKG_JSON, "utf8"),
    /"opencode-loop": "\.\/src\/cli\.ts"/,
  );
});

test("missing args print usage and exit 1", () => {
  const r = runCli([]);
  assert.equal(r.status, 1);
  assert.match(
    r.stderr,
    /Usage: node \.loop\/opencode-loop\.mjs <loops> <prompt\.\.\.> \[-- <opencode flags>\]/,
  );
});

test("non-integer loops print usage", () => {
  const r = runCli(["nope", "prompt"]);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /Usage: node \.loop\/opencode-loop\.mjs/);
});

test("zero loops print usage", () => {
  const r = runCli(["0", "prompt"]);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /Usage: node \.loop\/opencode-loop\.mjs/);
});

test("loops without a prompt print usage", () => {
  const r = runCli(["2"]);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /Usage: node \.loop\/opencode-loop\.mjs/);
});
