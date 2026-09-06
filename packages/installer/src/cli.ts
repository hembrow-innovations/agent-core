#!/usr/bin/env node
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  AGENT_DEST,
  DEST_ROOT,
  openDestination,
  PROMPT_DEST,
} from "./dest.ts";
import { catalogFromSource, planFromProfile, type InstallRequest } from "./plan.ts";
import { writeAgents } from "./agents.ts";
import { listProfiles, loadProfile } from "./profile.ts";
import { writePrompts } from "./prompts.ts";
import { installSkills } from "./skills.ts";

type CliRequest = { kind: "help" } | InstallRequest;

const DEFAULT_PROFILE = "agentic-core";

function usage(profileNames: string[] | null): void {
  const listed = profileNames?.length
    ? profileNames.join(" | ")
    : "see profiles/";
  console.log(`agentic-core

Usage:
  pnpm exec agentic-core install <target> [options]

Options:
  --profile <name>         YAML profile in profiles/ (default: ${DEFAULT_PROFILE})
  --with <skills>          comma-separated skills to add
  --without <skills>       comma-separated skills to remove
  -h, --help               Show help

Profiles (profiles/<name>/profile.yaml):
  ${listed}

Dest is always .opencode/. Stacks, agents, prompts, and skills are selected in the YAML.

Examples:
  pnpm exec agentic-core install . --profile agentic-core
  pnpm exec agentic-core install ~/Projects/my-app --profile agentic-core --with godot-mono
`);
}

function parseArgs(argv: string[]): CliRequest {
  const args = [...argv];
  if (args.length === 0) return { kind: "help" };

  const command = args.shift();
  if (command === "-h" || command === "--help") return { kind: "help" };
  if (command !== "install") die(`Unknown command: ${command}`);

  const out: InstallRequest = {
    kind: "install",
    target: "",
    profile: null,
    with: [],
    without: [],
  };

  while (args.length) {
    const a = args.shift();
    if (a === undefined) break;
    if (a === "-h" || a === "--help") return { kind: "help" };
    else if (a === "--profile") out.profile = need(args, a);
    else if (a === "--with") out.with.push(...csv(need(args, a)));
    else if (a === "--without") out.without.push(...csv(need(args, a)));
    else if (a.startsWith("-")) die(`Unknown flag: ${a}`);
    else if (out.target) die(`Unexpected argument: ${a}`);
    else out.target = resolve(a);
  }

  if (!out.target) die("Missing target directory");
  return out;
}

function csv(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function need(args: string[], flag: string): string {
  const v = args.shift();
  if (!v) die(`Missing value for ${flag}`);
  return v;
}

function die(msg: string): never {
  console.error(msg);
  process.exit(1);
}

function repoRoot(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  const root = resolve(here, "../../..");
  if (
    !existsSync(join(root, "profiles")) ||
    !existsSync(join(root, "ai", "skills")) ||
    !existsSync(join(root, "stacks"))
  ) {
    die("agentic-core must run from this checkout");
  }
  return root;
}

function run(argv: string[]): void {
  const opts = parseArgs(argv);
  const srcRoot = repoRoot();

  if (opts.kind === "help") {
    let names: string[] | null = null;
    try {
      names = listProfiles(srcRoot);
    } catch {
      names = null;
    }
    usage(names);
    return;
  }

  if (!existsSync(opts.target)) die(`Target does not exist: ${opts.target}`);
  const dest = openDestination(opts.target);

  const profileName = opts.profile ?? DEFAULT_PROFILE;
  let profile;
  try {
    profile = loadProfile(srcRoot, profileName);
  } catch (err) {
    die(err instanceof Error ? err.message : String(err));
  }

  let plan;
  try {
    plan = planFromProfile(profile, opts, catalogFromSource(srcRoot));
  } catch (err) {
    die(err instanceof Error ? err.message : String(err));
  }
  console.log(`Using local source: ${srcRoot}`);
  console.log(`Installing into ${opts.target}`);
  console.log(`Profile: ${profileName}`);
  if (profile.stacks.length) {
    console.log(`Stacks (${profile.stacks.length}): ${profile.stacks.join(", ")}`);
  }
  console.log(`Skills (${plan.skills.length}): ${plan.skills.join(", ")}`);

  try {
    dest.removeLeftovers();
    installSkills({ srcRoot, dest, names: plan.skills });
    if (plan.overlayAgents) {
      writeAgents(srcRoot, dest, plan.agentIds);
      console.log(`  agents (${plan.agentIds.length}) → ${AGENT_DEST}`);
    }
    if (plan.overlayPrompts) {
      writePrompts(srcRoot, dest, plan.promptIds);
      console.log(`  prompts (${plan.promptIds.length}) → ${PROMPT_DEST}`);
    }
  } catch (err) {
    die(err instanceof Error ? err.message : String(err));
  }

  console.log("Done.");
  console.log(`Dest is ${DEST_ROOT}/.`);
  console.log("Restart OpenCode so it loads the dest files.");
}

void (() => {
  try {
    run(process.argv.slice(2));
  } catch (err: unknown) {
    console.error(err);
    process.exit(1);
  }
})();
