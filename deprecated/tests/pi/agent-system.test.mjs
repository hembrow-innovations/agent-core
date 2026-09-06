import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const REPO = fileURLToPath(new URL("../..", import.meta.url));
const INSTALLER = join(REPO, "packages", "installer", "src", "cli.ts");
const FULL_READ = /Read `\.pi\/skills\/heio-mode\/SKILL\.md` in full/;

test("cold start dest ships the opt-in agent file", () => {
  const dest = mkdtempSync(join(tmpdir(), "agent-system-cold-"));
  const r = spawnSync(
    process.execPath,
    [INSTALLER, "install", dest, "--profile", "agentic-core"],
    { encoding: "utf8" },
  );
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.equal(existsSync(join(dest, ".pi", "agents", "heio.md")), false);
  for (const stem of [
    "heio-triage",
    "heio-tasker",
    "heio-builder",
    "heio-verifier",
    "heio-visual",
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
  assert.doesNotMatch(append, /running heio-mode on Pi/);
  assert.doesNotMatch(append, FULL_READ);
});

test("pack append and agent files do not dump dest heio-mode", () => {
  const append = readFileSync(
    join(REPO, "ai", "system-prompts", "default.md"),
    "utf8",
  );
  assert.doesNotMatch(append, FULL_READ);
  assert.doesNotMatch(append, /running heio-mode on Pi/);
});
