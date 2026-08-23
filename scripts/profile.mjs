import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join } from "node:path";

/** @typedef {{ id: string, title: string, when: string }} PlaybookMeta */

/** @typedef {{ kind: 'all' } | { kind: 'list', ids: string[] } | { kind: 'omit' }} PlaybookSelection */

/** @typedef {'opencode' | 'claude' | 'pi' | 'agents'} HarnessId */

/** @typedef {{
 *   skillDests: string[],
 *   runtime: 'opencode' | 'pi' | null,
 * }} Harness
 */

/** @typedef {{
 *   name: string,
 *   mode: string | null,
 *   skills: string[],
 *   playbooks: PlaybookSelection,
 *   harness: HarnessId,
 *   agents: boolean,
 *   commands: boolean,
 *   templates: boolean,
 * }} Profile
 */

/** @type {Record<HarnessId, Harness>} */
export const HARNESSES = {
  opencode: { skillDests: [".opencode/skills"], runtime: "opencode" },
  claude: { skillDests: [".claude/skills"], runtime: null },
  pi: { skillDests: [".pi/skills"], runtime: "pi" },
  agents: { skillDests: [".agents/skills"], runtime: null },
};

const PROFILE_KEYS = new Set([
  "mode",
  "skills",
  "playbooks",
  "agents",
  "commands",
  "templates",
  "harness",
]);

const START = "<!-- playbooks:start -->";
const END = "<!-- playbooks:end -->";

export function parseProfileYaml(text) {
  const out = {};
  let pendingKey = null;

  for (const raw of text.split(/\r?\n/)) {
    const line = stripComment(raw);
    if (!line.trim()) continue;
    rejectUnknown(line, raw);

    const indent = line.match(/^(\s*)/)[1];
    const body = line.slice(indent.length);

    const list = body.match(/^-(\s+(.*))?$/);
    if (list) {
      if (indent.length === 0 || pendingKey == null) {
        throw new Error(`List item without a key: ${raw}`);
      }
      if (!Object.hasOwn(out, pendingKey)) out[pendingKey] = [];
      if (!Array.isArray(out[pendingKey])) {
        throw new Error(`Mixed value and list for "${pendingKey}"`);
      }
      const item = parseScalar((list[2] ?? "").trim(), raw);
      if (item === "" || item == null) continue;
      out[pendingKey].push(item);
      continue;
    }

    const kv = body.match(/^([^:]+?)\s*:\s*(.*)$/);
    if (!kv) throw new Error(`Cannot parse YAML: ${raw}`);
    if (indent.length > 0) throw new Error(`Nested maps are not supported: ${raw}`);

    const key = kv[1].trim();
    const rawVal = kv[2];
    pendingKey = null;
    if (rawVal === "") {
      pendingKey = key;
      continue;
    }
    out[key] = parseScalar(rawVal, raw);
  }

  return out;
}

export function loadProfile(srcRoot, name) {
  const file = join(srcRoot, "profiles", `${name}.yaml`);
  if (!existsSync(file)) {
    const available = listProfiles(srcRoot);
    const listed = available.length ? available.join(", ") : "(none)";
    throw new Error(`Unknown profile "${name}". Choose: ${listed}`);
  }
  const raw = parseProfileYaml(readFileSync(file, "utf8"));
  if (Object.hasOwn(raw, "pi")) {
    throw new Error(`Profile "${name}" has leftover "pi:". use harness: pi`);
  }
  for (const key of Object.keys(raw)) {
    if (!PROFILE_KEYS.has(key)) {
      throw new Error(`Unknown profile key "${key}"`);
    }
  }
  const harness = parseHarness(raw.harness);
  const agents = asBool(raw.agents, "agents");
  const commands = asBool(raw.commands, "commands");
  const templates = asBool(raw.templates, "templates");
  if (harness !== "opencode") {
    if (agents) throw new Error(`"agents" is only valid on harness: opencode`);
    if (commands) throw new Error(`"commands" is only valid on harness: opencode`);
    if (templates) throw new Error(`"templates" is only valid on harness: opencode`);
  }
  return {
    name,
    mode: raw.mode == null || raw.mode === "" ? null : String(raw.mode),
    skills: asStringList(raw.skills, "skills"),
    playbooks: toPlaybooks(raw.playbooks),
    harness,
    agents,
    commands,
    templates,
  };
}

export function listProfiles(srcRoot) {
  const dir = join(srcRoot, "profiles");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((n) => n.endsWith(".yaml") && !/^readme\.yaml$/i.test(n))
    .map((n) => n.slice(0, -5))
    .sort();
}

export function listPlaybookIds(srcRoot) {
  const dir = join(srcRoot, "playbooks");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((n) => n.endsWith(".md") && !/^readme\.md$/i.test(n))
    .map((n) => n.slice(0, -3))
    .sort();
}

