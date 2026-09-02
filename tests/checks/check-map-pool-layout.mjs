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
} else {
  errors.push("missing ai/skills/heio-stack/heio-stack/rules/layout.md");
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("check-map-pool-layout: ok");
