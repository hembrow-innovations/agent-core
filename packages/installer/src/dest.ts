import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";

export const DEST_ROOT = ".opencode";
export const SKILL_DEST = ".opencode/skills";
export const PLAYBOOK_DEST = ".opencode/playbooks";
export const AGENT_DEST = ".opencode/agents";
export const PROMPT_DEST = ".opencode/commands";

const PREVIOUS_FIRST_PARTY = [
  "draconic-todo",
  "draconic-coms",
  "draconic-boot",
  "draconic-teams",
  "draconic-footer",
  "heio-coms",
  "heio-teams",
  "heio-todo",
  "heio-coord",
  "heio-boot",
  "heio-footer",
  "heio-onic",
] as const;

export type DestEntry = {
  name: string;
  isFile: boolean;
  isDirectory: boolean;
};

export type Destination = {
  readonly target: string;
  path(...parts: string[]): string;
  exists(rel: string): boolean;
  ensureDir(rel: string): void;
  readText(rel: string): string;
  writeText(rel: string, body: string, opts?: { ifMissing?: boolean }): boolean;
  copyFile(absSrc: string, relDest: string): void;
  copyTree(absSrc: string, relDest: string): void;
  replaceTree(absSrc: string, relDest: string): void;
  remove(rel: string): void;
  list(rel: string): DestEntry[];
  removeLeftovers(): void;
};

export function openDestination(target: string): Destination {
  const path = (...parts: string[]) => join(target, ...parts);

  const exists = (rel: string) => existsSync(path(rel));

  const ensureDir = (rel: string) => {
    mkdirSync(path(rel), { recursive: true });
  };

  const readText = (rel: string) => readFileSync(path(rel), "utf8");

  const writeText = (
    rel: string,
    body: string,
    opts?: { ifMissing?: boolean },
  ): boolean => {
    if (opts?.ifMissing && exists(rel)) return false;
    mkdirSync(dirname(path(rel)), { recursive: true });
    writeFileSync(path(rel), body, "utf8");
    return true;
  };

  const copyFile = (absSrc: string, relDest: string) => {
    mkdirSync(dirname(path(relDest)), { recursive: true });
    cpSync(absSrc, path(relDest));
  };

  const copyTree = (absSrc: string, relDest: string) => {
    mkdirSync(dirname(path(relDest)), { recursive: true });
    cpSync(absSrc, path(relDest), { recursive: true });
  };

  const remove = (rel: string) => {
    rmSync(path(rel), { recursive: true, force: true });
  };

  const replaceTree = (absSrc: string, relDest: string) => {
    remove(relDest);
    copyTree(absSrc, relDest);
  };

  const list = (rel: string): DestEntry[] => {
    if (!exists(rel)) return [];
    return readdirSync(path(rel), { withFileTypes: true }).map((ent) => ({
      name: ent.name,
      isFile: ent.isFile(),
      isDirectory: ent.isDirectory(),
    }));
  };

  const removeLeftovers = () => {
    remove(".pi/extensions");
    remove(".pi/lib");
    remove(".pi/roles");
    remove(".pi/vendor/@agentic-core");
    remove(".pi/draconic-models.md");
    remove(".pi/agents/draconic.md");
    remove(".pi/skills/draconic-mode");
    remove(".pi/skills/setup-draconic");
    remove(".pi/skills/agent-teams");
    remove(".pi/npm/local/@agentic-core");
    remove(".pi/npm/node_modules/@agentic-core");
    for (const name of PREVIOUS_FIRST_PARTY) {
      remove(`.pi/npm/node_modules/@agentic-core/${name}`);
      remove(`.pi/npm/local/@agentic-core/${name}`);
    }
  };

  return {
    target,
    path,
    exists,
    ensureDir,
    readText,
    writeText,
    copyFile,
    copyTree,
    replaceTree,
    remove,
    list,
    removeLeftovers,
  };
}
