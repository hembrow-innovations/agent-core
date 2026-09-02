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

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("check-map-pool-layout: ok");
