import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import type {
	ExtensionAPI,
	ExtensionContext,
	ToolDefinition,
} from "@earendil-works/pi-coding-agent";
import coordExtension from "./index.ts";

function tempCwd(): string {
	return mkdtempSync(join(tmpdir(), "heio-coord-verdict-"));
}

function loadFactory(): ToolDefinition {
	let tool: ToolDefinition | undefined;
	coordExtension({
		on() {},
		registerTool(registered) {
			tool = registered;
		},
		registerCommand() {},
	} as ExtensionAPI);
	if (!tool) throw new Error("factory did not register the tool");
	return tool;
}

function toolCtx(cwd: string): ExtensionContext {
	return { cwd } as ExtensionContext;
}

describe("heio-coord verdict", () => {
	it("records TASK plus one-line evidence as a tool result", async () => {
		const cwd = tempCwd();
		const tool = loadFactory();
		const result = await tool.execute(
			"v1",
			{
				action: "verdict",
				target: "TASK",
				evidence: "files, test command, oracle id",
			},
			undefined,
			undefined,
			toolCtx(cwd),
		);
		assert.deepEqual(result.content, [
			{
				type: "text",
				text: "VERDICT: TASK\nEVIDENCE: files, test command, oracle id",
			},
		]);
	});

	it("records TICKET, ESCALATE, and VERIFY plus one-line evidence", async () => {
		const cwd = tempCwd();
		const tool = loadFactory();
		for (const kind of ["TICKET", "ESCALATE", "VERIFY"] as const) {
			const result = await tool.execute(
				"v1",
				{
					action: "verdict",
					target: kind,
					evidence: "one line",
				},
				undefined,
				undefined,
				toolCtx(cwd),
			);
			assert.deepEqual(result.content, [
				{
					type: "text",
					text: `VERDICT: ${kind}\nEVIDENCE: one line`,
				},
			]);
		}
	});
});
