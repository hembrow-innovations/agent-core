import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { type Destination, openDestination } from "./dest.ts";

export const FIRST_PARTY_EXTENSIONS = [
  "heio-todo",
  "heio-boot",
  "heio-footer",
  "heio-coord",
] as const;

export type FirstPartyExtension = (typeof FIRST_PARTY_EXTENSIONS)[number];

export type ProfilePackage =
  | { kind: "npm"; source: string }
  | { kind: "local"; name: FirstPartyExtension };

const FIRST_PARTY_EXTENSION_SET = new Set<string>(FIRST_PARTY_EXTENSIONS);
const LOCAL_SOURCE_RE = /^local:@agentic-core\/([a-z0-9-]+)$/;

export function isFirstPartyExtension(
  name: string,
): name is FirstPartyExtension {
  return FIRST_PARTY_EXTENSION_SET.has(name);
}

export function localPackageSource(name: FirstPartyExtension): string {
  return `npm/local/@agentic-core/${name}`;
}

export function packageRefSource(pkg: ProfilePackage): string {
  switch (pkg.kind) {
    case "npm":
      return pkg.source;
    case "local":
      return localPackageSource(pkg.name);
    default: {
      const _exhaustive: never = pkg;
      return _exhaustive;
    }
  }
}

export function parseProfilePackage(raw: string): ProfilePackage {
  const src = raw.trim();
  if (src.startsWith("npm:")) {
    if (src === "npm:") throw new Error(`Invalid package source: ${raw}`);
    return { kind: "npm", source: src };
  }
  if (
    src.startsWith("vendor:") ||
    src.startsWith("vendor/") ||
    src.startsWith(".pi/vendor/")
  ) {
    throw new Error(
      `Invalid package source: ${raw}. Use npm:... or local:@agentic-core/<name>`,
    );
  }
  const local = src.match(LOCAL_SOURCE_RE);
  if (local) {
    const name = local[1];
    if (!isFirstPartyExtension(name)) {
      throw new Error(
        `Unknown extension: ${name}. Choose: ${FIRST_PARTY_EXTENSIONS.join(", ")}`,
      );
    }
    return { kind: "local", name };
  }
  throw new Error(
    `Invalid package source: ${raw}. Use npm:... or local:@agentic-core/<name>`,
  );
}

export function installVendorExtensions(
  srcRoot: string,
  target: string,
  names: readonly FirstPartyExtension[],
): void {
  writeExtensions(srcRoot, openDestination(target), names);
}

export function writeVendorTrees(
  srcRoot: string,
  dest: Destination,
  names: readonly FirstPartyExtension[],
): void {
  dest.remove(".pi/vendor/@agentic-core");
  for (const name of uniqueNames(names)) {
    writeVendorExtension(srcRoot, dest, name);
    console.log(`  local ${name} → .pi/npm/local/@agentic-core/${name}`);
  }
}

export function writeExtensions(
  srcRoot: string,
  dest: Destination,
  names: readonly FirstPartyExtension[],
): void {
  const unique = uniqueNames(names);
  writeVendorTrees(srcRoot, dest, unique);
  dest.mergePackages(unique.map(localPackageSource));
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
  dest: Destination,
  name: FirstPartyExtension,
): void {
  const srcPkg = join(srcRoot, "packages", name);
  const destRel = join(".pi", "npm", "local", "@agentic-core", name);
  if (!existsSync(srcPkg)) {
    throw new Error(`Extension package not found: ${name}`);
  }
  dest.remove(join(".pi", "npm", "node_modules", "@agentic-core", name));
  dest.remove(destRel);
  dest.ensureDir(destRel);
  dest.copyFile(join(srcPkg, "package.json"), join(destRel, "package.json"));
  copyTsSources(join(srcPkg, "src"), dest, join(destRel, "src"));
}

function copyTsSources(
  srcDir: string,
  dest: Destination,
  destRel: string,
): void {
  if (!existsSync(srcDir)) return;
  dest.ensureDir(destRel);
  for (const ent of readdirSync(srcDir, { withFileTypes: true })) {
    const from = join(srcDir, ent.name);
    const to = join(destRel, ent.name);
    if (ent.isDirectory()) {
      copyTsSources(from, dest, to);
      continue;
    }
    if (
      !ent.isFile() ||
      !ent.name.endsWith(".ts") ||
      ent.name.endsWith(".test.ts")
    ) {
      continue;
    }
    dest.copyFile(from, to);
  }
}
