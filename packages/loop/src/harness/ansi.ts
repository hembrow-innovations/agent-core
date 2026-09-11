/**
 * Terminal color and wrapping so JSON events stay readable on a TTY.
 *
 * {@link packages/loop/src/harness/markdown.ts}
 * {@link packages/loop/src/harness/tools.ts}
 *
 * @packageDocumentation
 */

/**
 * SGR reset; paint functions close with this when color is on.
 */
const RESET = "\x1b[0m";

/**
 * Colorize a value, or pass it through when paint is disabled.
 *
 * @param s - Value to stringify.
 * @returns The string, optionally wrapped in SGR sequences.
 */
export type PaintFn = (s: unknown) => string;

/**
 * Named ANSI styles used by markdown, tools, and the event harness.
 *
 * @see createPaint
 * @see PaintFn
 */
export type Paint = {
  /** When false, style functions return the raw string. */
  enabled: boolean;
  /** Sequence that ends a style run. */
  reset: string;
  /** Strong emphasis for table headers. */
  bold: PaintFn;
  /** Secondary chrome: rules, icons, durations. */
  dim: PaintFn;
  /** Quote bodies and thinking labels. */
  italic: PaintFn;
  /** Unused by the harness today; kept for a full SGR set. */
  under: PaintFn;
  /** Strikethrough for `~~deleted~~` inline markdown. */
  strike: PaintFn;
  /** Failures and diff deletions. */
  red: PaintFn;
  /** Success marks and diff additions. */
  green: PaintFn;
  /** In-progress tools and active todos. */
  yellow: PaintFn;
  /** Unused by the harness today; kept for a full SGR set. */
  blue: PaintFn;
  /** Unused by the harness today; kept for a full SGR set. */
  magenta: PaintFn;
  /** Running-complete tools and diff hunks. */
  cyan: PaintFn;
  /** Unused by the harness today; kept for a full SGR set. */
  gray: PaintFn;
  /** ATX `#` headings. */
  h1: PaintFn;
  /** ATX `##` headings. */
  h2: PaintFn;
  /** ATX `###`–`######` headings. */
  h3: PaintFn;
  /** Inline backtick spans. */
  code: PaintFn;
  /** Markdown links and bare `http` URLs. */
  link: PaintFn;
  /** Completed todos and checked task items. */
  ok: PaintFn;
  /** Tool and session errors. */
  err: PaintFn;
  /** Reasoning / thinking gutter. */
  think: PaintFn;
};

/**
 * Gate SGR wrapping so redirected output stays plain text.
 *
 * @param on - When true, wrap strings in ANSI sequences.
 * @returns Named style functions that either colorize or pass through.
 *
 * @see Paint
 *
 * @example
 * ```ts
 * const paint = createPaint(true);
 * paint.red("fail");
 * ```
 */
export function createPaint(on: boolean): Paint {
  /**
   * Bind one SGR open sequence to a paint function.
   *
   * @param open - CSI sequence written before the text.
   * @returns A function that colorizes or passes through.
   *
   * @see PaintFn
   */
  const seq =
    (open: string): PaintFn =>
    (s) => {
      const t = String(s ?? "");
      return on ? `${open}${t}${RESET}` : t;
    };
  return {
    enabled: on,
    reset: RESET,
    bold: seq("\x1b[1m"),
    dim: seq("\x1b[2m"),
    italic: seq("\x1b[3m"),
    under: seq("\x1b[4m"),
    strike: seq("\x1b[9m"),
    red: seq("\x1b[31m"),
    green: seq("\x1b[32m"),
    yellow: seq("\x1b[33m"),
    blue: seq("\x1b[34m"),
    magenta: seq("\x1b[35m"),
    cyan: seq("\x1b[36m"),
    gray: seq("\x1b[90m"),
    h1: seq("\x1b[1;97m"),
    h2: seq("\x1b[1;36m"),
    h3: seq("\x1b[1;34m"),
    code: seq("\x1b[33m"),
    link: seq("\x1b[4;36m"),
    ok: seq("\x1b[32m"),
    err: seq("\x1b[31m"),
    think: seq("\x1b[2;3;35m"),
  };
}

/**
 * Measure and compare strings without SGR codes inflating length.
 *
 * @param s - Value to stringify and strip.
 * @returns The string with `\x1b[…m` sequences removed.
 *
 * @see wrapAnsi
 */
export function stripAnsi(s: unknown): string {
  return String(s).replace(/\x1b\[[0-9;]*m/g, "");
}

/**
 * Fold long lines at visible columns so color codes do not break layout.
 *
 * @param text - Text that may contain ANSI color codes.
 * @param width - Target column width, including the indent prefix.
 * @param indent - Prefix for the first wrapped line of each input line.
 * @param hang - Prefix for continuation lines.
 * @returns The wrapped string, joined with newlines.
 *
 * @defaultValue indent - `""`
 * @defaultValue hang - the `indent` value
 *
 * @see stripAnsi
 */
export function wrapAnsi(
  text: unknown,
  width: number,
  indent = "",
  hang = indent,
): string {
  const chunks = String(text).split("\n");
  const out: string[] = [];
  for (const chunk of chunks) {
    if (!chunk) {
      out.push("");
      continue;
    }
    const tokens = chunk.match(/\x1b\[[0-9;]*m|[^\x1b\s]+|\s+/g) || [];
    let line = "";
    let vis = 0;
    let prefix = indent;
    /**
     * Visible budget for the current prefix, never below 16 columns.
     *
     * @returns Column count available for payload text.
     */
    const maxFor = (): number => Math.max(16, width - prefix.length);
    /**
     * Commit the current line and switch hanging indent on.
     */
    const flush = (): void => {
      out.push(prefix + line.trimEnd());
      line = "";
      vis = 0;
      prefix = hang;
    };
    for (const tok of tokens) {
      if (tok.startsWith("\x1b")) {
        line += tok;
        continue;
      }
      const max = maxFor();
      if (/^\s+$/.test(tok)) {
        if (vis === 0) continue;
        if (vis + tok.length > max) {
          flush();
          continue;
        }
        line += tok;
        vis += tok.length;
        continue;
      }
      if (vis && vis + tok.length > max) flush();
      const room = maxFor();
      if (tok.length > room && vis === 0) {
        let rest = tok;
        while (rest.length > maxFor()) {
          const n = maxFor();
          line += rest.slice(0, n);
          vis = n;
          flush();
          rest = rest.slice(n);
        }
        line += rest;
        vis = rest.length;
        continue;
      }
      line += tok;
      vis += tok.length;
    }
    if (line || vis) flush();
    else if (!tokens.length) out.push(prefix.trimEnd());
  }
  return out.join("\n");
}

/**
 * Bound huge tool output so a single event cannot flood the terminal.
 *
 * @param text - Value to stringify and clip.
 * @param max - Maximum number of lines to keep.
 * @returns The original string when it is short enough, otherwise a clipped
 *   string ending with `… N more lines`.
 *
 * @defaultValue max - `80`
 */
export function clipLines(text: unknown, max = 80): string {
  const lines = String(text).split("\n");
  if (lines.length <= max) return String(text);
  return `${lines.slice(0, max).join("\n")}\n… ${lines.length - max} more lines`;
}
