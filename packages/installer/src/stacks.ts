import { existsSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { walkPromptFiles, walkSkillDirs } from "./pack-walk.ts";

export const STACKS_DIR = "stacks";

const AGENT_STEM_RE = /^[a-z][a-z0-9-]{0,63}$/;

export type StackContents = {
  skills: string[];
  agents: string[];
  prompts: string[];
};

export function stacksRoot(srcRoot: string): string {
  return join(srcRoot, STACKS_DIR);
}

export function stackRoot(srcRoot: string, name: string): string {
  return join(srcRoot, STACKS_DIR, name);
}

export function listStacks(srcRoot: string): string[] {
  const dir = stacksRoot(srcRoot);
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((ent) => ent.isDirectory() && !ent.name.startsWith("."))
    .map((ent) => ent.name)
    .sort();
}

export function readStack(srcRoot: string, name: string): StackContents {
  const root = stackRoot(srcRoot, name);
  if (!existsSync(root)) {
    const available = listStacks(srcRoot);
    const listed = available.length ? available.join(", ") : "(none)";
    throw new Error(`Unknown stack "${name}". Choose: ${listed}`);
  }
  return {
    skills: listStackSkills(root),
    agents: listStackAgents(root),
    prompts: listStackPrompts(root),
  };
}

export function loadAllStacks(srcRoot: string): Record<string, StackContents> {
  const out: Record<string, StackContents> = {};
  for (const name of listStacks(srcRoot)) {
    out[name] = readStack(srcRoot, name);
  }
  return out;
}

function listStackSkills(root: string): string[] {
  const skills: string[] = [];
  walkSkillDirs(join(root, "skills"), (dir) => {
    skills.push(basename(dir));
  });
  return [...new Set(skills)].sort();
}

function listStackAgents(root: string): string[] {
  const dir = join(root, "agents");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => {
      if (!AGENT_STEM_RE.test(name)) return false;
      return existsSync(join(dir, name, `${name}.md`));
    })
    .sort();
}

function listStackPrompts(root: string): string[] {
  const dir = join(root, "prompts");
  const found = new Set<string>();
  walkPromptFiles(dir, (file) => {
    const id = basename(file).slice(0, -3);
    if (found.has(id)) throw new Error(`Duplicate prompt id: ${id}`);
    found.add(id);
  });
  return [...found].sort();
}
