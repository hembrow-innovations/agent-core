import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  findSkillDir,
  installModePlaybooks,
  listProfiles,
  loadProfile,
  parseProfileYaml,
  readPlaybookMeta,
  renderPlaybookCatalog,
  resolvePlaybookIds,
  rewriteSkillPlaybooks,
} from "./profile.mjs";

const REPO = fileURLToPath(new URL("..", import.meta.url));

test("parseProfileYaml: comments, scalars, booleans, lists, all", () => {
  const got = parseProfileYaml(`
# header
mode: draconic
templates: true
agents: false
playbooks: all
skills: [architect, arena]
empty: []
`);
  assert.deepEqual(got, {
    mode: "draconic",
    templates: true,
    agents: false,
    playbooks: "all",
    skills: ["architect", "arena"],
    empty: [],
  });
});

test("parseProfileYaml: block lists skip empty items", () => {
  const got = parseProfileYaml(`
skills:
  - feature
  -
  - bug-fix
  -
`);
  assert.deepEqual(got.skills, ["feature", "bug-fix"]);
});

test("parseProfileYaml: inline list skips empty items", () => {
  const got = parseProfileYaml(`skills: [feature, , bug-fix]`);
  assert.deepEqual(got.skills, ["feature", "bug-fix"]);
});

test("parseProfileYaml: throws on nested maps", () => {
  assert.throws(
    () =>
      parseProfileYaml(`
playbooks:
  kind: all
`),
    /Nested maps/,
  );
  assert.throws(() => parseProfileYaml(`x: {a: 1}`), /Nested maps/);
});

test("parseProfileYaml: throws on anchors", () => {
  assert.throws(() => parseProfileYaml(`x: &foo bar`), /anchors/);
  assert.throws(() => parseProfileYaml(`x: *foo`), /anchors/);
});

test("parseProfileYaml: throws on unknown constructs", () => {
  assert.throws(() => parseProfileYaml(`x: |\n  hi`), /Block scalars|Cannot parse/);
  assert.throws(() => parseProfileYaml(`???`), /Cannot parse/);
});

test("loadProfile: missing dies with available names", () => {
  const root = tempRoot();
  writeYaml(root, "core", "skills: []\n");
  assert.throws(() => loadProfile(root, "nope"), /Unknown profile "nope".*core/);
});

test("loadProfile: defaults and playbooks shapes", () => {
  const root = tempRoot();
  writeYaml(root, "bare", "skills: []\n");
  writeYaml(root, "all", "playbooks: all\nmode: draconic\n");
  writeYaml(
    root,
    "listed",
    `playbooks:
  - investigation
  - feature
`,
  );
  writeYaml(root, "empty", "playbooks: []\n");

  const bare = loadProfile(root, "bare");
  assert.deepEqual(bare, {
    name: "bare",
    mode: null,
    skills: [],
    playbooks: { kind: "omit" },
    agents: false,
    commands: false,
    templates: false,
    pi: false,
  });

  assert.deepEqual(loadProfile(root, "all").playbooks, { kind: "all" });
  assert.equal(loadProfile(root, "all").mode, "draconic");
  assert.deepEqual(loadProfile(root, "listed").playbooks, {
    kind: "list",
    ids: ["investigation", "feature"],
  });
  assert.deepEqual(loadProfile(root, "empty").playbooks, { kind: "list", ids: [] });
});

test("listProfiles skips README", () => {
  const root = tempRoot();
  writeYaml(root, "core", "skills: []\n");
  writeYaml(root, "web", "skills: []\n");
  writeFileSync(join(root, "profiles", "README.md"), "hi\n");
  assert.deepEqual(listProfiles(root), ["core", "web"]);
});

