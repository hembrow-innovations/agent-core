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
