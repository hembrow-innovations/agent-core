import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";

export const FIRST_PARTY_EXTENSIONS = [
  "draconic-todo",
  "draconic-coms",
  "draconic-boot",
  "draconic-teams",
] as const;

export type FirstPartyExtension = (typeof FIRST_PARTY_EXTENSIONS)[number];

const FIRST_PARTY_EXTENSION_SET = new Set<string>(FIRST_PARTY_EXTENSIONS);
const LIB_FROM = /from\s+(["'])@agentic-core\/lib\1/g;

export function isFirstPartyExtension(
  name: string,
): name is FirstPartyExtension {
  return FIRST_PARTY_EXTENSION_SET.has(name);
}

export function vendorPackageSource(name: FirstPartyExtension): string {
  return `.pi/vendor/@agentic-core/${name}`;
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
  rewriteVendorPackageJson(join(destPkg, "package.json"));
  if (!sourcesImportLib(join(destPkg, "src"))) return;
  const libIndex = join(destPkg, "src", "lib", "index.ts");
  copyTsSources(
    join(srcRoot, "packages", "lib", "src"),
    join(destPkg, "src", "lib"),
  );
  rewriteLibImports(join(destPkg, "src"), libIndex);
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

function rewriteVendorPackageJson(pkgPath: string): void {
  const raw: unknown = JSON.parse(readFileSync(pkgPath, "utf8"));
  if (!isRecord(raw)) throw new Error(`${pkgPath} must be a JSON object`);
  if (isRecord(raw.dependencies)) {
    delete raw.dependencies["@agentic-core/lib"];
    if (Object.keys(raw.dependencies).length === 0) delete raw.dependencies;
  }
  writeFileSync(pkgPath, `${JSON.stringify(raw, null, 2)}\n`, "utf8");
}

function sourcesImportLib(dir: string): boolean {
  return listTsFiles(dir).some((file) =>
    fileImportsLib(readFileSync(file, "utf8")),
  );
}

function fileImportsLib(text: string): boolean {
  return /from\s+["']@agentic-core\/lib["']/.test(text);
}

function rewriteLibImports(srcDir: string, libIndex: string): void {
  const libDir = dirname(libIndex);
  for (const file of listTsFiles(srcDir)) {
    if (
      file === libIndex ||
      file.startsWith(`${libDir}/`) ||
      file.startsWith(`${libDir}\\`)
    ) {
      continue;
    }
    const text = readFileSync(file, "utf8");
    if (!fileImportsLib(text)) continue;
    const specifier = relativeImport(file, libIndex);
    writeFileSync(
      file,
      text.replace(LIB_FROM, `from $1${specifier}$1`),
      "utf8",
    );
    LIB_FROM.lastIndex = 0;
  }
}

function relativeImport(fromFile: string, toFile: string): string {
  let rel = relative(dirname(fromFile), toFile);
  if (!rel.startsWith(".")) rel = `./${rel}`;
  return rel.split("\\").join("/");
}

function listTsFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, ent.name);
    if (ent.isDirectory()) out.push(...listTsFiles(path));
    else if (ent.isFile() && ent.name.endsWith(".ts")) out.push(path);
  }
  return out;
}

function mergePackageSources(settingsPath: string, sources: string[]): void {
  if (!sources.length) return;
  let settings: Record<string, unknown> = {};
  if (existsSync(settingsPath)) {
    const raw: unknown = JSON.parse(readFileSync(settingsPath, "utf8"));
    if (!isRecord(raw)) {
      throw new Error(".pi/settings.json must be a JSON object");
    }
    settings = raw;
  }
  const existing = Array.isArray(settings.packages) ? settings.packages : [];
  const have = new Set<string>();
  const next: unknown[] = [];
  for (const item of existing) {
    next.push(item);
    const source = packageSource(item);
    if (source) have.add(source);
  }
  for (const src of sources) {
    if (have.has(src)) continue;
    have.add(src);
    next.push(src);
  }
  if (next.length === existing.length && Array.isArray(settings.packages))
    return;
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
