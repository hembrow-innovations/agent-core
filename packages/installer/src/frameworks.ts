import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { Destination } from "./dest.ts";

export const HIVEMIND_YAML_REL = ".hivemind/hivemind.yaml";
export const HIVEMIND_YAML_LEGACY = "hivemind.yaml";

export function listFrameworks(srcRoot: string): string[] {
  const dir = join(srcRoot, "frameworks");
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter(
      (ent) =>
        ent.isDirectory() &&
        !ent.name.startsWith(".") &&
        existsSync(join(dir, ent.name, "package.json")),
    )
    .map((ent) => ent.name)
    .sort();
}

export function writeFrameworks(opts: {
  srcRoot: string;
  dest: Destination;
  profileName: string;
  names: readonly string[];
}): void {
  const { srcRoot, dest, profileName, names } = opts;
  for (const name of names) {
    writeFrameworkTree(srcRoot, dest, name);
  }
  if (names.includes("hivemind")) {
    copyHivemindYamlIfMissing(srcRoot, dest, profileName);
  }
}

function writeFrameworkTree(
  srcRoot: string,
  dest: Destination,
  name: string,
): void {
  const srcPkg = join(srcRoot, "frameworks", name);
  const destRel = join(".pi", "frameworks", name);
  dest.remove(destRel);
  dest.ensureDir(destRel);
  dest.copyFile(join(srcPkg, "package.json"), join(destRel, "package.json"));
  copyNonTestSrc(join(srcPkg, "src"), dest, join(destRel, "src"));
  console.log(`  framework ${name} → ${destRel}`);
}

function copyNonTestSrc(
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
      copyNonTestSrc(from, dest, to);
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

function copyHivemindYamlIfMissing(
  srcRoot: string,
  dest: Destination,
  profileName: string,
): void {
  if (dest.exists(HIVEMIND_YAML_REL)) return;
  if (dest.exists(HIVEMIND_YAML_LEGACY)) {
    dest.copyFile(dest.path(HIVEMIND_YAML_LEGACY), HIVEMIND_YAML_REL);
    return;
  }
  const template = join(srcRoot, "profiles", profileName, "hivemind.yaml");
  if (!existsSync(template)) return;
  dest.copyFile(template, HIVEMIND_YAML_REL);
}
