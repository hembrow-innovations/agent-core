#!/usr/bin/env node
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  AGENT_DEST,
  openDestination,
  PLAYBOOK_DEST,
  PROMPT_DEST,
} from "./dest.ts";
import {
  FIRST_PARTY_EXTENSIONS,
  isFirstPartyExtension,
  packageRefSource,
  writeExtensions,
  writeVendorTrees,
  type FirstPartyExtension,
} from "./extensions.ts";
import { planFromProfile, type InstallRequest } from "./plan.ts";
import { listPlaybookIds, writePlaybooks } from "./playbooks.ts";
import { listAgentIds, writeAgents } from "./agents.ts";
import { listProfiles, loadProfile } from "./profile.ts";
import { listPromptIds, writePrompts } from "./prompts.ts";
import { writeRuntime } from "./runtime.ts";
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
  --extension <name>       first-party vendor package (repeatable)
  --with <skills>          comma-separated skills to add
  --without <skills>       comma-separated skills to remove
  --playbooks <ids>        replace profile playbook selection
  --with-playbooks <ids>   add playbook ids
  --without-playbooks <ids> remove playbook ids
  -h, --help               Show help

Profiles (profiles/*.yaml):
  ${listed}

Dest is always .pi/. Playbooks, agents, prompts, and packages are selected in the YAML.

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
    playbooks: null,
    withPlaybooks: [],
    withoutPlaybooks: [],
    extensions: [],
  };

  while (args.length) {
    const a = args.shift();
    if (a === undefined) break;
    if (a === "-h" || a === "--help") return { kind: "help" };
    else if (a === "--profile") out.profile = need(args, a);
    else if (a === "--with") out.with.push(...csv(need(args, a)));
    else if (a === "--without") out.without.push(...csv(need(args, a)));
    else if (a === "--playbooks") out.playbooks = csv(need(args, a));
    else if (a === "--with-playbooks")
      out.withPlaybooks.push(...csv(need(args, a)));
    else if (a === "--without-playbooks")
      out.withoutPlaybooks.push(...csv(need(args, a)));
    else if (a === "--extension") {
      const name = need(args, a);
      if (!isFirstPartyExtension(name)) {
        die(
          `Unknown extension: ${name}. Choose: ${FIRST_PARTY_EXTENSIONS.join(", ")}`,
        );
      }
      out.extensions.push(name);
    } else if (a.startsWith("-")) die(`Unknown flag: ${a}`);
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
    !existsSync(join(root, "ai", "skills"))
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

  if (opts.profile == null && opts.extensions.length > 0) {
    console.log(`Using local source: ${srcRoot}`);
    console.log(`Installing into ${opts.target}`);
    console.log("Profile: none");
    dest.ensureGitignore();
    try {
      writeExtensions(srcRoot, dest, opts.extensions);
    } catch (err) {
      die(err instanceof Error ? err.message : String(err));
    }
    console.log("Done.");
    return;
  }

  const profileName = opts.profile ?? DEFAULT_PROFILE;
  let profile;
  try {
    profile = loadProfile(srcRoot, profileName);
  } catch (err) {
    die(err instanceof Error ? err.message : String(err));
  }

  let plan;
  try {
    plan = planFromProfile(profile, opts, {
      playbooks: listPlaybookIds(srcRoot),
      agents: listAgentIds(srcRoot),
      prompts: listPromptIds(srcRoot),
    });
  } catch (err) {
    die(err instanceof Error ? err.message : String(err));
  }
  console.log(`Using local source: ${srcRoot}`);
  console.log(`Installing into ${opts.target}`);
  console.log(`Profile: ${profileName}`);
  console.log(`Skills (${plan.skills.length}): ${plan.skills.join(", ")}`);

  try {
    installSkills({ srcRoot, dest, names: plan.skills });
    if (plan.overlayPlaybooks) {
      writePlaybooks(srcRoot, dest, plan.playbookIds);
      console.log(
        `  playbooks (${plan.playbookIds.length}) → ${PLAYBOOK_DEST}`,
      );
    }
    if (plan.overlayAgents) {
      writeAgents(srcRoot, dest, plan.agentIds);
      console.log(`  agents (${plan.agentIds.length}) → ${AGENT_DEST}`);
    }
    if (plan.overlayPrompts) {
      writePrompts(srcRoot, dest, plan.promptIds);
      console.log(`  prompts (${plan.promptIds.length}) → ${PROMPT_DEST}`);
    }
    writeRuntime(srcRoot, dest);
    console.log("  pi runtime → .pi");
    const vendorNames: FirstPartyExtension[] = [];
    for (const pkg of plan.packages) {
      if (pkg.kind === "vendor") vendorNames.push(pkg.name);
    }
    if (vendorNames.length > 0) {
      writeVendorTrees(srcRoot, dest, vendorNames);
    }
    if (plan.packages.length > 0) {
      dest.mergePackages(plan.packages.map(packageRefSource));
    }
  } catch (err) {
    die(err instanceof Error ? err.message : String(err));
  }

  console.log("Done.");
  console.log("Next: run `pi` in the project and trust the folder.");
  console.log(
    "Pi installs project packages from .pi/settings.json after you trust the folder.",
  );
}

void (() => {
  try {
    run(process.argv.slice(2));
  } catch (err: unknown) {
    console.error(err);
    process.exit(1);
  }
})();
