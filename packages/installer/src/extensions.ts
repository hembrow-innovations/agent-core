import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { type Destination, openDestination } from "./dest.ts";

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

export function installVendorExtensions(
  srcRoot: string,
  target: string,
  names: readonly FirstPartyExtension[],
): void {
  writeExtensions(srcRoot, openDestination(target), names);
}

export function writeExtensions(
  srcRoot: string,
  dest: Destination,
  names: readonly FirstPartyExtension[],
): void {
  const unique = uniqueNames(names);
  for (const name of unique) {
    writeVendorExtension(srcRoot, dest, name);
    console.log(`  vendor ${name} → .pi/vendor/@agentic-core/${name}`);
  }
  dest.mergePackages(unique.map(vendorPackageSource));
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
  const destRel = join(".pi", "vendor", "@agentic-core", name);
  if (!existsSync(srcPkg)) {
    throw new Error(`Extension package not found: ${name}`);
  }
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
