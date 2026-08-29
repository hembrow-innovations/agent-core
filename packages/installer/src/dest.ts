import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";

export const SKILL_DEST = ".pi/skills";
export const PLAYBOOK_DEST = ".pi/playbooks";
export const AGENT_DEST = ".pi/agents";
export const PROMPT_DEST = ".pi/prompts";
export const SETTINGS_PATH = ".pi/settings.json";
export const GITIGNORE_PATH = ".pi/.gitignore";
export const GITIGNORE_BODY = "npm/\ngit/\n";

const PREVIOUS_FIRST_PARTY = [
  "draconic-todo",
  "draconic-coms",
  "draconic-boot",
  "draconic-teams",
  "draconic-footer",
  "heio-coms",
  "heio-teams",
] as const;

export type DestEntry = {
  name: string;
  isFile: boolean;
  isDirectory: boolean;
};

export type Destination = {
  readonly target: string;
  path(...parts: string[]): string;
  exists(rel: string): boolean;
  ensureDir(rel: string): void;
  readText(rel: string): string;
  writeText(rel: string, body: string, opts?: { ifMissing?: boolean }): boolean;
  copyFile(absSrc: string, relDest: string): void;
  copyTree(absSrc: string, relDest: string): void;
  replaceTree(absSrc: string, relDest: string): void;
  remove(rel: string): void;
  list(rel: string): DestEntry[];
  mergePackages(sources: string[]): void;
  mergeSettings(patch: Record<string, unknown>): void;
  ensureGitignore(): void;
  removeLeftovers(): void;
};

export function openDestination(target: string): Destination {
  const path = (...parts: string[]) => join(target, ...parts);

  const exists = (rel: string) => existsSync(path(rel));

  const ensureDir = (rel: string) => {
    mkdirSync(path(rel), { recursive: true });
  };

  const readText = (rel: string) => readFileSync(path(rel), "utf8");

  const writeText = (
    rel: string,
    body: string,
    opts?: { ifMissing?: boolean },
  ): boolean => {
    if (opts?.ifMissing && exists(rel)) return false;
    mkdirSync(dirname(path(rel)), { recursive: true });
    writeFileSync(path(rel), body, "utf8");
    return true;
  };

  const copyFile = (absSrc: string, relDest: string) => {
    mkdirSync(dirname(path(relDest)), { recursive: true });
    cpSync(absSrc, path(relDest));
  };

  const copyTree = (absSrc: string, relDest: string) => {
    mkdirSync(dirname(path(relDest)), { recursive: true });
    cpSync(absSrc, path(relDest), { recursive: true });
  };

  const remove = (rel: string) => {
    rmSync(path(rel), { recursive: true, force: true });
  };

  const replaceTree = (absSrc: string, relDest: string) => {
    remove(relDest);
    copyTree(absSrc, relDest);
  };

  const list = (rel: string): DestEntry[] => {
    if (!exists(rel)) return [];
    return readdirSync(path(rel), { withFileTypes: true }).map((ent) => ({
      name: ent.name,
      isFile: ent.isFile(),
      isDirectory: ent.isDirectory(),
    }));
  };

  const mergePackages = (sources: string[]) => {
    mergePiSettingsPackages(path(SETTINGS_PATH), sources);
  };

  const mergeSettings = (patch: Record<string, unknown>) => {
    mergePiSettings(path(SETTINGS_PATH), patch);
  };

  const ensureGitignore = () => {
    writeText(GITIGNORE_PATH, GITIGNORE_BODY, { ifMissing: true });
  };

  const removeLeftovers = () => {
    remove(".pi/extensions");
    remove(".pi/lib");
    remove(".pi/roles");
    remove(".pi/vendor/@agentic-core");
    remove(".pi/draconic-models.md");
    remove(".pi/agents/draconic.md");
    remove(".pi/skills/draconic-mode");
    remove(".pi/skills/setup-draconic");
    remove(".pi/skills/agent-teams");
    for (const name of PREVIOUS_FIRST_PARTY) {
      remove(`.pi/npm/node_modules/@agentic-core/${name}`);
      remove(`.pi/npm/local/@agentic-core/${name}`);
    }
    dropPreviousFirstPartySettings(path(SETTINGS_PATH));
  };

  return {
    target,
    path,
    exists,
    ensureDir,
    readText,
    writeText,
    copyFile,
    copyTree,
    replaceTree,
    remove,
    list,
    mergePackages,
    mergeSettings,
    ensureGitignore,
    removeLeftovers,
  };
}

export function packageSource(entry: unknown): string | null {
  if (typeof entry === "string") return entry;
  if (isRecord(entry) && typeof entry.source === "string") return entry.source;
  return null;
}

function isPreviousFirstPartySource(source: string): boolean {
  const canon = canonicalizePackageSource(source);
  return PREVIOUS_FIRST_PARTY.some(
    (name) =>
      canon === `npm/local/@agentic-core/${name}` ||
      canon === `npm/node_modules/@agentic-core/${name}` ||
      canon.endsWith(`/@agentic-core/${name}`) ||
      canon.includes(`@agentic-core/${name}/`),
  );
}

