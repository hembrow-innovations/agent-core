import { basename, join } from "node:path";
import { openDestination, PROMPT_DEST, type Destination } from "./dest.ts";
import { packRoot } from "./pack.ts";
import { walkPromptFiles } from "./pack-walk.ts";
import { listStacks, stackRoot } from "./stacks.ts";

function promptFilesIn(dir: string): Map<string, string> {
  const found = new Map<string, string>();
  walkPromptFiles(dir, (file) => {
    const id = basename(file).slice(0, -3);
    if (found.has(id)) throw new Error(`Duplicate prompt id: ${id}`);
    found.set(id, file);
  });
  return found;
}

function packPromptFiles(srcRoot: string): Map<string, string> {
  return promptFilesIn(join(packRoot(srcRoot), "prompts"));
}

function resolvablePromptFiles(srcRoot: string): Map<string, string> {
  const found = packPromptFiles(srcRoot);
  for (const name of listStacks(srcRoot)) {
    walkPromptFiles(join(stackRoot(srcRoot, name), "prompts"), (file) => {
      const id = basename(file).slice(0, -3);
      if (found.has(id)) throw new Error(`Duplicate prompt id: ${id}`);
      found.set(id, file);
    });
  }
  return found;
}

export function findPromptFile(srcRoot: string, id: string): string | null {
  return resolvablePromptFiles(srcRoot).get(id) ?? null;
}

export function listPromptIds(srcRoot: string): string[] {
  return [...packPromptFiles(srcRoot).keys()].sort();
}

export function listResolvablePromptIds(srcRoot: string): string[] {
  return [...resolvablePromptFiles(srcRoot).keys()].sort();
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
  const files = resolvablePromptFiles(srcRoot);
  for (const id of ids) {
    const src = files.get(id);
    if (!src) throw new Error(`Prompt not found: ${id}`);
    dest.copyFile(src, join(PROMPT_DEST, `${id}.md`));
  }
}
