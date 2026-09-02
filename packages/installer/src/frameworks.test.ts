import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { openDestination } from "./dest.ts";
import { listFrameworks, writeFrameworks } from "./frameworks.ts";
import { planFromProfile, type InstallRequest } from "./plan.ts";
import type { Profile } from "./profile.ts";

function profile(over: Partial<Profile> = {}): Profile {
  return {
    name: "demo",
    skills: [],
    agents: { kind: "omit" },
    prompts: { kind: "omit" },
    packages: [],
    settings: null,
    frameworks: [],
    ...over,
  };
}

function request(): InstallRequest {
  return {
    kind: "install",
    target: "/tmp",
    profile: "demo",
    with: [],
    without: [],
    extensions: [],
  };
}

function tempSrc(): string {
  const root = mkdtempSync(join(tmpdir(), "fw-src-"));
  mkdirSync(join(root, "frameworks"));
  mkdirSync(join(root, "profiles", "demo"), { recursive: true });
  return root;
}

function writeFrameworkTree(root: string, name: string): void {
  const dir = join(root, "frameworks", name);
  mkdirSync(join(dir, "src"), { recursive: true });
  writeFileSync(
    join(dir, "package.json"),
    `${JSON.stringify({ name, private: true, type: "module" })}\n`,
  );
  writeFileSync(join(dir, "src", "cli.ts"), "export {}\n");
  writeFileSync(join(dir, "src", "cli.test.ts"), "export {}\n");
}

test("planFromProfile rejects unknown framework names", () => {
  assert.throws(
    () =>
      planFromProfile(profile({ frameworks: ["hivemind"] }), request(), {
        agents: [],
        prompts: [],
        frameworks: [],
        systemPrompts: [],
      }),
    /Unknown framework "hivemind"/,
  );
});

test("planFromProfile keeps known frameworks", () => {
  const plan = planFromProfile(
    profile({ frameworks: ["hivemind"] }),
    request(),
    { agents: [], prompts: [], frameworks: ["hivemind"], systemPrompts: [] },
  );
  assert.deepEqual(plan.frameworks, ["hivemind"]);
});

test("writeFrameworks copies package.json and non-test src, not settings packages", () => {
  const srcRoot = tempSrc();
  writeFrameworkTree(srcRoot, "hivemind");
  const destRoot = mkdtempSync(join(tmpdir(), "fw-dest-"));
  const dest = openDestination(destRoot);

  writeFrameworks({
    srcRoot,
    dest,
    profileName: "demo",
    names: ["hivemind"],
  });

  const copied = join(destRoot, ".pi", "frameworks", "hivemind");
  assert.equal(existsSync(join(copied, "package.json")), true);
  assert.equal(existsSync(join(copied, "src", "cli.ts")), true);
  assert.equal(existsSync(join(copied, "src", "cli.test.ts")), false);
  assert.equal(existsSync(join(destRoot, ".pi", "settings.json")), false);
});

test("writeFrameworks copies .hivemind/hivemind.yaml only when missing", () => {
  const srcRoot = tempSrc();
  writeFrameworkTree(srcRoot, "hivemind");
  writeFileSync(
    join(srcRoot, "profiles", "demo", "hivemind.yaml"),
    "lanes: {}\n",
  );
  const destRoot = mkdtempSync(join(tmpdir(), "fw-yaml-"));
  const dest = openDestination(destRoot);

  writeFrameworks({
    srcRoot,
    dest,
    profileName: "demo",
    names: ["hivemind"],
  });
  assert.equal(
    readFileSync(join(destRoot, ".hivemind", "hivemind.yaml"), "utf8"),
    "lanes: {}\n",
  );

  writeFileSync(
    join(destRoot, ".hivemind", "hivemind.yaml"),
    "lanes: {edited: true}\n",
  );
  writeFileSync(
    join(srcRoot, "profiles", "demo", "hivemind.yaml"),
    "lanes: {template: true}\n",
  );
  writeFrameworks({
    srcRoot,
    dest,
    profileName: "demo",
    names: ["hivemind"],
  });
  assert.equal(
    readFileSync(join(destRoot, ".hivemind", "hivemind.yaml"), "utf8"),
    "lanes: {edited: true}\n",
  );
});

test("writeFrameworks migrates a legacy root hivemind.yaml", () => {
  const srcRoot = tempSrc();
  writeFrameworkTree(srcRoot, "hivemind");
  writeFileSync(
    join(srcRoot, "profiles", "demo", "hivemind.yaml"),
    "lanes: {template: true}\n",
  );
  const destRoot = mkdtempSync(join(tmpdir(), "fw-yaml-legacy-"));
  writeFileSync(join(destRoot, "hivemind.yaml"), "lanes: {legacy: true}\n");
  const dest = openDestination(destRoot);

  writeFrameworks({
    srcRoot,
    dest,
    profileName: "demo",
    names: ["hivemind"],
  });
  assert.equal(
    readFileSync(join(destRoot, ".hivemind", "hivemind.yaml"), "utf8"),
    "lanes: {legacy: true}\n",
  );
});

test("writeFrameworks overwrites the dest framework tree on reinstall", () => {
  const srcRoot = tempSrc();
  writeFrameworkTree(srcRoot, "hivemind");
  const destRoot = mkdtempSync(join(tmpdir(), "fw-re-"));
  const dest = openDestination(destRoot);
  writeFrameworks({
    srcRoot,
    dest,
    profileName: "demo",
    names: ["hivemind"],
  });
  const leftover = join(
    destRoot,
    ".pi",
    "frameworks",
    "hivemind",
    "src",
    "old.ts",
  );
  writeFileSync(leftover, "stale\n");
  writeFileSync(
    join(srcRoot, "frameworks", "hivemind", "src", "cli.ts"),
    "export const n = 1;\n",
  );
  writeFrameworks({
    srcRoot,
    dest,
    profileName: "demo",
    names: ["hivemind"],
  });
  assert.equal(existsSync(leftover), false);
  assert.equal(
    readFileSync(
      join(destRoot, ".pi", "frameworks", "hivemind", "src", "cli.ts"),
      "utf8",
    ),
    "export const n = 1;\n",
  );
});

test("listFrameworks requires package.json", () => {
  const srcRoot = tempSrc();
  writeFrameworkTree(srcRoot, "hivemind");
  mkdirSync(join(srcRoot, "frameworks", "empty"));
  assert.deepEqual(listFrameworks(srcRoot), ["hivemind"]);
});
