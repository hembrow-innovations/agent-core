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
import onicExtension from "./index.ts";

function loadFactory(): { tool: ToolDefinition } {
	let tool: ToolDefinition | undefined;
	onicExtension({
		on() {},
		registerTool(registered) {
			tool = registered;
		},
	} as ExtensionAPI);
	if (!tool) throw new Error("factory did not register the tool");
	return { tool };
}

describe("heio-onic factory", () => {
	it("fails closed when onic is not installed", async () => {
		const { tool } = loadFactory();
		const previous = process.env.PATH;
		process.env.PATH = mkdtempSync(join(tmpdir(), "no-onic-"));
		try {
			const result = await tool.execute(
				"id",
				{},
				undefined,
				undefined,
				{ cwd: process.cwd() } as ExtensionContext,
			);
			assert.deepEqual(result.content, [
				{ type: "text", text: "onic is not installed" },
			]);
		} finally {
			process.env.PATH = previous;
		}
	});
});
