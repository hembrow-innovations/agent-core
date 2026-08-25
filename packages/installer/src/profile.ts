import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseProfilePackage, type ProfilePackage } from "./extensions.ts";

export type NamedSelection =
  | { kind: "all" }
  | { kind: "list"; ids: string[] }
  | { kind: "omit" };

export type PlaybookSelection = NamedSelection;

export type Profile = {
  name: string;
  skills: string[];
  playbooks: NamedSelection;
  agents: NamedSelection;
  prompts: NamedSelection;
  packages: ProfilePackage[];
};

const PROFILE_KEYS = new Set([
  "skills",
  "playbooks",
  "agents",
  "prompts",
  "packages",
]);

const LEFTOVER_KEYS = new Map([
  ["mode", 'leftover "mode:". dest playbooks live at .pi/playbooks'],
  ["harness", 'leftover "harness:". dest is always .pi'],
  ["pi", 'leftover "pi:". dest is always .pi'],
  ["extensions", 'leftover "extensions:". use packages:'],
  ["templates", 'leftover "templates:". dest is always .pi'],
  ["commands", 'leftover "commands:". dest is always .pi'],
]);

export type YamlScalar = string | boolean | null;
export type YamlValue = YamlScalar | YamlValue[];

export function parseProfileYaml(text: string): Record<string, YamlValue> {
  const out: Record<string, YamlValue> = {};
  let pendingKey: string | null = null;

  for (const raw of text.split(/\r?\n/)) {
    const line = stripComment(raw);
    if (!line.trim()) continue;
    rejectUnknown(line, raw);

    const indent = line.match(/^(\s*)/)?.[1] ?? "";
    const body = line.slice(indent.length);

    const list = body.match(/^-(\s+(.*))?$/);
    if (list) {
      if (indent.length === 0 || pendingKey == null) {
        throw new Error(`List item without a key: ${raw}`);
      }
      if (!Object.hasOwn(out, pendingKey)) out[pendingKey] = [];
      const current = out[pendingKey];
      if (!Array.isArray(current)) {
        throw new Error(`Mixed value and list for "${pendingKey}"`);
      }
      const item = parseScalar((list[2] ?? "").trim(), raw);
      if (item === "" || item == null) continue;
      current.push(item);
      continue;
    }

    const kv = body.match(/^([^:]+?)\s*:\s*(.*)$/);
    if (!kv) throw new Error(`Cannot parse YAML: ${raw}`);
    if (indent.length > 0) {
      throw new Error(`Nested maps are not supported: ${raw}`);
    }

    const key = kv[1].trim();
    const rawVal = kv[2];
    pendingKey = null;
    if (rawVal === "") {
      pendingKey = key;
      continue;
    }
    out[key] = parseScalar(rawVal, raw);
  }

  return out;
}

export function loadProfile(srcRoot: string, name: string): Profile {
  const file = join(srcRoot, "profiles", `${name}.yaml`);
  if (!existsSync(file)) {
    const available = listProfiles(srcRoot);
    const listed = available.length ? available.join(", ") : "(none)";
    throw new Error(`Unknown profile "${name}". Choose: ${listed}`);
  }
  const raw = parseProfileYaml(readFileSync(file, "utf8"));
  for (const key of Object.keys(raw)) {
    const leftover = LEFTOVER_KEYS.get(key);
    if (leftover) throw new Error(`Profile "${name}" has ${leftover}`);
    if (!PROFILE_KEYS.has(key)) {
      throw new Error(`Unknown profile key "${key}"`);
    }
  }
  return {
    name,
    skills: asStringList(raw.skills, "skills"),
    playbooks: toSelection(raw.playbooks, "playbooks"),
    agents: toSelection(raw.agents, "agents"),
    prompts: toSelection(raw.prompts, "prompts"),
    packages: asStringList(raw.packages, "packages").map(parseProfilePackage),
  };
}

