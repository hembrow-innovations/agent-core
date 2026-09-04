#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const errors = [];

const skillPath = join(
  root,
  "ai",
  "skills",
  "heio-stack",
  "heio-rounds",
  "SKILL.md",
);
const startPath = join(
  root,
  "ai",
  "prompts",
  "heio-stack",
  "heio-rounds-start.md",
);
const resumePath = join(
  root,
  "ai",
  "prompts",
  "heio-stack",
  "heio-rounds-resume.md",
);
const profiles = [
  join(root, "profiles", "agentic-core", "profile.yaml"),
  join(root, "profiles", "heio-stack", "profile.yaml"),
];

const STATUSES = [
  "awaiting-answers",
  "ready-to-resume",
  "awaiting-confirm",
  "published",
];

function readOrError(path, label) {
  if (!existsSync(path)) {
    errors.push(`missing ${label}`);
    return null;
  }
  return readFileSync(path, "utf8");
}

function listItem(text, name) {
  return new RegExp(`^\\s*-\\s+${name}\\s*$`, "m").test(text);
}

const skill = readOrError(
  skillPath,
  "ai/skills/heio-stack/heio-rounds/SKILL.md",
);
const start = readOrError(
  startPath,
  "ai/prompts/heio-stack/heio-rounds-start.md",
);
readOrError(resumePath, "ai/prompts/heio-stack/heio-rounds-resume.md");

if (skill !== null) {
  for (const status of STATUSES) {
    if (!skill.includes(status)) {
      errors.push(`skill does not name ${status}`);
    }
  }

  if (!/disable-model-invocation:\s*true/.test(skill)) {
    errors.push("skill does not set disable-model-invocation: true");
  }

  if (!/does not publish/i.test(skill)) {
    errors.push("skill does not say it does not publish");
  }
  if (!/frozen slices/.test(skill)) {
    errors.push("skill does not forbid frozen slices");
  }
  if (!/task-pool/.test(skill)) {
    errors.push("skill does not forbid task-pool write");
  }
  if (!/awaiting-confirm/.test(skill)) {
    errors.push("skill does not require the confirm stop");
  }
}

const sittingHaystack = `${skill ?? ""}\n${start ?? ""}`;
if (skill !== null || start !== null) {
  if (!sittingHaystack.includes("sitting-kind")) {
    errors.push("skill or start prompt does not name sitting-kind");
  }
  for (const kind of ["planning", "wayfinder"]) {
    if (!sittingHaystack.includes(kind)) {
      errors.push(
        `skill or start prompt does not name ${kind} as sitting-kind`,
      );
    }
  }
}

for (const profilePath of profiles) {
  const rel = profilePath.slice(root.length + 1);
  const profile = readOrError(profilePath, rel);
  if (profile === null) continue;
  if (!listItem(profile, "heio-rounds")) {
    errors.push(`${rel} does not list skill heio-rounds`);
  }
  if (!listItem(profile, "heio-rounds-start")) {
    errors.push(`${rel} does not list prompt heio-rounds-start`);
  }
  if (!listItem(profile, "heio-rounds-resume")) {
    errors.push(`${rel} does not list prompt heio-rounds-resume`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("check-rounds-loop: ok");
