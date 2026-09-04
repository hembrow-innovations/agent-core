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
import { packageRefSource, parseProfilePackage } from "./extensions.ts";
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

  const profile = loadProfile(REPO, "agentic-core");
  const skillRoot = join(dest, ".pi", "skills");
  const folders = readdirSync(skillRoot).sort();
  assert.deepEqual(folders, [...new Set(profile.skills)].sort());
  for (const name of folders) {
    assert.equal(existsSync(join(skillRoot, name, "SKILL.md")), true);
  }
  if (folders.includes("oracle")) {
    assert.equal(
      existsSync(join(skillRoot, "oracle", "scripts", "oracle-check.mjs")),
      true,
    );
  }
  assert.equal(existsSync(join(dest, ".pi", "playbooks")), false);
  const settings = JSON.parse(
    readFileSync(join(dest, ".pi", "settings.json"), "utf8"),
  );
  assert.deepEqual(settings, {
    packages: profile.packages.map(packageRefSource),
    ...profile.settings,
  });
  assert.equal(existsSync(join(dest, ".pi", "APPEND_SYSTEM.md")), true);
  assert.equal(existsSync(join(dest, ".pi", "roles")), false);
  const npmRoot = join(dest, ".pi", "npm", "local", "@agentic-core");
  assert.deepEqual(
    readdirSync(npmRoot).sort(),
    profile.packages
      .filter((pkg) => pkg.kind === "local")
      .map((pkg) => pkg.name)
      .sort(),
  );
  assert.equal(existsSync(join(npmRoot, "heio-todo")), false);
  assert.equal(existsSync(join(npmRoot, "heio-coms")), false);
  assert.equal(existsSync(join(npmRoot, "heio-boot", "src", "index.ts")), true);
  assert.equal(existsSync(join(npmRoot, "heio-teams")), false);
  assert.equal(
    existsSync(join(npmRoot, "heio-footer", "src", "index.ts")),
    true,
  );
  assert.equal(existsSync(join(npmRoot, "heio-coord")), false);
  assert.equal(existsSync(join(npmRoot, "heio-onic", "src", "index.ts")), true);
  assert.equal(existsSync(join(npmRoot, "lib")), false);
  assert.equal(
    existsSync(
      join(dest, ".pi", "npm", "node_modules", "@agentic-core", "heio-todo"),
    ),
    false,
  );
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
  assert.equal(
    existsSync(join(dest, ".pi", "agents", "heio-builder.md")),
    true,
  );
});

