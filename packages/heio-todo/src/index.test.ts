import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import type {
	ExtensionAPI,
	ExtensionContext,
	ToolCallEvent,
	ToolCallEventResult,
	ToolDefinition,
} from "@earendil-works/pi-coding-agent";
import todoExtension from "./index.ts";
import { parseSessionId, sessionTodoPath } from "./store.ts";

const sessionA = "01a02e18-de1b-73f6-a111-111111111111";
const sessionB = "01a02e18-de1b-73f6-b222-222222222222";
const BLOCK_REASON = "Use heio_todo. That path is a session checklist.";

function tempCwd(): string {
	return mkdtempSync(join(tmpdir(), "heio-todo-ext-"));
}

function loadFactory(): {
	tool: ToolDefinition;
	toolCall: (
		event: ToolCallEvent,
		ctx: ExtensionContext,
	) => ToolCallEventResult | undefined | void;
} {
	let tool: ToolDefinition | undefined;
	let toolCall:
		| ((
				event: ToolCallEvent,
				ctx: ExtensionContext,
		  ) => ToolCallEventResult | undefined | void)
		| undefined;

	todoExtension({
		on(event, handler) {
			if (event === "tool_call") {
				toolCall = handler;
			}
		},
		registerTool(registered) {
			tool = registered;
		},
	} as ExtensionAPI);

	if (!tool || !toolCall) {
		throw new Error("factory did not register the tool");
	}
	return { tool, toolCall };
}

function toolCtx(cwd: string, sessionId: string): ExtensionContext {
	return {
		cwd,
		sessionManager: { getSessionId: () => sessionId },
	} as ExtensionContext;
}

function blocked() {
	return { block: true, reason: BLOCK_REASON };
}

