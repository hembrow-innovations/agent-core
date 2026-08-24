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

const piRoot = join(root, "ai", "pi");
if (existsSync(piRoot)) {
  const names = new Set(readdirSync(piRoot).filter((n) => !n.startsWith(".")));
  const allowed = new Set([
    "APPEND_SYSTEM.md",
    "draconic-models.md",
    "prompts",
    "packages.json",
    "roles",
    "agents",
    "settings.json",
  ]);
  const required = new Set(allowed);
  required.delete("prompts");
  for (const need of required) {
    if (!names.has(need)) errors.push(`ai/pi/ missing ${need}`);
  }
  const extra = [...names].filter((n) => !allowed.has(n)).sort();
  if (extra.length) errors.push(`ai/pi/ unexpected ${extra.join(", ")}`);
  for (const rel of [
    "ai/pi/roles/argv.mjs",
    "ai/pi/roles/researcher.md",
    "ai/pi/roles/architect.md",
    "ai/pi/roles/coder.md",
    "ai/pi/agents/draconic.md",
  ]) {
    if (!existsSync(join(root, rel))) errors.push(`missing ${rel}`);
  }
}

for (const name of listProfiles(root)) {
  const profile = loadProfile(root, name);
  const needed = new Set(profile.skills);
  if (profile.mode) needed.add(`${profile.mode}-mode`);
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
      "draconic",
    ],
    { encoding: "utf8" },
  );
  if (r.status !== 0) {
    console.error(r.stdout);
    console.error(r.stderr);
    process.exit(1);
  }
  const modeSkill = join(dest, ".pi", "skills", "draconic-mode", "SKILL.md");
  const setupSkill = join(dest, ".pi", "skills", "setup-draconic", "SKILL.md");
  if (!existsSync(modeSkill) || !existsSync(setupSkill)) {
    console.error(
      "draconic install did not copy draconic-mode and setup-draconic",
    );
    process.exit(1);
  }
  const body = readFileSync(modeSkill, "utf8");
  if (!body.includes("Pi runtime adapter")) {
    console.error("installed draconic-mode is missing the Pi adapter");
    process.exit(1);
  }
  if (body.includes("OpenCode runtime adapter")) {
    console.error("installed draconic-mode still has the OpenCode adapter");
    process.exit(1);
  }
  for (const extra of [".opencode", ".claude", ".agents"]) {
    if (existsSync(join(dest, extra))) {
      console.error(`draconic install wrote ${extra}`);
      process.exit(1);
    }
  }
  console.log("check-no-pstack: ok");
} finally {
  rmSync(dest, { recursive: true, force: true });
}
