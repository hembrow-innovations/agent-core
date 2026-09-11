/**
 * Map OpenCode JSON events onto terminal lines without repeating part ids.
 *
 * {@link packages/loop/src/harness/ansi.ts}
 * {@link packages/loop/src/harness/markdown.ts}
 * {@link packages/loop/src/harness/tools.ts}
 *
 * @packageDocumentation
 */

import { createPaint, wrapAnsi, type Paint } from "./ansi.ts";
import { renderMarkdown } from "./markdown.ts";
import { formatTool } from "./tools.ts";

/**
 * Untyped JSON bag from an OpenCode event or part.
 */
type Dict = {
  /** Field from the OpenCode JSON payload. */
  [key: string]: unknown;
};

/**
 * Overrides for color, width, and indent. Omitted color follows the TTY.
 *
 * @see createHarness
 */
export type HarnessOptions = {
  /** Force color on or off; omit to follow env / TTY. */
  color?: boolean;
  /** Column budget; omit to use stdout columns. */
  width?: number;
  /** Prefix on formatted lines. */
  indent?: string;
};

/**
 * Stateful formatter that skips duplicate part-id updates.
 *
 * @see createHarness
 */
export type Harness = {
  /**
   * Render one event as terminal text.
   *
   * @param raw - Parsed JSON event, or any value.
   * @returns Formatted text, or `""` when the event should stay silent.
   */
  format(raw: unknown): string;
};

/**
 * Build a formatter that dedupes streaming part updates.
 *
 * Duplicate `part.id` updates with the same type and status are skipped.
 *
 * @param opts - Color, width, and indent overrides. Color follows the
 *   environment when omitted.
 * @returns A harness whose `format` method renders one event at a time.
 *
 * @see formatTool
 * @see renderMarkdown
 * @see createPaint
 *
 * @example
 * ```ts
 * const harness = createHarness({ color: false, width: 80 });
 * harness.format({ type: "server.heartbeat" });
 * ```
 */
export function createHarness(opts: HarnessOptions = {}): Harness {
  const seen = new Set<string>();
  return {
    /**
     * Render one event, skipping duplicate part ids.
     *
     * @param raw - Parsed JSON event, or any value.
     * @returns Formatted text, or `""` when the event should stay silent.
     */
    format(raw) {
      const paint = createPaint(opts.color ?? envColor());
      const width =
        opts.width ?? Math.max(40, (process.stdout.columns || 80) - 1);
      const indent = opts.indent ?? "  ";
      const ctx = { paint, width, indent };
      const ev = normalize(raw);
      const part = ev.part as Dict | undefined;
      const id = part?.id;
      if (id) {
        const state = part?.state as Dict | undefined;
        const key = `${ev.type}:${id}:${state?.status ?? ""}`;
        if (seen.has(key)) return "";
        seen.add(key);
      }
      switch (ev.type) {
        case "text": {
          const text = String(part?.text ?? "").trim();
          if (!text) return "";
          return `\n${renderMarkdown(text, ctx)}`;
        }
        case "reasoning": {
          const text = String(part?.text ?? "").trim();
          if (!text) return "";
          return `\n${indent}${paint.think("thinking")}\n${renderMarkdown(text, { ...ctx, indent: indent + "  " })}`;
        }
        case "tool_use":
          return formatTool(part, ctx);
        case "step_start":
          return paint.dim(`${indent}${"─".repeat(24)}`);
        case "step_finish":
          return "";
        case "error":
          return `${indent}${paint.err(`✗ ${errorMessage(ev.error)}`)}`;
        default:
          return formatUnknown(ev, paint, indent, width);
      }
    },
  };
}

/**
 * Whether stdout should use color.
 *
 * @returns False when `NO_COLOR` or `COLOR=0` is set; true when
 *   `FORCE_COLOR` is set; otherwise whether stdout is a TTY.
 */
function envColor(): boolean {
  if (process.env.NO_COLOR) return false;
  if (process.env.COLOR === "0") return false;
  if (process.env.FORCE_COLOR) return true;
  return Boolean(process.stdout.isTTY);
}

/**
 * Map OpenCode event envelopes onto harness event types.
 *
 * @param obj - Raw parsed event.
 * @returns A normalized event object. Unknown shapes are returned as-is.
 */
function normalize(obj: unknown): Dict {
  if (!obj || typeof obj !== "object") return { type: "unknown" };
  const rec = obj as Dict;
  if (rec.type === "message.part.updated") {
    const props = rec.properties as Dict | undefined;
    const part = props?.part ?? rec.part;
    if (!part) return rec;
    const p = part as Dict;
    if (p.type === "text") return { type: "text", part };
    if (p.type === "reasoning") return { type: "reasoning", part };
    if (p.type === "tool") return { type: "tool_use", part };
    if (p.type === "step-start") return { type: "step_start", part };
    if (p.type === "step-finish") return { type: "step_finish", part };
  }
  if (rec.type === "session.error") {
    const props = rec.properties as Dict | undefined;
    return { type: "error", error: props?.error ?? rec.error };
  }
  return rec;
}

/**
 * Extract a display string from a session error value.
 *
 * @param err - Error string or object.
 * @returns A message, name, JSON dump, or `"error"`.
 */
function errorMessage(err: unknown): string {
  if (!err) return "error";
  if (typeof err === "string") return err;
  const rec = err as {
    data?: { message?: unknown };
    message?: unknown;
    name?: unknown;
  };
  if (rec.data?.message) return String(rec.data.message);
  if (rec.message) return String(rec.message);
  if (rec.name) return String(rec.name);
  try {
    return JSON.stringify(err);
  } catch {
    return "error";
  }
}

/**
 * Render an unrecognized event as a dim one-liner, or hide session/message
 * chatter and heartbeats.
 *
 * @param ev - Normalized or raw event.
 * @param paint - ANSI paint helper.
 * @param indent - Line prefix.
 * @param width - Column width.
 * @returns Wrapped summary, or `""` for ignored types.
 */
function formatUnknown(
  ev: Dict,
  paint: Paint,
  indent: string,
  width: number,
): string {
  const t = String(ev.type || "event");
  if (
    t.startsWith("session.") ||
    t.startsWith("message.") ||
    t === "server.heartbeat" ||
    t === "server.connected"
  ) {
    return "";
  }
  const bits: string[] = [];
  for (const [k, v] of Object.entries(ev)) {
    if (k === "type" || k === "timestamp" || k === "sessionID") continue;
    if (
      typeof v === "string" ||
      typeof v === "number" ||
      typeof v === "boolean"
    ) {
      bits.push(`${k}=${String(v).slice(0, 48)}`);
    }
    if (bits.length >= 3) break;
  }
  return wrapAnsi(
    paint.dim(`· ${t}${bits.length ? " " + bits.join(" ") : ""}`),
    width,
    indent,
  );
}