test("resolvePlaybookIds: all / list / omit / cli / unknown", () => {
  const available = ["investigation", "feature", "bug-fix", "opening-a-pr"];
  const omit = { playbooks: { kind: "omit" } };
  const all = { playbooks: { kind: "all" } };
  const list = { playbooks: { kind: "list", ids: ["investigation", "feature"] } };
  const none = { playbooks: null, withPlaybooks: [], withoutPlaybooks: [] };

  assert.deepEqual(resolvePlaybookIds(omit, none, available), []);
  assert.deepEqual(resolvePlaybookIds(all, none, available), available);
  assert.deepEqual(resolvePlaybookIds(list, none, available), ["investigation", "feature"]);

  assert.deepEqual(
    resolvePlaybookIds(all, { playbooks: ["bug-fix"], withPlaybooks: [], withoutPlaybooks: [] }, available),
    ["bug-fix"],
  );
  assert.deepEqual(
    resolvePlaybookIds(
      list,
      { playbooks: null, withPlaybooks: ["opening-a-pr"], withoutPlaybooks: ["feature"] },
      available,
    ),
    ["investigation", "opening-a-pr"],
  );
  assert.throws(
    () => resolvePlaybookIds(list, { playbooks: ["nope"], withPlaybooks: [], withoutPlaybooks: [] }, available),
    /Unknown playbook "nope"/,
  );
  assert.throws(
    () =>
      resolvePlaybookIds(
        { playbooks: { kind: "list", ids: ["missing"] } },
        none,
        available,
      ),
    /Unknown playbook "missing"/,
  );
});

test("renderPlaybookCatalog: with and without when", () => {
  assert.equal(
    renderPlaybookCatalog([{ id: "feature", title: "Feature", when: "New behavior." }]),
    "- **Feature.** New behavior. `playbooks/feature.md`.",
  );
  assert.equal(
    renderPlaybookCatalog([{ id: "feature", title: "Feature", when: "" }]),
    "- **Feature.** `playbooks/feature.md`.",
  );
});

test("rewriteSkillPlaybooks: replaces between markers and throws if missing", () => {
  const dir = mkdtempSync(join(tmpdir(), "skill-"));
  const skill = join(dir, "SKILL.md");
  writeFileSync(
    skill,
    "intro\n<!-- playbooks:start -->\n- old\n<!-- playbooks:end -->\noutro\n",
  );
  rewriteSkillPlaybooks(dir, [{ id: "feature", title: "Feature", when: "New." }]);
  assert.equal(
    readFileSync(skill, "utf8"),
    "intro\n<!-- playbooks:start -->\n- **Feature.** New. `playbooks/feature.md`.\n<!-- playbooks:end -->\noutro\n",
  );
  writeFileSync(skill, "no markers\n");
  assert.throws(() => rewriteSkillPlaybooks(dir, []), /Missing playbooks markers/);
});

test("installModePlaybooks: selected files only, second run converges", () => {
  const root = tempRoot();
  mkdirSync(join(root, "playbooks"));
  writeFileSync(join(root, "playbooks", "feature.md"), "---\ntitle: Feature\nwhen: New.\n---\n\n### Feature\n");
  writeFileSync(join(root, "playbooks", "bug-fix.md"), "---\ntitle: Bug fix\nwhen: A defect.\n---\n\n### Bug fix\n");
  writeFileSync(join(root, "playbooks", "eval.md"), "---\ntitle: Eval\nwhen: Test a skill.\n---\n\n### Eval\n");

  const dest = mkdtempSync(join(tmpdir(), "dest-"));
  for (const base of [".opencode/skills", ".claude/skills"]) {
    const skillDir = join(dest, base, "demo-mode");
    mkdirSync(join(skillDir, "playbooks"), { recursive: true });
    writeFileSync(join(skillDir, "playbooks", "eval.md"), "stale\n");
    writeFileSync(join(skillDir, "playbooks", "leftover.md"), "gone\n");
    writeFileSync(
      join(skillDir, "SKILL.md"),
      "pre\n<!-- playbooks:start -->\n- old\n<!-- playbooks:end -->\npost\n",
    );
  }

  const ids = ["feature", "bug-fix"];
  installModePlaybooks(root, dest, "demo", ids);
  const first = snapshotInstall(dest);
  installModePlaybooks(root, dest, "demo", ids);
  assert.deepEqual(snapshotInstall(dest), first);

  for (const base of [".opencode/skills", ".claude/skills"]) {
    const pb = join(dest, base, "demo-mode", "playbooks");
    assert.deepEqual(readdirSync(pb).sort(), ["bug-fix.md", "feature.md"]);
    const skill = readFileSync(join(dest, base, "demo-mode", "SKILL.md"), "utf8");
    assert.match(skill, /\*\*Feature\.\*\*/);
    assert.match(skill, /\*\*Bug fix\.\*\*/);
    assert.doesNotMatch(skill, /Eval/);
    assert.doesNotMatch(skill, /leftover/);
  }
});

