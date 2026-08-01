#!/usr/bin/env node
/**
 * agent-core installer
 *
 *   curl -fsSL https://raw.githubusercontent.com/hembrow-innovations/agent-core/main/scripts/install.mjs | node -- --profile core
 *   node scripts/install.mjs --profile web
 *   node scripts/install.mjs /path/to/project --profile mobile --with maestro --without tdd --ref main
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
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = "hembrow-innovations/agent-core";
const DEFAULT_REF = "main";

const CORE_SKILLS = [
  "grill-me",
  "grilling",
  "grill-with-docs",
  "domain-modeling",
  "wayfinder",
  "tdd",
  "handoff",
  "improve-codebase-architecture",
  "codebase-design",
  "setup-matt-pocock-skills",
  "research",
  "prototype",
];

const PROFILES = {
  core: [...CORE_SKILLS],
  web: [...CORE_SKILLS, "playwright-cli"],
  mobile: [...CORE_SKILLS, "maestro"],
  full: [...CORE_SKILLS, "playwright-cli", "maestro"],
};

const SKILL_DESTS = [".opencode/skills", ".claude/skills"];
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
  --profile <name>   core (default) | web | mobile | full
  --with <skills>    comma-separated skills to add
  --without <skills> comma-separated skills to remove
  --ref <git-ref>    GitHub ref when fetching remotely (default: main)
  --local <path>     Use a local agent-core checkout instead of GitHub
  -h, --help         Show help

Examples:
  curl -fsSL https://raw.githubusercontent.com/${REPO}/main/scripts/install.mjs | node -- --profile web
  node scripts/install.mjs ~/Projects/my-app --profile mobile
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
  };
  const args = [...argv];
  while (args.length) {
    const a = args.shift();
    if (a === "-h" || a === "--help") out.help = true;
    else if (a === "--profile") out.profile = need(args, a);
    else if (a === "--with") out.with.push(...need(args, a).split(",").map(s => s.trim()).filter(Boolean));
    else if (a === "--without") out.without.push(...need(args, a).split(",").map(s => s.trim()).filter(Boolean));
    else if (a === "--ref") out.ref = need(args, a);
    else if (a === "--local") out.local = resolve(need(args, a));
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

function resolveSkillSet(opts) {
  const base = PROFILES[opts.profile];
  if (!base) die(`Unknown profile "${opts.profile}". Choose: ${Object.keys(PROFILES).join(", ")}`);
  const set = new Set(base);
  for (const s of opts.with) set.add(s);
  for (const s of opts.without) set.delete(s);
  return [...set].sort();
}

function detectBundledRoot() {
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    const root = join(here, "..");
    if (existsSync(join(root, "skills")) && existsSync(join(root, "preferences", "AGENTS.md"))) {
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

function copySkill(srcRoot, name, target) {
  const src = join(srcRoot, "skills", name);
  if (!existsSync(src) || !statSync(src).isDirectory()) {
    die(`Skill not found in source: ${name} (${src})`);
  }
  if (!existsSync(join(src, "SKILL.md"))) {
    die(`Skill missing SKILL.md: ${name}`);
  }
  for (const destBase of SKILL_DESTS) {
    const dest = join(target, destBase, name);
    mkdirSync(dirname(dest), { recursive: true });
    rmSync(dest, { recursive: true, force: true });
    cpSync(src, dest, { recursive: true });
    console.log(`  skill ${name} → ${destBase}/${name}`);
  }
}

function installPrefs(srcRoot, target) {
  const body = readFileSync(join(srcRoot, "preferences", "AGENTS.md"), "utf8");
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

  const skills = resolveSkillSet(opts);
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
    console.log(`Skills: ${skills.join(", ")}`);

    for (const name of skills) copySkill(srcRoot, name, opts.target);
    installPrefs(srcRoot, opts.target);

    console.log("Done.");
  } finally {
    if (cleanup) rmSync(cleanup, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