export function resolvePlaybookIds(profile, opts, available) {
  const avail = new Set(available);
  /** @type {string[]} */
  let ids;
  if (opts.playbooks != null) {
    ids = [...opts.playbooks];
  } else if (profile.playbooks.kind === "all") {
    ids = [...available];
  } else if (profile.playbooks.kind === "list") {
    ids = [...profile.playbooks.ids];
  } else {
    ids = [];
  }
  if (opts.withPlaybooks) ids.push(...opts.withPlaybooks);
  if (opts.withoutPlaybooks) {
    const drop = new Set(opts.withoutPlaybooks);
    ids = ids.filter((id) => !drop.has(id));
  }
  const seen = new Set();
  const out = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    if (!avail.has(id)) throw new Error(`Unknown playbook "${id}"`);
    out.push(id);
  }
  return out;
}

export function readPlaybookMeta(srcRoot, id) {
  const file = join(srcRoot, "playbooks", `${id}.md`);
  const text = readFileSync(file, "utf8");
  let title = null;
  let when = null;
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

export function renderPlaybookCatalog(metas) {
  return metas
    .map((m) => {
      if (m.when) return `- **${m.title}.** ${m.when} \`playbooks/${m.id}.md\`.`;
      return `- **${m.title}.** \`playbooks/${m.id}.md\`.`;
    })
    .join("\n");
}

export function rewriteSkillPlaybooks(skillDir, metas) {
  const skillPath = join(skillDir, "SKILL.md");
  const text = readFileSync(skillPath, "utf8");
  const i = text.indexOf(START);
  const j = text.indexOf(END);
  if (i === -1 || j === -1 || j < i) {
    throw new Error(`Missing playbooks markers in ${skillPath}`);
  }
  const catalog = renderPlaybookCatalog(metas);
  const mid = catalog ? `${catalog}\n` : "";
  writeFileSync(skillPath, `${text.slice(0, i + START.length)}\n${mid}${text.slice(j)}`, "utf8");
}

export function findSkillDir(srcRoot, name) {
  const candidates = [];
  const skillsRoot = join(srcRoot, "skills");
  if (existsSync(skillsRoot)) {
    walkSkillDirs(skillsRoot, (dir) => {
      if (basename(dir) === name && existsSync(join(dir, "SKILL.md"))) {
        candidates.push(dir);
      }
    });
  }

  if (!candidates.length) return null;
  const prefer = ["skills/workflow", "skills/setup"].map((rel) => join(srcRoot, rel) + "/");
  for (const prefix of prefer) {
    const hit = candidates.find((p) => p.startsWith(prefix));
    if (hit) return hit;
  }
  return candidates[0];
}

export function installModePlaybooks(srcRoot, target, mode, ids, destBases) {
  if (!Array.isArray(destBases) || destBases.length === 0) {
    throw new Error("installModePlaybooks requires a nonempty dest list");
  }
  const metas = ids.map((id) => readPlaybookMeta(srcRoot, id));
  for (const destBase of destBases) {
    const skillDir = join(target, destBase, `${mode}-mode`);
    if (!existsSync(skillDir)) {
      throw new Error(`Mode skill missing: ${destBase}/${mode}-mode`);
    }
    const pbDir = join(skillDir, "playbooks");
    mkdirSync(pbDir, { recursive: true });
    for (const ent of readdirSync(pbDir, { withFileTypes: true })) {
      if (ent.isFile() && ent.name.endsWith(".md")) rmSync(join(pbDir, ent.name));
    }
    for (const id of ids) {
      const src = join(srcRoot, "playbooks", `${id}.md`);
      if (!existsSync(src)) throw new Error(`Playbook not found: ${id}`);
      cpSync(src, join(pbDir, `${id}.md`));
    }
    rewriteSkillPlaybooks(skillDir, metas);
  }
}

export function installPiRuntime(srcRoot, target, opts = {}) {
  const pack = join(srcRoot, "pi");
  const required = ["extensions", "APPEND_SYSTEM.md", "draconic-models.md", "prompts"];
  for (const name of required) {
    if (!existsSync(join(pack, name))) {
      throw new Error(`Pi pack missing: expected pi/${name}`);
    }
  }

  const destExt = join(target, ".pi", "extensions");
  mkdirSync(destExt, { recursive: true });
  for (const ent of readdirSync(join(pack, "extensions"), { withFileTypes: true })) {
    if (!ent.isFile() || !(ent.name.endsWith(".ts") || ent.name.endsWith(".js"))) continue;
    cpSync(join(pack, "extensions", ent.name), join(destExt, ent.name));
  }

  const allow = new Set([...(opts.skills ?? []), ...(opts.playbooks ?? [])]);
  const destPrompts = join(target, ".pi", "prompts");
  mkdirSync(destPrompts, { recursive: true });
  const keep = new Set();
  for (const ent of readdirSync(join(pack, "prompts"), { withFileTypes: true })) {
    if (!ent.isFile() || !ent.name.endsWith(".md")) continue;
    const id = ent.name.slice(0, -3);
    if (allow.size > 0 && !allow.has(id)) continue;
    keep.add(ent.name);
    cpSync(join(pack, "prompts", ent.name), join(destPrompts, ent.name));
  }
  for (const ent of readdirSync(destPrompts, { withFileTypes: true })) {
    if (!ent.isFile() || !ent.name.endsWith(".md")) continue;
    if (!keep.has(ent.name)) rmSync(join(destPrompts, ent.name));
  }

  writeIfMissing(join(target, ".pi", "APPEND_SYSTEM.md"), readFileSync(join(pack, "APPEND_SYSTEM.md"), "utf8"));
  writeIfMissing(join(target, ".pi", "draconic-models.md"), readFileSync(join(pack, "draconic-models.md"), "utf8"));
  writeIfMissing(join(target, ".pi", ".gitignore"), "npm/\ngit/\n");
}

function writeIfMissing(dest, body) {
  if (existsSync(dest)) return;
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, body, "utf8");
}

