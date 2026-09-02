import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { run } from "./cli.ts";

const CLI = fileURLToPath(import.meta.url).replace(/\.test\.ts$/, ".ts");

test("once with no hivemind.yaml exits non-zero, no child", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "hivemind-missing-"));
  const spawned: unknown[] = [];
  const status = await run({
    argv: ["once"],
    cwd,
    spawnChild: (argv) => {
      spawned.push(argv);
    },
  });
  assert.notEqual(status, 0);
  assert.deepEqual(spawned, []);

  const proc = spawnSync(
    process.execPath,
    ["--experimental-strip-types", CLI, "once"],
    { cwd, encoding: "utf8" },
  );
  assert.notEqual(proc.status, 0);
  assert.equal(proc.status, status);
});

test("unknown keys exit non-zero", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "hivemind-unknown-"));
  writeFileSync(
    join(cwd, "hivemind.yaml"),
    "folders: []\nlanes: []\nunknown: 1\n",
  );
  const spawned: unknown[] = [];
  const status = await run({
    argv: ["once"],
    cwd,
    spawnChild: (argv) => {
      spawned.push(argv);
    },
  });
  assert.notEqual(status, 0);
  assert.deepEqual(spawned, []);
});

test("empty lanes: [] exits zero and spawns nothing", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "hivemind-empty-"));
  writeFileSync(join(cwd, "hivemind.yaml"), "folders: []\nlanes: []\n");
  const spawned: unknown[] = [];
  const status = await run({
    argv: ["once"],
    cwd,
    spawnChild: (argv) => {
      spawned.push(argv);
    },
  });
  assert.equal(status, 0);
  assert.deepEqual(spawned, []);

  const proc = spawnSync(
    process.execPath,
    ["--experimental-strip-types", CLI, "once"],
    { cwd, encoding: "utf8" },
  );
  assert.equal(proc.status, 0);
});

test("help exits zero", async () => {
  const spawned: unknown[] = [];
  const status = await run({
    argv: ["--help"],
    cwd: mkdtempSync(join(tmpdir(), "hivemind-help-")),
    spawnChild: (argv) => {
      spawned.push(argv);
    },
  });
  assert.equal(status, 0);
  assert.deepEqual(spawned, []);
});
