import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  findSkillDir,
  installModePlaybooks,
  installPiRuntime,
  listProfiles,
  loadProfile,
  mergePiSettingsPackages,
  packageSource,
  parseProfileYaml,
  readPiPackages,
  readPlaybookMeta,
  renderPlaybookCatalog,
  resolvePlaybookIds,
  rewriteSkillPlaybooks,
} from "../../scripts/profile.mjs";

const REPO = fileURLToPath(new URL("../..", import.meta.url));
const INSTALLER = join(REPO, "packages", "installer", "src", "cli.ts");
const CORE_WITHOUT =
  "domain-modeling,wayfinder,tdd,handoff,improve-codebase-architecture,codebase-design,setup-matt-pocock-skills,research,prototype,planning,planning-with-docs,management,docs,unslop";

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
  assert.throws(
    () => parseProfileYaml(`x: |\n  hi`),
    /Block scalars|Cannot parse/,
  );
  assert.throws(() => parseProfileYaml(`???`), /Cannot parse/);
});

test("loadProfile: missing dies with available names", () => {
  const root = tempRoot();
  writeYaml(root, "core", "skills: []\n");
  assert.throws(
    () => loadProfile(root, "nope"),
    /Unknown profile "nope".*core/,
  );
});

test("loadProfile: defaults and playbooks shapes", () => {
  const root = tempRoot();
  writeYaml(root, "bare", "harness: opencode\nskills: []\n");
  writeYaml(root, "all", "harness: opencode\nplaybooks: all\nmode: draconic\n");
  writeYaml(
    root,
    "listed",
    `harness: opencode
playbooks:
  - investigation
  - feature
`,
  );
  writeYaml(root, "empty", "harness: opencode\nplaybooks: []\n");

  const bare = loadProfile(root, "bare");
  assert.deepEqual(bare, {
    name: "bare",
    mode: null,
    skills: [],
    playbooks: { kind: "omit" },
    harness: "opencode",
    agents: false,
    commands: false,
    templates: false,
    extensions: [],
  });

  assert.deepEqual(loadProfile(root, "all").playbooks, { kind: "all" });
  assert.equal(loadProfile(root, "all").mode, "draconic");
  assert.deepEqual(loadProfile(root, "listed").playbooks, {
    kind: "list",
    ids: ["investigation", "feature"],
  });
  assert.deepEqual(loadProfile(root, "empty").playbooks, {
    kind: "list",
    ids: [],
  });
});

test("loadProfile: missing harness dies", () => {
  const root = tempRoot();
  writeYaml(root, "bare", "skills: []\n");
  assert.throws(
    () => loadProfile(root, "bare"),
    /Missing harness.*opencode, claude, pi, agents/,
  );
});

test("loadProfile: leftover pi dies", () => {
  const root = tempRoot();
  writeYaml(root, "old", "harness: pi\npi: false\nskills: []\n");
  assert.throws(() => loadProfile(root, "old"), /use harness: pi/);
});

test("loadProfile: unknown harness dies", () => {
  const root = tempRoot();
  writeYaml(root, "x", "harness: nope\nskills: []\n");
  assert.throws(
    () => loadProfile(root, "x"),
    /Unknown harness "nope".*opencode, claude, pi, agents/,
  );
});

test("loadProfile: unknown key dies", () => {
  const root = tempRoot();
  writeYaml(root, "x", "harness: opencode\nfoo: 1\n");
  assert.throws(() => loadProfile(root, "x"), /Unknown profile key "foo"/);
});

test("loadProfile: extensions default empty and accept a list", () => {
  const root = tempRoot();
  writeYaml(root, "bare", "harness: opencode\nskills: []\n");
  writeYaml(
    root,
    "ext",
    `harness: pi
extensions:
  - draconic-todo
  - draconic-coms
`,
  );
  assert.deepEqual(loadProfile(root, "bare").extensions, []);
  assert.deepEqual(loadProfile(root, "ext").extensions, [
    "draconic-todo",
    "draconic-coms",
  ]);
});

