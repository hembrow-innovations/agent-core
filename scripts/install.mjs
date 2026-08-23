#!/usr/bin/env node
/**
 * agent-core installer
 *
 *   curl -fsSL https://raw.githubusercontent.com/hembrow-innovations/agent-core/main/scripts/install.mjs | node - --profile core
 *   node scripts/install.mjs --profile pstack
 *   node scripts/install.mjs /path/to/project --profile mobile --with handoff --ref main
 *   node scripts/install.mjs /path/to/project --local . --profile pstack
 */

import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = "hembrow-innovations/agent-core";
const DEFAULT_REF = "main";

const CORE_SKILLS = [
  "domain-modeling",
  "wayfinder",
  "tdd",
  "handoff",
  "improve-codebase-architecture",
  "codebase-design",
  "setup-matt-pocock-skills",
  "research",
  "prototype",
  "planning",
  "planning-with-docs",
  "management",
  "unslop",
  "bro",
];

/** Skill folder names under pstack/skills (everything with SKILL.md). */
const PSTACK_SKILL_NAMES = [
  "architect",
  "arena",
  "automate-me",
  "blast-radius",
  "bro",
  "create-verification-skill",
  "figure-it-out",
  "how",
  "interrogate",
  "maintain-verification-skill",
  "no-comments",
  "poteto-mode",
  "principle-boundary-discipline",
  "principle-build-the-lever",
  "principle-encode-lessons-in-structure",
  "principle-exhaust-the-design-space",
  "principle-experience-first",
  "principle-fix-root-causes",
  "principle-foundational-thinking",
  "principle-guard-the-context-window",
  "principle-laziness-protocol",
  "principle-make-operations-idempotent",
  "principle-migrate-callers-then-delete-legacy-apis",
  "principle-minimize-reader-load",
  "principle-model-the-domain",
  "principle-never-block-on-the-human",
  "principle-outcome-oriented-execution",
  "principle-prove-it-works",
  "principle-redesign-from-first-principles",
  "principle-separate-before-serializing-shared-state",
  "principle-sequence-verifiable-units",
  "principle-subtract-before-you-add",
  "principle-type-system-discipline",
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
  "why",
];

const PROFILES = {
  core: { skills: [...CORE_SKILLS], pstack: false, agents: false, commands: false, templates: false },
  web: { skills: [...CORE_SKILLS, "playwright-cli", "react-testing"], pstack: false, agents: false, commands: false, templates: false },
  mobile: { skills: [...CORE_SKILLS, "maestro", "react-testing"], pstack: false, agents: false, commands: false, templates: false },
  pstack: {
    skills: [...PSTACK_SKILL_NAMES],
    pstack: true,
    agents: true,
    commands: true,
    templates: true,
  },
  godot: {
    skills: [...PSTACK_SKILL_NAMES, "godot-mono"],
    pstack: true,
    agents: true,
    commands: true,
    templates: true,
  },
  full: {
    skills: [...new Set([...CORE_SKILLS, ...PSTACK_SKILL_NAMES, "playwright-cli", "maestro", "godot-mono", "react-testing"])],
    pstack: true,
    agents: true,
    commands: true,
    templates: true,
  },
};

const SKILL_DESTS = [".opencode/skills", ".claude/skills"];
const AGENT_DEST = join(".opencode", "agent");
const COMMAND_DEST = join(".opencode", "command");
const PREF_DESTS = [
  "AGENTS.md",
  "CLAUDE.md",
  join(".github", "copilot-instructions.md"),
];

function usage() {
  console.log(`agent-core install

Usage:
  install.mjs [targetDir] [options]

Options:
  --profile <name>   core (default) | web | mobile | pstack | godot | full
  --with <skills>    comma-separated skills to add
  --without <skills> comma-separated skills to remove
  --ref <git-ref>    GitHub ref when fetching remotely (default: main)
  --local <path>     Use a local agent-core checkout instead of GitHub
  --no-agents        Skip OpenCode agents (pstack/godot/full)
  --no-commands      Skip OpenCode commands
  --no-templates     Skip opencode.json / WORKFLOW / rules templates
  -h, --help         Show help

Profiles:
  core     Matt Pocock-style engineering skills + prefs
  web      core + playwright-cli + react-testing
  mobile   core + maestro + react-testing
  pstack   full pstack (poteto-mode, playbooks, principles) + OpenCode agents/commands
  godot    pstack + godot-mono skill
  full     everything

Examples:
  curl -fsSL https://raw.githubusercontent.com/${REPO}/main/scripts/install.mjs | node - --profile pstack
  node scripts/install.mjs ~/Projects/my-app --profile godot --local .
  node scripts/install.mjs . --profile core --with godot-mono
`);
}

