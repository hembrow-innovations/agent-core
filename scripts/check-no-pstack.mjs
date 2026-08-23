#!/usr/bin/env node
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadProfile, listProfiles } from "./profile.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
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
const scanRoots = ["scripts", "profiles", "agents", "commands", "playbooks"].map((d) => join(root, d));
for (const dir of scanRoots) {
  walkFiles(dir, (file) => {
    if (file.endsWith(".tsv") || file.endsWith("check-no-pstack.mjs")) return;
    const text = readFileSync(file, "utf8");
    for (const re of banned) {
      if (re.test(text)) errors.push(`${file.replace(root + "/", "")} matches ${re}`);
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
  walkSkillDirs(join(root, "skills"), (dir) => {
    if (basename(dir) === name) candidates.push(dir);
  });
  const prefer = ["skills/workflow", "skills/setup"].map((rel) => join(root, rel) + "/");
  for (const prefix of prefer) {
    const hit = candidates.find((p) => p.startsWith(prefix));
    if (hit) return hit;
  }
  return candidates[0] ?? null;
}

const piRoot = join(root, "pi");
if (existsSync(piRoot)) {
  const extra = readdirSync(piRoot).filter((n) => !n.startsWith(".") && n !== "extensions");
  if (extra.length) errors.push(`pi/ should only contain extensions/, found ${extra.join(", ")}`);
}

for (const name of listProfiles(root)) {
  const profile = loadProfile(root, name);
  const needed = new Set(profile.skills);
  if (profile.mode) needed.add(`${profile.mode}-mode`);
  for (const skill of [...needed].sort()) {
    if (!resolveSkill(skill)) errors.push(`profile ${name}: missing skill ${skill}`);
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
    [join(root, "scripts", "install.mjs"), dest, "--local", root, "--profile", "draconic", "--no-templates"],
    { encoding: "utf8" },
  );
  if (r.status !== 0) {
    console.error(r.stdout);
    console.error(r.stderr);
    process.exit(1);
  }
  const modeSkill = join(dest, ".opencode", "skills", "draconic-mode", "SKILL.md");
  const setupSkill = join(dest, ".opencode", "skills", "setup-draconic", "SKILL.md");
  if (!existsSync(modeSkill) || !existsSync(setupSkill)) {
    console.error("draconic install did not copy draconic-mode and setup-draconic");
    process.exit(1);
  }
  const body = readFileSync(modeSkill, "utf8");
  if (!body.includes("OpenCode runtime adapter")) {
    console.error("installed draconic-mode is missing the OpenCode adapter");
    process.exit(1);
  }
  const piMode = join(dest, ".pi", "skills", "draconic-mode", "SKILL.md");
  if (!existsSync(piMode)) {
    console.error("draconic install did not copy the Pi pack");
    process.exit(1);
  }
  const piBody = readFileSync(piMode, "utf8");
  if (!piBody.includes("Pi runtime adapter")) {
    console.error("installed .pi/draconic-mode is missing the Pi adapter");
    process.exit(1);
  }
  if (!existsSync(join(dest, ".pi", "extensions", "draconic-spawn.ts"))) {
    console.error("draconic install did not copy Pi extensions");
    process.exit(1);
  }
  if (existsSync(join(dest, ".pi", "prompts")) || existsSync(join(dest, ".pi", "APPEND_SYSTEM.md"))) {
    console.error("pi install wrote removed runtime files");
    process.exit(1);
  }
  console.log("check-no-pstack: ok");
} finally {
  rmSync(dest, { recursive: true, force: true });
}
