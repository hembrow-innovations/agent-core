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
  agents: NamedSelection;
  prompts: NamedSelection;
  packages: ProfilePackage[];
  settings: Record<string, unknown> | null;
  "system-prompt"?: string;
};

const PROFILE_KEYS = new Set([
  "skills",
  "agents",
  "prompts",
  "packages",
  "settings",
  "system-prompt",
]);

const LEFTOVER_KEYS = new Map([
  ["mode", 'leftover "mode:". dest playbooks live at .pi/playbooks'],
  ["playbooks", 'leftover "playbooks:". the installer does not copy playbooks'],
  ["harness", 'leftover "harness:". dest is always .pi'],
  ["pi", 'leftover "pi:". dest is always .pi'],
  ["extensions", 'leftover "extensions:". use packages:'],
  ["templates", 'leftover "templates:". dest is always .pi'],
  ["commands", 'leftover "commands:". dest is always .pi'],
  [
    "frameworks",
    'leftover "frameworks:". hivemind is not installed from this pack',
  ],
]);

const JSON_NUMBER = /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/;

export type YamlScalar = string | number | boolean | null;
type YamlMap = { [key: string]: YamlValue };
export type YamlValue = YamlScalar | YamlValue[] | YamlMap;

type YamlTok = {
  indent: number;
  raw: string;
  isList: boolean;
  key: string | null;
  inline: string;
};

export function parseProfileYaml(text: string): Record<string, YamlValue> {
  const toks = tokenizeYaml(text);
  if (toks.length === 0) return {};
  if (toks[0].indent !== 0) {
    throw new Error(`Unexpected indent: ${toks[0].raw}`);
  }
  const parsed = parseMap(toks, 0, 0);
  if (parsed.next !== toks.length) {
    throw new Error(`Cannot parse YAML: ${toks[parsed.next].raw}`);
  }
  return parsed.value;
}

export function loadProfile(srcRoot: string, name: string): Profile {
  const file = join(srcRoot, "profiles", name, "profile.yaml");
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
  const systemPrompt = asOptionalString(raw["system-prompt"], "system-prompt");
  return {
    name,
    skills: asStringList(raw.skills, "skills"),
    agents: toSelection(raw.agents, "agents"),
    prompts: toSelection(raw.prompts, "prompts"),
    packages: asStringList(raw.packages, "packages").map(parseProfilePackage),
    settings: asSettings(raw.settings),
    ...(systemPrompt !== undefined ? { "system-prompt": systemPrompt } : {}),
  };
}

export function listProfiles(srcRoot: string): string[] {
  const dir = join(srcRoot, "profiles");
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter(
      (ent) =>
        ent.isDirectory() &&
        !ent.name.startsWith(".") &&
        existsSync(join(dir, ent.name, "profile.yaml")),
    )
    .map((ent) => ent.name)
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

function asOptionalString(value: unknown, key: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") throw new Error(`"${key}" must be a string`);
  return value;
}

function asSettings(value: unknown): Record<string, unknown> | null {
  if (value === undefined || value === null) return null;
  if (!isYamlMap(value)) throw new Error(`"settings" must be a map`);
  return value;
}

function isYamlMap(value: unknown): value is YamlMap {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function tokenizeYaml(text: string): YamlTok[] {
  const toks: YamlTok[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = stripComment(raw);
    if (!line.trim()) continue;
    rejectUnknown(line, raw);

    const indent = line.match(/^(\s*)/)?.[1].length ?? 0;
    const body = line.slice(indent);

    const list = body.match(/^-(\s+(.*))?$/);
    if (list) {
      const rest = (list[2] ?? "").trim();
      const kv =
        rest.match(/^([^:]+?):\s+(.*)$/) ?? rest.match(/^([^:]+?):\s*$/);
      if (kv) {
        toks.push({
          indent,
          raw,
          isList: true,
          key: kv[1].trim(),
          inline: kv[2],
        });
      } else {
        toks.push({
          indent,
          raw,
          isList: true,
          key: null,
          inline: rest,
        });
      }
      continue;
    }

    const kv = body.match(/^([^:]+?)\s*:\s*(.*)$/);
    if (!kv) throw new Error(`Cannot parse YAML: ${raw}`);
    toks.push({
      indent,
      raw,
      isList: false,
      key: kv[1].trim(),
      inline: kv[2],
    });
  }
  return toks;
}

function parseMap(
  toks: YamlTok[],
  start: number,
  indent: number,
): { value: YamlMap; next: number } {
  const value: YamlMap = {};
  let i = start;
  while (i < toks.length) {
    const t = toks[i];
    if (t.indent < indent) break;
    if (t.indent > indent) {
      throw new Error(`Unexpected indent: ${t.raw}`);
    }
    if (t.isList) throw new Error(`List item without a key: ${t.raw}`);
    if (t.key == null) throw new Error(`Cannot parse YAML: ${t.raw}`);

    if (t.inline !== "") {
      const peek = toks[i + 1];
      if (peek && peek.indent > t.indent) {
        throw new Error(`Mixed value and nested for "${t.key}": ${t.raw}`);
      }
      value[t.key] = parseScalar(t.inline, t.raw);
      i += 1;
      continue;
    }

    const child = parseChildren(toks, i, t.indent);
    i = child.next;
    if (!child.omit) value[t.key] = child.value;
  }
  return { value, next: i };
}

function parseList(
  toks: YamlTok[],
  start: number,
  indent: number,
): { value: YamlValue[]; next: number } {
  const value: YamlValue[] = [];
  let i = start;
  while (i < toks.length) {
    const t = toks[i];
    if (t.indent < indent) break;
    if (t.indent > indent) {
      throw new Error(`Unexpected indent: ${t.raw}`);
    }
    if (!t.isList) break;

    if (t.key != null) {
      const item: YamlMap = {};
      if (t.inline === "") {
        const child = parseChildren(toks, i, t.indent);
        i = child.next;
        if (!child.omit) item[t.key] = child.value;
      } else {
        item[t.key] = parseScalar(t.inline, t.raw);
        i += 1;
      }
      if (i < toks.length && toks[i].indent > indent && !toks[i].isList) {
        const rest = parseMap(toks, i, toks[i].indent);
        for (const [k, v] of Object.entries(rest.value)) item[k] = v;
        i = rest.next;
      }
      value.push(item);
      continue;
    }

    if (t.inline !== "") {
      const peek = toks[i + 1];
      if (peek && peek.indent > t.indent) {
        throw new Error(`Mixed value and nested: ${t.raw}`);
      }
      const item = parseScalar(t.inline, t.raw);
      if (item !== "" && item != null) value.push(item);
      i += 1;
      continue;
    }

    const child = parseChildren(toks, i, t.indent);
    i = child.next;
    if (!child.omit) value.push(child.value);
  }
  return { value, next: i };
}

function parseChildren(
  toks: YamlTok[],
  parentIndex: number,
  parentIndent: number,
): { value: YamlValue; next: number; omit: boolean } {
  const nextTok = toks[parentIndex + 1];
  if (!nextTok || nextTok.indent <= parentIndent) {
    return { value: null, next: parentIndex + 1, omit: true };
  }
  if (nextTok.isList) {
    const list = parseList(toks, parentIndex + 1, nextTok.indent);
    return { value: list.value, next: list.next, omit: false };
  }
  const map = parseMap(toks, parentIndex + 1, nextTok.indent);
  return { value: map.value, next: map.next, omit: false };
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
  if (JSON_NUMBER.test(s)) return Number(s);
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
