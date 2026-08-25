import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const REPO = fileURLToPath(new URL("../..", import.meta.url));
const INSTALLER = join(REPO, "packages", "installer", "src", "cli.ts");
const FULL_READ = /Read `\.pi\/skills\/draconic-mode\/SKILL\.md` in full/;

test("cold start dest ships the opt-in agent file", () => {
  const dest = mkdtempSync(join(tmpdir(), "agent-system-cold-"));
  const r = spawnSync(
    process.execPath,
    [INSTALLER, "install", dest, "--profile", "agentic-core"],
    { encoding: "utf8" },
  );
  assert.equal(r.status, 0, r.stderr || r.stdout);
  const destAgent = join(dest, ".pi", "agents", "draconic.md");
  assert.equal(existsSync(destAgent), true);
  const destText = readFileSync(destAgent, "utf8");
  assert.match(destText, /^name: draconic$/m);
  assert.doesNotMatch(destText, /^tools:/m);
  for (const stem of [
    "architect",
    "coder",
    "debugger",
    "designer",
    "devops",
    "documenter",
    "growth",
    "planner",
    "product",
    "researcher",
    "reviewer",
    "spec",
    "tester",
  ]) {
    const path = join(dest, ".pi", "agents", `${stem}.md`);
    assert.equal(existsSync(path), true, path);
    assert.match(
      readFileSync(path, "utf8"),
      new RegExp(`^name: ${stem}$`, "m"),
    );
  }
  assert.equal(existsSync(join(dest, ".pi", "roles")), false);
  const append = readFileSync(join(dest, ".pi", "APPEND_SYSTEM.md"), "utf8");
  assert.doesNotMatch(append, /running draconic-mode on Pi/);
  assert.doesNotMatch(append, FULL_READ);
});

test("pack append and agent files do not dump dest draconic-mode", () => {
  const append = readFileSync(
    join(REPO, "ai", "pi", "APPEND_SYSTEM.md"),
    "utf8",
  );
  const agent = readFileSync(
    join(REPO, "ai", "agents", "draconic", "draconic.md"),
    "utf8",
  );
  for (const text of [append, agent]) {
    assert.doesNotMatch(text, FULL_READ);
    assert.doesNotMatch(text, /running draconic-mode on Pi/);
  }
});
