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
import { planFromProfile, type InstallRequest } from "./plan.ts";
import { listProfiles, loadProfile, type Profile } from "./profile.ts";
import { listSystemPromptStems, writeRuntime } from "./runtime.ts";

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

function planProfile(over: Partial<Profile> = {}): Profile {
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

function planRequest(): InstallRequest {
  return {
    kind: "install",
    target: "/tmp",
    profile: "demo",
    with: [],
    without: [],
    extensions: [],
  };
}

test("planFromProfile rejects unknown system-prompt stems", () => {
  assert.throws(
    () =>
      planFromProfile(planProfile({ "system-prompt": "nope" }), planRequest(), {
        agents: [],
        prompts: [],
        frameworks: [],
        systemPrompts: ["default"],
      }),
    /Unknown system-prompt "nope"/,
  );
});

test("planFromProfile rejects a system-prompt stem with no ai/system-prompts markdown", () => {
  const root = tempRoot();
  mkdirSync(join(root, "ai", "system-prompts"), { recursive: true });
  writeFileSync(join(root, "ai", "system-prompts", "default.md"), "boot\n");
  assert.throws(
    () =>
      planFromProfile(
        planProfile({ "system-prompt": "persona" }),
        planRequest(),
        {
          agents: [],
          prompts: [],
          frameworks: [],
          systemPrompts: listSystemPromptStems(root),
        },
      ),
    /Unknown system-prompt "persona"/,
  );
});

test("planFromProfile allows omitting system-prompt", () => {
  assert.doesNotThrow(() =>
    planFromProfile(planProfile(), planRequest(), {
      agents: [],
      prompts: [],
      frameworks: [],
      systemPrompts: [],
    }),
  );
});

test("listSystemPromptStems lists markdown stems and ignores other files", () => {
  const root = tempRoot();
  writeSystemPrompts(root, {
    "persona.md": "hello\n",
    "packages.json": "[]\n",
  });
  assert.deepEqual(listSystemPromptStems(root), ["default", "persona"]);
});

test("planFromProfile accepts a system-prompt stem that has ai/system-prompts markdown", () => {
  const root = tempRoot();
  mkdirSync(join(root, "ai", "system-prompts"), { recursive: true });
  writeFileSync(join(root, "ai", "system-prompts", "persona.md"), "hello\n");
  const plan = planFromProfile(
    planProfile({ "system-prompt": "persona" }),
    planRequest(),
    {
      agents: [],
      prompts: [],
      frameworks: [],
      systemPrompts: listSystemPromptStems(root),
    },
  );
  assert.equal(plan.systemPrompt, "persona");
});

test("planFromProfile omits systemPrompt when the profile key is absent", () => {
  const plan = planFromProfile(planProfile(), planRequest(), {
    agents: [],
    prompts: [],
    frameworks: [],
    systemPrompts: [],
  });
  assert.equal("systemPrompt" in plan, false);
});

function writeSystemPrompts(
  root: string,
  files: Record<string, string> = {},
): void {
  mkdirSync(join(root, "ai", "system-prompts"), { recursive: true });
  writeFileSync(join(root, "ai", "system-prompts", "default.md"), "boot\n");
  for (const [name, body] of Object.entries(files)) {
    writeFileSync(join(root, "ai", "system-prompts", name), body);
  }
}

test("writeRuntime copies selected system-prompt markdown when dest APPEND_SYSTEM.md is missing", () => {
  const root = tempRoot();
  writeSystemPrompts(root, { "persona.md": "persona body\n" });
  const dest = mkdtempSync(join(tmpdir(), "rt-stem-"));
  writeRuntime(root, openDestination(dest), { systemPrompt: "persona" });
  assert.equal(
    readFileSync(join(dest, ".pi", "APPEND_SYSTEM.md"), "utf8"),
    "persona body\n",
  );
});

test("writeRuntime copies default.md when system-prompt is omitted", () => {
  const root = tempRoot();
  writeSystemPrompts(root, { "persona.md": "persona body\n" });
  const dest = mkdtempSync(join(tmpdir(), "rt-default-"));
  writeRuntime(root, openDestination(dest));
  assert.equal(
    readFileSync(join(dest, ".pi", "APPEND_SYSTEM.md"), "utf8"),
    "boot\n",
  );
});

test("writeRuntime keeps an existing dest APPEND_SYSTEM.md when a stem is selected", () => {
  const root = tempRoot();
  writeSystemPrompts(root, { "persona.md": "persona body\n" });
  const dest = mkdtempSync(join(tmpdir(), "rt-keep-"));
  mkdirSync(join(dest, ".pi"), { recursive: true });
  writeFileSync(join(dest, ".pi", "APPEND_SYSTEM.md"), "custom persona\n");
  writeRuntime(root, openDestination(dest), { systemPrompt: "persona" });
  assert.equal(
    readFileSync(join(dest, ".pi", "APPEND_SYSTEM.md"), "utf8"),
    "custom persona\n",
  );
});

test("writeRuntime replaces a legacy dest stub with the selected stem", () => {
  const root = tempRoot();
  writeSystemPrompts(root, { "persona.md": "persona body\n" });
  const dest = mkdtempSync(join(tmpdir(), "rt-legacy-"));
  mkdirSync(join(dest, ".pi"), { recursive: true });
  writeFileSync(
    join(dest, ".pi", "APPEND_SYSTEM.md"),
    "# Draconic\n\nYou are running draconic-mode on Pi for this project.\n",
  );
  writeRuntime(root, openDestination(dest), { systemPrompt: "persona" });
  assert.equal(
    readFileSync(join(dest, ".pi", "APPEND_SYSTEM.md"), "utf8"),
    "persona body\n",
  );
});

test("writeRuntime does not require pack heio-models.md and does not write dest", () => {
  const root = tempRoot();
  writeSystemPrompts(root);
  const dest = mkdtempSync(join(tmpdir(), "rt-no-models-"));
  writeRuntime(root, openDestination(dest));
  assert.equal(
    readFileSync(join(dest, ".pi", "APPEND_SYSTEM.md"), "utf8"),
    "boot\n",
  );
  assert.equal(existsSync(join(dest, ".pi", "heio-models.md")), false);
});

test("writeRuntime keeps an existing dest heio-models.md", () => {
  const root = tempRoot();
  writeSystemPrompts(root);
  const dest = mkdtempSync(join(tmpdir(), "rt-keep-models-"));
  mkdirSync(join(dest, ".pi"), { recursive: true });
  writeFileSync(join(dest, ".pi", "heio-models.md"), "picked\n");
  writeRuntime(root, openDestination(dest));
  assert.equal(
    readFileSync(join(dest, ".pi", "heio-models.md"), "utf8"),
    "picked\n",
  );
});
