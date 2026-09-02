#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const layoutPath = join(
  root,
  "ai",
  "skills",
  "heio-stack",
  "heio-stack",
  "rules",
  "layout.md",
);
const errors = [];

if (existsSync(layoutPath)) {
  const text = readFileSync(layoutPath, "utf8");

  if (!text.includes(".heio/pool/")) {
    errors.push("layout.md does not name .heio/pool/");
  }
  if (!/one markdown file per task/i.test(text)) {
    errors.push(
      "layout.md does not name .heio/pool/ as one markdown file per task",
    );
  }
  if (!text.includes(".heio/archive/pool/")) {
    errors.push("layout.md does not name .heio/archive/pool/");
  }
  if (!/moved on [`']?completed[`']?/i.test(text)) {
    errors.push(
      "layout.md does not say .heio/archive/pool/ is moved on completed",
    );
  }
  if (!/a slice is one markdown file/i.test(text)) {
    errors.push("layout.md does not say a slice is one markdown file");
  }
  if (!/status,\s*oracle checklist/i.test(text)) {
    errors.push(
      "layout.md does not say the slice file has status, oracle checklist",
    );
  }
  if (!/durable (?:pool-id links|links to pool ids)/i.test(text)) {
    errors.push(
      "layout.md does not name durable pool-id links on the slice file",
    );
  }
  if (!/shape\.md[`']? stays the grouping/i.test(text)) {
    errors.push("layout.md does not say sprint shape.md stays the grouping");
  }
  if (!/met[`']? means linked pool ids are [`']?completed[`']?/i.test(text)) {
    errors.push(
      "layout.md does not say slice met means linked pool ids are completed",
    );
  }
  if (!/oracles hold/i.test(text)) {
    errors.push("layout.md does not say slice met requires oracles hold");
  }
  if (!/links are never dropped/i.test(text)) {
    errors.push("layout.md does not say links are never dropped");
  }
} else {
  errors.push("missing ai/skills/heio-stack/heio-stack/rules/layout.md");
}

const templatesDir = join(
  root,
  "ai",
  "skills",
  "heio-stack",
  "heio-stack",
  "templates",
);

function readTemplate(name) {
  const path = join(templatesDir, name);
  if (!existsSync(path)) {
    errors.push(`missing templates/${name}`);
    return null;
  }
  return readFileSync(path, "utf8");
}

const sliceText = readTemplate("slice.md");
if (sliceText !== null) {
  if (!/\bstatus:/i.test(sliceText)) {
    errors.push("one-file slice template does not include status");
  }
  if (!/oracle checklist/i.test(sliceText)) {
    errors.push("one-file slice template does not include oracle checklist");
  }
  if (!/durable links to pool ids/i.test(sliceText)) {
    errors.push(
      "one-file slice template does not include durable links to pool ids",
    );
  }
}

const poolText = readTemplate("pool-task.md");
if (poolText !== null) {
  if (!/\bid:/i.test(poolText)) {
    errors.push("pool task template does not include id");
  }
  if (!/\btitle:/i.test(poolText)) {
    errors.push("pool task template does not include title");
  }
  if (!/\bstatus:/i.test(poolText)) {
    errors.push("pool task template does not include status");
  }
  if (!/\bdone\b/i.test(poolText)) {
    errors.push("pool task template does not include done");
  }
  if (!/\bcontext\b/i.test(poolText)) {
    errors.push("pool task template does not include context");
  }
  if (!/\bverify\b/i.test(poolText)) {
    errors.push("pool task template does not include verify");
  }
  if (!/optional links/i.test(poolText)) {
    errors.push("pool task template does not include optional links");
  }
  if (!poolText.includes("scope:")) {
    errors.push("pool task template does not include scope:");
  }
}

const kindsPath = join(
  root,
  "ai",
  "skills",
  "heio-stack",
  "heio-stack",
  "rules",
  "template-kinds.md",
);

if (existsSync(kindsPath)) {
  const kinds = readFileSync(kindsPath, "utf8");
  const existingMappings = [
    "templates/intent.md",
    "templates/roadmap.md",
    "templates/location.md",
    "templates/sprint-shape.md",
    "templates/slice-spec.md",
    "templates/slice-oracles.md",
    "templates/slice-tasks.md",
    "templates/ticket.md",
    "templates/archive-index.md",
  ];
  for (const mapping of existingMappings) {
    if (!kinds.includes(mapping)) {
      errors.push(`template-kinds.md dropped existing kind mapping ${mapping}`);
    }
  }

  const sliceLine = kinds
    .split("\n")
    .find((line) => line.includes("templates/slice.md"));
  if (!sliceLine) {
    errors.push(
      "template-kinds.md does not point at the one-file slice template templates/slice.md",
    );
  } else if (!/s-<slug>\.md/.test(sliceLine)) {
    errors.push(
      "template-kinds.md does not map the one-file slice template to s-<slug>.md so new slices copy it",
    );
  }

  const poolLine = kinds
    .split("\n")
    .find((line) => line.includes("templates/pool-task.md"));
  if (!poolLine) {
    errors.push(
      "template-kinds.md does not point at the pool-task template templates/pool-task.md",
    );
  } else if (!poolLine.includes(".heio/pool/")) {
    errors.push(
      "template-kinds.md does not map the pool-task template to .heio/pool/",
    );
  }
} else {
  errors.push(
    "missing ai/skills/heio-stack/heio-stack/rules/template-kinds.md",
  );
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("check-map-pool-layout: ok");