describe("heio-todo factory", () => {
	it("exports a factory that registers heio_todo", () => {
		assert.equal(typeof todoExtension, "function");
		const { tool } = loadFactory();
		assert.equal(tool.name, "heio_todo");
	});

	it("blocks write and edit of the stub and session checklist path", () => {
		const cwd = tempCwd();
		const { toolCall } = loadFactory();
		const ctx = toolCtx(cwd, sessionA);
		const sessionRel = `.heio/sessions/${sessionA}/TODO.md`;
		assert.deepEqual(
			toolCall(
				{
					type: "tool_call",
					toolCallId: "1",
					toolName: "write",
					input: { path: ".heio/TODO.md" },
				},
				ctx,
			),
			blocked(),
		);
		assert.deepEqual(
			toolCall(
				{
					type: "tool_call",
					toolCallId: "2",
					toolName: "edit",
					input: { path: ".heio/TODO.md", oldText: "a", newText: "b" },
				},
				ctx,
			),
			blocked(),
		);
		assert.deepEqual(
			toolCall(
				{
					type: "tool_call",
					toolCallId: "3",
					toolName: "write",
					input: { path: sessionRel },
				},
				ctx,
			),
			blocked(),
		);
		assert.equal(
			toolCall(
				{
					type: "tool_call",
					toolCallId: "4",
					toolName: "write",
					input: { path: "src/foo.ts" },
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
					input: { path: ".heio/TODO.md" },
				},
				ctx,
			),
			undefined,
		);
	});

	it("blocks bash redirect tee and rm of protected paths", () => {
		const cwd = tempCwd();
		const { toolCall } = loadFactory();
		const ctx = toolCtx(cwd, sessionA);
		const sessionRel = `.heio/sessions/${sessionA}/TODO.md`;
		assert.deepEqual(
			toolCall(
				{
					type: "tool_call",
					toolCallId: "b1",
					toolName: "bash",
					input: { command: "echo hi > .heio/TODO.md" },
				},
				ctx,
			),
			blocked(),
		);
		assert.deepEqual(
			toolCall(
				{
					type: "tool_call",
					toolCallId: "b2",
					toolName: "bash",
					input: { command: `tee ${sessionRel}` },
				},
				ctx,
			),
			blocked(),
		);
		assert.deepEqual(
			toolCall(
				{
					type: "tool_call",
					toolCallId: "b3",
					toolName: "bash",
					input: { command: `rm ${sessionRel}` },
				},
				ctx,
			),
			blocked(),
		);
		assert.equal(
			toolCall(
				{
					type: "tool_call",
					toolCallId: "b4",
					toolName: "bash",
					input: { command: "ls src" },
				},
				ctx,
			),
			undefined,
		);
		assert.equal(
			toolCall(
				{
					type: "tool_call",
					toolCallId: "b5",
					toolName: "bash",
					input: { command: "cat .heio/TODO.md" },
				},
				ctx,
			),
			undefined,
		);
	});

	it("write requires markdown including empty body", async () => {
		const { tool } = loadFactory();
		const missing = await tool.execute(
			"id",
			{ action: "write" },
			undefined,
			undefined,
			toolCtx(tempCwd(), sessionA),
		);
		assert.deepEqual(missing.content, [
			{ type: "text", text: "markdown is required for action write" },
		]);
		const empty = await tool.execute(
			"id",
			{ action: "write", markdown: "" },
			undefined,
			undefined,
			toolCtx(tempCwd(), sessionA),
		);
		assert.deepEqual(empty.content, [
			{ type: "text", text: "markdown is required for action write" },
		]);
	});

	it("write reports the session path", async () => {
		const cwd = tempCwd();
		const { tool } = loadFactory();
		const result = await tool.execute(
			"id",
			{ action: "write", markdown: "# Feature\n\n- [ ] read principles" },
			undefined,
			undefined,
			toolCtx(cwd, sessionA),
		);
		const sessionPath = join(cwd, ".heio", "sessions", sessionA, "TODO.md");
		assert.deepEqual(result.content, [
			{ type: "text", text: `Wrote ${sessionPath}` },
		]);
		assert.equal(
			readFileSync(sessionPath, "utf8"),
			"# Feature\n\n- [ ] read principles\n",
		);
	});

	it("write rejects an invalid session id", async () => {
		const { tool } = loadFactory();
		const result = await tool.execute(
			"id",
			{ action: "write", markdown: "# x" },
			undefined,
			undefined,
			toolCtx(tempCwd(), "../x"),
		);
		assert.deepEqual(result.content, [
			{ type: "text", text: "invalid session id: ../x" },
		]);
	});

	it("list reports this session first and caps sibling titles", async () => {
		const cwd = tempCwd();
		const { tool } = loadFactory();
		const empty = await tool.execute(
			"id",
			{ action: "list" },
			undefined,
			undefined,
			toolCtx(cwd, sessionA),
		);
		assert.deepEqual(empty.content, [
			{ type: "text", text: "No checklist for this session." },
		]);

		await tool.execute(
			"id",
			{ action: "write", markdown: "# Alpha\n\n- [ ] first" },
			undefined,
			undefined,
			toolCtx(cwd, sessionA),
		);
		await tool.execute(
			"id",
			{ action: "write", markdown: "# Bravo\n\n- [ ] later" },
			undefined,
			undefined,
			toolCtx(cwd, sessionB),
		);
		const listed = await tool.execute(
			"id",
			{ action: "list" },
			undefined,
			undefined,
			toolCtx(cwd, sessionA),
		);
		assert.deepEqual(listed.content, [
			{
				type: "text",
				text: [
					"This session:",
					"# Alpha",
					"",
					"- [ ] first",
					"",
					"Other sessions:",
					`- **${sessionB}**: # Bravo`,
				].join("\n"),
			},
		]);
		assert.equal(
			listed.content[0] && "text" in listed.content[0]
				? listed.content[0].text.includes(
						sessionTodoPath(cwd, parseSessionId(sessionB)),
					)
				: true,
			false,
		);
	});
});
