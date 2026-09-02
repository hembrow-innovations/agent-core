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
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("check-map-pool-pipelines: ok");
