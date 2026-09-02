#!/usr/bin/env node
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadProfile, listProfiles } from "../lib/profile.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const errors = [];

if (existsSync(join(root, "pstack"))) {
  errors.push("pstack/ still exists");
}

function walkFiles(dir, visit) {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return;
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith(".")) continue;
    const full = join(dir, ent.name);
    if (ent.isDirectory()) walkFiles(full, visit);
    else visit(full);
  }
}

const banned = [
  /pstack\/skills/,
  /join\([^)]*["']pstack["']/,
  /poteto-mode/,
  /setup-pstack/,
  /poteto-agent/,
];
const scanRoots = ["scripts", "profiles", "ai/playbooks"].map((d) =>
  join(root, d),
);
for (const dir of scanRoots) {
  walkFiles(dir, (file) => {
    if (file.endsWith(".tsv") || file.endsWith("check-no-pstack.mjs")) return;
    const text = readFileSync(file, "utf8");
    for (const re of banned) {
      if (re.test(text))
        errors.push(`${file.replace(root + "/", "")} matches ${re}`);
    }
  });
}

function walkSkillDirs(dir, visit) {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return;
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    if (!ent.isDirectory() || ent.name.startsWith(".")) continue;
    const full = join(dir, ent.name);
    if (existsSync(join(full, "SKILL.md"))) visit(full);
    else walkSkillDirs(full, visit);
  }
}

function resolveSkill(name) {
  const candidates = [];
  walkSkillDirs(join(root, "ai", "skills"), (dir) => {
    if (basename(dir) === name) candidates.push(dir);
  });
  const prefer = ["ai/skills/workflow", "ai/skills/setup"].map(
    (rel) => join(root, rel) + "/",
  );
  for (const prefix of prefer) {
    const hit = candidates.find((p) => p.startsWith(prefix));
    if (hit) return hit;
  }
  return candidates[0] ?? null;
}

if (existsSync(join(root, "ai", "pi"))) {
  errors.push("ai/pi/ leftover; system prompts live in ai/system-prompts/");
}
const promptRoot = join(root, "ai", "system-prompts");
if (!existsSync(promptRoot)) {
  errors.push("ai/system-prompts/ missing");
} else {
  const names = readdirSync(promptRoot).filter((n) => !n.startsWith("."));
  if (!names.includes("default.md")) {
    errors.push("ai/system-prompts/ missing default.md");
  }
  const extra = names.filter((n) => !n.endsWith(".md")).sort();
  if (extra.length) {
    errors.push(`ai/system-prompts/ unexpected ${extra.join(", ")}`);
  }
}
for (const rel of [
  "ai/agents/architect/architect.md",
  "ai/agents/spec/spec.md",
  "ai/agents/planner/planner.md",
  "ai/agents/coder/coder.md",
  "ai/agents/reviewer/reviewer.md",
  "ai/agents/tester/tester.md",
  "ai/agents/debugger/debugger.md",
  "ai/agents/documenter/documenter.md",
  "ai/agents/devops/devops.md",
  "ai/agents/researcher/researcher.md",
]) {
  if (!existsSync(join(root, rel))) errors.push(`missing ${rel}`);
}

for (const name of listProfiles(root)) {
  const profile = loadProfile(root, name);
  const needed = new Set(profile.skills);
  for (const skill of [...needed].sort()) {
    if (!resolveSkill(skill))
      errors.push(`profile ${name}: missing skill ${skill}`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

const dest = mkdtempSync(join(tmpdir(), "check-no-pstack-"));
try {
  const r = spawnSync(
    process.execPath,
    [
      join(root, "packages", "installer", "src", "cli.ts"),
      "install",
      dest,
      "--profile",
      "agentic-core",
    ],
    { encoding: "utf8" },
  );
  if (r.status !== 0) {
    console.error(r.stdout);
    console.error(r.stderr);
    process.exit(1);
  }
  const setupSkill = join(dest, ".pi", "skills", "heio-stack", "SKILL.md");
  if (!existsSync(setupSkill)) {
    console.error("agentic-core install did not copy heio-stack");
    process.exit(1);
  }
  if (existsSync(join(dest, ".pi", "playbooks"))) {
    console.error("agentic-core install still copied .pi/playbooks");
    process.exit(1);
  }
  if (existsSync(join(dest, ".pi", "skills", "heio-mode"))) {
    console.error("agentic-core install still copied heio-mode");
    process.exit(1);
  }
  for (const extra of [".opencode", ".claude", ".agents"]) {
    if (existsSync(join(dest, extra))) {
      console.error(`agentic-core install wrote ${extra}`);
      process.exit(1);
    }
  }
  console.log("check-no-pstack: ok");
} finally {
  rmSync(dest, { recursive: true, force: true });
}
