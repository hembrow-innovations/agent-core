#!/usr/bin/env node
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  FIRST_PARTY_EXTENSIONS,
  type FirstPartyExtension,
  installVendorExtensions,
  isFirstPartyExtension,
} from "./vendor.ts";

const AGENT_DEST = join(".opencode", "agent");
const COMMAND_DEST = join(".opencode", "command");

type PlaybookSelection =
  | { kind: "all" }
  | { kind: "list"; ids: string[] }
  | { kind: "omit" };

type Profile = {
  name: string;
  mode: string | null;
  skills: string[];
  playbooks: PlaybookSelection;
  harness: string;
  agents: boolean;
  commands: boolean;
  templates: boolean;
  extensions: string[];
};

type Harness = {
  skillDests: string[];
  runtime: "opencode" | "pi" | null;
};

type ProfileModule = {
  HARNESSES: Record<string, Harness>;
  loadProfile: (srcRoot: string, name: string) => Profile;
  listProfiles: (srcRoot: string) => string[];
  listPlaybookIds: (srcRoot: string) => string[];
  resolvePlaybookIds: (
    profile: Profile,
    opts: {
      playbooks: string[] | null;
      withPlaybooks: string[];
      withoutPlaybooks: string[];
    },
    available: string[],
  ) => string[];
  installModePlaybooks: (
    srcRoot: string,
    target: string,
    mode: string,
    ids: string[],
    destBases: string[],
  ) => void;
  installPiRuntime: (
    srcRoot: string,
    target: string,
    opts?: { skills?: string[]; playbooks?: string[] },
  ) => void;
  findSkillDir: (srcRoot: string, name: string) => string | null;
};

type InstallRequest = {
  kind: "install";
  target: string;
  profile: string | null;
  with: string[];
  without: string[];
  playbooks: string[] | null;
  withPlaybooks: string[];
  withoutPlaybooks: string[];
  noAgents: boolean;
  noCommands: boolean;
  noTemplates: boolean;
  harness: string | null;
  extensions: FirstPartyExtension[];
};

type CliRequest = { kind: "help" } | InstallRequest;

type InstallPlan = {
  skills: string[];
  playbookIds: string[];
  overlayPlaybooks: boolean;
  agents: boolean;
  commands: boolean;
  templates: boolean;
  skillDests: string[];
  runtime: "opencode" | "pi" | null;
  mode: string | null;
  harness: string;
  extensions: FirstPartyExtension[];
};