test("readPlaybookMeta: frontmatter and heading fallback", () => {
  const root = tempRoot();
  mkdirSync(join(root, "playbooks"));
  writeFileSync(
    join(root, "playbooks", "feature.md"),
    "---\ntitle: Feature\nwhen: New or changed behavior.\n---\n\n### Feature\nbody\n",
  );
  writeFileSync(join(root, "playbooks", "bare.md"), "### Bare title\nbody\n");
  assert.deepEqual(readPlaybookMeta(root, "feature"), {
    id: "feature",
    title: "Feature",
    when: "New or changed behavior.",
  });
  assert.deepEqual(readPlaybookMeta(root, "bare"), { id: "bare", title: "Bare title", when: "" });
});

test("repo life-engine profile loads", () => {
  const p = loadProfile(REPO, "life-engine");
  assert.equal(p.mode, "draconic");
  assert.deepEqual(p.playbooks, { kind: "all" });
  assert.equal(p.agents, true);
  assert.equal(p.commands, true);
  assert.equal(p.templates, true);
  assert.equal(p.pi, true);
  const ported = [
    "behaviour-contracts",
    "diagnose",
    "frontend-design",
    "tanstack-query",
    "thermo-review",
    "to-issues",
    "triage",
    "typography",
    "vault-pack",
    "vercel-react-best-practices",
    "verify-issue",
    "webapp-testing",
    "write-a-skill",
  ];
  for (const name of ported) assert.ok(p.skills.includes(name), name);
  const missing = p.skills.filter((name) => !skillHasMarkdown(REPO, name));
  assert.deepEqual(missing, []);
});

