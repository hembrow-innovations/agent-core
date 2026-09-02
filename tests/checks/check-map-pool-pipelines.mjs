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

const COMPLETER_ARCHIVES =
  /whoever sets [`']?completed[`']? moves the file to [`']?\.heio\/archive\/pool\/[`']?/i;

const REVIEWER_NO_HUNT = /reviewer does not hunt archive for work/i;

const skillsDir = join(root, "ai", "skills", "heio-stack");
if (existsSync(skillsDir)) {
  const skillsText = readAll(walkMarkdown(skillsDir));
  if (!STATUS_CHAIN.test(skillsText)) {
    errors.push(
      "heio-stack skills do not name draft, ready, claimed, implemented, completed",
    );
  }
  if (!/anyone may draft/i.test(skillsText)) {
    errors.push("heio-stack skills do not say anyone may draft");
  }
  if (!/planning or triage marks [`']?ready[`']?/i.test(skillsText)) {
    errors.push("heio-stack skills do not say planning or triage marks ready");
  }
  if (!BUILDER_CLAIM_STOP.test(skillsText)) {
    errors.push(
      "heio-stack skills do not say a builder claims and stops at implemented unless the invoked prompt is through-to-complete",
    );
  }
  if (!COMPLETER_ARCHIVES.test(skillsText)) {
    errors.push(
      "heio-stack skills do not say whoever sets completed moves the file to .heio/archive/pool/",
    );
  }
  if (!REVIEWER_NO_HUNT.test(skillsText)) {
    errors.push(
      "heio-stack skills do not say reviewer does not hunt archive for work",
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
