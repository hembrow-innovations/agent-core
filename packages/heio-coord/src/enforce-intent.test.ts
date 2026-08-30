import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import type {
	ExtensionAPI,
	ExtensionContext,
	ToolCallEvent,
	ToolCallEventResult,
} from "@earendil-works/pi-coding-agent";
import coordExtension from "./index.ts";

const STICKY_REASON = "Use heio_stack. That path is sticky planning.";
const EXPECT_REASON = "Use heio_stack. EXPECT is frozen.";

function tempCwd(): string {
	return mkdtempSync(join(tmpdir(), "heio-coord-intent-"));
}

function writeNote(path: string, fields: Record<string, string>): void {
	mkdirSync(dirname(path), { recursive: true });
	const lines = ["---"];
	for (const [key, value] of Object.entries(fields)) {
		lines.push(`${key}: "${value}"`);
	}
	lines.push("---", "", `# ${fields.id}`, "");
	writeFileSync(path, `${lines.join("\n")}\n`, "utf8");
}

function seedTree(cwd: string): void {
	writeNote(join(cwd, ".heio", "planning", "intent.md"), {
		id: "intent",
		status: "active",
	});
}

function loadFactory(): {
	toolCall: (
		event: ToolCallEvent,
		ctx: ExtensionContext,
	) => ToolCallEventResult | undefined | void;
} {
	let toolCall:
		| ((
				event: ToolCallEvent,
				ctx: ExtensionContext,
		  ) => ToolCallEventResult | undefined | void)
		| undefined;
	coordExtension({
		on(event, handler) {
			if (event === "tool_call") toolCall = handler;
		},
		registerTool() {},
		registerCommand() {},
	} as ExtensionAPI);
	if (!toolCall) throw new Error("factory did not register tool_call");
	return { toolCall };
}

function toolCtx(cwd: string): ExtensionContext {
	return { cwd } as ExtensionContext;
}

