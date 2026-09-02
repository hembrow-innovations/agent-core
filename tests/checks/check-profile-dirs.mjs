#!/usr/bin/env node
import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { listProfiles, loadProfile } from "../lib/profile.mjs";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const dirYaml = join(repo, "profiles", "agentic-core", "profile.yaml");
assert.equal(existsSync(dirYaml), true);
const shipped = loadProfile(repo, "agentic-core");
assert.equal(shipped.name, "agentic-core");

const root = mkdtempSync(join(tmpdir(), "check-profile-dirs-"));
try {
  mkdirSync(join(root, "profiles", "agentic-core"), { recursive: true });
  mkdirSync(join(root, "profiles", "web"), { recursive: true });
  writeFileSync(
    join(root, "profiles", "agentic-core", "profile.yaml"),
    "skills:\n  - from-dir\n",
  );
  writeFileSync(join(root, "profiles", "web", "profile.yaml"), "skills: []\n");
  writeFileSync(
    join(root, "profiles", "agentic-core.yaml"),
    "skills:\n  - from-flat\n",
  );
  writeFileSync(join(root, "profiles", "foo.yaml"), "skills: []\n");

  const loaded = loadProfile(root, "agentic-core");
  assert.deepEqual(loaded.skills, ["from-dir"]);
  console.log(
    'loadProfile(root, "agentic-core") reads profiles/agentic-core/profile.yaml',
  );

  const names = listProfiles(root);
  assert.deepEqual(names, ["agentic-core", "web"]);
  assert.equal(names.includes("foo"), false);
  assert.equal(existsSync(join(root, "profiles", "foo.yaml")), true);
  console.log(
    "listProfiles sees directory stems; leftover profiles/foo.yaml is not a profile",
  );
} finally {
  rmSync(root, { recursive: true, force: true });
}
