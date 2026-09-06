import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { planFromProfile, type InstallRequest } from "./plan.ts";
import { listProfiles, loadProfile, type Profile } from "./profile.ts";

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
  });
});

test("loadProfile treats leftover flat yaml as unknown", () => {
  const root = tempRoot();
  writeFileSync(join(root, "profiles", "foo.yaml"), "skills: []\n");
  assert.throws(() => loadProfile(root, "foo"), /Unknown profile "foo"/);
});

test("loadProfile: leftover frameworks key dies", () => {
  const root = tempRoot();
  writeDirProfile(root, "fw", "frameworks:\n  - hivemind\n");
  assert.throws(
    () => loadProfile(root, "fw"),
    /leftover "frameworks:". hivemind is not installed from this pack/,
  );
});

test("loadProfile: leftover Pi keys die", () => {
  const root = tempRoot();
  writeDirProfile(root, "pkg", "packages:\n  - npm:pi-lens\n");
  assert.throws(
    () => loadProfile(root, "pkg"),
    /leftover "packages:". Pi packages are parked/,
  );
  writeDirProfile(root, "set", "settings:\n  toolDescriptionMode: compact\n");
  assert.throws(
    () => loadProfile(root, "set"),
    /leftover "settings:". Pi runtime is parked/,
  );
  writeDirProfile(root, "sys", "system-prompt: default\n");
  assert.throws(
    () => loadProfile(root, "sys"),
    /leftover "system-prompt:". Pi runtime is parked/,
  );
});

function planProfile(over: Partial<Profile> = {}): Profile {
  return {
    name: "demo",
    skills: [],
    agents: { kind: "omit" },
    prompts: { kind: "omit" },
    ...over,
  };
}

function planRequest(): InstallRequest {
  return {
    kind: "install",
    target: "/tmp",
    profile: "demo",
    with: [],
    without: [],
  };
}

test("planFromProfile overlays with and without skills", () => {
  const plan = planFromProfile(
    planProfile({ skills: ["tdd", "oracle"] }),
    { ...planRequest(), with: ["docs"], without: ["oracle"] },
    { agents: [], prompts: [] },
  );
  assert.deepEqual(plan.skills, ["docs", "tdd"]);
  assert.equal(plan.overlayAgents, false);
  assert.equal(plan.overlayPrompts, false);
});
