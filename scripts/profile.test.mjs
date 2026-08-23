import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
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
mode: poteto
pstack: true
agents: false
playbooks: all
skills: [architect, arena]
empty: []
`);
  assert.deepEqual(got, {
    mode: "poteto",
    pstack: true,
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
  writeYaml(root, "all", "playbooks: all\nmode: poteto\n");
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
    pstack: false,
  });

  assert.deepEqual(loadProfile(root, "all").playbooks, { kind: "all" });
  assert.equal(loadProfile(root, "all").mode, "poteto");
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
  assert.equal(p.mode, "poteto");
  assert.deepEqual(p.playbooks, { kind: "all" });
  assert.equal(p.pstack, true);
  assert.equal(p.agents, true);
  assert.equal(p.commands, true);
  assert.equal(p.templates, true);
  assert.deepEqual(p.skills, [
    "architect",
    "arena",
    "automate-me",
    "blast-radius",
    "bro",
    "create-verification-skill",
    "docs",
    "figure-it-out",
    "how",
    "improve-codebase-architecture",
    "interrogate",
    "maestro",
    "maintain-verification-skill",
    "no-comments",
    "playwright-cli",
    "poteto-mode",
    "principle-boundary-discipline",
    "principle-build-the-lever",
    "principle-contracts-have-two-altitudes",
    "principle-encode-lessons-in-structure",
    "principle-exhaust-the-design-space",
    "principle-experience-first",
    "principle-fix-root-causes",
    "principle-foundational-thinking",
    "principle-guard-the-context-window",
    "principle-intent-ladder-stop",
    "principle-laziness-protocol",
    "principle-make-operations-idempotent",
    "principle-migrate-callers-then-delete-legacy-apis",
    "principle-minimize-reader-load",
    "principle-model-the-domain",
    "principle-never-block-on-the-human",
    "principle-occurrences-project-never-materialize",
    "principle-outcome-oriented-execution",
    "principle-personal-home-shared-bridge",
    "principle-prove-it-works",
    "principle-react-api-owns-shared-behaviour",
    "principle-redesign-from-first-principles",
    "principle-rls-is-the-security-boundary",
    "principle-separate-before-serializing-shared-state",
    "principle-sequence-verifiable-units",
    "principle-subtract-before-you-add",
    "principle-type-system-discipline",
    "principle-zod-degrades-never-blanks",
    "prototype",
    "recall",
    "reflect",
    "setup-pstack",
    "show-me-your-work",
    "swarm",
    "tdd",
    "teach",
    "technical-writing",
    "typescript-best-practices",
    "unslop",
    "vitest",
    "wayfinder",
    "why",
  ]);
  const missing = p.skills.filter((name) => !skillHasMarkdown(REPO, name));
  assert.deepEqual(missing, []);
});

function skillHasMarkdown(root, name) {
  if (existsSync(join(root, "pstack", "skills", name, "SKILL.md"))) return true;
  if (existsSync(join(root, "pi", "skills", name, "SKILL.md"))) return true;
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