describe("heio-coord sticky planning fence", () => {
	it("blocks write of intent.md", () => {
		const cwd = tempCwd();
		seedTree(cwd);
		const { toolCall } = loadFactory();
		assert.deepEqual(
			toolCall(
				{
					type: "tool_call",
					toolCallId: "1",
					toolName: "write",
					input: { path: ".heio/planning/intent.md", content: "nope" },
				},
				toolCtx(cwd),
			),
			{ block: true, reason: STICKY_REASON },
		);
	});

	it("blocks edit of intent.md", () => {
		const cwd = tempCwd();
		seedTree(cwd);
		const { toolCall } = loadFactory();
		assert.deepEqual(
			toolCall(
				{
					type: "tool_call",
					toolCallId: "2",
					toolName: "edit",
					input: {
						path: ".heio/planning/intent.md",
						oldText: "a",
						newText: "b",
					},
				},
				toolCtx(cwd),
			),
			{ block: true, reason: STICKY_REASON },
		);
	});

	it("blocks bash redirect of intent.md", () => {
		const cwd = tempCwd();
		seedTree(cwd);
		const { toolCall } = loadFactory();
		assert.deepEqual(
			toolCall(
				{
					type: "tool_call",
					toolCallId: "3",
					toolName: "bash",
					input: { command: "echo x > .heio/planning/intent.md" },
				},
				toolCtx(cwd),
			),
			{ block: true, reason: STICKY_REASON },
		);
	});

	it("blocks write of roadmap.md and sprint shape.md", () => {
		const cwd = tempCwd();
		seedTree(cwd);
		const { toolCall } = loadFactory();
		const ctx = toolCtx(cwd);
		assert.deepEqual(
			toolCall(
				{
					type: "tool_call",
					toolCallId: "7",
					toolName: "write",
					input: { path: ".heio/planning/roadmap.md", content: "nope" },
				},
				ctx,
			),
			{ block: true, reason: STICKY_REASON },
		);
		assert.deepEqual(
			toolCall(
				{
					type: "tool_call",
					toolCallId: "8",
					toolName: "edit",
					input: {
						path: ".heio/planning/sprints/coord/shape.md",
						oldText: "a",
						newText: "b",
					},
				},
				ctx,
			),
			{ block: true, reason: STICKY_REASON },
		);
	});

	it("blocks a builder patch to EXPECT lines", () => {
		const cwd = tempCwd();
		seedTree(cwd);
		const oraclePath = join(
			cwd,
			".heio",
			"planning",
			"sprints",
			"coord",
			"slices",
			"s-rails",
			"oracles.md",
		);
		mkdirSync(dirname(oraclePath), { recursive: true });
		writeFileSync(
			oraclePath,
			[
				"- [ ] O1: x",
				"  CHECK: echo a",
				"  EXPECT: COORD_INTENT_BLOCKED",
				"",
			].join("\n"),
			"utf8",
		);
		const { toolCall } = loadFactory();
		const ctx = toolCtx(cwd);
		const rel = ".heio/planning/sprints/coord/slices/s-rails/oracles.md";
		assert.deepEqual(
			toolCall(
				{
					type: "tool_call",
					toolCallId: "9",
					toolName: "edit",
					input: {
						path: rel,
						oldText: "  EXPECT: COORD_INTENT_BLOCKED",
						newText: "  EXPECT: TAMPERED",
					},
				},
				ctx,
			),
			{ block: true, reason: EXPECT_REASON },
		);
	});

	it("blocks a write that changes EXPECT lines", () => {
		const cwd = tempCwd();
		seedTree(cwd);
		const oraclePath = join(
			cwd,
			".heio",
			"planning",
			"sprints",
			"coord",
			"slices",
			"s-rails",
			"oracles.md",
		);
		mkdirSync(dirname(oraclePath), { recursive: true });
		writeFileSync(
			oraclePath,
			[
				"- [ ] O1: x",
				"  CHECK: echo a",
				"  EXPECT: COORD_INTENT_BLOCKED",
				"",
			].join("\n"),
			"utf8",
		);
		const { toolCall } = loadFactory();
		assert.deepEqual(
			toolCall(
				{
					type: "tool_call",
					toolCallId: "11",
					toolName: "write",
					input: {
						path: ".heio/planning/sprints/coord/slices/s-rails/oracles.md",
						content: [
							"- [ ] O1: x",
							"  CHECK: echo a",
							"  EXPECT: TAMPERED",
							"",
						].join("\n"),
					},
				},
				toolCtx(cwd),
			),
			{ block: true, reason: EXPECT_REASON },
		);
	});

	it("blocks bash mutation of oracles.md", () => {
		const cwd = tempCwd();
		seedTree(cwd);
		const { toolCall } = loadFactory();
		assert.deepEqual(
			toolCall(
				{
					type: "tool_call",
					toolCallId: "12",
					toolName: "bash",
					input: {
						command:
							"echo TAMPERED > .heio/planning/sprints/coord/slices/s-rails/oracles.md",
					},
				},
				toolCtx(cwd),
			),
			{ block: true, reason: EXPECT_REASON },
		);
	});

	it("allows a CHECK refinement that leaves EXPECT alone", () => {
		const cwd = tempCwd();
		seedTree(cwd);
		const { toolCall } = loadFactory();
		assert.equal(
			toolCall(
				{
					type: "tool_call",
					toolCallId: "10",
					toolName: "edit",
					input: {
						path: ".heio/planning/sprints/coord/slices/s-rails/oracles.md",
						oldText: "  CHECK: echo a",
						newText: "  CHECK: echo b",
					},
				},
				toolCtx(cwd),
			),
			undefined,
		);
	});

	it("leaves unrelated writes and reads alone", () => {
		const cwd = tempCwd();
		seedTree(cwd);
		const { toolCall } = loadFactory();
		const ctx = toolCtx(cwd);
		assert.equal(
			toolCall(
				{
					type: "tool_call",
					toolCallId: "4",
					toolName: "write",
					input: { path: "src/foo.ts", content: "ok" },
				},
				ctx,
			),
			undefined,
		);
		assert.equal(
			toolCall(
				{
					type: "tool_call",
					toolCallId: "5",
					toolName: "read",
					input: { path: ".heio/planning/intent.md" },
				},
				ctx,
			),
			undefined,
		);
		assert.equal(
			toolCall(
				{
					type: "tool_call",
					toolCallId: "6",
					toolName: "bash",
					input: { command: "cat .heio/planning/intent.md" },
				},
				ctx,
			),
			undefined,
		);
	});
});
