#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const errors = [];

function walkMarkdown(dir, files = []) {
  if (!existsSync(dir)) return files;
  for (const name of readdirSync(dir)) {
    if (name.startsWith(".")) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walkMarkdown(full, files);
    else if (name.endsWith(".md")) files.push(full);
  }
  return files;
}

function readAll(files) {
  return files
    .filter((path) => existsSync(path))
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");
}

const STATUS_CHAIN =
  /draft[`']?\s*(?:→|->|\/)\s*[`']?ready[`']?\s*(?:→|->|\/)\s*[`']?claimed[`']?\s*(?:→|->|\/)\s*[`']?implemented[`']?\s*(?:→|->|\/)\s*[`']?completed/;

const BUILDER_CLAIM_STOP =
  /builder(?: skill)? claims and stops at [`']?implemented[`']? unless the invoked prompt is through-to-complete/i;

const skillsDir = join(root, "ai", "skills", "heio-stack");
if (existsSync(skillsDir)) {
  const skillsText = readAll(walkMarkdown(skillsDir));
  if (!STATUS_CHAIN.test(skillsText)) {
    errors.push(
      "heio-stack skills do not name draft, ready, claimed, implemented, completed",
    );
  }
  const archivesCompleted =
    skillsText.includes(".heio/archive/planning/task-pool/") ||
    /completed task files move to (?:archive|\.heio\/archive)/i.test(
      skillsText,
    ) ||
    /completed.{0,80}\.heio\/archive/i.test(skillsText) ||
    /\.heio\/archive.{0,80}completed/i.test(skillsText);
  if (!archivesCompleted) {
    errors.push(
      "heio-stack skills do not say completed task files move to .heio/archive/planning/task-pool/ or .heio/archive",
    );
  }
} else {
  errors.push("missing ai/skills/heio-stack");
}

const roleAgents = [
  [
    "heio-builder",
    join(root, "ai", "agents", "heio-builder", "heio-builder.md"),
  ],
  ["heio-triage", join(root, "ai", "agents", "heio-triage", "heio-triage.md")],
];

for (const [name, path] of roleAgents) {
  if (!existsSync(path)) {
    errors.push(`missing ${name} agent`);
    continue;
  }
  const text = readFileSync(path, "utf8");
  if (!STATUS_CHAIN.test(text)) {
    errors.push(
      `${name} does not name draft, ready, claimed, implemented, completed`,
    );
  }
  if (name === "heio-builder" && !BUILDER_CLAIM_STOP.test(text)) {
    errors.push(
      "heio-builder does not claim and stop at implemented unless the invoked prompt is through-to-complete",
    );
  }
  if (name === "heio-triage") {
    if (
      !/unblocked active slice or (?:the )?(?:planning\/)?(?:task[- ]?)?pool/i.test(
        text,
      )
    ) {
      errors.push(
        "heio-triage does not route to an unblocked active slice or the pool",
      );
    }
    if (/\bthe active slice\b/i.test(text)) {
      errors.push("heio-triage still requires a singular the active slice");
    }
  }
}

const ROLE_SKILL_PIPELINE = /role skill(?: is|=) (?:the )?pipeline/i;
const PLAIN_PI_NOT_TRAPPED = /plain [`']?pi[`']? is not trapped/i;

const agentsPath = join(root, "AGENTS.md");
if (existsSync(agentsPath)) {
  const agentsText = readFileSync(agentsPath, "utf8");
  if (!ROLE_SKILL_PIPELINE.test(agentsText)) {
    errors.push("AGENTS.md does not say role skill is the pipeline");
  }
  if (!PLAIN_PI_NOT_TRAPPED.test(agentsText)) {
    errors.push("AGENTS.md does not say plain pi is not trapped");
  }
} else {
  errors.push("missing AGENTS.md");
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("check-map-pool-pipelines: ok");
