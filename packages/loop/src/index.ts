/**
 * Public surface for repeating an OpenCode prompt and rendering its JSON events.
 *
 * {@link packages/loop/src/cli.ts}
 * {@link packages/loop/src/harness/index.ts}
 *
 * @packageDocumentation
 */

export {
  createHarness,
  type Harness,
  type HarnessOptions,
} from "./harness/index.ts";
export {
  createPaint,
  stripAnsi,
  wrapAnsi,
  clipLines,
  type Paint,
  type PaintFn,
} from "./harness/ansi.ts";
export {
  renderMarkdown,
  renderDiff,
  renderInline,
  type MarkdownRenderOptions,
} from "./harness/markdown.ts";
export { formatTool, type ToolFormatContext } from "./harness/tools.ts";
