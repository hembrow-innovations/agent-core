/**
 * Turn assistant markdown into wrapped terminal text.
 *
 * {@link packages/loop/src/harness/ansi.ts}
 *
 * @packageDocumentation
 */

import { wrapAnsi, type Paint } from "./ansi.ts";

/**
 * Paint and layout knobs for one markdown render.
 *
 * @see renderMarkdown
 * @see Paint
 */
export type MarkdownRenderOptions = {
  /** Style functions; required when `src` has content. */
  paint?: Paint;
  /** Column budget including indent. */
  width?: number;
  /** Prefix on each output line. */
  indent?: string;
};

/**
 * Turn assistant markdown into wrapped terminal text.
 *
 * @param src - Markdown source. Empty values render as `""`.
 * @param options - Paint, column width, and indent. `paint` is required when
 *   `src` has content.
 * @returns Rendered terminal text, with blocks joined by blank lines.
 *
 * @defaultValue options.width - `80`
 * @defaultValue options.indent - `"  "`
 *
 * @see renderInline
 * @see renderDiff
 * @see wrapAnsi
 */
export function renderMarkdown(
  src: unknown,
  { paint, width = 80, indent = "  " }: MarkdownRenderOptions = {},
): string {
  if (!src) return "";
  const color = paint as Paint;
  const lines = String(src).replace(/\r\n/g, "\n").split("\n");
  const blocks: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^\s*$/.test(line)) {
      i++;
      continue;
    }
    const fence = line.match(/^\s*(```|~~~)\s*(.*)$/);
    if (fence) {
      const mark = fence[1];
      const lang = fence[2].trim();
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(mark)) {
        body.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;
      blocks.push(renderFence(lang, body.join("\n"), color, width, indent));
      continue;
    }
    if (/^\s{0,3}#{1,6}\s+\S/.test(line)) {
      blocks.push(renderHeading(line, color, width, indent));
      i++;
      continue;
    }
    if (/^\s{0,3}(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      const n = Math.min(32, Math.max(8, width - indent.length));
      blocks.push(indent + color.dim("─".repeat(n)));
      i++;
      continue;
    }
    if (/^\s{0,3}>/.test(line)) {
      const q: string[] = [];
      while (i < lines.length && /^\s{0,3}>/.test(lines[i])) {
        q.push(lines[i].replace(/^\s{0,3}>\s?/, ""));
        i++;
      }
      blocks.push(renderQuote(q.join("\n"), color, width, indent));
      continue;
    }
    if (isTableStart(lines, i)) {
      const table = takeTable(lines, i);
      blocks.push(renderTable(table.rows, color, indent));
      i = table.next;
      continue;
    }
    if (isListLine(line)) {
      const items: string[] = [];
      while (i < lines.length) {
        const cur = lines[i];
        if (!cur.trim()) break;
        if (isListLine(cur) || (items.length && isListCont(cur))) {
          items.push(cur);
          i++;
          continue;
        }
        break;
      }
      blocks.push(renderList(items, color, width, indent));
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i])) {
      para.push(lines[i].trim());
      i++;
    }
    blocks.push(wrapAnsi(renderInline(para.join(" "), color), width, indent));
  }
  return blocks.join("\n\n");
}

/**
 * Whether a line starts a fenced, heading, rule, quote, or list block.
 *
 * @param line - Single markdown line.
 * @returns True when the line should not continue a paragraph.
 */
function isBlockStart(line: string): boolean {
  return (
    /^\s*(```|~~~)/.test(line) ||
    /^\s{0,3}#{1,6}\s+\S/.test(line) ||
    /^\s{0,3}(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line) ||
    /^\s{0,3}>/.test(line) ||
    isListLine(line)
  );
}

/**
 * Whether a line is a bullet or ordered list item with content.
 *
 * @param line - Single markdown line.
 * @returns True for `- `, `* `, `+ `, or `1. ` items.
 */
function isListLine(line: string): boolean {
  return /^\s*(?:[-*+]|\d+[.)])\s+\S/.test(line);
}

/**
 * Whether a line continues a list item by indent.
 *
 * @param line - Single markdown line.
 * @returns True when the line is indented content, not a new block.
 */
function isListCont(line: string): boolean {
  return /^\s{2,}\S/.test(line) && !isBlockStart(line);
}

/**
 * Whether `lines[i]` starts a pipe table with a delimiter row next.
 *
 * @param lines - Markdown lines.
 * @param i - Candidate header index.
 * @returns True when a GFM table starts at `i`.
 */
function isTableStart(lines: string[], i: number): boolean {
  const a = lines[i];
  const b = lines[i + 1];
  if (!a || !b || !a.includes("|") || !b.includes("|")) return false;
  return /^\s*\|?[\s:|-]+\|[\s:|-]+\|?\s*$/.test(b);
}

/**
 * Raw GFM table lines plus the scan index after them.
 */
type TableSlice = {
  /** Pipe-table source lines, including the delimiter row. */
  rows: string[];
  /** Index of the first line after the table. */
  next: number;
};

