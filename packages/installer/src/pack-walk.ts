import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

export function walkSkillDirs(
  root: string,
  visit: (dir: string) => void,
): void {
  if (!existsSync(root) || !statSync(root).isDirectory()) return;
  for (const ent of readdirSync(root, { withFileTypes: true })) {
    if (!ent.isDirectory() || ent.name.startsWith(".")) continue;
    const full = join(root, ent.name);
    if (existsSync(join(full, "SKILL.md"))) visit(full);
    else walkSkillDirs(full, visit);
  }
}

export function walkPromptFiles(
  root: string,
  visit: (file: string) => void,
): void {
  if (!existsSync(root) || !statSync(root).isDirectory()) return;
  for (const ent of readdirSync(root, { withFileTypes: true })) {
    if (ent.name.startsWith(".")) continue;
    const full = join(root, ent.name);
    if (ent.isDirectory()) {
      walkPromptFiles(full, visit);
      continue;
    }
    if (
      ent.isFile() &&
      ent.name.endsWith(".md") &&
      !/^readme\.md$/i.test(ent.name)
    ) {
      visit(full);
    }
  }
}
