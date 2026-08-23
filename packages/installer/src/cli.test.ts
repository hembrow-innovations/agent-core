import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const SRC = dirname(fileURLToPath(import.meta.url));
const PKG = join(SRC, "..");
const REPO = join(PKG, "../..");
const BIN = join(SRC, "cli.ts");
const PKG_JSON = join(PKG, "package.json");

function runCli(args: string[]) {
  return spawnSync(process.execPath, [BIN, ...args], {
    encoding: "utf8",
    cwd: REPO,
  });
}

test("package bin name is agentic-core", () => {
  assert.match(
    readFileSync(PKG_JSON, "utf8"),
    /"agentic-core": "\.\/src\/cli\.ts"/,
  );
});

test("usage names pnpm exec agentic-core install and drops curl", () => {
  const r = runCli(["--help"]);
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.match(r.stdout, /pnpm exec agentic-core install <target>/);
  assert.doesNotMatch(r.stdout, /curl/);
  assert.doesNotMatch(r.stdout, /scripts\/install\.mjs/);
  assert.doesNotMatch(r.stdout, /--local/);
  assert.doesNotMatch(r.stdout, /--ref/);
});

test("unknown command, remote flags, and --extension die", () => {
  const dest = mkdtempSync(join(tmpdir(), "installer-flags-"));
  const unknown = runCli(["fetch", dest]);
  assert.notEqual(unknown.status, 0);
  assert.match(unknown.stderr, /Unknown command: fetch/);

  const local = runCli(["install", dest, "--local", REPO]);
  assert.notEqual(local.status, 0);
  assert.match(local.stderr, /Unknown flag: --local/);

  const ref = runCli(["install", dest, "--ref", "main"]);
  assert.notEqual(ref.status, 0);
  assert.match(ref.stderr, /Unknown flag: --ref/);

  const extension = runCli(["install", dest, "--extension", "draconic-todo"]);
  assert.notEqual(extension.status, 0);
  assert.match(extension.stderr, /Unknown flag: --extension/);
});

test("install --profile pi writes skills, pack files, and third-party npm sources", () => {
  const dest = mkdtempSync(join(tmpdir(), "installer-pi-"));
  const r = runCli(["install", dest, "--profile", "pi"]);
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.match(r.stdout, /Profile: pi/);
  assert.match(r.stdout, /Harness: pi/);

  const skillRoot = join(dest, ".pi", "skills");
  const folders = readdirSync(skillRoot);
  assert.ok(folders.includes("draconic-mode"), folders.join(", "));
  assert.ok(folders.includes("how"), folders.join(", "));
  assert.equal(existsSync(join(skillRoot, "draconic-mode", "SKILL.md")), true);
  assert.equal(existsSync(join(dest, ".pi", "APPEND_SYSTEM.md")), true);
  assert.equal(
    existsSync(join(dest, ".pi", "prompts", "draconic-mode.md")),
    true,
  );
  assert.equal(existsSync(join(dest, ".pi", "roles", "researcher.md")), true);
  assert.deepEqual(
    JSON.parse(readFileSync(join(dest, ".pi", "settings.json"), "utf8"))
      .packages,
    ["npm:pi-lens", "npm:pi-web-access", "npm:pi-subagents"],
  );
  assert.equal(existsSync(join(dest, ".pi", "vendor")), false);
  assert.equal(existsSync(join(dest, ".opencode")), false);
});

test("install --profile core writes .opencode/skills and does not wire this checkout", () => {
  const dest = mkdtempSync(join(tmpdir(), "installer-core-"));
  const checkoutSettingsPath = join(REPO, ".pi", "settings.json");
  const before = existsSync(checkoutSettingsPath)
    ? readFileSync(checkoutSettingsPath, "utf8")
    : null;

  const r = runCli(["install", dest, "--profile", "core"]);
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.match(r.stdout, /Profile: core/);
  assert.match(r.stdout, /Harness: opencode/);

  const skillRoot = join(dest, ".opencode", "skills");
  const folders = readdirSync(skillRoot);
  assert.ok(folders.includes("bro"), folders.join(", "));
  assert.equal(existsSync(join(skillRoot, "bro", "SKILL.md")), true);
  assert.equal(existsSync(join(dest, ".pi")), false);
  assert.equal(existsSync(join(dest, ".pi", "vendor")), false);

  const after = existsSync(checkoutSettingsPath)
    ? readFileSync(checkoutSettingsPath, "utf8")
    : null;
  assert.equal(after, before);
  if (after) {
    assert.doesNotMatch(after, /vendor\/@agentic-core/);
    assert.doesNotMatch(
      after,
      /packages\/(?:lib|draconic-todo|draconic-coms|draconic-boot)/,
    );
  }
});
