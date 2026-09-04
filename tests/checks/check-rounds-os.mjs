#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const skillRoot = join(root, "ai", "skills", "heio-stack", "heio-stack");
const errors = [];

const layoutPath = join(skillRoot, "rules", "layout.md");
const skillPath = join(skillRoot, "SKILL.md");
const kindsPath = join(skillRoot, "rules", "template-kinds.md");
const requiredPath = join(skillRoot, "templates", "required-fields.md");
const roundPath = join(skillRoot, "templates", "round.md");

const LIVE_ROUNDS = ".heio/planning/rounds/";
const ARCHIVE_ROUNDS = ".heio/archive/planning/rounds/";
const ARCHIVE_ROUNDS_REL = "archive/planning/rounds/";
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

function namesArchiveRounds(text) {
  return (
    text.includes(ARCHIVE_ROUNDS) ||
    (text.includes(ARCHIVE_ROUNDS_REL) && text.includes(".heio/archive"))
  );
}

const layout = readOrError(
  layoutPath,
  "ai/skills/heio-stack/heio-stack/rules/layout.md",
);
if (layout !== null) {
  if (!layout.includes(LIVE_ROUNDS)) {
    errors.push("layout.md does not name .heio/planning/rounds/");
  }
  if (!namesArchiveRounds(layout)) {
    errors.push("layout.md does not name .heio/archive/planning/rounds/");
  }
}

const skill = readOrError(
  skillPath,
  "ai/skills/heio-stack/heio-stack/SKILL.md",
);
if (skill !== null) {
  if (!skill.includes(LIVE_ROUNDS)) {
    errors.push("heio-stack SKILL.md does not name .heio/planning/rounds/");
  }
  if (!namesArchiveRounds(skill)) {
    errors.push(
      "heio-stack SKILL.md does not name .heio/archive/planning/rounds/",
    );
  }
}

const kinds = readOrError(
  kindsPath,
  "ai/skills/heio-stack/heio-stack/rules/template-kinds.md",
);
if (kinds !== null) {
  const roundLine = kinds
    .split("\n")
    .find((line) => line.includes("templates/round.md"));
  if (!roundLine) {
    errors.push("template-kinds.md does not map templates/round.md");
  } else if (!roundLine.includes(".heio/planning/rounds/<NN>-<slug>.md")) {
    errors.push(
      "template-kinds.md does not map templates/round.md to .heio/planning/rounds/<NN>-<slug>.md",
    );
  }
}

const required = readOrError(
  requiredPath,
  "ai/skills/heio-stack/heio-stack/templates/required-fields.md",
);
if (required !== null) {
  const allowsRound =
    /kind:[^\n]*\bround\b/.test(required) || /\| *round\b/.test(required);
  if (!allowsRound) {
    errors.push("required-fields.md does not allow kind round");
  }
}

const round = readOrError(
  roundPath,
  "ai/skills/heio-stack/heio-stack/templates/round.md",
);
if (round !== null) {
  if (!/\bkind:\s*round\b/.test(round)) {
    errors.push("templates/round.md does not include kind: round");
  }
  if (!/\bsitting-kind\b/.test(round)) {
    errors.push("templates/round.md does not include sitting-kind");
  }
  if (!/\bstatus:/.test(round)) {
    errors.push("templates/round.md does not include status:");
  }
  if (!/^## +Round\b/m.test(round)) {
    errors.push("templates/round.md does not include a Round heading");
  }
}

const statusHaystack = `${layout ?? ""}\n${round ?? ""}`;
for (const status of STATUSES) {
  if (!statusHaystack.includes(status)) {
    errors.push(
      `status ${status} does not appear in layout.md or templates/round.md`,
    );
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("check-rounds-os: ok");
