import assert from "node:assert/strict";
import { homedir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { createPaint } from "./ansi.ts";
import { formatTool } from "./tools.ts";

const paint = createPaint(false);
const ctx = { paint, width: 80, indent: "  " };

test("formatTool titles, times, quiet tools, and bodies", () => {
  assert.equal(
    formatTool(
      {
        tool: "read",
        state: {
          status: "completed",
          input: { filePath: "/tmp/x.ts" },
          time: { start: 0, end: 12 },
        },
      },
      ctx,
    ),
    "  → Read /tmp/x.ts · 12ms",
  );
  assert.equal(
    formatTool(
      {
        tool: "bash",
        state: {
          status: "completed",
          input: { command: "ls -la" },
          output: "a\nb",
          time: { start: 0, end: 1500 },
        },
      },
      ctx,
    ),
    "  $ ls -la · 1.5s\n    a\n    b",
  );
  assert.equal(
    formatTool(
      {
        tool: "bash",
        state: { status: "error", input: { command: "false" }, error: "boom" },
      },
      ctx,
    ),
    "  ✗ false\n    boom",
  );
  assert.equal(
    formatTool(
      {
        tool: "bash",
        state: { status: "running", input: { command: "sleep 1" } },
      },
      ctx,
    ),
    "  • sleep 1",
  );
  assert.equal(
    formatTool(
      {
        tool: "bash",
        state: {
          status: "completed",
          input: { command: "x" },
          time: { start: 0, end: 10000 },
        },
      },
      { paint, width: 80 },
    ),
    "  $ x · 10s",
  );
  assert.equal(
    formatTool(
      {
        tool: "bash",
        state: {
          status: "completed",
          input: { command: "x" },
          time: { start: 0, end: 11000 },
        },
      },
      { paint, width: 80 },
    ),
    "  $ x · 11s",
  );
  assert.equal(
    formatTool(
      {
        tool: "bash",
        state: {
          status: "completed",
          input: { command: "x" },
          time: { start: 5, end: 1 },
        },
      },
      { paint, width: 80 },
    ),
    "  $ x",
  );
});

test("formatTool todos, edit, patch, task, write, and questions", () => {
  assert.equal(
    formatTool(
      {
        tool: "todowrite",
        state: {
          status: "completed",
          input: {
            todos: [
              { status: "completed", content: "a" },
              { status: "in_progress", content: "b" },
              { status: "pending", content: "c" },
            ],
          },
        },
      },
      ctx,
    ),
    "  # Todos\n    ☑ a\n    • b\n    ☐ c",
  );
  assert.equal(
    formatTool(
      {
        tool: "edit",
        state: {
          status: "completed",
          input: { filePath: "foo.ts" },
          metadata: { diff: "+a\n-b\n c" },
        },
      },
      ctx,
    ),
    "  ← Edit foo.ts\n    +a\n    -b\n     c",
  );
  assert.equal(
    formatTool(
      {
        tool: "apply_patch",
        state: {
          status: "completed",
          metadata: {
            files: [
              { type: "add", relativePath: "a.ts" },
              { type: "delete", relativePath: "b.ts" },
              { type: "move", filePath: "c.ts", relativePath: "d.ts" },
              { type: "edit", relativePath: "e.ts" },
            ],
          },
        },
      },
      ctx,
    ),
    "  % apply_patch\n    + Created a.ts\n    - Deleted b.ts\n    → Moved c.ts -> d.ts\n    ~ Patched e.ts",
  );
  assert.equal(
    formatTool(
      {
        tool: "task",
        state: {
          status: "completed",
          input: { description: "Explore", subagent_type: "explore" },
          output: "<task_result>\nDone now\n</task_result>",
        },
      },
      ctx,
    ),
    "  ✓ Explore\n    Done now",
  );
  assert.equal(
    formatTool(
      {
        tool: "task",
        state: {
          status: "completed",
          input: { subagent_type: "explore" },
          output: "task_id: abc\nHello",
        },
      },
      ctx,
    ),
    "  ✓ Explore Task\n    Hello",
  );
  assert.equal(
    formatTool(
      {
        tool: "write",
        state: {
          status: "completed",
          input: { filePath: "a.ts", content: "hello\nworld" },
        },
      },
      ctx,
    ),
    "  ← Write a.ts\n    hello\n    world",
  );
  assert.equal(
    formatTool(
      {
        tool: "question",
        state: { status: "completed", input: { questions: [1, 2] } },
      },
      ctx,
    ),
    "  ? Asked 2 questions",
  );
});

test("formatTool grep, glob, paths, quiet tools, and fallbacks", () => {
  assert.equal(
    formatTool(
      {
        tool: "grep",
        state: {
          status: "completed",
          input: { pattern: "foo" },
          metadata: { matches: 2 },
        },
      },
      ctx,
    ),
    '  ✱ Grep "foo" · 2 matches',
  );
  assert.equal(
    formatTool(
      {
        tool: "glob",
        state: {
          status: "completed",
          input: { pattern: "*" },
          metadata: { count: 0 },
        },
      },
      ctx,
    ),
    '  ✱ Glob "*" · 0 matches',
  );
  assert.equal(
    formatTool(
      {
        tool: "read",
        state: {
          status: "completed",
          input: { filePath: join(homedir(), "secret.txt") },
        },
      },
      ctx,
    ),
    "  → Read ~/secret.txt",
  );
  assert.equal(
    formatTool(
      {
        tool: "webfetch",
        state: {
          status: "completed",
          input: { url: "https://x.com" },
          output: "quiet me",
        },
      },
      ctx,
    ),
    "  % WebFetch https://x.com",
  );
  assert.equal(
    formatTool(
      { tool: "skill", state: { status: "completed", input: { name: "tdd" } } },
      ctx,
    ),
    '  → Skill "tdd"',
  );
  assert.equal(
    formatTool(
      {
        tool: "lsp",
        state: {
          status: "completed",
          title: "Go to def",
          input: { operation: "definition" },
        },
      },
      ctx,
    ),
    "  → Go to def",
  );
  assert.equal(
    formatTool(
      {
        tool: "websearch",
        state: { status: "completed", input: { query: "tsdoc" } },
      },
      ctx,
    ),
    '  ◈ Search "tsdoc"',
  );
  assert.equal(
    formatTool(
      {
        tool: "other",
        state: {
          status: "completed",
          input: { foo: "short" },
          output: "# Hello\n\nWorld",
        },
      },
      ctx,
    ),
    "  ⚙ other short\n    Hello\n\n    World",
  );
  assert.equal(
    formatTool(
      {
        tool: "other",
        state: { status: "completed", input: {}, output: "+a\n-b\n+c\n-d" },
      },
      ctx,
    ),
    "  ⚙ other\n    +a\n    -b\n    +c\n    -d",
  );
  assert.equal(
    formatTool(
      {
        tool: "mystery",
        state: { status: "completed", title: "  Custom  ", input: {} },
      },
      ctx,
    ),
    "  ⚙ Custom",
  );
});