test("repo pi profile resolves every skill from skills/", () => {
  const p = loadProfile(REPO, "pi");
  assert.equal(p.pi, true);
  assert.equal(p.agents, false);
  assert.equal(p.commands, false);
  assert.equal(p.templates, false);
  assert.equal(p.mode, "draconic");
  const needed = [...p.skills, `${p.mode}-mode`];
  for (const name of needed) {
    assert.ok(findSkillDir(REPO, name), name);
    assert.doesNotMatch(findSkillDir(REPO, name), /\/pi\/skills\//);
  }
  assert.equal(existsSync(join(REPO, "pi", "skills")), false);
  assert.equal(existsSync(join(REPO, "pi", "install.mjs")), false);
  assert.equal(existsSync(join(REPO, "pi", "extensions", "draconic-spawn.ts")), true);
});

test("findSkillDir reads skills/ only", () => {
  const mode = findSkillDir(REPO, "draconic-mode");
  assert.ok(mode.endsWith(join("skills", "workflow", "draconic-mode")), mode);
  assert.equal(findSkillDir(REPO, "no-such-skill"), null);
});

test("install --profile pi writes shared skills plus Pi runtime files", () => {
  const dest = mkdtempSync(join(tmpdir(), "install-pi-"));
  const r = spawnSync(
    process.execPath,
    [join(REPO, "scripts", "install.mjs"), dest, "--local", REPO, "--profile", "pi", "--no-templates"],
    { encoding: "utf8" },
  );
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.match(r.stdout, /Profile: pi/);
  const piSkill = readFileSync(join(dest, ".pi", "skills", "draconic-mode", "SKILL.md"), "utf8");
  const ocSkill = readFileSync(join(dest, ".opencode", "skills", "draconic-mode", "SKILL.md"), "utf8");
  assert.match(piSkill, /Pi runtime adapter/);
  assert.match(ocSkill, /OpenCode runtime adapter/);
  assert.equal(existsSync(join(dest, ".pi", "prompts", "draconic-mode.md")), true);
  assert.equal(existsSync(join(dest, ".pi", "extensions", "draconic-spawn.ts")), true);
  assert.equal(existsSync(join(dest, ".pi", "APPEND_SYSTEM.md")), true);
  assert.equal(existsSync(join(dest, ".agents", "skills", "draconic-mode", "SKILL.md")), true);
});

test("install --profile core skips pi unless --pi", () => {
  const dest = mkdtempSync(join(tmpdir(), "install-core-"));
  const r = spawnSync(
    process.execPath,
    [
      join(REPO, "scripts", "install.mjs"),
      dest,
      "--local",
      REPO,
      "--profile",
      "core",
      "--no-templates",
      "--without",
      "domain-modeling,wayfinder,tdd,handoff,improve-codebase-architecture,codebase-design,setup-matt-pocock-skills,research,prototype,planning,planning-with-docs,management,docs,unslop",
    ],
    { encoding: "utf8" },
  );
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.equal(existsSync(join(dest, ".pi")), false);
  const forced = mkdtempSync(join(tmpdir(), "install-core-pi-"));
  const r2 = spawnSync(
    process.execPath,
    [
      join(REPO, "scripts", "install.mjs"),
      forced,
      "--local",
      REPO,
      "--profile",
      "core",
      "--pi",
      "--no-templates",
      "--without",
      "domain-modeling,wayfinder,tdd,handoff,improve-codebase-architecture,codebase-design,setup-matt-pocock-skills,research,prototype,planning,planning-with-docs,management,docs,unslop",
    ],
    { encoding: "utf8" },
  );
  assert.equal(r2.status, 0, r2.stderr || r2.stdout);
  assert.equal(existsSync(join(forced, ".pi", "skills", "bro", "SKILL.md")), true);
});

test("install --profile draconic --no-pi skips the Pi pack", () => {
  const dest = mkdtempSync(join(tmpdir(), "install-nopi-"));
  const r = spawnSync(
    process.execPath,
    [join(REPO, "scripts", "install.mjs"), dest, "--local", REPO, "--profile", "draconic", "--no-pi", "--no-templates"],
    { encoding: "utf8" },
  );
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.equal(existsSync(join(dest, ".opencode", "skills", "draconic-mode", "SKILL.md")), true);
  assert.equal(existsSync(join(dest, ".pi")), false);
});

test("install uses profiles yaml only and does not write preference stubs", () => {
  const dest = mkdtempSync(join(tmpdir(), "install-"));
  const r = spawnSync(
    process.execPath,
    [
      join(REPO, "scripts", "install.mjs"),
      dest,
      "--local",
      REPO,
      "--profile",
      "core",
      "--no-templates",
      "--without",
      "domain-modeling,wayfinder,tdd,handoff,improve-codebase-architecture,codebase-design,setup-matt-pocock-skills,research,prototype,planning,planning-with-docs,management,docs,unslop",
    ],
    { encoding: "utf8" },
  );
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.match(r.stdout, /Profile: core/);
  assert.match(r.stdout, /skill bro → \.opencode\/skills\/bro/);
  assert.doesNotMatch(r.stdout, /prefs/);
  assert.equal(existsSync(join(dest, "AGENTS.md")), false);
  assert.equal(existsSync(join(dest, "CLAUDE.md")), false);
  assert.equal(existsSync(join(dest, ".github", "copilot-instructions.md")), false);
  assert.equal(existsSync(join(dest, ".opencode", "skills", "bro", "SKILL.md")), true);
  assert.equal(existsSync(join(REPO, "preferences")), false);
});

test("pstack source tree is gone and draconic install resolves", () => {
  const r = spawnSync(process.execPath, [join(REPO, "scripts", "check-no-pstack.mjs")], {
    encoding: "utf8",
  });
  assert.equal(r.status, 0, r.stderr || r.stdout);
});

test("ported life-engine skills keep the management/docs split", () => {
  const r = spawnSync(process.execPath, [join(REPO, "scripts", "check-ported-skills.mjs")], {
    encoding: "utf8",
  });
  assert.equal(r.status, 0, r.stderr || r.stdout);
});

function skillHasMarkdown(root, name) {
  return walkSkillMarkdown(join(root, "skills"), name);
}

function walkSkillMarkdown(dir, name) {
  if (!existsSync(dir)) return false;
  if (existsSync(join(dir, name, "SKILL.md"))) return true;
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    if (!ent.isDirectory() || ent.name.startsWith(".")) continue;
    const full = join(dir, ent.name);
    if (existsSync(join(full, "SKILL.md"))) continue;
    if (walkSkillMarkdown(full, name)) return true;
  }
  return false;
}

function tempRoot() {
  const root = mkdtempSync(join(tmpdir(), "profile-"));
  mkdirSync(join(root, "profiles"));
  return root;
}

function writeYaml(root, name, body) {
  writeFileSync(join(root, "profiles", `${name}.yaml`), body);
}

function snapshotInstall(dest) {
  const out = {};
  for (const base of [".opencode/skills", ".claude/skills"]) {
    const skillDir = join(dest, base, "demo-mode");
    out[`${base}/SKILL.md`] = readFileSync(join(skillDir, "SKILL.md"), "utf8");
    out[`${base}/playbooks`] = {};
    for (const name of readdirSync(join(skillDir, "playbooks")).sort()) {
      out[`${base}/playbooks`][name] = readFileSync(join(skillDir, "playbooks", name), "utf8");
    }
  }
  return out;
}

