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
import { parseProfilePackage } from "./extensions.ts";
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

test("usage names pnpm exec agentic-core install and drops curl", () => {
  const r = runCli(["--help"]);
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.match(r.stdout, /pnpm exec agentic-core install <target>/);
  assert.doesNotMatch(r.stdout, /curl/);
  assert.doesNotMatch(r.stdout, /scripts\/install\.mjs/);
  assert.doesNotMatch(r.stdout, /--local/);
  assert.doesNotMatch(r.stdout, /--ref/);
  assert.doesNotMatch(r.stdout, /--harness/);
  assert.doesNotMatch(r.stdout, /--playbooks/);
  assert.doesNotMatch(r.stdout, /--with-playbooks/);
  assert.doesNotMatch(r.stdout, /--without-playbooks/);
  assert.match(r.stdout, /Dest is always \.pi\//);
});

test("unknown command, remote flags, and unknown --extension die", () => {
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

  const extension = runCli(["install", dest, "--extension", "not-a-package"]);
  assert.notEqual(extension.status, 0);
  assert.match(extension.stderr, /Unknown extension: not-a-package/);
});

test("install --profile agentic-core writes skills, pack files, and third-party npm sources", () => {
  const dest = mkdtempSync(join(tmpdir(), "installer-pi-"));
  const r = runCli(["install", dest, "--profile", "agentic-core"]);
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.match(r.stdout, /Profile: agentic-core/);
  assert.doesNotMatch(r.stdout, /Harness:/);

  const skillRoot = join(dest, ".pi", "skills");
  const folders = readdirSync(skillRoot);
  assert.equal(folders.includes("heio-mode"), false, folders.join(", "));
  assert.equal(folders.includes("how"), false, folders.join(", "));
  assert.equal(folders.includes("why"), false, folders.join(", "));
  assert.equal(folders.includes("unslop"), false, folders.join(", "));
  for (const name of [
    "docs",
    "domain-modeling",
    "handoff",
    "management",
    "planning",
    "planning-with-docs",
    "planning-arena",
    "to-issues",
    "triage",
    "wayfinder",
    "create-verification-skill",
    "oracle",
  ]) {
    assert.ok(folders.includes(name), folders.join(", "));
    assert.equal(existsSync(join(skillRoot, name, "SKILL.md")), true);
  }
  assert.equal(
    existsSync(join(skillRoot, "oracle", "scripts", "oracle-check.mjs")),
    true,
  );
  assert.equal(existsSync(join(dest, ".pi", "agents", "architect.md")), true);
  assert.equal(existsSync(join(dest, ".pi", "prompts", "arena.md")), true);
  assert.equal(existsSync(join(dest, ".pi", "playbooks")), false);
  const settings = JSON.parse(
    readFileSync(join(dest, ".pi", "settings.json"), "utf8"),
  );
  assert.equal(settings.toolDescriptionMode, "compact");
  assert.deepEqual(settings.defaultTools, [
    "read",
    "bash",
    "edit",
    "write",
    "ls",
  ]);
  assert.equal(existsSync(join(dest, ".pi", "APPEND_SYSTEM.md")), true);
  assert.equal(existsSync(join(dest, ".pi", "roles")), false);
  assert.deepEqual(
    JSON.parse(readFileSync(join(dest, ".pi", "settings.json"), "utf8"))
      .packages,
    [
      "npm:pi-lens",
      "npm:pi-web-access",
      "npm:pi-subagents",
      "npm:@ff-labs/pi-fff",
      "npm/node_modules/@agentic-core/heio-todo",
      "npm/node_modules/@agentic-core/heio-coms",
      "npm/node_modules/@agentic-core/heio-boot",
      "npm/node_modules/@agentic-core/heio-teams",
      "npm/node_modules/@agentic-core/heio-footer",
    ],
  );
  const npmRoot = join(dest, ".pi", "npm", "node_modules", "@agentic-core");
  assert.deepEqual(readdirSync(npmRoot).sort(), [
    "heio-boot",
    "heio-coms",
    "heio-footer",
    "heio-teams",
    "heio-todo",
  ]);
  assert.equal(existsSync(join(npmRoot, "heio-todo", "src", "index.ts")), true);
  assert.equal(existsSync(join(npmRoot, "heio-coms", "src", "index.ts")), true);
  assert.equal(existsSync(join(npmRoot, "heio-boot", "src", "index.ts")), true);
  assert.equal(
    existsSync(join(npmRoot, "heio-teams", "src", "index.ts")),
    true,
  );
  assert.equal(
    existsSync(join(npmRoot, "heio-footer", "src", "index.ts")),
    true,
  );
  assert.equal(existsSync(join(npmRoot, "lib")), false);
  assert.doesNotMatch(
    JSON.stringify(
      JSON.parse(readFileSync(join(dest, ".pi", "settings.json"), "utf8"))
        .packages,
    ),
    /npm:@agentic-core\//,
  );
  assert.equal(existsSync(join(dest, ".opencode")), false);
  assertNoCheckoutPath(dest);
});

test("install --profile agentic-core removes leftover dest extension files", () => {
  const dest = mkdtempSync(join(tmpdir(), "installer-pi-stale-"));
  mkdirSync(join(dest, ".pi", "extensions"), { recursive: true });
  mkdirSync(join(dest, ".pi", "lib"), { recursive: true });
  mkdirSync(join(dest, ".pi", "roles"), { recursive: true });
  writeFileSync(join(dest, ".pi", "extensions", "heio-boot.ts"), "old\n");
  writeFileSync(join(dest, ".pi", "lib", "old.ts"), "old\n");
  writeFileSync(join(dest, ".pi", "roles", "architect.md"), "old role\n");
  const r = runCli(["install", dest, "--profile", "agentic-core"]);
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.equal(existsSync(join(dest, ".pi", "extensions")), false);
  assert.equal(existsSync(join(dest, ".pi", "lib")), false);
  assert.equal(existsSync(join(dest, ".pi", "roles")), false);
  assert.equal(existsSync(join(dest, ".pi", "agents", "architect.md")), true);
});

test("install --profile agentic-core writes .pi/skills and does not wire this checkout", () => {
  const dest = mkdtempSync(join(tmpdir(), "installer-core-"));
  const checkoutSettingsPath = join(REPO, ".pi", "settings.json");
  const before = existsSync(checkoutSettingsPath)
    ? readFileSync(checkoutSettingsPath, "utf8")
    : null;

  const r = runCli(["install", dest, "--profile", "agentic-core"]);
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.match(r.stdout, /Profile: agentic-core/);
  assert.doesNotMatch(r.stdout, /Harness:/);

  const skillRoot = join(dest, ".pi", "skills");
  const folders = readdirSync(skillRoot);
  assert.ok(folders.includes("create-skill"), folders.join(", "));
  assert.equal(existsSync(join(skillRoot, "create-skill", "SKILL.md")), true);
  assert.equal(folders.includes("how"), false, folders.join(", "));
  assert.equal(folders.includes("unslop"), false, folders.join(", "));
  assert.equal(existsSync(join(dest, ".pi", "APPEND_SYSTEM.md")), true);
  assert.equal(existsSync(join(dest, ".opencode")), false);
  assert.equal(
    existsSync(
      join(dest, ".pi", "npm", "node_modules", "@agentic-core", "heio-todo"),
    ),
    true,
  );

  const after = existsSync(checkoutSettingsPath)
    ? readFileSync(checkoutSettingsPath, "utf8")
    : null;
  assert.equal(after, before);
  if (after) {
    assert.doesNotMatch(
      after,
      /packages\/(?:lib|heio-todo|heio-coms|heio-boot|heio-teams|heio-footer)/,
    );
  }
});

test("install --profile agentic-core keeps dest extras and updates listed files", () => {
  const dest = mkdtempSync(join(tmpdir(), "installer-keep-extras-"));
  const first = runCli(["install", dest, "--profile", "agentic-core"]);
  assert.equal(first.status, 0, first.stderr || first.stdout);

  const extraSkill = join(dest, ".pi", "skills", "extra-skill");
  mkdirSync(extraSkill, { recursive: true });
  writeFileSync(join(extraSkill, "SKILL.md"), "# extra skill\n");
  writeFileSync(
    join(dest, ".pi", "agents", "extra-agent.md"),
    "# extra agent\n",
  );
  mkdirSync(join(dest, ".pi", "playbooks"), { recursive: true });
  writeFileSync(
    join(dest, ".pi", "playbooks", "extra-playbook.md"),
    "# extra playbook\n",
  );
  writeFileSync(
    join(dest, ".pi", "prompts", "extra-prompt.md"),
    "# extra prompt\n",
  );

  const settingsPath = join(dest, ".pi", "settings.json");
  const settings = JSON.parse(readFileSync(settingsPath, "utf8")) as {
    packages: string[];
    defaultTools?: string[];
    keep?: string;
  };
  settings.packages.push("npm:extra-survives");
  settings.keep = "dest-only";
  settings.defaultTools = ["custom", ...(settings.defaultTools ?? [])];
  writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);

  writeFileSync(join(dest, ".pi", "agents", "architect.md"), "STALE AGENT\n");
  writeFileSync(
    join(dest, ".pi", "skills", "create-skill", "SKILL.md"),
    "STALE SKILL\n",
  );
  writeFileSync(join(dest, ".pi", "prompts", "arena.md"), "STALE PROMPT\n");

  const second = runCli(["install", dest, "--profile", "agentic-core"]);
  assert.equal(second.status, 0, second.stderr || second.stdout);

  assert.equal(
    readFileSync(join(extraSkill, "SKILL.md"), "utf8"),
    "# extra skill\n",
  );
  assert.equal(
    readFileSync(join(dest, ".pi", "agents", "extra-agent.md"), "utf8"),
    "# extra agent\n",
  );
  assert.equal(
    readFileSync(join(dest, ".pi", "playbooks", "extra-playbook.md"), "utf8"),
    "# extra playbook\n",
  );
  assert.equal(
    readFileSync(join(dest, ".pi", "prompts", "extra-prompt.md"), "utf8"),
    "# extra prompt\n",
  );
  const afterSettings = JSON.parse(readFileSync(settingsPath, "utf8")) as {
    packages: string[];
    defaultTools: string[];
    keep: string;
    toolDescriptionMode: string;
  };
  assert.ok(
    afterSettings.packages.includes("npm:extra-survives"),
    afterSettings.packages.join(", "),
  );
  assert.equal(afterSettings.keep, "dest-only");
  assert.equal(afterSettings.toolDescriptionMode, "compact");
  assert.deepEqual(afterSettings.defaultTools, [
    "custom",
    "read",
    "bash",
    "edit",
    "write",
    "ls",
  ]);

  assert.equal(
    readFileSync(join(dest, ".pi", "agents", "architect.md"), "utf8"),
    readFileSync(
      join(REPO, "ai", "agents", "architect", "architect.md"),
      "utf8",
    ),
  );
  assert.equal(
    readFileSync(
      join(dest, ".pi", "skills", "create-skill", "SKILL.md"),
      "utf8",
    ),
    readFileSync(
      join(REPO, "ai", "skills", "engineering", "create-skill", "SKILL.md"),
      "utf8",
    ),
  );
  assert.equal(
    readFileSync(join(dest, ".pi", "prompts", "arena.md"), "utf8"),
    readFileSync(join(REPO, "ai", "prompts", "arena.md"), "utf8"),
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

test("install --extension heio-todo writes a dest-relative npm package", () => {
  const dest = mkdtempSync(join(tmpdir(), "installer-ext-"));
  const r = runCli(["install", dest, "--extension", "heio-todo"]);
  assert.equal(r.status, 0, r.stderr || r.stdout);

  const npmRoot = join(dest, ".pi", "npm", "node_modules", "@agentic-core");
  const local = join(npmRoot, "heio-todo");
  assert.equal(existsSync(local), true);
  assert.deepEqual(readdirSync(npmRoot), ["heio-todo"]);
  assert.equal(existsSync(join(dest, ".pi", "skills")), false);
  assert.equal(existsSync(join(npmRoot, "lib")), false);
  assert.equal(existsSync(join(local, "src", "lib")), false);
  assert.equal(existsSync(join(local, "src", "store.ts")), true);
  assert.equal(existsSync(join(local, "src", "index.test.ts")), false);

  const index = readFileSync(join(local, "src", "index.ts"), "utf8");
  assert.match(index, /from "\.\/store\.ts"/);
  assert.doesNotMatch(index, /@agentic-core\/lib/);

  const pkg = JSON.parse(readFileSync(join(local, "package.json"), "utf8")) as {
    dependencies?: Record<string, string>;
  };
  assert.equal(pkg.dependencies?.["@agentic-core/lib"], undefined);

  const settings = JSON.parse(
    readFileSync(join(dest, ".pi", "settings.json"), "utf8"),
  ) as { packages?: unknown };
  assert.ok(Array.isArray(settings.packages), "settings.packages");
  assert.deepEqual(settings.packages, [
    "npm/node_modules/@agentic-core/heio-todo",
  ]);

  const gitignore = readFileSync(join(dest, ".pi", ".gitignore"), "utf8");
  assert.equal(gitignore, "npm/\ngit/\n");
  assert.doesNotMatch(gitignore, /vendor/);

  assertNoCheckoutPath(dest);
});

test("install removes installer-owned vendor trees and keeps other dest extras", () => {
  const dest = mkdtempSync(join(tmpdir(), "installer-drop-vendor-"));
  const vendorTodo = join(dest, ".pi", "vendor", "@agentic-core", "heio-todo");
  mkdirSync(vendorTodo, { recursive: true });
  writeFileSync(join(vendorTodo, "old.ts"), "old vendor\n");
  mkdirSync(join(dest, ".pi", "vendor", "other-extra"), { recursive: true });
  writeFileSync(
    join(dest, ".pi", "vendor", "other-extra", "keep.txt"),
    "keep\n",
  );
  writeFileSync(
    join(dest, ".pi", "settings.json"),
    `${JSON.stringify(
      {
        packages: [
          "vendor/@agentic-core/heio-todo",
          "npm/node_modules/@agentic-core/heio-todo",
        ],
      },
      null,
      2,
    )}\n`,
  );

  const r = runCli(["install", dest, "--profile", "agentic-core"]);
  assert.equal(r.status, 0, r.stderr || r.stdout);

  assert.equal(existsSync(join(dest, ".pi", "vendor", "@agentic-core")), false);
  assert.equal(
    readFileSync(
      join(dest, ".pi", "vendor", "other-extra", "keep.txt"),
      "utf8",
    ),
    "keep\n",
  );
  assert.equal(
    existsSync(
      join(
        dest,
        ".pi",
        "npm",
        "node_modules",
        "@agentic-core",
        "heio-todo",
        "src",
        "index.ts",
      ),
    ),
    true,
  );
  const settings = JSON.parse(
    readFileSync(join(dest, ".pi", "settings.json"), "utf8"),
  ) as { packages: string[] };
  assert.ok(
    settings.packages.includes("npm/node_modules/@agentic-core/heio-todo"),
  );
  assert.equal(
    settings.packages.includes("vendor/@agentic-core/heio-todo"),
    false,
  );
  assert.doesNotMatch(JSON.stringify(settings.packages), /npm:@agentic-core\//);
});

test("install --extension can repeat and a second run overwrites the npm copy", () => {
  const dest = mkdtempSync(join(tmpdir(), "installer-ext-repeat-"));
  const first = runCli([
    "install",
    dest,
    "--extension",
    "heio-todo",
    "--extension",
    "heio-boot",
  ]);
  assert.equal(first.status, 0, first.stderr || first.stdout);

  const todo = join(
    dest,
    ".pi",
    "npm",
    "node_modules",
    "@agentic-core",
    "heio-todo",
  );
  const boot = join(
    dest,
    ".pi",
    "npm",
    "node_modules",
    "@agentic-core",
    "heio-boot",
  );
  assert.equal(existsSync(todo), true);
  assert.equal(existsSync(boot), true);
  assert.equal(
    existsSync(
      join(dest, ".pi", "npm", "node_modules", "@agentic-core", "lib"),
    ),
    false,
  );

  const leftover = join(todo, "leftover.txt");
  writeFileSync(leftover, "stale\n", "utf8");
  const second = runCli(["install", dest, "--extension", "heio-todo"]);
  assert.equal(second.status, 0, second.stderr || second.stdout);
  assert.equal(existsSync(leftover), false);
  assert.equal(existsSync(join(todo, "src", "index.ts")), true);

  const settings = JSON.parse(
    readFileSync(join(dest, ".pi", "settings.json"), "utf8"),
  ) as { packages?: unknown };
  assert.deepEqual(settings.packages, [
    "npm/node_modules/@agentic-core/heio-todo",
    "npm/node_modules/@agentic-core/heio-boot",
  ]);
  assertNoCheckoutPath(dest);
});

test("parseProfilePackage accepts local:@agentic-core/heio-todo", () => {
  assert.deepEqual(parseProfilePackage("local:@agentic-core/heio-todo"), {
    kind: "local",
    name: "heio-todo",
  });
});

test("parseProfilePackage and loadProfile reject vendor: and vendor/ sources", () => {
  assert.throws(
    () => parseProfilePackage("vendor:@agentic-core/heio-todo"),
    /vendor:@agentic-core\/heio-todo/,
  );
  assert.throws(
    () => parseProfilePackage("vendor/@agentic-core/heio-todo"),
    /vendor\/@agentic-core\/heio-todo/,
  );

  const srcRoot = mkdtempSync(join(tmpdir(), "installer-vendor-src-"));
  mkdirSync(join(srcRoot, "profiles"));
  writeFileSync(
    join(srcRoot, "profiles", "vendor-colon.yaml"),
    "packages:\n  - vendor:@agentic-core/heio-todo\n",
  );
  writeFileSync(
    join(srcRoot, "profiles", "vendor-slash.yaml"),
    "packages:\n  - vendor/@agentic-core/heio-todo\n",
  );
  assert.throws(
    () => loadProfile(srcRoot, "vendor-colon"),
    /vendor:@agentic-core\/heio-todo/,
  );
  assert.throws(
    () => loadProfile(srcRoot, "vendor-slash"),
    /vendor\/@agentic-core\/heio-todo/,
  );
});

test("parseProfilePackage and loadProfile reject unknown local names", () => {
  assert.throws(
    () => parseProfilePackage("local:@agentic-core/not-a-package"),
    /Unknown extension: not-a-package/,
  );

  const srcRoot = mkdtempSync(join(tmpdir(), "installer-profile-"));
  mkdirSync(join(srcRoot, "profiles"));
  writeFileSync(
    join(srcRoot, "profiles", "bad.yaml"),
    "packages:\n  - local:@agentic-core/not-a-package\n",
  );
  assert.throws(
    () => loadProfile(srcRoot, "bad"),
    /Unknown extension: not-a-package/,
  );
});
