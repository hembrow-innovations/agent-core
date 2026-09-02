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

const SCOPE_REASON = "Use heio_stack. Path is outside claimed task scope.";

function tempCwd(): string {
	return mkdtempSync(join(tmpdir(), "heio-coord-scope-"));
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

function builderCtx(cwd: string): ExtensionContext {
	return {
		cwd,
		getSystemPrompt: () =>
			"You are `heio-builder`. You implement one named task from the brief.",
	} as ExtensionContext;
}

function seedClaimedPool(cwd: string, scope: string): void {
	const path = join(cwd, ".heio", "pool", "task-x.md");
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(
		path,
		[
			"---",
			'id: "task-x"',
			'status: "claimed"',
			'claim: "session-a"',
			`claimed_at: "${new Date().toISOString()}"`,
			"---",
			"",
			"# task-x",
			"",
			`scope: ${scope}`,
			"",
		].join("\n"),
		"utf8",
	);
}

describe("heio-coord builder scope fence", () => {
	it("blocks a builder write of a product file when no pool task is claimed", () => {
		const cwd = tempCwd();
		const { toolCall } = loadFactory();
		assert.deepEqual(
			toolCall(
				{
					type: "tool_call",
					toolCallId: "1",
					toolName: "write",
					input: { path: "src/foo.ts", content: "nope" },
				},
				builderCtx(cwd),
			),
			{ block: true, reason: SCOPE_REASON },
		);
	});

	it("blocks a builder edit of a product file when no pool task is claimed", () => {
		const cwd = tempCwd();
		const { toolCall } = loadFactory();
		assert.deepEqual(
			toolCall(
				{
					type: "tool_call",
					toolCallId: "2",
					toolName: "edit",
					input: { path: "src/foo.ts", oldText: "a", newText: "b" },
				},
				builderCtx(cwd),
			),
			{ block: true, reason: SCOPE_REASON },
		);
	});

	it("blocks a builder bash mutation of a product file when no pool task is claimed", () => {
		const cwd = tempCwd();
		const { toolCall } = loadFactory();
		assert.deepEqual(
			toolCall(
				{
					type: "tool_call",
					toolCallId: "3",
					toolName: "bash",
					input: { command: "echo x > src/foo.ts" },
				},
				builderCtx(cwd),
			),
			{ block: true, reason: SCOPE_REASON },
		);
	});

	it("blocks a builder write when the claimed pool task scope does not include the path", () => {
		const cwd = tempCwd();
		seedClaimedPool(cwd, "packages/other/src/bar.ts");
		const { toolCall } = loadFactory();
		assert.deepEqual(
			toolCall(
				{
					type: "tool_call",
					toolCallId: "4",
					toolName: "write",
					input: { path: "src/foo.ts", content: "nope" },
				},
				builderCtx(cwd),
			),
			{ block: true, reason: SCOPE_REASON },
		);
	});
});
