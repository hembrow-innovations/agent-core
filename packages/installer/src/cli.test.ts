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
  assert.equal(folders.includes("draconic-mode"), false, folders.join(", "));
  assert.ok(folders.includes("how"), folders.join(", "));
  assert.ok(folders.includes("playbooks"), folders.join(", "));
  assert.equal(existsSync(join(dest, ".pi", "playbooks", "feature.md")), true);
  assert.equal(existsSync(join(dest, ".pi", "agents", "architect.md")), true);
  assert.equal(existsSync(join(dest, ".pi", "prompts", "arena.md")), true);
  assert.equal(existsSync(join(dest, ".pi", "APPEND_SYSTEM.md")), true);
  assert.equal(existsSync(join(dest, ".pi", "roles", "researcher.md")), true);
  assert.deepEqual(
    JSON.parse(readFileSync(join(dest, ".pi", "settings.json"), "utf8"))
      .packages,
    [
      "npm:pi-lens",
      "npm:pi-web-access",
      "npm:pi-subagents",
      "npm:@ff-labs/pi-fff",
      "vendor/@agentic-core/draconic-todo",
      "vendor/@agentic-core/draconic-coms",
      "vendor/@agentic-core/draconic-boot",
      "vendor/@agentic-core/draconic-teams",
    ],
  );
  const vendorRoot = join(dest, ".pi", "vendor", "@agentic-core");
  assert.deepEqual(readdirSync(vendorRoot).sort(), [
    "draconic-boot",
    "draconic-coms",
    "draconic-teams",
    "draconic-todo",
  ]);
  assert.equal(
    existsSync(join(vendorRoot, "draconic-todo", "src", "index.ts")),
    true,
  );
  assert.equal(
    existsSync(join(vendorRoot, "draconic-coms", "src", "index.ts")),
    true,
  );
  assert.equal(
    existsSync(join(vendorRoot, "draconic-boot", "src", "index.ts")),
    true,
  );
  assert.equal(
    existsSync(join(vendorRoot, "draconic-teams", "src", "index.ts")),
    true,
  );
  assert.equal(existsSync(join(vendorRoot, "lib")), false);
  assert.equal(existsSync(join(dest, ".opencode")), false);
  assertNoCheckoutPath(dest);
});

