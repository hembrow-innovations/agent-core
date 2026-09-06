import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { AGENT_DEST, openDestination, type Destination } from "./dest.ts";
import { packRoot } from "./pack.ts";
import { listStacks, stackRoot } from "./stacks.ts";

const AGENT_STEM_RE = /^[a-z][a-z0-9-]{0,63}$/;

function listAgentIdsIn(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => {
      if (!AGENT_STEM_RE.test(name)) return false;
      return existsSync(join(dir, name, `${name}.md`));
    })
    .sort();
}

export function listAgentIds(srcRoot: string): string[] {
  return listAgentIdsIn(join(packRoot(srcRoot), "agents"));
}

export function listResolvableAgentIds(srcRoot: string): string[] {
  const ids = new Set(listAgentIds(srcRoot));
  for (const name of listStacks(srcRoot)) {
    for (const id of listAgentIdsIn(join(stackRoot(srcRoot, name), "agents"))) {
      ids.add(id);
    }
  }
  return [...ids].sort();
}

export function findAgentFile(srcRoot: string, id: string): string | null {
  const pack = join(packRoot(srcRoot), "agents", id, `${id}.md`);
  if (existsSync(pack)) return pack;
  for (const name of listStacks(srcRoot)) {
    const file = join(stackRoot(srcRoot, name), "agents", id, `${id}.md`);
    if (existsSync(file)) return file;
  }
  return null;
}

export function installAgents(
  srcRoot: string,
  target: string,
  ids: string[],
): void {
  writeAgents(srcRoot, openDestination(target), ids);
}

export function writeAgents(
  srcRoot: string,
  dest: Destination,
  ids: string[],
): void {
  dest.ensureDir(AGENT_DEST);
  for (const id of ids) {
    const src = findAgentFile(srcRoot, id);
    if (!src) throw new Error(`Agent not found: ${id}`);
    dest.copyFile(src, join(AGENT_DEST, `${id}.md`));
  }
}
