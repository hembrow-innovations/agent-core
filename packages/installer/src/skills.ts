import { existsSync } from "node:fs";
import { basename, join } from "node:path";
import { SKILL_DEST, type Destination } from "./dest.ts";
import { packRoot } from "./pack.ts";
import { walkSkillDirs } from "./pack-walk.ts";

export function findSkillDir(srcRoot: string, name: string): string | null {
  const candidates: string[] = [];
  const pack = packRoot(srcRoot);
  const skillsRoot = join(pack, "skills");
  if (existsSync(skillsRoot)) {
    walkSkillDirs(skillsRoot, (dir) => {
      if (basename(dir) === name && existsSync(join(dir, "SKILL.md"))) {
        candidates.push(dir);
      }
    });
  }

  if (!candidates.length) return null;
  const prefer = ["skills/workflow", "skills/setup"].map(
    (rel) => join(pack, rel) + "/",
  );
  for (const prefix of prefer) {
    const hit = candidates.find((p) => p.startsWith(prefix));
    if (hit) return hit;
  }
  return candidates[0] ?? null;
}

export function installSkills(input: {
  srcRoot: string;
  dest: Destination;
  names: string[];
}): void {
  for (const name of input.names) {
    const src = findSkillDir(input.srcRoot, name);
    if (!src) throw new Error(`Skill not found in source: ${name}`);
    input.dest.replaceTree(src, join(SKILL_DEST, name));
    console.log(`  skill ${name} → ${SKILL_DEST}/${name}`);
  }
}
