import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { peerArgv, parseRoleFile } from "../../ai/pi/roles/argv.mjs";

const REPO = fileURLToPath(new URL("../..", import.meta.url));
const INSTALLER = join(REPO, "packages", "installer", "src", "cli.ts");
const FULL_READ = /Read `\.pi\/skills\/draconic-mode\/SKILL\.md` in full/;

test("cold start dest has the default agent file", () => {
  const dest = mkdtempSync(join(tmpdir(), "agent-system-cold-"));
  const r = spawnSync(
    process.execPath,
    [INSTALLER, "install", dest, "--profile", "pi"],
    { encoding: "utf8" },
  );
  assert.equal(r.status, 0, r.stderr || r.stdout);
  const destAgent = join(dest, ".pi", "agents", "draconic.md");
  assert.equal(existsSync(destAgent), true);
  const destText = readFileSync(destAgent, "utf8");
  assert.match(destText, /^name: draconic$/m);
  assert.doesNotMatch(destText, /^tools:/m);
  const append = readFileSync(join(dest, ".pi", "APPEND_SYSTEM.md"), "utf8");
  assert.doesNotMatch(append, /running draconic-mode on Pi/);
  assert.doesNotMatch(append, FULL_READ);
});

test("load path names investigation.md and not the dest router", () => {
  const append = readFileSync(
    join(REPO, "ai", "pi", "APPEND_SYSTEM.md"),
    "utf8",
  );
  const agent = readFileSync(
    join(REPO, "ai", "pi", "agents", "draconic.md"),
    "utf8",
  );
  for (const text of [append, agent]) {
    assert.doesNotMatch(text, FULL_READ);
  }
  assert.match(append, /playbooks\/investigation\.md/);
});

test("teammate argv appends a pi/agents file", () => {
  const role = parseRoleFile(join(REPO, "ai", "pi", "roles", "researcher.md"));
  const { argv } = peerArgv(role, { project: "default", extraPiArgs: [] });
  assert.equal(argv.includes("--system-prompt"), false);
  assert.equal(argv.includes("--append-system-prompt"), false);
  assert.equal(argv.includes("--cname"), true);
  assert.equal(argv.includes("--purpose"), true);
  assert.equal(argv.includes("--project"), true);
  assert.equal(argv[argv.indexOf("--agent") + 1], "draconic");
  assert.doesNotMatch(argv.join(" "), /--mode rpc/);
});