export function listProfiles(srcRoot: string): string[] {
  const dir = join(srcRoot, "profiles");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((n) => n.endsWith(".yaml") && !/^readme\.yaml$/i.test(n))
    .map((n) => n.slice(0, -5))
    .sort();
}

export type SelectionResolveOpts = {
  replace: string[] | null;
  add: string[];
  remove: string[];
};

export function resolveNamedIds(
  selection: NamedSelection,
  opts: SelectionResolveOpts,
  available: string[],
  label: string,
): string[] {
  const avail = new Set(available);
  let ids: string[];
  if (opts.replace != null) ids = [...opts.replace];
  else if (selection.kind === "all") ids = [...available];
  else if (selection.kind === "list") ids = [...selection.ids];
  else ids = [];
  ids.push(...opts.add);
  if (opts.remove.length > 0) {
    const drop = new Set(opts.remove);
    ids = ids.filter((id) => !drop.has(id));
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    if (!avail.has(id)) throw new Error(`Unknown ${label} "${id}"`);
    out.push(id);
  }
  return out;
}

function toSelection(value: unknown, key: string): NamedSelection {
  if (value === undefined || value === null) return { kind: "omit" };
  if (value === "all") return { kind: "all" };
  if (Array.isArray(value)) return { kind: "list", ids: value.map(String) };
  throw new Error(`Invalid ${key} value: ${JSON.stringify(value)}`);
}

function asStringList(value: unknown, key: string): string[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new Error(`"${key}" must be a list`);
  return value.map(String);
}

function stripComment(line: string): string {
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === "'" && !inDouble) inSingle = !inSingle;
    else if (c === '"' && !inSingle) inDouble = !inDouble;
    else if (c === "#" && !inSingle && !inDouble) return line.slice(0, i);
  }
  return line;
}

function rejectUnknown(line: string, raw: string): void {
  if (/(^|\s)[&*][A-Za-z_]/.test(line)) {
    throw new Error(`YAML anchors are not supported: ${raw}`);
  }
  if (/:\s*[|>][-+]?\s*$/.test(line)) {
    throw new Error(`Block scalars are not supported: ${raw}`);
  }
  if (/\{/.test(line) && !inQuotes(line, line.indexOf("{"))) {
    throw new Error(`Nested maps are not supported: ${raw}`);
  }
}

function inQuotes(line: string, idx: number): boolean {
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < idx; i++) {
    const c = line[i];
    if (c === "'" && !inDouble) inSingle = !inSingle;
    else if (c === '"' && !inSingle) inDouble = !inDouble;
  }
  return inSingle || inDouble;
}

function parseScalar(s: string, raw: string): YamlValue {
  if (s === "true") return true;
  if (s === "false") return false;
  if (s === "null" || s === "~") return null;
  if (s === "[]") return [];
  if (s.startsWith("[") && s.endsWith("]")) {
    const inner = s.slice(1, -1).trim();
    if (!inner) return [];
    return inner
      .split(",")
      .map((part) => parseScalar(part.trim(), raw))
      .filter((item) => item !== "" && item != null);
  }
  if (s.startsWith("{")) {
    throw new Error(`Nested maps are not supported: ${raw}`);
  }
  if (s.startsWith("&") || s.startsWith("*")) {
    throw new Error(`YAML anchors are not supported: ${raw}`);
  }
  if (s.startsWith("|") || s.startsWith(">")) {
    throw new Error(`Block scalars are not supported: ${raw}`);
  }
  return unquote(s);
}

export function unquote(s: string): string {
  if (s.length >= 2 && s.startsWith('"') && s.endsWith('"')) {
    return s.slice(1, -1).replace(/\\"/g, '"').replace(/\\n/g, "\n");
  }
  if (s.length >= 2 && s.startsWith("'") && s.endsWith("'")) {
    return s.slice(1, -1).replace(/''/g, "'");
  }
  return s;
}
