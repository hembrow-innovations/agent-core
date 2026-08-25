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

export const FIRST_PARTY_EXTENSIONS = [
  "draconic-todo",
  "draconic-coms",
  "draconic-boot",
  "draconic-teams",
] as const;

export type FirstPartyExtension = (typeof FIRST_PARTY_EXTENSIONS)[number];

const FIRST_PARTY_EXTENSION_SET = new Set<string>(FIRST_PARTY_EXTENSIONS);

export function isFirstPartyExtension(
  name: string,
): name is FirstPartyExtension {
  return FIRST_PARTY_EXTENSION_SET.has(name);
}

export function vendorPackageSource(name: FirstPartyExtension): string {
  return `vendor/@agentic-core/${name}`;
}

function canonicalizePackageSource(source: string): string {
  const match = source.match(
    /^(?:\.pi\/)?vendor\/@agentic-core\/([a-z0-9-]+)$/,
  );
  if (!match) return source;
  return `vendor/@agentic-core/${match[1]}`;
}

export function installVendorExtensions(
  srcRoot: string,
  target: string,
  names: readonly FirstPartyExtension[],
): void {
  const unique = uniqueNames(names);
  for (const name of unique) {
    writeVendorExtension(srcRoot, target, name);
    console.log(`  vendor ${name} → .pi/vendor/@agentic-core/${name}`);
  }
  mergePackageSources(
    join(target, ".pi", "settings.json"),
    unique.map(vendorPackageSource),
  );
}

function uniqueNames(
  names: readonly FirstPartyExtension[],
): FirstPartyExtension[] {
  const seen = new Set<FirstPartyExtension>();
  const out: FirstPartyExtension[] = [];
  for (const name of names) {
    if (seen.has(name)) continue;
    seen.add(name);
    out.push(name);
  }
  return out;
}

function writeVendorExtension(
  srcRoot: string,
  target: string,
  name: FirstPartyExtension,
): void {
  const srcPkg = join(srcRoot, "packages", name);
  const destPkg = join(target, ".pi", "vendor", "@agentic-core", name);
  if (!existsSync(srcPkg)) {
    throw new Error(`Extension package not found: ${name}`);
  }
  rmSync(destPkg, { recursive: true, force: true });
  mkdirSync(destPkg, { recursive: true });
  cpSync(join(srcPkg, "package.json"), join(destPkg, "package.json"));
  copyTsSources(join(srcPkg, "src"), join(destPkg, "src"));
}

function copyTsSources(srcDir: string, destDir: string): void {
  if (!existsSync(srcDir)) return;
  mkdirSync(destDir, { recursive: true });
  for (const ent of readdirSync(srcDir, { withFileTypes: true })) {
    const from = join(srcDir, ent.name);
    const to = join(destDir, ent.name);
    if (ent.isDirectory()) {
      copyTsSources(from, to);
      continue;
    }
    if (
      !ent.isFile() ||
      !ent.name.endsWith(".ts") ||
      ent.name.endsWith(".test.ts")
    ) {
      continue;
    }
    cpSync(from, to);
  }
}

function mergePackageSources(settingsPath: string, sources: string[]): void {
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

function packageSource(entry: unknown): string | null {
  if (typeof entry === "string") return entry;
  if (isRecord(entry) && typeof entry.source === "string") return entry.source;
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}
