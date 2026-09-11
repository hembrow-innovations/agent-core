/**
 * Turn OpenCode tool-use parts into title-plus-body terminal lines.
 *
 * {@link packages/loop/src/harness/ansi.ts}
 * {@link packages/loop/src/harness/markdown.ts}
 *
 * @packageDocumentation
 */

import { homedir } from "node:os";
import { relative, resolve, sep } from "node:path";
import { clipLines, wrapAnsi, type Paint } from "./ansi.ts";
import { renderDiff, renderMarkdown } from "./markdown.ts";

/**
 * Untyped JSON bag from a tool part, input, or metadata object.
 */
type Dict = {
  /** Field from the OpenCode JSON payload. */
  [key: string]: unknown;
};

/**
 * Paint and layout knobs for one tool line.
 *
 * @see formatTool
 * @see Paint
 */
export type ToolFormatContext = {
  /** Style functions for status color and dim chrome. */
  paint: Paint;
  /** Column budget including indent. */
  width: number;
  /** Prefix on the title line; body hangs two more spaces. */
  indent?: string;
};

/**
 * Status-neutral glyph for each known tool name.
 */
const ICONS: Record<string, string> = {
  bash: "$",
  shell: "$",
  read: "→",
  write: "←",
  edit: "←",
  apply_patch: "%",
  glob: "✱",
  grep: "✱",
  list: "→",
  webfetch: "%",
  websearch: "◈",
  skill: "→",
  todowrite: "#",
  todo: "#",
  task: "✓",
  lsp: "→",
  question: "?",
  batch: "#",
};

/**
 * Tools whose output is omitted from the body.
 */
const QUIET = new Set([
  "read",
  "glob",
  "grep",
  "list",
  "lsp",
  "skill",
  "webfetch",
  "websearch",
]);

/**
 * Format a tool-use part as a title line plus optional body.
 *
 * @param part - Tool part from an OpenCode event.
 * @param ctx - Paint, column width, and indent.
 * @returns Terminal text for the tool call.
 *
 * @defaultValue ctx.indent - `"  "`
 *
 * @see createHarness
 * @see renderMarkdown
 * @see renderDiff
 */
export function formatTool(
  part: unknown,
  { paint, width, indent = "  " }: ToolFormatContext,
): string {
  const rec = obj(part);
  const state = obj(rec.state);
  const input = obj(state.input);
  const meta = obj(state.metadata);
  const status = String(state.status || "");
  const name = String(rec.tool || "tool");
  const icon =
    status === "error" ? "✗" : status === "running" ? "•" : (ICONS[name] ?? "⚙");
  const title = titleFor(name, input, meta, state);
  const color =
    status === "error"
      ? paint.err
      : status === "running"
        ? paint.yellow
        : paint.cyan;
  const time = fmtTime(state.time);
  let out = `${indent}${paint.dim(icon)} ${color(title)}${time ? paint.dim(` · ${time}`) : ""}`;
  if (status === "error" && state.error) {
    out += `\n${wrapAnsi(paint.err(String(state.error)), width, indent + "  ")}`;
  }
  const body = toolBody(name, state, input, meta, paint, width, indent);
  if (body) out += `\n${body}`;
  return out;
}

/**
 * Body lines under a tool title.
 *
 * @param name - Tool name.
 * @param state - Tool state object.
 * @param input - Tool input object.
 * @param meta - Tool metadata object.
 * @param paint - ANSI paint helper.
 * @param width - Column width.
 * @param indent - Title indent; body hangs two more spaces.
 * @returns Body text, or `""` when there is nothing to show.
 */
