import assert from "node:assert/strict";
import { test } from "node:test";
import { createPaint } from "./ansi.ts";
import { renderDiff, renderInline, renderMarkdown } from "./markdown.ts";

const paint = createPaint(false);

test("renderMarkdown handles empty, headings, lists, and fences", () => {
  assert.equal(renderMarkdown("", { paint }), "");
  assert.equal(renderMarkdown(null, { paint }), "");
  assert.equal(
    renderMarkdown("# Hi\n\nHello **world**", { paint, width: 80, indent: "  " }),
    "  Hi\n\n  Hello world",
  );
  assert.equal(
    renderMarkdown("- a\n- b", { paint, width: 80, indent: "  " }),
    "  • a\n  • b",
  );
  assert.equal(
    renderMarkdown("```js\nconst x = 1\n```", { paint, width: 40, indent: "  " }),
    "  ── js ────────────────────────\n    const x = 1",
  );
  assert.equal(
    renderMarkdown("```diff\n+a\n-b\n```", { paint, width: 40, indent: "  " }),
    "  ── diff ────────────────────────\n    +a\n    -b",
  );
  assert.equal(renderMarkdown("## Title ##", { paint, width: 40, indent: "" }), "Title");
  assert.equal(
    renderMarkdown("- a\n  - b\n    continued", { paint, width: 40, indent: "" }),
    "• a\n  • b\n    continued",
  );
  assert.equal(
    renderMarkdown("foo\nbar\n\nbaz", { paint, width: 40, indent: "  " }),
    "  foo bar\n\n  baz",
  );
});

test("renderMarkdown handles quotes, rules, tables, and task lists", () => {
  assert.equal(
    renderMarkdown("> hello\n> world", { paint, width: 40, indent: "  " }),
    "  │ hello world",
  );
  assert.equal(
    renderMarkdown("---", { paint, width: 40, indent: "  " }),
    "  ────────────────────────────────",
  );
  assert.equal(
    renderMarkdown("| a | b |\n| - | - |\n| 1 | 2 |", {
      paint,
      width: 40,
      indent: "  ",
    }),
    "  a │ b\n  1 │ 2",
  );
  assert.equal(
    renderMarkdown("- [x] done\n- [ ] todo", { paint, width: 40, indent: "  " }),
    "  ☑ done\n  ☐ todo",
  );
  assert.equal(
    renderMarkdown("1. first\n2. second", { paint, width: 40, indent: "  " }),
    "  1. first\n  2. second",
  );
});

test("renderInline handles links, images, strike, italics, and URLs", () => {
  assert.equal(renderInline("a **b** `c`", paint), "a b c");
  assert.equal(
    renderMarkdown("see [x](https://ex.com)", { paint, width: 80, indent: "" }),
    "see x (https://ex.com)",
  );
  assert.equal(
    renderMarkdown("![alt](pic.png)", { paint, width: 80, indent: "" }),
    "[image: alt]",
  );
  assert.equal(
    renderMarkdown("\\*star\\*", { paint, width: 80, indent: "" }),
    "*star*",
  );
  assert.equal(renderMarkdown("~~no~~", { paint, width: 80, indent: "" }), "no");
  assert.equal(
    renderMarkdown("*hi* and _yo_.", { paint, width: 80, indent: "" }),
    "hi and yo.",
  );
  assert.equal(
    renderMarkdown("go https://ex.com/a.", { paint, width: 80, indent: "" }),
    "go https://ex.com/a",
  );
});

test("renderDiff colors plus, minus, and hunk lines through paint", () => {
  assert.equal(renderDiff("+a\n-b\n@@\n c", paint), "+a\n-b\n@@\n c");
  const on = createPaint(true);
  assert.equal(renderDiff("+a", on), "\x1b[32m+a\x1b[0m");
  assert.equal(renderDiff("-a", on), "\x1b[31m-a\x1b[0m");
  assert.equal(renderDiff("@@", on), "\x1b[36m@@\x1b[0m");
  assert.equal(renderDiff("+++", on), "\x1b[2m+++\x1b[0m");
});