test("loadProfile: agents true on non-opencode dies", () => {
  const root = tempRoot();
  writeYaml(root, "x", "harness: pi\nagents: true\n");
  assert.throws(
    () => loadProfile(root, "x"),
    /"agents" is only valid on harness: opencode/,
  );
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
  const list = {
    playbooks: { kind: "list", ids: ["investigation", "feature"] },
  };
  const none = { playbooks: null, withPlaybooks: [], withoutPlaybooks: [] };

  assert.deepEqual(resolvePlaybookIds(omit, none, available), []);
  assert.deepEqual(resolvePlaybookIds(all, none, available), available);
  assert.deepEqual(resolvePlaybookIds(list, none, available), [
    "investigation",
    "feature",
  ]);

  assert.deepEqual(
    resolvePlaybookIds(
      all,
      { playbooks: ["bug-fix"], withPlaybooks: [], withoutPlaybooks: [] },
      available,
    ),
    ["bug-fix"],
  );
  assert.deepEqual(
    resolvePlaybookIds(
      list,
      {
        playbooks: null,
        withPlaybooks: ["opening-a-pr"],
        withoutPlaybooks: ["feature"],
      },
      available,
    ),
    ["investigation", "opening-a-pr"],
  );
  assert.throws(
    () =>
      resolvePlaybookIds(
        list,
        { playbooks: ["nope"], withPlaybooks: [], withoutPlaybooks: [] },
        available,
      ),
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
    renderPlaybookCatalog([
      { id: "feature", title: "Feature", when: "New behavior." },
    ]),
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
  rewriteSkillPlaybooks(dir, [
    { id: "feature", title: "Feature", when: "New." },
  ]);
  assert.equal(
    readFileSync(skill, "utf8"),
    "intro\n<!-- playbooks:start -->\n- **Feature.** New. `playbooks/feature.md`.\n<!-- playbooks:end -->\noutro\n",
  );
  writeFileSync(skill, "no markers\n");
  assert.throws(
    () => rewriteSkillPlaybooks(dir, []),
    /Missing playbooks markers/,
  );
});

test("installModePlaybooks: selected files only, second run converges", () => {
  const root = tempRoot();
  mkdirSync(join(root, "playbooks"));
  writeFileSync(
    join(root, "playbooks", "feature.md"),
    "---\ntitle: Feature\nwhen: New.\n---\n\n### Feature\n",
  );
  writeFileSync(
    join(root, "playbooks", "bug-fix.md"),
    "---\ntitle: Bug fix\nwhen: A defect.\n---\n\n### Bug fix\n",
  );
  writeFileSync(
    join(root, "playbooks", "eval.md"),
    "---\ntitle: Eval\nwhen: Test a skill.\n---\n\n### Eval\n",
  );

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
  const destBases = [".opencode/skills", ".claude/skills"];
  installModePlaybooks(root, dest, "demo", ids, destBases);
  const first = snapshotInstall(dest);
  installModePlaybooks(root, dest, "demo", ids, destBases);
  assert.deepEqual(snapshotInstall(dest), first);

  for (const base of [".opencode/skills", ".claude/skills"]) {
    const pb = join(dest, base, "demo-mode", "playbooks");
    assert.deepEqual(readdirSync(pb).sort(), ["bug-fix.md", "feature.md"]);
    const skill = readFileSync(
      join(dest, base, "demo-mode", "SKILL.md"),
      "utf8",
    );
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
  assert.deepEqual(readPlaybookMeta(root, "bare"), {
    id: "bare",
    title: "Bare title",
    when: "",
  });
});

test("repo life-engine profile loads", () => {
  const p = loadProfile(REPO, "life-engine");
  assert.equal(p.mode, "draconic");
  assert.deepEqual(p.playbooks, { kind: "all" });
  assert.equal(p.agents, true);
  assert.equal(p.commands, true);
  assert.equal(p.templates, true);
  assert.equal(p.harness, "opencode");
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

test("repo life-engine-pi profile loads", () => {
  const p = loadProfile(REPO, "life-engine-pi");
  assert.equal(p.mode, "draconic");
  assert.deepEqual(p.playbooks, { kind: "all" });
  assert.equal(p.agents, false);
  assert.equal(p.commands, false);
  assert.equal(p.templates, false);
  assert.equal(p.harness, "pi");
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
    "comment-sicko",
  ];
  for (const name of ported) assert.ok(p.skills.includes(name), name);
  const missing = p.skills.filter((name) => !skillHasMarkdown(REPO, name));
  assert.deepEqual(missing, []);
});

test("repo agentic-core profile loads", () => {
  const p = loadProfile(REPO, "agentic-core");
  assert.equal(p.mode, "draconic");
  assert.deepEqual(p.playbooks, { kind: "all" });
  assert.equal(p.agents, false);
  assert.equal(p.commands, false);
  assert.equal(p.templates, false);
  assert.equal(p.harness, "pi");
  const needed = [
    "write-a-skill",
    "diagnose",
    "thermo-review",
    "research",
    "codebase-design",
  ];
  for (const name of needed) assert.ok(p.skills.includes(name), name);
  const banned = [
    "godot-mono",
    "vault-pack",
    "playwright-cli",
    "supabase",
    "frontend-design",
  ];
  for (const name of banned) assert.equal(p.skills.includes(name), false, name);
  const missing = p.skills.filter((name) => !skillHasMarkdown(REPO, name));
  assert.deepEqual(missing, []);
});

test("repo pi profiles list todo, coms, and boot", () => {
  for (const name of ["pi", "agentic-core", "life-engine-pi"]) {
    assert.deepEqual(loadProfile(REPO, name).extensions, [
      "draconic-todo",
      "draconic-coms",
      "draconic-boot",
    ]);
  }
});

test("always-on text points at one playbook, not the dest router", () => {
  const append = readFileSync(join(REPO, "pi", "APPEND_SYSTEM.md"), "utf8");
  const prompt = readFileSync(
    join(REPO, "pi", "prompts", "draconic-mode.md"),
    "utf8",
  );
  const agent = readFileSync(join(REPO, "pi", "agents", "draconic.md"), "utf8");
  for (const text of [append, prompt, agent]) {
    assert.doesNotMatch(
      text,
      /Read `\.pi\/skills\/draconic-mode\/SKILL\.md` in full/,
    );
  }
  assert.match(
    append,
    /Investigation-shaped ask reads `playbooks\/investigation\.md`/,
  );
});

test("repo pi profile resolves every skill from skills/", () => {
  const p = loadProfile(REPO, "pi");
  assert.equal(p.harness, "pi");
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
  assert.equal(existsSync(join(REPO, "pi", "packages.json")), true);
  assert.equal(existsSync(join(REPO, "pi", "APPEND_SYSTEM.md")), true);
  assert.equal(existsSync(join(REPO, "pi", "draconic-models.md")), true);
  assert.equal(
    existsSync(join(REPO, "pi", "prompts", "draconic-mode.md")),
    true,
  );
  assert.deepEqual(readPiPackages(join(REPO, "pi")), [
    "npm:pi-lens",
    "npm:pi-web-access",
    "npm:pi-subagents",
  ]);
});

test("installPiRuntime writes boot, models, and profile-filtered prompts", () => {
  const root = tempRoot();
  mkdirSync(join(root, "pi", "extensions"), { recursive: true });
  mkdirSync(join(root, "pi", "prompts"), { recursive: true });
  writeFileSync(
    join(root, "pi", "extensions", "boot.ts"),
    "export default function () {}\n",
  );
  writeFileSync(join(root, "pi", "APPEND_SYSTEM.md"), "boot\n");
  writeFileSync(join(root, "pi", "draconic-models.md"), "models\n");
  writeFileSync(join(root, "pi", "prompts", "how.md"), "how\n");
  writeFileSync(join(root, "pi", "prompts", "why.md"), "why\n");
  writeFileSync(join(root, "pi", "prompts", "orchestrate.md"), "orch\n");
  writePiRolesPack(root);

  const dest = mkdtempSync(join(tmpdir(), "pi-rt-"));
  installPiRuntime(root, dest, { skills: ["how"], playbooks: ["orchestrate"] });
  assert.equal(
    readFileSync(join(dest, ".pi", "APPEND_SYSTEM.md"), "utf8"),
    "boot\n",
  );
  assert.equal(
    readFileSync(join(dest, ".pi", "draconic-models.md"), "utf8"),
    "models\n",
  );
  assert.equal(existsSync(join(dest, ".pi", "prompts", "how.md")), true);
  assert.equal(
    existsSync(join(dest, ".pi", "prompts", "orchestrate.md")),
    true,
  );
  assert.equal(existsSync(join(dest, ".pi", "prompts", "why.md")), false);

  writeFileSync(join(dest, ".pi", "APPEND_SYSTEM.md"), "custom\n");
  writeFileSync(join(dest, ".pi", "draconic-models.md"), "picked\n");
  writeFileSync(join(dest, ".pi", "prompts", "why.md"), "stale\n");
  installPiRuntime(root, dest, { skills: ["how"], playbooks: ["orchestrate"] });
  assert.equal(
    readFileSync(join(dest, ".pi", "APPEND_SYSTEM.md"), "utf8"),
    "custom\n",
  );
  assert.equal(
    readFileSync(join(dest, ".pi", "draconic-models.md"), "utf8"),
    "picked\n",
  );
  assert.equal(existsSync(join(dest, ".pi", "prompts", "why.md")), false);
});

test("installPiRuntime merges pack packages into settings.json", () => {
  const root = tempRoot();
  mkdirSync(join(root, "pi", "extensions"), { recursive: true });
  mkdirSync(join(root, "pi", "prompts"), { recursive: true });
  writeFileSync(
    join(root, "pi", "extensions", "boot.ts"),
    "export default function () {}\n",
  );
  writeFileSync(join(root, "pi", "APPEND_SYSTEM.md"), "boot\n");
  writeFileSync(join(root, "pi", "draconic-models.md"), "models\n");
  writeFileSync(
    join(root, "pi", "packages.json"),
    JSON.stringify(["npm:pi-lens", "npm:pi-web-access", "npm:pi-subagents"]),
  );
  writePiRolesPack(root);

  const dest = mkdtempSync(join(tmpdir(), "pi-rt-pkg-"));
  installPiRuntime(root, dest);
  assert.deepEqual(
    JSON.parse(readFileSync(join(dest, ".pi", "settings.json"), "utf8")),
    {
      packages: ["npm:pi-lens", "npm:pi-web-access", "npm:pi-subagents"],
    },
  );

  writeFileSync(
    join(dest, ".pi", "settings.json"),
    `${JSON.stringify(
      {
        theme: "dark",
        packages: [{ source: "npm:pi-lens", extensions: [] }, "npm:custom"],
      },
      null,
      2,
    )}\n`,
  );
  installPiRuntime(root, dest);
  assert.deepEqual(
    JSON.parse(readFileSync(join(dest, ".pi", "settings.json"), "utf8")),
    {
      theme: "dark",
      packages: [
        { source: "npm:pi-lens", extensions: [] },
        "npm:custom",
        "npm:pi-web-access",
        "npm:pi-subagents",
      ],
    },
  );
});

test("readPiPackages rejects a bad pack list", () => {
  const root = tempRoot();
  mkdirSync(join(root, "pi"), { recursive: true });
  writeFileSync(join(root, "pi", "packages.json"), "{}\n");
  assert.throws(() => readPiPackages(join(root, "pi")), /must be a JSON array/);
});

test("mergePiSettingsPackages is idempotent and keeps object-form sources", () => {
  const dest = join(mkdtempSync(join(tmpdir(), "pi-merge-")), "settings.json");
  mergePiSettingsPackages(dest, ["npm:pi-lens"]);
  mergePiSettingsPackages(dest, ["npm:pi-lens"]);
  assert.deepEqual(JSON.parse(readFileSync(dest, "utf8")), {
    packages: ["npm:pi-lens"],
  });
  assert.equal(packageSource({ source: "npm:pi-lens" }), "npm:pi-lens");
});

test("installPiRuntime rewrites a dest APPEND_SYSTEM that still matches the old persona", () => {
  const root = tempRoot();
  mkdirSync(join(root, "pi", "extensions"), { recursive: true });
  mkdirSync(join(root, "pi", "prompts"), { recursive: true });
  writeFileSync(
    join(root, "pi", "extensions", "boot.ts"),
    "export default function () {}\n",
  );
  writeFileSync(join(root, "pi", "APPEND_SYSTEM.md"), "new stub\n");
  writeFileSync(join(root, "pi", "draconic-models.md"), "models\n");
  writePiRolesPack(root);

  const dest = mkdtempSync(join(tmpdir(), "pi-rt-append-mig-"));
  mkdirSync(join(dest, ".pi"), { recursive: true });
  writeFileSync(
    join(dest, ".pi", "APPEND_SYSTEM.md"),
    readFileSync(
      join(REPO, "scripts", "fixtures", "legacy-append-system.md"),
      "utf8",
    ),
  );
  installPiRuntime(root, dest);
  assert.equal(
    readFileSync(join(dest, ".pi", "APPEND_SYSTEM.md"), "utf8"),
    "new stub\n",
  );

  writeFileSync(join(dest, ".pi", "APPEND_SYSTEM.md"), "custom persona\n");
  installPiRuntime(root, dest);
  assert.equal(
    readFileSync(join(dest, ".pi", "APPEND_SYSTEM.md"), "utf8"),
    "custom persona\n",
  );
});

test("installPiRuntime writes dest agents and leaves a custom file alone", () => {
  const root = tempRoot();
  mkdirSync(join(root, "pi", "extensions"), { recursive: true });
  mkdirSync(join(root, "pi", "prompts"), { recursive: true });
  mkdirSync(join(root, "pi", "agents"), { recursive: true });
  writeFileSync(
    join(root, "pi", "extensions", "boot.ts"),
    "export default function () {}\n",
  );
  writeFileSync(join(root, "pi", "APPEND_SYSTEM.md"), "boot\n");
  writeFileSync(join(root, "pi", "draconic-models.md"), "models\n");
  writeFileSync(
    join(root, "pi", "agents", "draconic.md"),
    "---\nname: draconic\n---\n\npack body\n",
  );
  writePiRolesPack(root);

  const dest = mkdtempSync(join(tmpdir(), "pi-rt-agents-"));
  installPiRuntime(root, dest);
  const destAgent = join(dest, ".pi", "agents", "draconic.md");
  assert.equal(
    readFileSync(destAgent, "utf8"),
    "---\nname: draconic\n---\n\npack body\n",
  );

  writeFileSync(destAgent, "custom agent\n");
  writeFileSync(
    join(root, "pi", "agents", "draconic.md"),
    "---\nname: draconic\n---\n\nnew pack body\n",
  );
  installPiRuntime(root, dest);
  assert.equal(readFileSync(destAgent, "utf8"), "custom agent\n");
});

test("installPiRuntime keeps a customized dest role file and replaces argv.mjs", () => {
  const root = tempRoot();
  mkdirSync(join(root, "pi", "extensions"), { recursive: true });
  mkdirSync(join(root, "pi", "prompts"), { recursive: true });
  writeFileSync(
    join(root, "pi", "extensions", "boot.ts"),
    "export default function () {}\n",
  );
  writeFileSync(join(root, "pi", "APPEND_SYSTEM.md"), "boot\n");
  writeFileSync(join(root, "pi", "draconic-models.md"), "models\n");
  writePiRolesPack(root);

  const dest = mkdtempSync(join(tmpdir(), "pi-rt-roles-"));
  installPiRuntime(root, dest);
  const destResearcher = join(dest, ".pi", "roles", "researcher.md");
  writeFileSync(destResearcher, "custom researcher\n");
  writeFileSync(join(dest, ".pi", "roles", "argv.mjs"), "old helper\n");
  writeFileSync(join(dest, ".pi", "roles", "reviewer.md"), "operator added\n");
  writeFileSync(join(root, "pi", "roles", "argv.mjs"), "new helper\n");
  installPiRuntime(root, dest);
  assert.equal(readFileSync(destResearcher, "utf8"), "custom researcher\n");
  assert.equal(
    readFileSync(join(dest, ".pi", "roles", "argv.mjs"), "utf8"),
    "new helper\n",
  );
  assert.equal(
    readFileSync(join(dest, ".pi", "roles", "reviewer.md"), "utf8"),
    "operator added\n",
  );
});

test("installPiRuntime dies when the pack is incomplete", () => {
  const root = tempRoot();
  mkdirSync(join(root, "pi", "extensions"), { recursive: true });
  const dest = mkdtempSync(join(tmpdir(), "pi-rt-missing-"));
  assert.throws(
    () => installPiRuntime(root, dest),
    /Pi pack missing: expected pi\/APPEND_SYSTEM.md/,
  );
});

test("findSkillDir reads skills/ only", () => {
  const mode = findSkillDir(REPO, "draconic-mode");
  assert.ok(mode.endsWith(join("skills", "workflow", "draconic-mode")), mode);
  assert.equal(findSkillDir(REPO, "no-such-skill"), null);
});

test("install --profile pi writes .pi only", () => {
  const dest = mkdtempSync(join(tmpdir(), "install-pi-"));
  const r = spawnSync(
    process.execPath,
    [INSTALLER, "install", dest, "--profile", "pi"],
    { encoding: "utf8" },
  );
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.match(r.stdout, /Profile: pi/);
  assert.match(r.stdout, /Harness: pi/);
  const piSkill = readFileSync(
    join(dest, ".pi", "skills", "draconic-mode", "SKILL.md"),
    "utf8",
  );
  assert.match(piSkill, /Pi runtime adapter/);
  assert.equal(existsSync(join(dest, ".pi", "roles", "researcher.md")), true);
  assert.equal(existsSync(join(dest, ".pi", "agents", "draconic.md")), true);
  assert.doesNotMatch(
    readFileSync(join(dest, ".pi", "agents", "draconic.md"), "utf8"),
    /Skill|Task/,
  );
  const vendorRoot = join(dest, ".pi", "vendor", "@agentic-core");
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
  assert.equal(existsSync(join(vendorRoot, "lib")), false);
  const append = readFileSync(join(dest, ".pi", "APPEND_SYSTEM.md"), "utf8");
  assert.doesNotMatch(append, /running draconic-mode on Pi/);
  assert.doesNotMatch(
    append,
    /Read `\.pi\/skills\/draconic-mode\/SKILL\.md` in full/,
  );
  assert.match(append, /playbooks\/investigation\.md/);
  assert.match(
    readFileSync(join(dest, ".pi", "draconic-models.md"), "utf8"),
    /feature, refactoring:/,
  );
  assert.match(
    readFileSync(join(dest, ".pi", "prompts", "draconic-mode.md"), "utf8"),
    /\.pi\/skills\/draconic-mode/,
  );
  assert.equal(existsSync(join(dest, ".pi", "prompts", "how.md")), true);
  assert.equal(
    existsSync(join(dest, ".pi", "prompts", "orchestrate.md")),
    true,
  );
  assert.deepEqual(
    JSON.parse(readFileSync(join(dest, ".pi", "settings.json"), "utf8")),
    {
      packages: [
        "npm:pi-lens",
        "npm:pi-web-access",
        "npm:pi-subagents",
        ".pi/vendor/@agentic-core/draconic-todo",
        ".pi/vendor/@agentic-core/draconic-coms",
        ".pi/vendor/@agentic-core/draconic-boot",
      ],
    },
  );
  assert.match(
    r.stdout,
    /Pi installs project packages from \.pi\/settings\.json/,
  );
  assert.equal(existsSync(join(dest, "AGENTS.md")), false);
  assert.equal(existsSync(join(dest, ".opencode")), false);
  assert.equal(existsSync(join(dest, ".claude")), false);
  assert.equal(existsSync(join(dest, ".agents")), false);
  assert.equal(existsSync(join(dest, ".draconic")), false);
});

test("install --profile agentic-core writes .pi only", () => {
  const dest = mkdtempSync(join(tmpdir(), "install-agentic-core-"));
  const r = spawnSync(
    process.execPath,
    [INSTALLER, "install", dest, "--profile", "agentic-core"],
    { encoding: "utf8" },
  );
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.match(r.stdout, /Profile: agentic-core/);
  assert.match(r.stdout, /Harness: pi/);
  assert.equal(
    existsSync(join(dest, ".pi", "skills", "draconic-mode", "SKILL.md")),
    true,
  );
  assert.equal(
    existsSync(join(dest, ".pi", "skills", "write-a-skill", "SKILL.md")),
    true,
  );
  assert.equal(
    existsSync(join(dest, ".pi", "skills", "diagnose", "SKILL.md")),
    true,
  );
  assert.equal(
    existsSync(join(dest, ".pi", "skills", "godot-mono", "SKILL.md")),
    false,
  );
  assert.equal(
    existsSync(join(dest, ".pi", "skills", "vault-pack", "SKILL.md")),
    false,
  );
  assert.equal(
    existsSync(join(dest, ".pi", "skills", "playwright-cli", "SKILL.md")),
    false,
  );
  assert.equal(
    existsSync(join(dest, ".pi", "skills", "supabase", "SKILL.md")),
    false,
  );
  assert.equal(existsSync(join(dest, ".opencode")), false);
  assert.equal(existsSync(join(dest, ".claude")), false);
  assert.equal(existsSync(join(dest, ".agents")), false);
});

test("install --profile life-engine-pi writes .pi only", () => {
  const dest = mkdtempSync(join(tmpdir(), "install-life-engine-pi-"));
  const r = spawnSync(
    process.execPath,
    [INSTALLER, "install", dest, "--profile", "life-engine-pi"],
    { encoding: "utf8" },
  );
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.match(r.stdout, /Profile: life-engine-pi/);
  assert.match(r.stdout, /Harness: pi/);
  assert.equal(
    existsSync(join(dest, ".pi", "skills", "draconic-mode", "SKILL.md")),
    true,
  );
  assert.equal(
    existsSync(join(dest, ".pi", "skills", "vault-pack", "SKILL.md")),
    true,
  );
  const vendorRoot = join(dest, ".pi", "vendor", "@agentic-core");
  assert.equal(
    existsSync(join(vendorRoot, "draconic-todo", "src", "index.ts")),
    true,
  );
  assert.equal(existsSync(join(vendorRoot, "lib")), false);
  assert.equal(existsSync(join(dest, ".opencode")), false);
  assert.equal(existsSync(join(dest, ".claude")), false);
  assert.equal(existsSync(join(dest, ".agents")), false);
});

test("install --profile pi --without how omits the how prompt", () => {
  const dest = mkdtempSync(join(tmpdir(), "install-pi-without-"));
  const r = spawnSync(
    process.execPath,
    [INSTALLER, "install", dest, "--profile", "pi", "--without", "how"],
    { encoding: "utf8" },
  );
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.equal(
    existsSync(join(dest, ".pi", "skills", "how", "SKILL.md")),
    false,
  );
  assert.equal(existsSync(join(dest, ".pi", "prompts", "how.md")), false);
  assert.equal(
    existsSync(join(dest, ".pi", "prompts", "draconic-mode.md")),
    true,
  );
});

test("install --profile core writes .opencode/skills only", () => {
  const dest = mkdtempSync(join(tmpdir(), "install-core-"));
  const r = spawnSync(
    process.execPath,
    [
      INSTALLER,
      "install",
      dest,
      "--profile",
      "core",
      "--without",
      CORE_WITHOUT,
    ],
    { encoding: "utf8" },
  );
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.equal(
    existsSync(join(dest, ".opencode", "skills", "bro", "SKILL.md")),
    true,
  );
  assert.equal(existsSync(join(dest, ".claude")), false);
  assert.equal(existsSync(join(dest, ".pi")), false);
});

test("install --harness claude on core writes .claude/skills only", () => {
  const dest = mkdtempSync(join(tmpdir(), "install-claude-"));
  const r = spawnSync(
    process.execPath,
    [
      INSTALLER,
      "install",
      dest,
      "--profile",
      "core",
      "--harness",
      "claude",
      "--without",
      CORE_WITHOUT,
    ],
    { encoding: "utf8" },
  );
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.match(r.stdout, /Harness: claude/);
  assert.equal(
    existsSync(join(dest, ".claude", "skills", "bro", "SKILL.md")),
    true,
  );
  assert.equal(existsSync(join(dest, ".opencode")), false);
  assert.equal(existsSync(join(dest, ".pi")), false);
  assert.equal(existsSync(join(dest, ".agents")), false);
});

test("install --harness unknown dies", () => {
  const dest = mkdtempSync(join(tmpdir(), "install-bad-harness-"));
  const r = spawnSync(
    process.execPath,
    [INSTALLER, "install", dest, "--profile", "core", "--harness", "nope"],
    { encoding: "utf8" },
  );
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /Unknown harness "nope"/);
});

test("install uses profiles yaml only and does not write preference stubs", () => {
  const dest = mkdtempSync(join(tmpdir(), "install-"));
  const r = spawnSync(
    process.execPath,
    [
      INSTALLER,
      "install",
      dest,
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
  assert.equal(
    existsSync(join(dest, ".github", "copilot-instructions.md")),
    false,
  );
  assert.equal(
    existsSync(join(dest, ".opencode", "skills", "bro", "SKILL.md")),
    true,
  );
  assert.equal(existsSync(join(dest, ".claude")), false);
  assert.equal(existsSync(join(REPO, "preferences")), false);
});

test("pstack source tree is gone and draconic install resolves", () => {
  const r = spawnSync(
    process.execPath,
    [join(REPO, "scripts", "check-no-pstack.mjs")],
    {
      encoding: "utf8",
    },
  );
  assert.equal(r.status, 0, r.stderr || r.stdout);
});

test("ported life-engine skills keep the management/docs split", () => {
  const r = spawnSync(
    process.execPath,
    [join(REPO, "scripts", "check-ported-skills.mjs")],
    {
      encoding: "utf8",
    },
  );
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

function writePiRolesPack(root) {
  mkdirSync(join(root, "pi", "roles"), { recursive: true });
  writeFileSync(join(root, "pi", "roles", "argv.mjs"), "export {}\n");
  for (const name of ["researcher", "architect", "coder"]) {
    writeFileSync(
      join(root, "pi", "roles", `${name}.md`),
      `---\npurpose: ${name}\n---\n\n${name} body\n`,
    );
  }
}

function snapshotInstall(dest) {
  const out = {};
  for (const base of [".opencode/skills", ".claude/skills"]) {
    const skillDir = join(dest, base, "demo-mode");
    out[`${base}/SKILL.md`] = readFileSync(join(skillDir, "SKILL.md"), "utf8");
    out[`${base}/playbooks`] = {};
    for (const name of readdirSync(join(skillDir, "playbooks")).sort()) {
      out[`${base}/playbooks`][name] = readFileSync(
        join(skillDir, "playbooks", name),
        "utf8",
      );
    }
  }
  return out;
}