function dropPreviousFirstPartySettings(settingsPath: string): void {
  if (!existsSync(settingsPath)) return;
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(settingsPath, "utf8"));
  } catch {
    throw new Error(".pi/settings.json must be valid JSON");
  }
  if (!isRecord(raw) || !Array.isArray(raw.packages)) return;
  const next = raw.packages.filter((item) => {
    const source = packageSource(item);
    if (!source) return true;
    return !isPreviousFirstPartySource(source);
  });
  if (JSON.stringify(raw.packages) === JSON.stringify(next)) return;
  raw.packages = next;
  writeFileSync(settingsPath, `${JSON.stringify(raw, null, 2)}\n`, "utf8");
}

export function mergePiSettingsPackages(
  settingsPath: string,
  sources: string[],
): void {
  if (!sources.length) return;
  let settings: Record<string, unknown> = {};
  if (existsSync(settingsPath)) {
    let raw: unknown;
    try {
      raw = JSON.parse(readFileSync(settingsPath, "utf8"));
    } catch {
      throw new Error(".pi/settings.json must be valid JSON");
    }
    if (!isRecord(raw)) {
      throw new Error(".pi/settings.json must be a JSON object");
    }
    settings = raw;
  }
  const existing = Array.isArray(settings.packages) ? settings.packages : [];
  const have = new Set<string>();
  const next: unknown[] = [];
  for (const item of existing) {
    const source = packageSource(item);
    const canon = source ? canonicalizePackageSource(source) : null;
    if (canon && have.has(canon)) continue;
    if (typeof item === "string" && canon) {
      next.push(canon);
      have.add(canon);
      continue;
    }
    if (isRecord(item) && canon && typeof item.source === "string") {
      next.push({ ...item, source: canon });
      have.add(canon);
      continue;
    }
    next.push(item);
    if (canon) have.add(canon);
    else if (source) have.add(source);
  }
  for (const src of sources) {
    const canon = canonicalizePackageSource(src);
    if (have.has(canon)) continue;
    have.add(canon);
    next.push(canon);
  }
  if (
    Array.isArray(settings.packages) &&
    JSON.stringify(settings.packages) === JSON.stringify(next)
  ) {
    return;
  }
  settings.packages = next;
  mkdirSync(dirname(settingsPath), { recursive: true });
  writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`, "utf8");
}

type SettingsObject = { [key: string]: SettingsJson };
type SettingsJson =
  | string
  | number
  | boolean
  | null
  | SettingsJson[]
  | SettingsObject;

export function mergePiSettings(
  settingsPath: string,
  patch: Record<string, unknown>,
): void {
  const settings = readSettingsObject(settingsPath);
  const merged = deepMergeSettings(settings, asSettingsObject(patch));
  if (JSON.stringify(settings) === JSON.stringify(merged)) return;
  mkdirSync(dirname(settingsPath), { recursive: true });
  writeFileSync(settingsPath, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
}

function readSettingsObject(settingsPath: string): SettingsObject {
  if (!existsSync(settingsPath)) return {};
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(settingsPath, "utf8"));
  } catch {
    throw new Error(".pi/settings.json must be valid JSON");
  }
  if (!isRecord(raw)) {
    throw new Error(".pi/settings.json must be a JSON object");
  }
  return asSettingsObject(raw);
}

function asSettingsObject(value: Record<string, unknown>): SettingsObject {
  const out: SettingsObject = {};
  for (const [key, item] of Object.entries(value)) {
    out[key] = asSettingsJson(item);
  }
  return out;
}

function asSettingsJson(value: unknown): SettingsJson {
  if (value === null) return null;
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (Array.isArray(value)) return value.map(asSettingsJson);
  if (isRecord(value)) return asSettingsObject(value);
  throw new Error(".pi/settings.json must be JSON");
}

function deepMergeSettings(
  dest: SettingsJson,
  src: SettingsJson,
): SettingsJson {
  if (Array.isArray(src)) {
    if (!Array.isArray(dest)) return src;
    return mergeSettingsArrays(dest, src);
  }
  if (isRecord(src)) {
    if (!isRecord(dest)) return src;
    const out: SettingsObject = { ...dest };
    for (const [key, value] of Object.entries(src)) {
      if (Object.hasOwn(dest, key)) {
        out[key] = deepMergeSettings(dest[key], value);
      } else {
        out[key] = value;
      }
    }
    return out;
  }
  return src;
}

function mergeSettingsArrays(
  dest: SettingsJson[],
  src: SettingsJson[],
): SettingsJson[] {
  const next = [...dest];
  const have = new Set(dest.map(settingsArrayKey));
  for (const item of src) {
    const key = settingsArrayKey(item);
    if (have.has(key)) continue;
    have.add(key);
    next.push(item);
  }
  return next;
}

function settingsArrayKey(item: SettingsJson): string {
  if (item !== null && typeof item === "object") {
    return `o:${JSON.stringify(item)}`;
  }
  return `s:${typeof item}:${String(item)}`;
}

function canonicalizePackageSource(source: string): string {
  const match = source.match(
    /^(?:\.pi\/)?(?:vendor|npm\/node_modules)\/@agentic-core\/([a-z0-9-]+)$/,
  );
  if (!match) return source;
  return `npm/local/@agentic-core/${match[1]}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}