test("install --profile agentic-core removes leftover dest extension files", () => {
  const dest = mkdtempSync(join(tmpdir(), "installer-pi-stale-"));
  mkdirSync(join(dest, ".pi", "extensions"), { recursive: true });
  mkdirSync(join(dest, ".pi", "lib"), { recursive: true });
  writeFileSync(join(dest, ".pi", "extensions", "draconic-boot.ts"), "old\n");
  writeFileSync(join(dest, ".pi", "lib", "old.ts"), "old\n");
  const r = runCli(["install", dest, "--profile", "agentic-core"]);
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.equal(existsSync(join(dest, ".pi", "extensions")), false);
  assert.equal(existsSync(join(dest, ".pi", "lib")), false);
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
  assert.ok(folders.includes("unslop"), folders.join(", "));
  assert.equal(existsSync(join(skillRoot, "unslop", "SKILL.md")), true);
  assert.equal(existsSync(join(dest, ".pi", "playbooks", "feature.md")), true);
  assert.equal(existsSync(join(dest, ".pi", "APPEND_SYSTEM.md")), true);
  assert.equal(existsSync(join(dest, ".opencode")), false);
  assert.equal(
    existsSync(join(dest, ".pi", "vendor", "@agentic-core", "draconic-todo")),
    true,
  );

  const after = existsSync(checkoutSettingsPath)
    ? readFileSync(checkoutSettingsPath, "utf8")
    : null;
  assert.equal(after, before);
  if (after) {
    assert.doesNotMatch(
      after,
      /packages\/(?:lib|draconic-todo|draconic-coms|draconic-boot|draconic-teams)/,
    );
  }
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

test("install --extension draconic-todo vendors a dest-relative package", () => {
  const dest = mkdtempSync(join(tmpdir(), "installer-ext-"));
  const r = runCli(["install", dest, "--extension", "draconic-todo"]);
  assert.equal(r.status, 0, r.stderr || r.stdout);

  const vendorRoot = join(dest, ".pi", "vendor", "@agentic-core");
  const vendor = join(vendorRoot, "draconic-todo");
  assert.equal(existsSync(vendor), true);
  assert.deepEqual(readdirSync(vendorRoot), ["draconic-todo"]);
  assert.equal(existsSync(join(dest, ".pi", "skills")), false);
  assert.equal(existsSync(join(vendorRoot, "lib")), false);
  assert.equal(existsSync(join(vendor, "src", "lib")), false);
  assert.equal(existsSync(join(vendor, "src", "store.ts")), true);

  const index = readFileSync(join(vendor, "src", "index.ts"), "utf8");
  assert.match(index, /from "\.\/store\.ts"/);
  assert.doesNotMatch(index, /@agentic-core\/lib/);

  const pkg = JSON.parse(
    readFileSync(join(vendor, "package.json"), "utf8"),
  ) as {
    dependencies?: Record<string, string>;
  };
  assert.equal(pkg.dependencies?.["@agentic-core/lib"], undefined);

  const settings = JSON.parse(
    readFileSync(join(dest, ".pi", "settings.json"), "utf8"),
  ) as { packages?: unknown };
  assert.ok(Array.isArray(settings.packages), "settings.packages");
  assert.deepEqual(settings.packages, ["vendor/@agentic-core/draconic-todo"]);

  const gitignore = readFileSync(join(dest, ".pi", ".gitignore"), "utf8");
  assert.equal(gitignore, "npm/\ngit/\n");
  assert.doesNotMatch(gitignore, /vendor/);

  assertNoCheckoutPath(dest);
});

test("install rewrites stale .pi/vendor package sources to vendor/", () => {
  const dest = mkdtempSync(join(tmpdir(), "installer-vendor-migrate-"));
  mkdirSync(join(dest, ".pi"), { recursive: true });
  writeFileSync(
    join(dest, ".pi", "settings.json"),
    `${JSON.stringify(
      {
        packages: [
          ".pi/vendor/@agentic-core/draconic-todo",
          "vendor/@agentic-core/draconic-todo",
        ],
      },
      null,
      2,
    )}\n`,
  );
  const r = runCli(["install", dest, "--extension", "draconic-todo"]);
  assert.equal(r.status, 0, r.stderr || r.stdout);
  const settings = JSON.parse(
    readFileSync(join(dest, ".pi", "settings.json"), "utf8"),
  ) as { packages?: unknown };
  assert.deepEqual(settings.packages, ["vendor/@agentic-core/draconic-todo"]);
});

test("install --extension can repeat and a second run overwrites vendor", () => {
  const dest = mkdtempSync(join(tmpdir(), "installer-ext-repeat-"));
  const first = runCli([
    "install",
    dest,
    "--extension",
    "draconic-todo",
    "--extension",
    "draconic-boot",
  ]);
  assert.equal(first.status, 0, first.stderr || first.stdout);

  const todo = join(dest, ".pi", "vendor", "@agentic-core", "draconic-todo");
  const boot = join(dest, ".pi", "vendor", "@agentic-core", "draconic-boot");
  assert.equal(existsSync(todo), true);
  assert.equal(existsSync(boot), true);
  assert.equal(
    existsSync(join(dest, ".pi", "vendor", "@agentic-core", "lib")),
    false,
  );

  const leftover = join(todo, "leftover.txt");
  writeFileSync(leftover, "stale\n", "utf8");
  const second = runCli(["install", dest, "--extension", "draconic-todo"]);
  assert.equal(second.status, 0, second.stderr || second.stdout);
  assert.equal(existsSync(leftover), false);
  assert.equal(existsSync(join(todo, "src", "index.ts")), true);

  const settings = JSON.parse(
    readFileSync(join(dest, ".pi", "settings.json"), "utf8"),
  ) as { packages?: unknown };
  assert.deepEqual(settings.packages, [
    "vendor/@agentic-core/draconic-todo",
    "vendor/@agentic-core/draconic-boot",
  ]);
  assertNoCheckoutPath(dest);
});
