import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./loadConfig.ts";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "../../..");

test("loadConfig throws when hivemind.yaml is missing", () => {
  const cwd = mkdtempSync(join(tmpdir(), "hivemind-load-missing-"));
  assert.throws(() => loadConfig(cwd), /Missing hivemind.yaml/);
});

test("loadConfig throws on unknown top-level keys", () => {
  const cwd = mkdtempSync(join(tmpdir(), "hivemind-load-unknown-"));
  writeFileSync(
    join(cwd, "hivemind.yaml"),
    "folders: []\nlanes: []\nunknown: 1\n",
  );
  assert.throws(() => loadConfig(cwd), /Unknown key "unknown"/);
});

test("loadConfig accepts empty lanes: []", () => {
  const cwd = mkdtempSync(join(tmpdir(), "hivemind-load-empty-"));
  writeFileSync(join(cwd, "hivemind.yaml"), "folders: []\nlanes: []\n");
  const cfg = loadConfig(cwd);
  assert.deepEqual(cfg.lanes, []);
});

test("loadConfig accepts the agentic-core heio-stack template", () => {
  const cfg = loadConfig(join(REPO, "profiles", "agentic-core"));
  assert.deepEqual(
    cfg.lanes.map((lane) => lane.lane),
    ["plan", "tasker", "build", "review"],
  );
  for (const lane of cfg.lanes) {
    assert.equal(typeof lane.claimStatus, "string");
    assert.notEqual(lane.claimStatus, "");
  }
  const review = cfg.lanes.find((lane) => lane.lane === "review");
  assert.equal(review?.scalars["mint-status"], "ready-for-human");
  const mintLane = cfg.lanes.some((lane) => lane.lane === "mint");
  assert.equal(mintLane && !cfg.disable.includes("mint"), false);
});