function usage(profileNames: string[] | null): void {
  const listed = profileNames?.length
    ? profileNames.join(" | ")
    : "see profiles/";
  console.log(`agentic-core

Usage:
  pnpm exec agentic-core install <target> [options]

Options:
  --profile <name>         YAML profile in profiles/ (default: core)
  --extension <name>       first-party vendor package (repeatable)
  --with <skills>          comma-separated skills to add
  --without <skills>       comma-separated skills to remove
  --playbooks <ids>        replace profile playbook selection
  --with-playbooks <ids>   add playbook ids
  --without-playbooks <ids> remove playbook ids
  --no-agents              Skip OpenCode agents
  --no-commands            Skip OpenCode commands
  --no-templates           Skip opencode.json / WORKFLOW / rules templates
  --harness <id>           Override profile harness (opencode | claude | pi | agents)
  -h, --help               Show help

Profiles (profiles/*.yaml):
  ${listed}

Playbooks are selected in the YAML and overlaid into {mode}-mode.

Examples:
  pnpm exec agentic-core install . --profile agentic-core
  pnpm exec agentic-core install ~/Projects/my-app --profile core --with godot-mono
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
    noAgents: false,
    noCommands: false,
    noTemplates: false,
    harness: null,
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
    else if (a === "--no-agents") out.noAgents = true;
    else if (a === "--no-commands") out.noCommands = true;
    else if (a === "--no-templates") out.noTemplates = true;
    else if (a === "--harness") out.harness = need(args, a);
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

function writePiGitignore(target: string): void {
  const gitignore = join(target, ".pi", ".gitignore");
  if (existsSync(gitignore)) return;
  mkdirSync(dirname(gitignore), { recursive: true });
  writeFileSync(gitignore, "npm/\ngit/\n", "utf8");
}

function repoRoot(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  const root = resolve(here, "../../..");
  if (
    !existsSync(join(root, "profiles")) ||
    !existsSync(join(root, "skills"))
  ) {
    die("agentic-core must run from this checkout");
  }
  return root;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function isFn(value: unknown): value is (...args: never[]) => unknown {
  return typeof value === "function";
}

function isProfileModule(value: unknown): value is ProfileModule {
  if (!isRecord(value)) return false;
  return (
    isRecord(value.HARNESSES) &&
    isFn(value.loadProfile) &&
    isFn(value.listProfiles) &&
    isFn(value.listPlaybookIds) &&
    isFn(value.resolvePlaybookIds) &&
    isFn(value.installModePlaybooks) &&
    isFn(value.installPiRuntime) &&
    isFn(value.findSkillDir)
  );
}

async function loadProfileModule(srcRoot: string): Promise<ProfileModule> {
  const href = pathToFileURL(join(srcRoot, "scripts", "profile.mjs")).href;
  const raw: unknown = await import(href);
  if (!isProfileModule(raw)) die("scripts/profile.mjs export shape is invalid");
  return raw;
}

function copySkill(
  srcRoot: string,
  name: string,
  target: string,
  findSkillDir: ProfileModule["findSkillDir"],
  destBases: string[],
): void {
  const src = findSkillDir(srcRoot, name);
  if (!src) die(`Skill not found in source: ${name}`);
  for (const destBase of destBases) {
    const dest = join(target, destBase, name);
    mkdirSync(dirname(dest), { recursive: true });
    rmSync(dest, { recursive: true, force: true });
    cpSync(src, dest, { recursive: true });
    console.log(`  skill ${name} → ${destBase}/${name}`);
  }
}

function copyMarkdownTree(
  srcDir: string,
  destDir: string,
  label: string,
): number {
  if (!existsSync(srcDir)) return 0;
  let n = 0;
  mkdirSync(destDir, { recursive: true });
  for (const ent of readdirSync(srcDir, { withFileTypes: true })) {
    if (!ent.isFile() || !ent.name.endsWith(".md")) continue;
    if (ent.name.toUpperCase() === "README.MD") continue;
    const dest = join(destDir, ent.name);
    cpSync(join(srcDir, ent.name), dest);
    console.log(
      `  ${label} ${ent.name} → ${destDir.replace(`${process.cwd()}/`, "")}/${ent.name}`.replace(
        /\\/g,
        "/",
      ),
    );
    n++;
  }
  return n;
}

function installAgents(srcRoot: string, target: string): void {
  const src = join(srcRoot, "agents");
  const dest = join(target, AGENT_DEST);
  const n = copyMarkdownTree(src, dest, "agent");
  if (!n) console.log("  agents: none");
}

function installCommands(srcRoot: string, target: string): void {
  const src = join(srcRoot, "commands");
  const dest = join(target, COMMAND_DEST);
  const n = copyMarkdownTree(src, dest, "command");
  if (!n) console.log("  commands: none");
}

function installTemplates(srcRoot: string, target: string): void {
  const tpl = join(srcRoot, "templates", "opencode");
  if (!existsSync(tpl)) {
    console.log("  templates: missing pack");
    return;
  }

  const opencodeJson = join(target, "opencode.json");
  if (existsSync(opencodeJson)) {
    console.log("  template skip (exists): opencode.json");
  } else {
    cpSync(join(tpl, "opencode.json"), opencodeJson);
    console.log("  template write: opencode.json");
  }

  const rulesSrc = join(tpl, "rules", "draconic-models.md");
  const rulesDest = join(target, ".opencode", "rules", "draconic-models.md");
  mkdirSync(dirname(rulesDest), { recursive: true });
  cpSync(rulesSrc, rulesDest);
  console.log("  template write: .opencode/rules/draconic-models.md");

  for (const name of ["WORKFLOW.md", "DRACONIC-INDEX.md"]) {
    const dest = join(target, name);
    if (name === "DRACONIC-INDEX.md" || !existsSync(dest)) {
      cpSync(join(tpl, name), dest);
      console.log(`  template write: ${name}`);
    } else {
      console.log(`  template skip (exists): ${name}`);
    }
  }

  const gitignore = join(target, ".opencode", ".gitignore");
  if (!existsSync(gitignore)) {
    mkdirSync(dirname(gitignore), { recursive: true });
    writeFileSync(gitignore, "node_modules/\npackage-lock.json\n", "utf8");
    console.log("  template write: .opencode/.gitignore");
  }
}

function resolveHarnessId(opts: InstallRequest, profile: Profile): string {
  if (opts.harness) return opts.harness;
  if (opts.extensions.length > 0 && opts.profile == null) return "pi";
  return profile.harness;
}

function resolveExtensions(
  profileNames: string[],
  cliNames: readonly FirstPartyExtension[],
): FirstPartyExtension[] {
  const out: FirstPartyExtension[] = [];
  const seen = new Set<FirstPartyExtension>();
  for (const name of [...profileNames, ...cliNames]) {
    if (!isFirstPartyExtension(name)) {
      throw new Error(
        `Unknown extension: ${name}. Choose: ${FIRST_PARTY_EXTENSIONS.join(", ")}`,
      );
    }
    if (seen.has(name)) continue;
    seen.add(name);
    out.push(name);
  }
  return out;
}

function planFromProfile(
  profile: Profile,
  opts: InstallRequest,
  available: string[],
  resolvePlaybookIds: ProfileModule["resolvePlaybookIds"],
  harnesses: Record<string, Harness>,
): InstallPlan {
  const set = new Set(profile.skills);
  if (profile.mode) set.add(`${profile.mode}-mode`);
  for (const s of opts.with) set.add(s);
  for (const s of opts.without) set.delete(s);
  const harnessId = resolveHarnessId(opts, profile);
  const harness = harnesses[harnessId];
  if (!harness) {
    const known = Object.keys(harnesses).join(", ");
    throw new Error(`Unknown harness "${harnessId}". Choose: ${known}`);
  }
  const opencode = harness.runtime === "opencode";
  return {
    skills: [...set].sort(),
    playbookIds: resolvePlaybookIds(profile, opts, available),
    overlayPlaybooks:
      profile.playbooks.kind !== "omit" ||
      opts.playbooks != null ||
      opts.withPlaybooks.length > 0,
    agents: opencode && profile.agents && !opts.noAgents,
    commands: opencode && profile.commands && !opts.noCommands,
    templates: opencode && profile.templates && !opts.noTemplates,
    skillDests: [...harness.skillDests],
    runtime: harness.runtime,
    mode: profile.mode,
    harness: harnessId,
    extensions: resolveExtensions(profile.extensions, opts.extensions),
  };
}

async function run(argv: string[]): Promise<void> {
  const opts = parseArgs(argv);
  const srcRoot = repoRoot();

  if (opts.kind === "help") {
    let names: string[] | null = null;
    try {
      const mod = await loadProfileModule(srcRoot);
      names = mod.listProfiles(srcRoot);
    } catch {
      names = null;
    }
    usage(names);
    return;
  }

  if (!existsSync(opts.target)) die(`Target does not exist: ${opts.target}`);

  if (opts.profile == null && opts.extensions.length > 0) {
    console.log(`Using local source: ${srcRoot}`);
    console.log(`Installing into ${opts.target}`);
    console.log("Profile: none");
    console.log("Harness: pi");
    writePiGitignore(opts.target);
    try {
      installVendorExtensions(srcRoot, opts.target, opts.extensions);
    } catch (err) {
      die(err instanceof Error ? err.message : String(err));
    }
    console.log("Done.");
    return;
  }

  const {
    HARNESSES,
    loadProfile,
    listPlaybookIds,
    resolvePlaybookIds,
    installModePlaybooks,
    installPiRuntime,
    findSkillDir,
  } = await loadProfileModule(srcRoot);

  const profileName = opts.profile ?? "core";
  let profile: Profile;
  try {
    profile = loadProfile(srcRoot, profileName);
  } catch (err) {
    die(err instanceof Error ? err.message : String(err));
  }

  let plan: InstallPlan;
  try {
    plan = planFromProfile(
      profile,
      opts,
      listPlaybookIds(srcRoot),
      resolvePlaybookIds,
      HARNESSES,
    );
  } catch (err) {
    die(err instanceof Error ? err.message : String(err));
  }
  console.log(`Using local source: ${srcRoot}`);
  console.log(`Installing into ${opts.target}`);
  console.log(`Profile: ${profileName}`);
  console.log(`Harness: ${plan.harness}`);
  console.log(`Skills (${plan.skills.length}): ${plan.skills.join(", ")}`);

  for (const name of plan.skills) {
    copySkill(srcRoot, name, opts.target, findSkillDir, plan.skillDests);
  }
  if (plan.overlayPlaybooks) {
    if (!plan.mode) die("Playbook overlay requires profile.mode");
    installModePlaybooks(
      srcRoot,
      opts.target,
      plan.mode,
      plan.playbookIds,
      plan.skillDests,
    );
    console.log(
      `  playbooks (${plan.playbookIds.length}) → ${plan.mode}-mode/playbooks`,
    );
  }
  if (plan.agents) installAgents(srcRoot, opts.target);
  if (plan.commands) installCommands(srcRoot, opts.target);
  if (plan.templates) installTemplates(srcRoot, opts.target);
  if (plan.runtime === "pi") {
    installPiRuntime(srcRoot, opts.target, {
      skills: plan.skills,
      playbooks: plan.playbookIds,
    });
    console.log("  pi runtime → .pi");
    if (plan.extensions.length > 0) {
      try {
        installVendorExtensions(srcRoot, opts.target, plan.extensions);
      } catch (err) {
        die(err instanceof Error ? err.message : String(err));
      }
    }
  }

  console.log("Done.");
  if (plan.runtime === "opencode" && plan.mode === "draconic") {
    console.log(
      "Next: open the project in OpenCode, run /setup-draconic, optionally /create-verification-skill.",
    );
  } else if (plan.runtime === "pi") {
    console.log(
      "Next: run `pi` in the project, trust the folder, then /draconic-mode.",
    );
    console.log(
      "Pi installs project packages from .pi/settings.json after you trust the folder.",
    );
  }
}

void run(process.argv.slice(2)).catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
