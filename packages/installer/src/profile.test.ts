import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { listProfiles, loadProfile } from "./profile.ts";

function tempRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "profile-dirs-"));
  mkdirSync(join(root, "profiles"));
  return root;
}

function writeDirProfile(root: string, name: string, body: string): void {
  const dir = join(root, "profiles", name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "profile.yaml"), body);
}

test("listProfiles sees directory stems and ignores leftover flat yaml", () => {
  const root = tempRoot();
  writeDirProfile(root, "agentic-core", "skills: []\n");
  writeDirProfile(root, "web", "skills: []\n");
  writeFileSync(join(root, "profiles", "foo.yaml"), "skills: []\n");
  writeFileSync(join(root, "profiles", "README.md"), "hi\n");
  mkdirSync(join(root, "profiles", ".hidden"));
  writeFileSync(
    join(root, "profiles", ".hidden", "profile.yaml"),
    "skills: []\n",
  );
  mkdirSync(join(root, "profiles", "empty"));
  assert.deepEqual(listProfiles(root), ["agentic-core", "web"]);
  assert.equal(existsSync(join(root, "profiles", "foo.yaml")), true);
});

test("loadProfile reads profiles/<name>/profile.yaml", () => {
  const root = tempRoot();
  writeDirProfile(root, "agentic-core", "skills: []\n");
  writeFileSync(
    join(root, "profiles", "agentic-core.yaml"),
    "skills:\n  - nope\n",
  );
  const got = loadProfile(root, "agentic-core");
  assert.deepEqual(got, {
    name: "agentic-core",
    skills: [],
    agents: { kind: "omit" },
    prompts: { kind: "omit" },
    packages: [],
    settings: null,
    frameworks: [],
  });
});

test("loadProfile treats leftover flat yaml as unknown", () => {
  const root = tempRoot();
  writeFileSync(join(root, "profiles", "foo.yaml"), "skills: []\n");
  assert.throws(() => loadProfile(root, "foo"), /Unknown profile "foo"/);
});

test("loadProfile: missing frameworks is empty; list is kept; non-list dies", () => {
  const root = tempRoot();
  writeDirProfile(root, "bare", "skills: []\n");
  writeDirProfile(root, "listed", "frameworks:\n  - hivemind\n");
  writeDirProfile(root, "bad", "frameworks: hivemind\n");
  assert.deepEqual(loadProfile(root, "bare").frameworks, []);
  assert.deepEqual(loadProfile(root, "listed").frameworks, ["hivemind"]);
  assert.throws(() => loadProfile(root, "bad"), /"frameworks" must be a list/);
});

test("loadProfile: system-prompt stem is kept; absent key omits the field", () => {
  const root = tempRoot();
  writeDirProfile(root, "bare", "skills: []\n");
  writeDirProfile(root, "named", "system-prompt: persona\n");
  assert.equal("system-prompt" in loadProfile(root, "bare"), false);
  assert.equal(loadProfile(root, "named")["system-prompt"], "persona");
});