function toolBody(
  name: string,
  state: Dict,
  input: Dict,
  meta: Dict,
  paint: Paint,
  width: number,
  indent: string,
): string {
  const hang = indent + "  ";
  if (name === "todowrite" || name === "todo") {
    const todos = Array.isArray(input.todos) ? input.todos : [];
    if (!todos.length) return "";
    return todos
      .map((item) => {
        const rec = obj(item);
        const mark =
          rec.status === "completed"
            ? paint.ok("☑")
            : rec.status === "in_progress"
              ? paint.yellow("•")
              : paint.dim("☐");
        return wrapAnsi(`${mark} ${rec.content ?? ""}`, width, hang);
      })
      .join("\n");
  }
  if (name === "edit" && typeof meta.diff === "string" && meta.diff.trim()) {
    return indentLines(renderDiff(clipLines(meta.diff, 60), paint), hang);
  }
  if (name === "apply_patch" && Array.isArray(meta.files)) {
    return meta.files
      .slice(0, 8)
      .map((file) => hang + paint.dim(patchLine(file)))
      .join("\n");
  }
  if (name === "task") {
    const result = taskResult(state.output);
    if (!result) return "";
    return renderMarkdown(result, { paint, width, indent: hang });
  }
  if (
    name === "write" &&
    typeof input.content === "string" &&
    input.content.trim()
  ) {
    return indentLines(paint.dim(clipLines(input.content, 40)), hang);
  }
  if (QUIET.has(name)) return "";
  const output = typeof state.output === "string" ? state.output.trim() : "";
  if (!output) return "";
  if (looksMarkdown(output)) {
    return renderMarkdown(clipLines(output, 80), { paint, width, indent: hang });
  }
  const shown = clipLines(output, 80);
  if (looksDiff(shown)) return indentLines(renderDiff(shown, paint), hang);
  return indentLines(paint.dim(shown), hang);
}

/**
 * Human-readable title for a tool call.
 *
 * @param name - Tool name.
 * @param input - Tool input object.
 * @param meta - Tool metadata object.
 * @param state - Tool state object.
 * @returns Title text.
 */
function titleFor(name: string, input: Dict, meta: Dict, state: Dict): unknown {
  if (name === "bash" || name === "shell")
    return input.command || state.title || "bash";
  if (name === "read") return `Read ${shortPath(input.filePath)}`;
  if (name === "write") return `Write ${shortPath(input.filePath)}`;
  if (name === "edit") return `Edit ${shortPath(input.filePath)}`;
  if (name === "glob") {
    const root = input.path ? ` in ${shortPath(input.path)}` : "";
    const n = meta.count;
    const extra =
      typeof n === "number" ? ` · ${n} match${n === 1 ? "" : "es"}` : "";
    return `Glob "${input.pattern ?? ""}"${root}${extra}`;
  }
  if (name === "grep") {
    const root = input.path ? ` in ${shortPath(input.path)}` : "";
    const n = meta.matches;
    const extra =
      typeof n === "number" ? ` · ${n} match${n === 1 ? "" : "es"}` : "";
    return `Grep "${input.pattern ?? ""}"${root}${extra}`;
  }
  if (name === "list") return input.path ? `List ${shortPath(input.path)}` : "List";
  if (name === "webfetch") return input.url ? `WebFetch ${input.url}` : "WebFetch";
  if (name === "websearch")
    return input.query ? `Search "${input.query}"` : "Search";
  if (name === "skill") return `Skill "${input.name ?? ""}"`;
  if (name === "task")
    return (
      input.description ||
      `${titlecase(input.subagent_type || "task")} Task`
    );
  if (name === "todowrite" || name === "todo") return "Todos";
  if (name === "lsp") return state.title || `LSP ${input.operation || "request"}`;
  if (name === "question") {
    const n = Array.isArray(input.questions) ? input.questions.length : 0;
    return `Asked ${n} question${n === 1 ? "" : "s"}`;
  }
  if (typeof state.title === "string" && state.title.trim())
    return state.title.trim();
  for (const v of Object.values(input)) {
    if (typeof v === "string" && v.trim() && v.length < 80)
      return `${name} ${v.trim()}`;
  }
  return name;
}

/**
 * Shorten a path relative to cwd, or as `~/…` under the home directory.
 *
 * @param input - Path value from tool input.
 * @returns A display path, or `""` when `input` is not a string.
 */
