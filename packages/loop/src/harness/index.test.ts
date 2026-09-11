import assert from "node:assert/strict";
import { test } from "node:test";
import { createHarness } from "./index.ts";

test("createHarness formats text, reasoning, tools, and steps", () => {
  const h = createHarness({ color: false, width: 80, indent: "  " });
  assert.equal(
    h.format({
      type: "message.part.updated",
      part: { type: "text", id: "1", text: "Hello" },
    }),
    "\n  Hello",
  );
  assert.equal(
    h.format({
      type: "message.part.updated",
      part: { type: "text", id: "1", text: "Hello" },
    }),
    "",
  );
  assert.equal(
    h.format({
      type: "message.part.updated",
      properties: { part: { type: "reasoning", id: "r1", text: "hmm" } },
    }),
    "\n  thinking\n    hmm",
  );
  assert.equal(
    h.format({
      type: "message.part.updated",
      part: {
        type: "tool",
        id: "t1",
        tool: "read",
        state: { status: "completed", input: { filePath: "x.ts" } },
      },
    }),
    "  → Read x.ts",
  );
  assert.equal(
    h.format({
      type: "message.part.updated",
      part: { type: "step-start", id: "s1" },
    }),
    "  ────────────────────────",
  );
  assert.equal(
    h.format({
      type: "message.part.updated",
      part: { type: "step-finish", id: "f1" },
    }),
    "",
  );
});

test("createHarness formats errors, hides chatter, and summarizes unknown events", () => {
  const h = createHarness({ color: false, width: 80, indent: "  " });
  assert.equal(
    h.format({ type: "session.error", error: { message: "boom" } }),
    "  ✗ boom",
  );
  assert.equal(
    h.format({
      type: "session.error",
      properties: { error: { data: { message: "nope" } } },
    }),
    "  ✗ nope",
  );
  assert.equal(
    h.format({
      type: "session.error",
      properties: { error: { name: "X" } },
    }),
    "  ✗ X",
  );
  assert.equal(h.format({ type: "session.error" }), "  ✗ error");
  assert.equal(h.format({ type: "server.heartbeat" }), "");
  assert.equal(h.format({ type: "session.idle" }), "");
  assert.equal(h.format(null), "  · unknown");
  assert.equal(
    h.format({
      type: "custom.event",
      foo: "bar",
      n: 1,
      timestamp: 1,
      sessionID: "s",
    }),
    "  · custom.event foo=bar n=1",
  );
  assert.equal(
    h.format({
      type: "message.part.updated",
      part: { type: "text", id: "e1", text: "  " },
    }),
    "",
  );
});
