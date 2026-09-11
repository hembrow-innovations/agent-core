import assert from "node:assert/strict";
import { test } from "node:test";
import {
  clipLines,
  createPaint,
  stripAnsi,
  wrapAnsi,
} from "./ansi.ts";

test("createPaint passes through when off and wraps SGR when on", () => {
  const off = createPaint(false);
  const on = createPaint(true);
  assert.equal(off.red("x"), "x");
  assert.equal(on.red("x"), "\x1b[31mx\x1b[0m");
  assert.equal(off.enabled, false);
  assert.equal(on.enabled, true);
  assert.equal(stripAnsi(on.red("hi")), "hi");
});

test("clipLines keeps short text and marks overflow", () => {
  assert.equal(clipLines("a\nb\nc", 2), "a\nb\n… 1 more lines");
  assert.equal(clipLines("a\nb", 2), "a\nb");
  assert.equal(clipLines("a\nb", 0), "\n… 2 more lines");
  const eightyOne = Array.from({ length: 81 }, (_, i) => `L${i}`).join("\n");
  assert.equal(clipLines(eightyOne).endsWith("… 1 more lines"), true);
  assert.equal(clipLines(eightyOne).startsWith("L0\nL1\n"), true);
});

test("wrapAnsi wraps on visible width and ignores ANSI", () => {
  const paint = createPaint(true);
  const long = "abcdefghijklmnopqrstuvwxyz0123456789";
  assert.equal(
    wrapAnsi(long, 20, ">>>>"),
    ">>>>abcdefghijklmnop\n>>>>qrstuvwxyz012345\n>>>>6789",
  );
  assert.equal(
    wrapAnsi("one two three four five six seven eight", 24, "  ", "    "),
    "  one two three four\n    five six seven eight",
  );
  assert.equal(wrapAnsi("hello world foo", 10, "  "), "  hello world foo");
  assert.equal(wrapAnsi("", 10, "  "), "");
  assert.equal(wrapAnsi("ab\n\ncd", 10, ">"), ">ab\n\n>cd");
  assert.equal(wrapAnsi("   hello", 40, ">>"), ">>hello");
  assert.equal(wrapAnsi("   ", 40, ">>"), "");
  const colored = paint.red("hello") + " " + paint.blue("world");
  assert.equal(stripAnsi(wrapAnsi(colored, 20, "")), "hello world");
});
