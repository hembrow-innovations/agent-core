import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { catalogFromSource, planFromProfile } from "./plan.ts";
import { loadProfile } from "./profile.ts";

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

test("usage names pnpm exec agentic-core install and OpenCode dest", () => {
  const r = runCli(["--help"]);
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.match(r.stdout, /pnpm exec agentic-core install <target>/);
  assert.doesNotMatch(r.stdout, /curl/);
  assert.doesNotMatch(r.stdout, /scripts\/install\.mjs/);
  assert.doesNotMatch(r.stdout, /--local/);
  assert.doesNotMatch(r.stdout, /--ref/);
  assert.doesNotMatch(r.stdout, /--harness/);
  assert.doesNotMatch(r.stdout, /--extension/);
  assert.doesNotMatch(r.stdout, /--playbooks/);
  assert.match(r.stdout, /Dest is always \.opencode\//);
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

  const playbooks = runCli(["install", dest, "--playbooks", "feature"]);
  assert.notEqual(playbooks.status, 0);
  assert.match(playbooks.stderr, /Unknown flag: --playbooks/);

  const extension = runCli(["install", dest, "--extension", "heio-boot"]);
  assert.notEqual(extension.status, 0);
  assert.match(extension.stderr, /Unknown flag: --extension/);
});

test("install --profile agentic-core writes .opencode skills, agents, and commands", () => {
  const dest = mkdtempSync(join(tmpdir(), "installer-opencode-"));
  const r = runCli(["install", dest, "--profile", "agentic-core"]);
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.match(r.stdout, /Profile: agentic-core/);
  assert.doesNotMatch(r.stdout, /Harness:/);
  assert.match(r.stdout, /Dest is \.opencode\//);
  assert.match(r.stdout, /Restart OpenCode/);

  const profile = loadProfile(REPO, "agentic-core");
  const plan = planFromProfile(
    profile,
    {
      kind: "install",
      target: dest,
      profile: "agentic-core",
      with: [],
      without: [],
    },
    catalogFromSource(REPO),
  );
  const skillRoot = join(dest, ".opencode", "skills");
  const folders = readdirSync(skillRoot).sort();
  assert.deepEqual(folders, plan.skills);
  for (const name of folders) {
    assert.equal(existsSync(join(skillRoot, name, "SKILL.md")), true);
  }
  if (folders.includes("oracle")) {
    assert.equal(
      existsSync(join(skillRoot, "oracle", "scripts", "oracle-check.mjs")),
      true,
    );
  }
  assert.equal(existsSync(join(dest, ".opencode", "playbooks")), false);
  assert.equal(existsSync(join(dest, ".pi")), false);
  assert.equal(existsSync(join(dest, ".opencode", "APPEND_SYSTEM.md")), false);
  assert.equal(existsSync(join(dest, ".opencode", "settings.json")), false);
  assert.equal(
    existsSync(join(dest, ".opencode", "npm", "local", "@agentic-core")),
    false,
  );
  assert.equal(existsSync(join(dest, ".claude")), false);
  assertNoCheckoutPath(dest);
});

test("install --profile agentic-core removes leftover Pi dest files", () => {
  const dest = mkdtempSync(join(tmpdir(), "installer-pi-stale-"));
  mkdirSync(join(dest, ".pi", "extensions"), { recursive: true });
  mkdirSync(join(dest, ".pi", "lib"), { recursive: true });
  mkdirSync(join(dest, ".pi", "roles"), { recursive: true });
  writeFileSync(join(dest, ".pi", "extensions", "heio-boot.ts"), "old\n");
  writeFileSync(join(dest, ".pi", "lib", "old.ts"), "old\n");
  writeFileSync(join(dest, ".pi", "roles", "architect.md"), "old role\n");
  mkdirSync(
    join(dest, ".pi", "npm", "local", "@agentic-core", "heio-boot", "src"),
    { recursive: true },
  );
  writeFileSync(
    join(dest, ".pi", "npm", "local", "@agentic-core", "heio-boot", "src", "index.ts"),
    "old\n",
  );
  const r = runCli(["install", dest, "--profile", "agentic-core"]);
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.equal(existsSync(join(dest, ".pi", "extensions")), false);
  assert.equal(existsSync(join(dest, ".pi", "lib")), false);
  assert.equal(existsSync(join(dest, ".pi", "roles")), false);
  assert.equal(
    existsSync(join(dest, ".pi", "npm", "local", "@agentic-core", "heio-boot")),
    false,
  );
  assert.equal(
    existsSync(join(dest, ".opencode", "agents", "heio-builder.md")),
    true,
  );
});

test("install --profile heio-stack copies the named stack unit", () => {
  const dest = mkdtempSync(join(tmpdir(), "installer-stack-"));
  const r = runCli(["install", dest, "--profile", "heio-stack"]);
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.match(r.stdout, /Stacks \(1\): heio-stack/);
  assert.equal(
    existsSync(join(dest, ".opencode", "skills", "heio-stack", "SKILL.md")),
    true,
  );
  assert.equal(
    existsSync(join(dest, ".opencode", "agents", "heio-builder.md")),
    true,
  );
  assert.equal(
    existsSync(join(dest, ".opencode", "commands", "heio-slice.md")),
    true,
  );
});

test("install --profile agentic-core does not wire this checkout", () => {
  const dest = mkdtempSync(join(tmpdir(), "installer-core-"));
  const checkoutSettingsPath = join(REPO, ".pi", "settings.json");
  const before = existsSync(checkoutSettingsPath)
    ? readFileSync(checkoutSettingsPath, "utf8")
    : null;

  const r = runCli(["install", dest, "--profile", "agentic-core"]);
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.match(r.stdout, /Profile: agentic-core/);

  const skillRoot = join(dest, ".opencode", "skills");
  const folders = readdirSync(skillRoot);
  assert.ok(folders.includes("heio-stack"), folders.join(", "));
  assert.equal(existsSync(join(skillRoot, "heio-stack", "SKILL.md")), true);
  assert.equal(folders.includes("how"), true, folders.join(", "));
  assert.equal(folders.includes("why"), true, folders.join(", "));
  assert.equal(folders.includes("unslop"), false, folders.join(", "));
  assert.equal(folders.includes("agent-teams"), false, folders.join(", "));

  const after = existsSync(checkoutSettingsPath)
    ? readFileSync(checkoutSettingsPath, "utf8")
    : null;
  assert.equal(after, before);
});

test("install --profile agentic-core keeps dest extras and updates listed files", () => {
  const dest = mkdtempSync(join(tmpdir(), "installer-keep-extras-"));
  const first = runCli(["install", dest, "--profile", "agentic-core"]);
  assert.equal(first.status, 0, first.stderr || first.stdout);

  const extraSkill = join(dest, ".opencode", "skills", "extra-skill");
  mkdirSync(extraSkill, { recursive: true });
  writeFileSync(join(extraSkill, "SKILL.md"), "# extra skill\n");
  writeFileSync(
    join(dest, ".opencode", "agents", "extra-agent.md"),
    "# extra agent\n",
  );
  mkdirSync(join(dest, ".opencode", "playbooks"), { recursive: true });
  writeFileSync(
    join(dest, ".opencode", "playbooks", "extra-playbook.md"),
    "# extra playbook\n",
  );
  writeFileSync(
    join(dest, ".opencode", "commands", "extra-prompt.md"),
    "# extra prompt\n",
  );

  writeFileSync(
    join(dest, ".opencode", "agents", "heio-builder.md"),
    "STALE AGENT\n",
  );
  writeFileSync(
    join(dest, ".opencode", "skills", "heio-stack", "SKILL.md"),
    "STALE SKILL\n",
  );
  writeFileSync(
    join(dest, ".opencode", "commands", "heio-slice.md"),
    "STALE PROMPT\n",
  );

  const second = runCli(["install", dest, "--profile", "agentic-core"]);
  assert.equal(second.status, 0, second.stderr || second.stdout);

  assert.equal(
    readFileSync(join(extraSkill, "SKILL.md"), "utf8"),
    "# extra skill\n",
  );
  assert.equal(
    readFileSync(join(dest, ".opencode", "agents", "extra-agent.md"), "utf8"),
    "# extra agent\n",
  );
  assert.equal(
    readFileSync(
      join(dest, ".opencode", "playbooks", "extra-playbook.md"),
      "utf8",
    ),
    "# extra playbook\n",
  );
  assert.equal(
    readFileSync(join(dest, ".opencode", "commands", "extra-prompt.md"), "utf8"),
    "# extra prompt\n",
  );

  assert.equal(
    readFileSync(join(dest, ".opencode", "agents", "heio-builder.md"), "utf8"),
    readFileSync(
      join(REPO, "stacks", "heio-stack", "agents", "heio-builder", "heio-builder.md"),
      "utf8",
    ),
  );
  assert.equal(
    readFileSync(
      join(dest, ".opencode", "skills", "heio-stack", "SKILL.md"),
      "utf8",
    ),
    readFileSync(
      join(REPO, "stacks", "heio-stack", "skills", "heio-stack", "SKILL.md"),
      "utf8",
    ),
  );
  assert.equal(
    readFileSync(join(dest, ".opencode", "commands", "heio-slice.md"), "utf8"),
    readFileSync(
      join(REPO, "stacks", "heio-stack", "prompts", "heio-slice.md"),
      "utf8",
    ),
  );
});

function destFiles(root: string): string[] {
  if (!existsSync(root)) return [];
  if (statSync(root).isFile()) return [root];
  const out: string[] = [];
  for (const name of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, name.name);
    if (name.isDirectory()) out.push(...destFiles(path));
    else if (name.isFile()) out.push(path);
  }
  return out;
}

function assertNoCheckoutPath(root: string): void {
  const checkout = resolve(REPO);
  for (const file of destFiles(root)) {
    assert.doesNotMatch(
      readFileSync(file, "utf8"),
      new RegExp(checkout.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      file,
    );
  }
}
