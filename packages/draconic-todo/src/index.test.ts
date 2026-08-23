import { describe, expect, it } from "bun:test";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type {
	ExtensionAPI,
	ExtensionContext,
	ToolCallEvent,
	ToolCallEventResult,
	ToolDefinition,
} from "@earendil-works/pi-coding-agent";
import todoExtension from "./index.ts";

const sessionA = "01a02e18-de1b-73f6-a111-111111111111";

function tempCwd(): string {
	return mkdtempSync(join(tmpdir(), "draconic-todo-ext-"));
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

describe("draconic-todo factory", () => {
	it("exports a factory that registers draconic_todo", () => {
		expect(typeof todoExtension).toBe("function");
		const { tool } = loadFactory();
		expect(tool.name).toBe("draconic_todo");
	});

	it("blocks write and edit of the session checklist path", () => {
		const cwd = tempCwd();
		const { toolCall } = loadFactory();
		const ctx = toolCtx(cwd, sessionA);
		expect(
			toolCall(
				{
					type: "tool_call",
					toolCallId: "1",
					toolName: "write",
					input: { path: ".draconic/TODO.md" },
				},
				ctx,
			),
		).toEqual({
			block: true,
			reason: "Use draconic_todo. That path is a session checklist.",
		});
		expect(
			toolCall(
				{
					type: "tool_call",
					toolCallId: "2",
					toolName: "edit",
					input: { path: ".draconic/TODO.md", oldText: "a", newText: "b" },
				},
				ctx,
			),
		).toEqual({
			block: true,
			reason: "Use draconic_todo. That path is a session checklist.",
		});
		expect(
			toolCall(
				{
					type: "tool_call",
					toolCallId: "3",
					toolName: "write",
					input: { path: "src/foo.ts" },
				},
				ctx,
			),
		).toBeUndefined();
		expect(
			toolCall(
				{
					type: "tool_call",
					toolCallId: "4",
					toolName: "read",
					input: { path: ".draconic/TODO.md" },
				},
				ctx,
			),
		).toBeUndefined();
	});

	it("write requires markdown", async () => {
		const { tool } = loadFactory();
		const result = await tool.execute(
			"id",
			{ action: "write" },
			undefined,
			undefined,
			toolCtx(tempCwd(), sessionA),
		);
		expect(result.content).toEqual([
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
		const sessionPath = join(cwd, ".draconic", "sessions", sessionA, "TODO.md");
		expect(result.content).toEqual([
			{ type: "text", text: `Wrote ${sessionPath}` },
		]);
		expect(readFileSync(sessionPath, "utf8")).toBe(
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
		expect(result.content).toEqual([
			{ type: "text", text: "invalid session id: ../x" },
		]);
	});

	it("list reports no checklists or the known titles", async () => {
		const cwd = tempCwd();
		const { tool } = loadFactory();
		const empty = await tool.execute(
			"id",
			{ action: "list" },
			undefined,
			undefined,
			toolCtx(cwd, sessionA),
		);
		expect(empty.content).toEqual([
			{ type: "text", text: "No session checklists." },
		]);

		await tool.execute(
			"id",
			{ action: "write", markdown: "# Alpha" },
			undefined,
			undefined,
			toolCtx(cwd, sessionA),
		);
		const listed = await tool.execute(
			"id",
			{ action: "list" },
			undefined,
			undefined,
			toolCtx(cwd, sessionA),
		);
		const sessionPath = join(cwd, ".draconic", "sessions", sessionA, "TODO.md");
		expect(listed.content).toEqual([
			{
				type: "text",
				text: `- **${sessionA}**: ${sessionPath} (# Alpha)`,
			},
		]);
	});
});
