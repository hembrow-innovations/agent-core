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

const TASKS_REASON = "Use heio_stack. Slice must be frozen or active.";

function tempCwd(): string {
	return mkdtempSync(join(tmpdir(), "heio-coord-slice-"));
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

function seedSlice(cwd: string, status: string): void {
	writeNote(
		join(
			cwd,
			".heio",
			"planning",
			"sprints",
			"coord",
			"slices",
			"s-rails",
			"spec.md",
		),
		{ id: "s-rails", status },
	);
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

describe("heio-coord slice fence", () => {
	it("blocks creating tasks.md while the slice is shaping", () => {
		const cwd = tempCwd();
		seedSlice(cwd, "shaping");
		const { toolCall } = loadFactory();
		assert.deepEqual(
			toolCall(
				{
					type: "tool_call",
					toolCallId: "1",
					toolName: "write",
					input: {
						path: ".heio/planning/sprints/coord/slices/s-rails/tasks.md",
						content: "# Tasks\n",
					},
				},
				toolCtx(cwd),
			),
			{ block: true, reason: TASKS_REASON },
		);
	});

	it("blocks bash creation of tasks.md while shaping", () => {
		const cwd = tempCwd();
		seedSlice(cwd, "shaping");
		const { toolCall } = loadFactory();
		assert.deepEqual(
			toolCall(
				{
					type: "tool_call",
					toolCallId: "bash-tasks",
					toolName: "bash",
					input: {
						command: "echo hi > .heio/planning/sprints/coord/slices/s-rails/tasks.md",
					},
				},
				toolCtx(cwd),
			),
			{ block: true, reason: TASKS_REASON },
		);
	});

	it("allows tasks.md once the slice is frozen or active", () => {
		const { toolCall } = loadFactory();
		for (const status of ["frozen", "active"]) {
			const cwd = tempCwd();
			seedSlice(cwd, status);
			assert.equal(
				toolCall(
					{
						type: "tool_call",
						toolCallId: status,
						toolName: "write",
						input: {
							path: ".heio/planning/sprints/coord/slices/s-rails/tasks.md",
							content: "# Tasks\n",
						},
					},
					toolCtx(cwd),
				),
				undefined,
			);
		}
	});

	it("allows a second slice flipping to active", () => {
		const cwd = tempCwd();
		seedSlice(cwd, "active");
		writeNote(
			join(
				cwd,
				".heio",
				"planning",
				"sprints",
				"coord",
				"slices",
				"s-verify",
				"spec.md",
			),
			{ id: "s-verify", status: "frozen" },
		);
		const { toolCall } = loadFactory();
		assert.equal(
			toolCall(
				{
					type: "tool_call",
					toolCallId: "2",
					toolName: "edit",
					input: {
						path: ".heio/planning/sprints/coord/slices/s-verify/spec.md",
						oldText: 'status: "frozen"',
						newText: 'status: "active"',
					},
				},
				toolCtx(cwd),
			),
			undefined,
		);
	});

	it("allows the first slice to become active", () => {
		const cwd = tempCwd();
		seedSlice(cwd, "frozen");
		const { toolCall } = loadFactory();
		assert.equal(
			toolCall(
				{
					type: "tool_call",
					toolCallId: "3",
					toolName: "edit",
					input: {
						path: ".heio/planning/sprints/coord/slices/s-rails/spec.md",
						oldText: 'status: "frozen"',
						newText: 'status: "active"',
					},
				},
				toolCtx(cwd),
			),
			undefined,
		);
	});
});