/**
 * Consume consecutive pipe-table rows.
 *
 * @param lines - Markdown lines.
 * @param i - First table row index.
 * @returns The raw row strings and the index after the table.
 */
function takeTable(lines: string[], i: number): TableSlice {
  const rows: string[] = [];
  let n = i;
  while (n < lines.length && lines[n].includes("|") && lines[n].trim()) {
    rows.push(lines[n]);
    n++;
  }
  return { rows, next: n };
}

/**
 * Render an ATX heading.
 *
 * @param line - Heading source line.
 * @param paint - ANSI paint helper.
 * @param width - Column width.
 * @param indent - Line prefix.
 * @returns Wrapped heading text.
 */
function renderHeading(
  line: string,
  paint: Paint,
  width: number,
  indent: string,
): string {
  const m = line.match(/^\s{0,3}(#{1,6})\s+(.*)$/)!;
  const level = m[1].length;
  const text = renderInline(m[2].replace(/\s+#+\s*$/, ""), paint);
  const style = level === 1 ? paint.h1 : level === 2 ? paint.h2 : paint.h3;
  return wrapAnsi(style(text), width, indent);
}

/**
 * Render a fenced code block with a dim language label.
 *
 * @param lang - Info string from the opening fence.
 * @param body - Fence contents.
 * @param paint - ANSI paint helper.
 * @param width - Column width.
 * @param indent - Line prefix.
 * @returns Label line plus indented body.
 */
function renderFence(
  lang: string,
  body: string,
  paint: Paint,
  width: number,
  indent: string,
): string {
  const label = lang || "code";
  const bar = Math.max(4, Math.min(24, width - indent.length - label.length - 4));
  const head = indent + paint.dim(`── ${label} ${"─".repeat(bar)}`);
  const colored = colorFence(lang, body, paint)
    .split("\n")
    .map((l) => indent + "  " + l)
    .join("\n");
  return `${head}\n${colored}`;
}

/**
 * Color a fence body, using diff colors when the language looks like a patch.
 *
 * @param lang - Fence info string.
 * @param body - Fence contents.
 * @param paint - ANSI paint helper.
 * @returns Colored body without indent.
 */
function colorFence(lang: string, body: string, paint: Paint): string {
  if (lang === "diff" || lang === "patch" || looksDiff(body))
    return renderDiff(body, paint);
  return String(body)
    .split("\n")
    .map((l) => paint.dim(l))
    .join("\n");
}

/**
 * Color unified-diff lines.
 *
 * @param body - Diff text.
 * @param paint - ANSI paint helper.
 * @returns The diff with `+` green, `-` red, `@@` cyan, and other lines dim.
 *
 * @see Paint
 * @see clipLines
 */
export function renderDiff(body: unknown, paint: Paint): string {
  return String(body)
    .split("\n")
    .map((line) => {
      if (line.startsWith("+") && !line.startsWith("+++"))
        return paint.green(line);
      if (line.startsWith("-") && !line.startsWith("---")) return paint.red(line);
      if (line.startsWith("@@")) return paint.cyan(line);
      return paint.dim(line);
    })
    .join("\n");
}

/**
 * Whether text looks like a unified diff.
 *
 * @param body - Candidate text.
 * @returns True when at least half of the non-empty lines start with `+`, `-`,
 *   or `@@`.
 */
function looksDiff(body: unknown): boolean {
  const lines = String(body)
    .split("\n")
    .filter((l) => l.trim());
  if (lines.length < 2) return false;
  const hits = lines.filter((l) => /^[+-]/.test(l) || l.startsWith("@@")).length;
  return hits / lines.length >= 0.5;
}

/**
 * Render a block quote with a dim gutter.
 *
 * @param text - Quote body with `>` markers already stripped.
 * @param paint - ANSI paint helper.
 * @param width - Column width.
 * @param indent - Line prefix.
 * @returns Quoted terminal text.
 */
function renderQuote(
  text: string,
  paint: Paint,
  width: number,
  indent: string,
): string {
  const inner = renderMarkdown(text, { paint, width: width - 2, indent: "" });
  return inner
    .split("\n")
    .map((l) => indent + paint.dim("│ ") + (l ? paint.italic(l) : ""))
    .join("\n");
}

/**
 * Render bullet, ordered, and task-list items.
 *
 * @param raw - Raw list lines, including continuations.
 * @param paint - ANSI paint helper.
 * @param width - Column width.
 * @param indent - Line prefix.
 * @returns Wrapped list text.
 */
function renderList(
  raw: string[],
  paint: Paint,
  width: number,
  indent: string,
): string {
  const out: string[] = [];
  for (const line of raw) {
    const m = line.match(/^(\s*)([-*+]|\d+[.)])\s+(?:\[([ xX])\]\s+)?(.*)$/);
    if (!m) {
      out.push(wrapAnsi(renderInline(line.trim(), paint), width, indent + "    "));
      continue;
    }
    const depth = Math.min(6, Math.floor(m[1].replace(/\t/g, "  ").length / 2));
    const pad = indent + "  ".repeat(depth);
    const check = m[3];
    const bullet =
      check != null
        ? check.trim()
          ? paint.ok("☑")
          : paint.dim("☐")
        : /^\d/.test(m[2])
          ? paint.dim(m[2])
          : paint.dim("•");
    const mark = `${bullet} `;
    out.push(
      wrapAnsi(
        renderInline(m[4], paint),
        width,
        pad + mark,
        pad + " ".repeat(stripLen(mark)),
      ),
    );
  }
  return out.join("\n");
}

/**
 * Visible length of a string after stripping SGR sequences.
 *
 * @param s - Possibly colored text.
 * @returns Visible character count.
 */
function stripLen(s: unknown): number {
  return String(s).replace(/\x1b\[[0-9;]*m/g, "").length;
}

/**
 * Render a GFM pipe table, dropping the delimiter row.
 *
 * @param rows - Raw table lines.
 * @param paint - ANSI paint helper.
 * @param indent - Line prefix.
 * @returns Aligned table text, or `""` when there are no data rows.
 */
function renderTable(rows: string[], paint: Paint, indent: string): string {
  const cells = rows
    .filter((_row, i) => i !== 1)
    .map((row) =>
      row
        .replace(/^\s*\|/, "")
        .replace(/\|\s*$/, "")
        .split("|")
        .map((c) => c.trim()),
    );
  if (!cells.length) return "";
  const cols = Math.max(...cells.map((r) => r.length));
  const widths = Array.from({ length: cols }, (_, i) =>
    Math.min(40, Math.max(...cells.map((r) => (r[i] ? r[i].length : 0)))),
  );
  return cells
    .map((row, ri) => {
      const line = row
        .map((c, i) => (c || "").padEnd(widths[i]))
        .join(paint.dim(" │ "));
      const styled = ri === 0 ? paint.bold(line) : line;
      return indent + styled;
    })
    .join("\n");
}

/**
 * Render inline markdown: code, links, images, emphasis, strike, and URLs.
 *
 * @param src - Inline source.
 * @param paint - ANSI paint helper.
 * @returns Styled inline text without wrapping.
 *
 * @see Paint
 * @see renderMarkdown
 */
export function renderInline(src: unknown, paint: Paint): string {
  const s = String(src);
  let i = 0;
  let out = "";
  while (i < s.length) {
    if (s[i] === "\\" && i + 1 < s.length) {
      out += s[i + 1];
      i += 2;
      continue;
    }
    if (s[i] === "`") {
      const end = s.indexOf("`", i + 1);
      if (end !== -1) {
        out += paint.code(s.slice(i + 1, end));
        i = end + 1;
        continue;
      }
    }
    if (s.startsWith("![", i)) {
      const m = s.slice(i).match(/^!\[([^\]]*)\]\(([^)]+)\)/);
      if (m) {
        out += paint.dim(`[image: ${m[1] || m[2]}]`);
        i += m[0].length;
        continue;
      }
    }
    if (s[i] === "[") {
      const m = s.slice(i).match(/^\[([^\]]+)\]\(([^)]+)\)/);
      if (m) {
        out +=
          m[1] === m[2]
            ? paint.link(m[1])
            : `${paint.link(m[1])}${paint.dim(` (${m[2]})`)}`;
        i += m[0].length;
        continue;
      }
    }
    if (s.startsWith("***", i)) {
      const end = s.indexOf("***", i + 3);
      if (end !== -1) {
        out += paint.bold(paint.italic(s.slice(i + 3, end)));
        i = end + 3;
        continue;
      }
    }
    if (s.startsWith("**", i)) {
      const end = s.indexOf("**", i + 2);
      if (end !== -1) {
        out += paint.bold(renderInline(s.slice(i + 2, end), paint));
        i = end + 2;
        continue;
      }
    }
    if (s.startsWith("~~", i)) {
      const end = s.indexOf("~~", i + 2);
      if (end !== -1) {
        out += paint.strike(s.slice(i + 2, end));
        i = end + 2;
        continue;
      }
    }
    if (
      s[i] === "*" ||
      (s[i] === "_" && (i === 0 || /[\s(]/.test(s[i - 1])))
    ) {
      const mark = s[i];
      const end = s.indexOf(mark, i + 1);
      if (
        end !== -1 &&
        end > i + 1 &&
        (mark !== "_" ||
          end === s.length - 1 ||
          /[\s).,!?]/.test(s[end + 1] || " "))
      ) {
        out += paint.italic(s.slice(i + 1, end));
        i = end + 1;
        continue;
      }
    }
    const url = s.slice(i).match(/^https?:\/\/[^\s)<]+/);
    if (url) {
      out += paint.link(url[0].replace(/[.,;:!?]+$/, ""));
      i += url[0].length;
      continue;
    }
    out += s[i];
    i++;
  }
  return out;
}
