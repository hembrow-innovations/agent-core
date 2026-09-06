import { existsSync } from "node:fs";
import { basename, join } from "node:path";
import { SKILL_DEST, type Destination } from "./dest.ts";
import { packRoot } from "./pack.ts";
import { walkSkillDirs } from "./pack-walk.ts";
import { listStacks, stackRoot } from "./stacks.ts";

function collectSkillDirs(root: string, name: string, into: string[]): void {
  if (!existsSync(root)) return;
  walkSkillDirs(root, (dir) => {
    if (basename(dir) === name && existsSync(join(dir, "SKILL.md"))) {
      into.push(dir);
    }
  });
}

export function findSkillDir(srcRoot: string, name: string): string | null {
  const packHits: string[] = [];
  const pack = packRoot(srcRoot);
  collectSkillDirs(join(pack, "skills"), name, packHits);
  if (packHits.length) {
    const prefer = ["skills/workflow", "skills/setup"].map(
      (rel) => join(pack, rel) + "/",
    );
    for (const prefix of prefer) {
      const hit = packHits.find((p) => p.startsWith(prefix));
      if (hit) return hit;
    }
    return packHits[0] ?? null;
  }

  const stackHits: string[] = [];
  for (const stackName of listStacks(srcRoot)) {
    collectSkillDirs(join(stackRoot(srcRoot, stackName), "skills"), name, stackHits);
  }
  return stackHits[0] ?? null;
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