test("install --profile agentic-core removes parked heio-coms, heio-teams, and heio-coord dest copies", () => {
  const dest = mkdtempSync(join(tmpdir(), "installer-parked-"));
  const npmRoot = join(dest, ".pi", "npm", "node_modules", "@agentic-core");
  for (const name of ["heio-coms", "heio-teams", "heio-coord"]) {
    mkdirSync(join(npmRoot, name, "src"), { recursive: true });
    writeFileSync(join(npmRoot, name, "src", "index.ts"), "old\n");
  }
  mkdirSync(
    join(dest, ".pi", "npm", "local", "@agentic-core", "heio-coord", "src"),
    { recursive: true },
  );
  writeFileSync(
    join(
      dest,
      ".pi",
      "npm",
      "local",
      "@agentic-core",
      "heio-coord",
      "src",
      "index.ts",
    ),
    "old\n",
  );
  mkdirSync(join(dest, ".pi", "skills", "agent-teams"), { recursive: true });
  writeFileSync(
    join(dest, ".pi", "skills", "agent-teams", "SKILL.md"),
    "# parked\n",
  );
  writeFileSync(
    join(dest, ".pi", "settings.json"),
    `${JSON.stringify(
      {
        packages: [
          "npm/local/@agentic-core/heio-todo",
          "npm/local/@agentic-core/heio-coord",
          "npm/node_modules/@agentic-core/heio-todo",
          "npm/node_modules/@agentic-core/heio-coms",
          "npm/node_modules/@agentic-core/heio-teams",
          "npm/node_modules/@agentic-core/heio-coord",
        ],
      },
      null,
      2,
    )}\n`,
  );
  const r = runCli(["install", dest, "--profile", "agentic-core"]);
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.equal(existsSync(join(npmRoot, "heio-coms")), false);
  assert.equal(existsSync(join(npmRoot, "heio-teams")), false);
  assert.equal(existsSync(join(npmRoot, "heio-todo")), false);
  assert.equal(existsSync(join(npmRoot, "heio-coord")), false);
  assert.equal(existsSync(join(dest, ".pi", "skills", "agent-teams")), false);
  const localRoot = join(dest, ".pi", "npm", "local", "@agentic-core");
  assert.equal(existsSync(join(localRoot, "heio-todo")), false);
  assert.equal(existsSync(join(localRoot, "heio-coms")), false);
  assert.equal(existsSync(join(localRoot, "heio-coord")), false);
  const settings = JSON.parse(
    readFileSync(join(dest, ".pi", "settings.json"), "utf8"),
  ) as { packages: string[] };
  assert.equal(
    settings.packages.includes("npm/node_modules/@agentic-core/heio-coms"),
    false,
  );
  assert.equal(
    settings.packages.includes("npm/node_modules/@agentic-core/heio-teams"),
    false,
  );
  assert.equal(
    settings.packages.includes("npm/node_modules/@agentic-core/heio-todo"),
    false,
  );
  assert.equal(
    settings.packages.includes("npm/local/@agentic-core/heio-todo"),
    false,
  );
  assert.equal(
    settings.packages.includes("npm/local/@agentic-core/heio-coord"),
    false,
  );
  assert.equal(
    settings.packages.includes("npm/node_modules/@agentic-core/heio-coord"),
    false,
  );
  assert.ok(settings.packages.includes("npm:@inobit/pi-todo@0.1.1"));
  assert.ok(
    settings.packages.includes("npm:@juicesharp/rpiv-ask-user-question@2.8.0"),
  );
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
  assert.ok(folders.includes("heio-stack"), folders.join(", "));
  assert.equal(existsSync(join(skillRoot, "heio-stack", "SKILL.md")), true);
  assert.equal(folders.includes("how"), false, folders.join(", "));
  assert.equal(folders.includes("unslop"), false, folders.join(", "));
  assert.equal(folders.includes("agent-teams"), false, folders.join(", "));
  assert.equal(existsSync(join(dest, ".pi", "APPEND_SYSTEM.md")), true);
  assert.equal(existsSync(join(dest, ".opencode")), false);
  assert.equal(
    existsSync(join(dest, ".pi", "npm", "local", "@agentic-core", "heio-todo")),
    false,
  );
  assert.equal(
    existsSync(join(dest, ".pi", "npm", "local", "@agentic-core", "heio-boot")),
    true,
  );

  const after = existsSync(checkoutSettingsPath)
    ? readFileSync(checkoutSettingsPath, "utf8")
    : null;
  assert.equal(after, before);
  if (after) {
    assert.doesNotMatch(
      after,
      /packages\/(?:lib|heio-todo|heio-coms|heio-boot|heio-teams|heio-footer|heio-coord|heio-onic)/,
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

  writeFileSync(
    join(dest, ".pi", "agents", "heio-builder.md"),
    "STALE AGENT\n",
  );
  writeFileSync(
    join(dest, ".pi", "skills", "heio-stack", "SKILL.md"),
    "STALE SKILL\n",
  );
  writeFileSync(
    join(dest, ".pi", "prompts", "heio-slice.md"),
    "STALE PROMPT\n",
  );

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
    readFileSync(join(dest, ".pi", "agents", "heio-builder.md"), "utf8"),
    readFileSync(
      join(REPO, "ai", "agents", "heio-builder", "heio-builder.md"),
      "utf8",
    ),
  );
  assert.equal(
    readFileSync(join(dest, ".pi", "skills", "heio-stack", "SKILL.md"), "utf8"),
    readFileSync(
      join(REPO, "ai", "skills", "heio-stack", "heio-stack", "SKILL.md"),
      "utf8",
    ),
  );
  assert.equal(
    readFileSync(join(dest, ".pi", "prompts", "heio-slice.md"), "utf8"),
    readFileSync(
      join(REPO, "ai", "prompts", "heio-stack", "heio-slice.md"),
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

test("install --extension heio-boot writes a dest-relative npm package", () => {
  const dest = mkdtempSync(join(tmpdir(), "installer-ext-"));
  const r = runCli(["install", dest, "--extension", "heio-boot"]);
  assert.equal(r.status, 0, r.stderr || r.stdout);

  const npmRoot = join(dest, ".pi", "npm", "local", "@agentic-core");
  const local = join(npmRoot, "heio-boot");
  assert.equal(existsSync(local), true);
  assert.deepEqual(readdirSync(npmRoot), ["heio-boot"]);
  assert.equal(existsSync(join(dest, ".pi", "skills")), false);
  assert.equal(existsSync(join(npmRoot, "lib")), false);
  assert.equal(existsSync(join(local, "src", "lib")), false);
  assert.equal(existsSync(join(local, "src", "index.ts")), true);
  assert.equal(existsSync(join(local, "src", "index.test.ts")), false);

  const index = readFileSync(join(local, "src", "index.ts"), "utf8");
  assert.doesNotMatch(index, /@agentic-core\/lib/);

  const pkg = JSON.parse(readFileSync(join(local, "package.json"), "utf8")) as {
    dependencies?: Record<string, string>;
  };
  assert.equal(pkg.dependencies?.["@agentic-core/lib"], undefined);

  const settings = JSON.parse(
    readFileSync(join(dest, ".pi", "settings.json"), "utf8"),
  ) as { packages?: unknown };
  assert.ok(Array.isArray(settings.packages), "settings.packages");
  assert.deepEqual(settings.packages, ["npm/local/@agentic-core/heio-boot"]);

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
          "vendor/@agentic-core/heio-boot",
          "npm/node_modules/@agentic-core/heio-boot",
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
        "local",
        "@agentic-core",
        "heio-boot",
        "src",
        "index.ts",
      ),
    ),
    true,
  );
  assert.equal(
    existsSync(
      join(dest, ".pi", "npm", "node_modules", "@agentic-core", "heio-boot"),
    ),
    false,
  );
  const settings = JSON.parse(
    readFileSync(join(dest, ".pi", "settings.json"), "utf8"),
  ) as { packages: string[] };
  assert.ok(settings.packages.includes("npm/local/@agentic-core/heio-boot"));
  assert.equal(
    settings.packages.includes("npm/node_modules/@agentic-core/heio-boot"),
    false,
  );
  assert.equal(
    settings.packages.includes("vendor/@agentic-core/heio-boot"),
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
    "heio-boot",
    "--extension",
    "heio-footer",
  ]);
  assert.equal(first.status, 0, first.stderr || first.stdout);

  const boot = join(dest, ".pi", "npm", "local", "@agentic-core", "heio-boot");
  const footer = join(
    dest,
    ".pi",
    "npm",
    "local",
    "@agentic-core",
    "heio-footer",
  );
  assert.equal(existsSync(boot), true);
  assert.equal(existsSync(footer), true);
  assert.equal(
    existsSync(join(dest, ".pi", "npm", "local", "@agentic-core", "lib")),
    false,
  );

  const leftover = join(boot, "leftover.txt");
  writeFileSync(leftover, "stale\n", "utf8");
  const second = runCli(["install", dest, "--extension", "heio-boot"]);
  assert.equal(second.status, 0, second.stderr || second.stdout);
  assert.equal(existsSync(leftover), false);
  assert.equal(existsSync(join(boot, "src", "index.ts")), true);

  const settings = JSON.parse(
    readFileSync(join(dest, ".pi", "settings.json"), "utf8"),
  ) as { packages?: unknown };
  assert.deepEqual(settings.packages, [
    "npm/local/@agentic-core/heio-boot",
    "npm/local/@agentic-core/heio-footer",
  ]);
  assertNoCheckoutPath(dest);
});

test("parseProfilePackage accepts local:@agentic-core/heio-onic", () => {
  assert.deepEqual(parseProfilePackage("local:@agentic-core/heio-onic"), {
    kind: "local",
    name: "heio-onic",
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
  mkdirSync(join(srcRoot, "profiles", "vendor-colon"), { recursive: true });
  mkdirSync(join(srcRoot, "profiles", "vendor-slash"), { recursive: true });
  writeFileSync(
    join(srcRoot, "profiles", "vendor-colon", "profile.yaml"),
    "packages:\n  - vendor:@agentic-core/heio-todo\n",
  );
  writeFileSync(
    join(srcRoot, "profiles", "vendor-slash", "profile.yaml"),
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

test("parseProfilePackage rejects parked heio-coms, heio-teams, heio-todo, and heio-coord", () => {
  assert.throws(
    () => parseProfilePackage("local:@agentic-core/heio-coms"),
    /Unknown extension: heio-coms/,
  );
  assert.throws(
    () => parseProfilePackage("local:@agentic-core/heio-teams"),
    /Unknown extension: heio-teams/,
  );
  assert.throws(
    () => parseProfilePackage("local:@agentic-core/heio-todo"),
    /Unknown extension: heio-todo/,
  );
  assert.throws(
    () => parseProfilePackage("local:@agentic-core/heio-coord"),
    /Unknown extension: heio-coord/,
  );
});

test("parseProfilePackage and loadProfile reject unknown local names", () => {
  assert.throws(
    () => parseProfilePackage("local:@agentic-core/not-a-package"),
    /Unknown extension: not-a-package/,
  );

  const srcRoot = mkdtempSync(join(tmpdir(), "installer-profile-"));
  mkdirSync(join(srcRoot, "profiles", "bad"), { recursive: true });
  writeFileSync(
    join(srcRoot, "profiles", "bad", "profile.yaml"),
    "packages:\n  - local:@agentic-core/not-a-package\n",
  );
  assert.throws(
    () => loadProfile(srcRoot, "bad"),
    /Unknown extension: not-a-package/,
  );
});