function parseArgs(argv) {
  const out = {
    target: process.cwd(),
    profile: "core",
    with: [],
    without: [],
    ref: DEFAULT_REF,
    local: null,
    help: false,
    noAgents: false,
    noCommands: false,
    noTemplates: false,
  };
  const args = [...argv];
  while (args.length) {
    const a = args.shift();
    if (a === "-h" || a === "--help") out.help = true;
    else if (a === "--profile") out.profile = need(args, a);
    else if (a === "--with") out.with.push(...need(args, a).split(",").map((s) => s.trim()).filter(Boolean));
    else if (a === "--without") out.without.push(...need(args, a).split(",").map((s) => s.trim()).filter(Boolean));
    else if (a === "--ref") out.ref = need(args, a);
    else if (a === "--local") out.local = resolve(need(args, a));
    else if (a === "--no-agents") out.noAgents = true;
    else if (a === "--no-commands") out.noCommands = true;
    else if (a === "--no-templates") out.noTemplates = true;
    else if (a.startsWith("-")) die(`Unknown flag: ${a}`);
    else out.target = resolve(a);
  }
  return out;
}

function need(args, flag) {
  const v = args.shift();
  if (!v) die(`Missing value for ${flag}`);
  return v;
}

function die(msg) {
  console.error(msg);
  process.exit(1);
}

function resolveProfile(opts) {
  const base = PROFILES[opts.profile];
  if (!base) die(`Unknown profile "${opts.profile}". Choose: ${Object.keys(PROFILES).join(", ")}`);
  const set = new Set(base.skills);
  for (const s of opts.with) set.add(s);
  for (const s of opts.without) set.delete(s);
  return {
    skills: [...set].sort(),
    agents: base.agents && !opts.noAgents,
    commands: base.commands && !opts.noCommands,
    templates: base.templates && !opts.noTemplates,
    pstack: base.pstack,
  };
}

function detectBundledRoot() {
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    const root = join(here, "..");
    if (existsSync(join(root, "skills")) || existsSync(join(root, "pstack"))) {
      return root;
    }
  } catch {
    // stdin / non-file execution
  }
  return null;
}

