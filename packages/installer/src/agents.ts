import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { AGENT_DEST, openDestination, type Destination } from "./dest.ts";
import { packRoot } from "./pack.ts";

const AGENT_STEM_RE = /^[a-z][a-z0-9-]{0,63}$/;

export function listAgentIds(srcRoot: string): string[] {
  const dir = join(packRoot(srcRoot), "agents");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => {
      if (!AGENT_STEM_RE.test(name)) return false;
      return existsSync(join(dir, name, `${name}.md`));
    })
    .sort();
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
  for (const ent of dest.list(AGENT_DEST)) {
    if (ent.isFile && ent.name.endsWith(".md")) {
      dest.remove(join(AGENT_DEST, ent.name));
    }
  }
  for (const id of ids) {
    const src = join(packRoot(srcRoot), "agents", id, `${id}.md`);
    if (!existsSync(src)) throw new Error(`Agent not found: ${id}`);
    dest.copyFile(src, join(AGENT_DEST, `${id}.md`));
  }
}
