import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import type {
	ExtensionAPI,
	ExtensionContext,
	ToolDefinition,
} from "@earendil-works/pi-coding-agent";
import coordExtension from "./index.ts";

const sessionA = "01a02e18-de1b-73f6-a111-111111111111";
const sessionB = "01a02e18-de1b-73f6-b222-222222222222";

function tempCwd(): string {
	return mkdtempSync(join(tmpdir(), "heio-coord-claim-"));
}

function writeNote(
	path: string,
	fields: Record<string, string>,
	body = "",
): void {
	mkdirSync(dirname(path), { recursive: true });
	const lines = ["---"];
	for (const [key, value] of Object.entries(fields)) {
		lines.push(`${key}: "${value}"`);
	}
	lines.push("---", "", `# ${fields.id}`, "", body);
	writeFileSync(path, `${lines.join("\n")}\n`, "utf8");
}

function seedActiveSlice(cwd: string): string {
	writeNote(join(cwd, ".heio", "planning", "sprints", "coord", "shape.md"), {
		id: "coord",
		status: "active",
	});
	const sliceDir = join(
		cwd,
		".heio",
		"planning",
		"sprints",
		"coord",
		"slices",
		"s-rails",
	);
	writeNote(join(sliceDir, "spec.md"), { id: "s-rails", status: "active" });
	const tasksPath = join(sliceDir, "tasks.md");
	writeFileSync(
		tasksPath,
		[
			"# Tasks: s-rails",
			"",
			"- [ ] T1: block sticky writes",
			"  fits: O1",
			"  done: intent write blocked",
			"",
		].join("\n"),
		"utf8",
	);
	return tasksPath;
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

function toolCtx(cwd: string, sessionId: string): ExtensionContext {
	return {
		cwd,
		sessionManager: { getSessionId: () => sessionId },
	} as ExtensionContext;
}

describe("heio-coord claims", () => {
	it("rejects a second live claim on one task", async () => {
		const cwd = tempCwd();
		seedActiveSlice(cwd);
		const tool = loadFactory();
		const first = await tool.execute(
			"c1",
			{ action: "claim", target: "T1" },
			undefined,
			undefined,
			toolCtx(cwd, sessionA),
		);
		assert.match(
			first.content[0]?.type === "text" ? first.content[0].text : "",
			/T1/,
		);
		const second = await tool.execute(
			"c2",
			{ action: "claim", target: "T1" },
			undefined,
			undefined,
			toolCtx(cwd, sessionB),
		);
		assert.deepEqual(second.content, [
			{
				type: "text",
				text: `Use heio_stack. T1 is claimed by ${sessionA}.`,
			},
		]);
	});

	it("releases a claim so another session can take it", async () => {
		const cwd = tempCwd();
		seedActiveSlice(cwd);
		const tool = loadFactory();
		await tool.execute(
			"c1",
			{ action: "claim", target: "T1" },
			undefined,
			undefined,
			toolCtx(cwd, sessionA),
		);
		const released = await tool.execute(
			"r1",
			{ action: "release", target: "T1" },
			undefined,
			undefined,
			toolCtx(cwd, sessionA),
		);
		assert.deepEqual(released.content, [{ type: "text", text: "released T1" }]);
		const second = await tool.execute(
			"c2",
			{ action: "claim", target: "T1" },
			undefined,
			undefined,
			toolCtx(cwd, sessionB),
		);
		assert.deepEqual(second.content, [{ type: "text", text: "claimed T1" }]);
	});

	it("rejects a second live claim on one ticket", async () => {
		const cwd = tempCwd();
		writeNote(join(cwd, ".heio", "tickets", "ticket-01-x.md"), {
			id: "ticket-01-x",
			status: "open",
		});
		const tool = loadFactory();
		const first = await tool.execute(
			"c1",
			{ action: "claim", target: "ticket-01-x" },
			undefined,
			undefined,
			toolCtx(cwd, sessionA),
		);
		assert.deepEqual(first.content, [
			{ type: "text", text: "claimed ticket-01-x" },
		]);
		const second = await tool.execute(
			"c2",
			{ action: "claim", target: "ticket-01-x" },
			undefined,
			undefined,
			toolCtx(cwd, sessionB),
		);
		assert.deepEqual(second.content, [
			{
				type: "text",
				text: `Use heio_stack. ticket-01-x is claimed by ${sessionA}.`,
			},
		]);
	});

	it("lets a stale claim expire", async () => {
		const cwd = tempCwd();
		const tasksPath = seedActiveSlice(cwd);
		const stale = new Date(Date.now() - 31 * 60 * 1000).toISOString();
		writeFileSync(
			tasksPath,
			[
				"# Tasks: s-rails",
				"",
				"- [ ] T1: block sticky writes",
				"  fits: O1",
				"  done: intent write blocked",
				`  claim: ${sessionA}`,
				`  claimed_at: ${stale}`,
				"",
			].join("\n"),
			"utf8",
		);
		const tool = loadFactory();
		const result = await tool.execute(
			"c1",
			{ action: "claim", target: "T1" },
			undefined,
			undefined,
			toolCtx(cwd, sessionB),
		);
		assert.deepEqual(result.content, [{ type: "text", text: "claimed T1" }]);
	});
});
