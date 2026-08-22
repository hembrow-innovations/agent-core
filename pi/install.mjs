#!/usr/bin/env node
/**
 * Install draconic into a project for Pi.
 *
 *   node /path/to/agent-core/pi/install.mjs
 *   node /path/to/agent-core/pi/install.mjs /path/to/project
 */

import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

function usage() {
  console.log(`draconic install (Pi)

Usage:
  install.mjs [targetDir]

Copies this pack into the project:
  skills/      → .pi/skills/ and .agents/skills/
  prompts/     → .pi/prompts/
  extensions/  → .pi/extensions/
  APPEND_SYSTEM.md, draconic-models.md, WORKFLOW.md, DRACONIC-INDEX.md
  AGENTS.md only if missing

Then: cd into the project, run pi, trust the folder, /draconic-mode
`);
}

function die(msg) {
  console.error(msg);
  process.exit(1);
}

function copyDir(src, dest) {
  mkdirSync(dirname(dest), { recursive: true });
  rmSync(dest, { recursive: true, force: true });
  cpSync(src, dest, { recursive: true });
}

function copyFileIfMissing(src, dest, label) {
  if (existsSync(dest)) {
    console.log(`  skip (exists): ${label}`);
    return;
  }
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(src, dest);
  console.log(`  write: ${label}`);
}

function writeIfMissing(dest, body, label) {
  if (existsSync(dest)) {
    console.log(`  skip (exists): ${label}`);
    return;
  }
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, body, "utf8");
  console.log(`  write: ${label}`);
}

function listSkillDirs(root) {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true })
    .filter((ent) => ent.isDirectory() && !ent.name.startsWith("."))
    .map((ent) => ent.name)
    .filter((name) => existsSync(join(root, name, "SKILL.md")));
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes("-h") || args.includes("--help")) {
    usage();
    return;
  }
  const target = resolve(args[0] || process.cwd());
  if (!existsSync(target) || !statSync(target).isDirectory()) {
    die(`Target does not exist: ${target}`);
  }

  const skillsSrc = join(HERE, "skills");
  const promptsSrc = join(HERE, "prompts");
  const extensionsSrc = join(HERE, "extensions");
  if (!existsSync(join(skillsSrc, "draconic-mode", "SKILL.md"))) {
    die(`Pack incomplete: missing ${join(skillsSrc, "draconic-mode", "SKILL.md")}`);
  }

  console.log(`Installing draconic into ${target}`);

  const skillNames = listSkillDirs(skillsSrc);
  for (const name of skillNames) {
    const src = join(skillsSrc, name);
    for (const destBase of [join(".pi", "skills"), join(".agents", "skills")]) {
      const dest = join(target, destBase, name);
      copyDir(src, dest);
      console.log(`  skill ${name} → ${destBase}/${name}`);
    }
  }

  if (existsSync(promptsSrc)) {
    const dest = join(target, ".pi", "prompts");
    mkdirSync(dest, { recursive: true });
    for (const ent of readdirSync(promptsSrc, { withFileTypes: true })) {
      if (!ent.isFile() || !ent.name.endsWith(".md")) continue;
      cpSync(join(promptsSrc, ent.name), join(dest, ent.name));
      console.log(`  prompt ${ent.name} → .pi/prompts/${ent.name}`);
    }
  }

  if (existsSync(extensionsSrc)) {
    const dest = join(target, ".pi", "extensions");
    mkdirSync(dest, { recursive: true });
    for (const ent of readdirSync(extensionsSrc, { withFileTypes: true })) {
      if (!ent.isFile() || !(ent.name.endsWith(".ts") || ent.name.endsWith(".js"))) continue;
      cpSync(join(extensionsSrc, ent.name), join(dest, ent.name));
      console.log(`  extension ${ent.name} → .pi/extensions/${ent.name}`);
    }
  }

  copyFileIfMissing(join(HERE, "APPEND_SYSTEM.md"), join(target, ".pi", "APPEND_SYSTEM.md"), ".pi/APPEND_SYSTEM.md");
  cpSync(join(HERE, "draconic-models.md"), join(target, ".pi", "draconic-models.md"));
  console.log("  write: .pi/draconic-models.md");
  copyFileIfMissing(join(HERE, "WORKFLOW.md"), join(target, "WORKFLOW.md"), "WORKFLOW.md");
  cpSync(join(HERE, "DRACONIC-INDEX.md"), join(target, "DRACONIC-INDEX.md"));
  console.log("  write: DRACONIC-INDEX.md");
  copyFileIfMissing(join(HERE, "AGENTS.md"), join(target, "AGENTS.md"), "AGENTS.md");

  writeIfMissing(
    join(target, ".draconic", ".gitignore"),
    "worktrees/\nsessions/\n",
    ".draconic/.gitignore",
  );

  const gitignore = join(target, ".pi", ".gitignore");
  if (!existsSync(gitignore)) {
    writeFileSync(gitignore, "npm/\ngit/\n", "utf8");
    console.log("  write: .pi/.gitignore");
  }

  console.log("Done.");
  console.log("Next: cd into the project, run `pi`, trust the folder, then /draconic-mode.");
  console.log("Optional: /setup-draconic and /create-verification-skill.");
}

main();