async function fetchRemoteRoot(ref) {
  const url = `https://codeload.github.com/${REPO}/tar.gz/${encodeURIComponent(ref)}`;
  console.log(`Fetching ${REPO}@${ref} …`);
  const res = await fetch(url);
  if (!res.ok) die(`Failed to download ${url}: ${res.status} ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const dir = mkdtempSync(join(tmpdir(), "agent-core-"));
  const tgz = join(dir, "src.tar.gz");
  writeFileSync(tgz, buf);
  const extract = join(dir, "extract");
  mkdirSync(extract);
  const r = spawnSync("tar", ["-xzf", tgz, "-C", extract], { encoding: "utf8" });
  if (r.status !== 0) die(`tar extract failed: ${r.stderr || r.stdout || "unknown error"}`);
  const entries = readdirSync(extract);
  if (entries.length !== 1) die(`Unexpected tarball layout: ${entries.join(", ")}`);
  return { root: join(extract, entries[0]), cleanup: dir };
}

/** Find skill dir by name under skills/** or pstack/skills/<name>. Prefer pstack for pstack names when both exist and installing pstack. */
function findSkillDir(srcRoot, name, preferPstack) {
  const candidates = [];
  const pstackPath = join(srcRoot, "pstack", "skills", name);
  if (existsSync(join(pstackPath, "SKILL.md"))) candidates.push({ path: pstackPath, source: "pstack" });

  const skillsRoot = join(srcRoot, "skills");
  if (existsSync(skillsRoot)) {
    walkSkillDirs(skillsRoot, (dir) => {
      if (basename(dir) === name && existsSync(join(dir, "SKILL.md"))) {
        candidates.push({ path: dir, source: "skills" });
      }
    });
  }

  if (!candidates.length) return null;
  if (preferPstack) {
    const p = candidates.find((c) => c.source === "pstack");
    if (p) return p.path;
  }
  return candidates[0].path;
}

function walkSkillDirs(root, visit) {
  if (!existsSync(root) || !statSync(root).isDirectory()) return;
  for (const ent of readdirSync(root, { withFileTypes: true })) {
    if (!ent.isDirectory()) continue;
    if (ent.name.startsWith(".")) continue;
    const full = join(root, ent.name);
    if (existsSync(join(full, "SKILL.md"))) visit(full);
    else walkSkillDirs(full, visit);
  }
}

function copySkill(srcRoot, name, target, preferPstack) {
  const src = findSkillDir(srcRoot, name, preferPstack);
  if (!src) die(`Skill not found in source: ${name}`);
  for (const destBase of SKILL_DESTS) {
    const dest = join(target, destBase, name);
    mkdirSync(dirname(dest), { recursive: true });
    rmSync(dest, { recursive: true, force: true });
    cpSync(src, dest, { recursive: true });
    console.log(`  skill ${name} → ${destBase}/${name}`);
  }
}

function copyMarkdownTree(srcDir, destDir, label) {
  if (!existsSync(srcDir)) return 0;
  let n = 0;
  mkdirSync(destDir, { recursive: true });
  for (const ent of readdirSync(srcDir, { withFileTypes: true })) {
    if (!ent.isFile() || !ent.name.endsWith(".md")) continue;
    if (ent.name.toUpperCase() === "README.MD") continue;
    const dest = join(destDir, ent.name);
    cpSync(join(srcDir, ent.name), dest);
    console.log(`  ${label} ${ent.name} → ${destDir.replace(process.cwd() + "/", "")}/${ent.name}`.replace(/\\/g, "/"));
    n++;
  }
  return n;
}

function installAgents(srcRoot, target) {
  const src = join(srcRoot, "agents");
  const dest = join(target, AGENT_DEST);
  const n = copyMarkdownTree(src, dest, "agent");
  if (!n) console.log("  agents: none");
}

function installCommands(srcRoot, target) {
  const src = join(srcRoot, "commands");
  const dest = join(target, COMMAND_DEST);
  const n = copyMarkdownTree(src, dest, "command");
  if (!n) console.log("  commands: none");
}

function installTemplates(srcRoot, target) {
  const tpl = join(srcRoot, "templates", "opencode");
  if (!existsSync(tpl)) {
    console.log("  templates: missing pack");
    return;
  }

  const opencodeJson = join(target, "opencode.json");
  if (!existsSync(opencodeJson)) {
    cpSync(join(tpl, "opencode.json"), opencodeJson);
    console.log("  template write: opencode.json");
  } else {
    console.log("  template skip (exists): opencode.json");
  }

  const rulesSrc = join(tpl, "rules", "pstack-models.md");
  const rulesDest = join(target, ".opencode", "rules", "pstack-models.md");
  mkdirSync(dirname(rulesDest), { recursive: true });
  cpSync(rulesSrc, rulesDest);
  console.log("  template write: .opencode/rules/pstack-models.md");

  for (const name of ["WORKFLOW.md", "PSTACK-INDEX.md"]) {
    const dest = join(target, name);
    if (name === "PSTACK-INDEX.md" || !existsSync(dest)) {
      cpSync(join(tpl, name), dest);
      console.log(`  template write: ${name}`);
    } else {
      console.log(`  template skip (exists): ${name}`);
    }
  }

  const gitignore = join(target, ".opencode", ".gitignore");
  if (!existsSync(gitignore)) {
    mkdirSync(dirname(gitignore), { recursive: true });
    writeFileSync(gitignore, "node_modules/\npackage-lock.json\n", "utf8");
    console.log("  template write: .opencode/.gitignore");
  }
}

function installPrefs(srcRoot, target) {
  const prefPath = join(srcRoot, "preferences", "AGENTS.md");
  if (!existsSync(prefPath)) {
    console.log("  prefs: no preferences/AGENTS.md");
    return;
  }
  const body = readFileSync(prefPath, "utf8");
  for (const rel of PREF_DESTS) {
    const dest = join(target, rel);
    if (existsSync(dest)) {
      console.log(`  prefs skip (exists): ${rel}`);
      continue;
    }
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, body, "utf8");
    console.log(`  prefs write: ${rel}`);
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    usage();
    return;
  }

  const plan = resolveProfile(opts);
  let srcRoot = opts.local || detectBundledRoot();
  let cleanup = null;

  if (!srcRoot) {
    const remote = await fetchRemoteRoot(opts.ref);
    srcRoot = remote.root;
    cleanup = remote.cleanup;
  } else {
    console.log(`Using local source: ${srcRoot}`);
  }

  try {
    if (!existsSync(opts.target)) die(`Target does not exist: ${opts.target}`);
    console.log(`Installing into ${opts.target}`);
    console.log(`Profile: ${opts.profile}`);
    console.log(`Skills (${plan.skills.length}): ${plan.skills.join(", ")}`);

    for (const name of plan.skills) copySkill(srcRoot, name, opts.target, plan.pstack);
    if (plan.agents) installAgents(srcRoot, opts.target);
    if (plan.commands) installCommands(srcRoot, opts.target);
    if (plan.templates) installTemplates(srcRoot, opts.target);
    installPrefs(srcRoot, opts.target);

    console.log("Done.");
    if (plan.pstack) {
      console.log("Next: open the project in OpenCode, run /setup-pstack, optionally /create-verification-skill.");
    }
  } finally {
    if (cleanup) rmSync(cleanup, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
