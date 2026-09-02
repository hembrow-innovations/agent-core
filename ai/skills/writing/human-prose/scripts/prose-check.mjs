#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";

const KILL = [
  /\bdelve(?:s|d|ing)?\b/i,
  /\btapestry\b/i,
  /\bunderscores?\b/i,
  /\bpivotal\b/i,
  /\bembark(?:s|ed|ing)?\b/i,
  /\bnestled\b/i,
  /\bvibrant\b/i,
  /\brealm\b/i,
  /\btestament to\b/i,
  /\ba dance of\b/i,
  /\bcould not help but\b/i,
  /\bcouldn't help but\b/i,
  /\blittle did\b/i,
  /\band then everything changed\b/i,
  /\bthe air was thick\b/i,
  /\bwords hung in the air\b/i,
  /\ba smile played\b/i,
  /\bsomething inside (?:him|her|them)\b/i,
  /\bprofound\b/i,
  /\bmoreover\b/i,
  /\bfurthermore\b/i,
  /\butilize(?:s|d|ing)?\b/i,
  /\bnecessitate(?:s|d)?\b/i,
  /\blandscape of\b/i,
  /\bin the tapestry\b/i,
  /\bthe very fabric\b/i,
];

const DASH = /[—–]/;
const SHORT = 6;
const STACCATO = 4;

export function stripFrontmatter(src) {
  if (!src.startsWith("---")) return src;
  const end = src.indexOf("\n---", 3);
  if (end === -1) return src;
  const after = src.indexOf("\n", end + 4);
  return after === -1 ? "" : src.slice(after + 1);
}

export function wordCount(text) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length;
}

function sentences(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function checkProse(src, opts = {}) {
  const min = opts.min ?? 1500;
  const issues = [];
  if (!src.trim()) {
    issues.push("empty file");
    return { ok: false, words: 0, issues };
  }
  const body = stripFrontmatter(src);
  const words = wordCount(body);
  if (words < min) issues.push(`word count ${words} < ${min}`);
  if (DASH.test(body)) issues.push("em dash or en dash present");
  for (const re of KILL) {
    const m = body.match(re);
    if (m) issues.push(`kill-list: ${m[0]}`);
  }
  const sents = sentences(body.replace(/\n+/g, " "));
  let run = 0;
  for (const s of sents) {
    const n = s.split(/\s+/).filter(Boolean).length;
    if (n > 0 && n < SHORT) run += 1;
    else run = 0;
    if (run >= STACCATO) {
      issues.push(`staccato: ${STACCATO}+ short sentences in a row`);
      break;
    }
  }
  return { ok: issues.length === 0, words, issues };
}

function main(argv) {
  const args = argv.slice(2);
  let min = 1500;
  const files = [];
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === "--min") {
      min = Number(args[i + 1]);
      i += 1;
      continue;
    }
    files.push(args[i]);
  }
  if (files.length !== 1) {
    console.error("usage: prose-check.mjs [--min N] <file.md>");
    process.exit(2);
  }
  const file = files[0];
  if (!existsSync(file)) {
    console.error(`missing ${file}`);
    process.exit(1);
  }
  const src = readFileSync(file, "utf8");
  const result = checkProse(src, { min });
  console.log(`WORD COUNT ${result.words}`);
  if (!result.ok) {
    for (const issue of result.issues) console.log(`ISSUE ${issue}`);
    console.log("PROSE DIRTY");
    process.exit(1);
  }
  console.log("PROSE CLEAN");
}

const entry = process.argv[1] ? process.argv[1].replace(/\\/g, "/") : "";
if (entry.endsWith("prose-check.mjs")) main(process.argv);
