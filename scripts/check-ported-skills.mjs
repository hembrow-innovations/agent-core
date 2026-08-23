#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

const EXPECTED = [
  "skills/workflow/to-issues",
  "skills/workflow/triage",
  "skills/workflow/verify-issue",
  "skills/engineering/behaviour-contracts",
  "skills/engineering/diagnose",
  "skills/engineering/write-a-skill",
  "skills/engineering/thermo-review",
  "skills/ui/frontend-design",
  "skills/ui/typography",
  "skills/ui/vercel-react-best-practices",
  "skills/data/tanstack-query",
  "skills/data/vault-pack",
  "skills/testing/webapp-testing",
];

const TRACKER_SKILLS = new Set([
  "to-issues",
  "triage",
  "verify-issue",
  "vault-pack",
]);

const errors = [];

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) walk(full, out);
    else if (ent.isFile() && ent.name.endsWith(".md")) out.push(full);
  }
  return out;
}

function hasFrontmatterField(text, field) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return false;
  return new RegExp(`^${field}\\s*:`, "m").test(m[1]);
}

for (const rel of EXPECTED) {
  const dir = join(ROOT, rel);
  const skill = join(dir, "SKILL.md");
  const name = rel.split("/").pop();
  if (!existsSync(skill) || !statSync(skill).isFile()) {
    errors.push(`missing ${rel}/SKILL.md`);
    continue;
  }
  const text = readFileSync(skill, "utf8");
  if (!hasFrontmatterField(text, "name")) errors.push(`${rel}: missing frontmatter name`);
  if (!hasFrontmatterField(text, "description")) errors.push(`${rel}: missing frontmatter description`);
  if (!text.includes(`name: ${name}`) && !text.includes(`name: "${name}"`)) {
    errors.push(`${rel}: name does not match folder`);
  }

  const files = walk(dir);
  for (const file of files) {
    const body = readFileSync(file, "utf8");
    if (body.includes("docs/planning") && !/AGENTS\.md|WORKSPACE\.md|override/.test(body)) {
      errors.push(`${file.replace(ROOT + "/", "")}: docs/planning without AGENTS.md override`);
    }
  }

  if (TRACKER_SKILLS.has(name) && !/management/i.test(text)) {
    errors.push(`${rel}: tracker skill never names management`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`ok ${EXPECTED.length} ported skills`);
