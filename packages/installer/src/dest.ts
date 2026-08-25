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
export const SETTINGS_PATH = ".pi/settings.json";
export const GITIGNORE_PATH = ".pi/.gitignore";
export const GITIGNORE_BODY = "npm/\ngit/\n";

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

  const ensureGitignore = () => {
    writeText(GITIGNORE_PATH, GITIGNORE_BODY, { ifMissing: true });
  };

  const removeLeftovers = () => {
    remove(".pi/extensions");
    remove(".pi/lib");
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
    ensureGitignore,
    removeLeftovers,
  };
}

export function packageSource(entry: unknown): string | null {
  if (typeof entry === "string") return entry;
  if (isRecord(entry) && typeof entry.source === "string") return entry.source;
  return null;
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

function canonicalizePackageSource(source: string): string {
  const match = source.match(
    /^(?:\.pi\/)?vendor\/@agentic-core\/([a-z0-9-]+)$/,
  );
  if (!match) return source;
  return `vendor/@agentic-core/${match[1]}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}
