import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { openDestination, PROMPT_DEST, type Destination } from "./dest.ts";
import { packRoot } from "./pack.ts";

export function listPromptIds(srcRoot: string): string[] {
  const dir = join(packRoot(srcRoot), "prompts");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((n) => n.endsWith(".md") && !/^readme\.md$/i.test(n))
    .map((n) => n.slice(0, -3))
    .sort();
}

export function installPrompts(
  srcRoot: string,
  target: string,
  ids: string[],
): void {
  writePrompts(srcRoot, openDestination(target), ids);
}

export function writePrompts(
  srcRoot: string,
  dest: Destination,
  ids: string[],
): void {
  dest.ensureDir(PROMPT_DEST);
  for (const id of ids) {
    const src = join(packRoot(srcRoot), "prompts", `${id}.md`);
    if (!existsSync(src)) throw new Error(`Prompt not found: ${id}`);
    dest.copyFile(src, join(PROMPT_DEST, `${id}.md`));
  }
}