function walkSkillDirs(root, visit) {
  if (!existsSync(root) || !statSync(root).isDirectory()) return;
  for (const ent of readdirSync(root, { withFileTypes: true })) {
    if (!ent.isDirectory() || ent.name.startsWith(".")) continue;
    const full = join(root, ent.name);
    if (existsSync(join(full, "SKILL.md"))) visit(full);
    else walkSkillDirs(full, visit);
  }
}

function parseHarness(value) {
  const known = Object.keys(HARNESSES).join(", ");
  if (value == null || value === "") {
    throw new Error(`Missing harness. Choose: ${known}`);
  }
  const id = String(value);
  if (!Object.hasOwn(HARNESSES, id)) {
    throw new Error(`Unknown harness "${id}". Choose: ${known}`);
  }
  return id;
}

function toPlaybooks(value) {
  if (value === undefined || value === null) return { kind: "omit" };
  if (value === "all") return { kind: "all" };
  if (Array.isArray(value)) return { kind: "list", ids: value.map(String) };
  throw new Error(`Invalid playbooks value: ${JSON.stringify(value)}`);
}

function asStringList(value, key) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new Error(`"${key}" must be a list`);
  return value.map(String);
}

function asBool(value, key) {
  if (value === undefined || value === null) return false;
  if (typeof value !== "boolean") throw new Error(`"${key}" must be a boolean`);
  return value;
}

function stripComment(line) {
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === "'" && !inDouble) inSingle = !inSingle;
    else if (c === '"' && !inSingle) inDouble = !inDouble;
    else if (c === "#" && !inSingle && !inDouble) return line.slice(0, i);
  }
  return line;
}

function rejectUnknown(line, raw) {
  if (/(^|\s)[&*][A-Za-z_]/.test(line)) throw new Error(`YAML anchors are not supported: ${raw}`);
  if (/:\s*[|>][-+]?\s*$/.test(line)) throw new Error(`Block scalars are not supported: ${raw}`);
  if (/\{/.test(line) && !inQuotes(line, line.indexOf("{"))) {
    throw new Error(`Nested maps are not supported: ${raw}`);
  }
}

function inQuotes(line, idx) {
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < idx; i++) {
    const c = line[i];
    if (c === "'" && !inDouble) inSingle = !inSingle;
    else if (c === '"' && !inSingle) inDouble = !inDouble;
  }
  return inSingle || inDouble;
}

function parseScalar(s, raw) {
  if (s === "true") return true;
  if (s === "false") return false;
  if (s === "null" || s === "~") return null;
  if (s === "[]") return [];
  if (s.startsWith("[") && s.endsWith("]")) {
    const inner = s.slice(1, -1).trim();
    if (!inner) return [];
    return inner
      .split(",")
      .map((part) => parseScalar(part.trim(), raw))
      .filter((item) => item !== "" && item != null);
  }
  if (s.startsWith("{")) throw new Error(`Nested maps are not supported: ${raw}`);
  if (s.startsWith("&") || s.startsWith("*")) throw new Error(`YAML anchors are not supported: ${raw}`);
  if (s.startsWith("|") || s.startsWith(">")) throw new Error(`Block scalars are not supported: ${raw}`);
  return unquote(s);
}

function unquote(s) {
  if (s.length >= 2 && s.startsWith('"') && s.endsWith('"')) {
    return s.slice(1, -1).replace(/\\"/g, '"').replace(/\\n/g, "\n");
  }
  if (s.length >= 2 && s.startsWith("'") && s.endsWith("'")) {
    return s.slice(1, -1).replace(/''/g, "'");
  }
  return s;
}
