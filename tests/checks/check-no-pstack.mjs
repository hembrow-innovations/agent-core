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
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { findAgentFile, findSkillDir, loadProfile, listProfiles } from "../lib/profile.mjs";

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

if (existsSync(join(root, "ai", "pi"))) {
  errors.push("ai/pi/ leftover; Pi runtime is deprecated");
}
if (existsSync(join(root, "ai", "system-prompts"))) {
  errors.push(
    "ai/system-prompts/ leftover; Pi runtime is deprecated under deprecated/system-prompts/",
  );
}
if (!existsSync(join(root, "deprecated", "system-prompts", "default.md"))) {
  errors.push("deprecated/system-prompts/ missing default.md");
}
if (existsSync(join(root, "ai", "skills", "heio-stack"))) {
  errors.push(
    "ai/skills/heio-stack leftover; heio-stack lives in stacks/heio-stack/",
  );
}
if (!existsSync(join(root, "stacks", "heio-stack"))) {
  errors.push("stacks/heio-stack missing");
}
for (const name of listProfiles(root)) {
  const profile = loadProfile(root, name);
  const needed = new Set(profile.skills);
  for (const skill of [...needed].sort()) {
    if (!findSkillDir(root, skill))
      errors.push(`profile ${name}: missing skill ${skill}`);
  }
  if (profile.agents.kind === "list") {
    for (const id of profile.agents.ids) {
      if (!findAgentFile(root, id))
        errors.push(`profile ${name}: missing agent ${id}`);
    }
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
  const setupSkill = join(dest, ".opencode", "skills", "heio-stack", "SKILL.md");
  if (!existsSync(setupSkill)) {
    console.error("agentic-core install did not copy heio-stack");
    process.exit(1);
  }
  if (existsSync(join(dest, ".opencode", "playbooks"))) {
    console.error("agentic-core install still copied .opencode/playbooks");
    process.exit(1);
  }
  if (existsSync(join(dest, ".opencode", "skills", "heio-mode"))) {
    console.error("agentic-core install still copied heio-mode");
    process.exit(1);
  }
  if (existsSync(join(dest, ".pi"))) {
    console.error("agentic-core install wrote .pi");
    process.exit(1);
  }
  for (const extra of [".claude", ".agents"]) {
    if (existsSync(join(dest, extra))) {
      console.error(`agentic-core install wrote ${extra}`);
      process.exit(1);
    }
  }
  console.log("check-no-pstack: ok");
} finally {
  rmSync(dest, { recursive: true, force: true });
}
