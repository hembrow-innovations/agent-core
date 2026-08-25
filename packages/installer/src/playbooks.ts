import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { openDestination, PLAYBOOK_DEST, type Destination } from "./dest.ts";
import { packRoot } from "./pack.ts";
import { resolveNamedIds, unquote, type Profile } from "./profile.ts";

export type PlaybookMeta = {
  id: string;
  title: string;
  when: string;
};

export type PlaybookResolveOpts = {
  playbooks: string[] | null;
  withPlaybooks: string[];
  withoutPlaybooks: string[];
};

const START = "<!-- playbooks:start -->";
const END = "<!-- playbooks:end -->";

export function listPlaybookIds(srcRoot: string): string[] {
  const dir = join(packRoot(srcRoot), "playbooks");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((n) => n.endsWith(".md") && !/^readme\.md$/i.test(n))
    .map((n) => n.slice(0, -3))
    .sort();
}

export function resolvePlaybookIds(
  profile: Profile,
  opts: PlaybookResolveOpts,
  available: string[],
): string[] {
  return resolveNamedIds(
    profile.playbooks,
    {
      replace: opts.playbooks,
      add: opts.withPlaybooks,
      remove: opts.withoutPlaybooks,
    },
    available,
    "playbook",
  );
}

export function readPlaybookMeta(srcRoot: string, id: string): PlaybookMeta {
  const file = join(packRoot(srcRoot), "playbooks", `${id}.md`);
  const text = readFileSync(file, "utf8");
  let title: string | null = null;
  let when: string | null = null;
  if (text.startsWith("---\n") || text.startsWith("---\r\n")) {
    const close = text.indexOf("\n---", 3);
    if (close !== -1) {
      const fm = text.slice(text.indexOf("\n") + 1, close);
      for (const line of fm.split(/\r?\n/)) {
        const m = line.match(/^([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.*)$/);
        if (!m) continue;
        const val = unquote(m[2].trim());
        if (m[1] === "title") title = val;
        else if (m[1] === "when") when = val;
      }
    }
  }
  if (title == null || title === "") {
    const h = text.match(/^###\s+(.+)$/m);
    title = h ? h[1].trim() : id;
  }
  return { id, title, when: when ?? "" };
}

export function renderPlaybookCatalog(metas: PlaybookMeta[]): string {
  return metas
    .map((m) => {
      if (m.when) {
        return `- **${m.title}.** ${m.when} \`playbooks/${m.id}.md\`.`;
      }
      return `- **${m.title}.** \`playbooks/${m.id}.md\`.`;
    })
    .join("\n");
}

export function rewriteSkillPlaybooks(
  skillDir: string,
  metas: PlaybookMeta[],
): void {
  const skillPath = join(skillDir, "SKILL.md");
  const text = readFileSync(skillPath, "utf8");
  const i = text.indexOf(START);
  const j = text.indexOf(END);
  if (i === -1 || j === -1 || j < i) {
    throw new Error(`Missing playbooks markers in ${skillPath}`);
  }
  const catalog = renderPlaybookCatalog(metas);
  const mid = catalog ? `${catalog}\n` : "";
  writeFileSync(
    skillPath,
    `${text.slice(0, i + START.length)}\n${mid}${text.slice(j)}`,
    "utf8",
  );
}

export function installPlaybooks(
  srcRoot: string,
  target: string,
  ids: string[],
): void {
  writePlaybooks(srcRoot, openDestination(target), ids);
}

export function writePlaybooks(
  srcRoot: string,
  dest: Destination,
  ids: string[],
): void {
  dest.ensureDir(PLAYBOOK_DEST);
  for (const ent of dest.list(PLAYBOOK_DEST)) {
    if (ent.isFile && ent.name.endsWith(".md")) {
      dest.remove(join(PLAYBOOK_DEST, ent.name));
    }
  }
  for (const id of ids) {
    const src = join(packRoot(srcRoot), "playbooks", `${id}.md`);
    if (!existsSync(src)) throw new Error(`Playbook not found: ${id}`);
    dest.copyFile(src, join(PLAYBOOK_DEST, `${id}.md`));
  }
}