function shortPath(input: unknown): string {
  if (!input || typeof input !== "string") return "";
  const cwd = process.cwd();
  const abs = input.startsWith("/") ? input : resolve(cwd, input);
  const rel = relative(cwd, abs);
  if (rel && !rel.startsWith(".." + sep) && rel !== "..")
    return rel.replaceAll("\\", "/");
  const home = homedir();
  if (home && (abs === home || abs.startsWith(home + sep))) {
    return abs.replace(home, "~").replaceAll("\\", "/");
  }
  return abs.replaceAll("\\", "/");
}

/**
 * Format a tool duration from start/end timestamps.
 *
 * @param time - Object with numeric `start` and `end`.
 * @returns A duration label, or `""` when the timestamps are missing or invalid.
 */
function fmtTime(time: unknown): string {
  const rec = obj(time);
  const start = rec.start;
  const end = rec.end;
  if (typeof start !== "number" || typeof end !== "number") return "";
  const ms = end - start;
  if (ms < 0 || !Number.isFinite(ms)) return "";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 10_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms / 1000)}s`;
}

/**
 * Extract a task subagent result from its output string.
 *
 * @param output - Raw tool output.
 * @returns Inner `<task_result>` text, or the output with `task_id:` lines
 *   removed.
 */
function taskResult(output: unknown): string {
  if (typeof output !== "string" || !output.trim()) return "";
  const match = output.match(/<task_result>\s*([\s\S]*?)\s*<\/task_result>/);
  if (match) return match[1].trim();
  return output
    .split("\n")
    .filter((line) => !line.startsWith("task_id:"))
    .join("\n")
    .trim();
}

/**
 * One-line summary for an apply_patch file entry.
 *
 * @param file - Patch file metadata.
 * @returns A created/deleted/moved/patched label.
 */
function patchLine(file: unknown): string {
  if (!file || typeof file !== "object") return "patch";
  const rec = file as Dict;
  const rel = rec.relativePath || rec.filePath || "";
  if (rec.type === "add") return `+ Created ${rel}`;
  if (rec.type === "delete") return `- Deleted ${rel}`;
  if (rec.type === "move") return `→ Moved ${rec.filePath} -> ${rel}`;
  return `~ Patched ${rel}`;
}

/**
 * Whether text looks like markdown worth rendering.
 *
 * @param text - Candidate output.
 * @returns True when headings, fences, lists, quotes, bold, or code appear.
 */
function looksMarkdown(text: string): boolean {
  return (
    /^(#{1,6}\s|```|[-*]\s|\d+\.\s|>\s)/m.test(text) ||
    /\*\*[^*]+\*\*|`[^`]+`/.test(text)
  );
}

/**
 * Whether text looks like a unified diff.
 *
 * @param text - Candidate output.
 * @returns True when at least half of the non-empty lines start with `+`, `-`,
 *   or `@@`.
 */
function looksDiff(text: string): boolean {
  const lines = String(text)
    .split("\n")
    .filter((l) => l.trim());
  if (lines.length < 2) return false;
  const hits = lines.filter((l) => /^[+-]/.test(l) || l.startsWith("@@")).length;
  return hits / lines.length >= 0.5;
}

/**
 * Prefix every line of text.
 *
 * @param text - Body text.
 * @param indent - Prefix for each line.
 * @returns Indented text.
 */
function indentLines(text: unknown, indent: string): string {
  return String(text)
    .split("\n")
    .map((l) => indent + l)
    .join("\n");
}

/**
 * Title-case a slug, treating `_` and `-` as spaces.
 *
 * @param s - Value to stringify.
 * @returns Title-cased string.
 */
function titlecase(s: unknown): string {
  return String(s)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Coerce a value to a plain object.
 *
 * @param v - Candidate value.
 * @returns `v` when it is a non-array object, otherwise `{}`.
 */
function obj(v: unknown): Dict {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Dict) : {};
}
