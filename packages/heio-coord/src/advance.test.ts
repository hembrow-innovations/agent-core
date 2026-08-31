import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import type {
	ExtensionAPI,
	ExtensionContext,
	ToolDefinition,
} from "@earendil-works/pi-coding-agent";
import coordExtension from "./index.ts";

function tempCwd(): string {
	return mkdtempSync(join(tmpdir(), "heio-coord-advance-"));
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

function seedSlice(cwd: string, status: string): string {
	writeNote(join(cwd, ".heio", "planning", "sprints", "coord", "shape.md"), {
		id: "coord",
		status: "active",
	});
	const specPath = join(
		cwd,
		".heio",
		"planning",
		"sprints",
		"coord",
		"slices",
		"s-lens",
		"spec.md",
	);
	writeNote(specPath, { id: "s-lens", status });
	return specPath;
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

function builderCtx(cwd: string): ExtensionContext {
	return {
		cwd,
		getSystemPrompt: () =>
			"You are `heio-builder`. You implement one named task from the brief.",
		sessionManager: {
			getSessionId: () => "01a02e18-de1b-73f6-b111-111111111111",
			getSessionName: () => "heio-builder",
		},
	} as ExtensionContext;
}

function parentCtx(cwd: string): ExtensionContext {
	return {
		cwd,
		getSystemPrompt: () => "You are the parent orchestrator.",
		sessionManager: {
			getSessionId: () => "01a02e18-de1b-73f6-a111-111111111111",
			getSessionName: () => "heio-slice",
		},
	} as ExtensionContext;
}

describe("heio-coord advance", () => {
	it("refuses a builder-shaped session advancing a slice to met", async () => {
		const cwd = tempCwd();
		const specPath = seedSlice(cwd, "active");
		const before = readFileSync(specPath, "utf8");
		const tool = loadFactory();
		const result = await tool.execute(
			"a1",
			{ action: "advance", target: "met" },
			undefined,
			undefined,
			builderCtx(cwd),
		);
		assert.deepEqual(result.content, [
			{
				type: "text",
				text: "Use heio_stack. Builder cannot mark the slice met.",
			},
		]);
		assert.equal(readFileSync(specPath, "utf8"), before);
	});

	it("advances a frozen slice to active", async () => {
		const cwd = tempCwd();
		const specPath = seedSlice(cwd, "frozen");
		const tool = loadFactory();
		const result = await tool.execute(
			"a1",
			{ action: "advance", target: "active" },
			undefined,
			undefined,
			parentCtx(cwd),
		);
		assert.deepEqual(result.content, [
			{ type: "text", text: "advanced s-lens to active" },
		]);
		assert.match(readFileSync(specPath, "utf8"), /status: "active"/);
	});

	it("advances an active slice to met", async () => {
		const cwd = tempCwd();
		const specPath = seedSlice(cwd, "active");
		const tool = loadFactory();
		const result = await tool.execute(
			"a1",
			{ action: "advance", target: "met" },
			undefined,
			undefined,
			parentCtx(cwd),
		);
		assert.deepEqual(result.content, [
			{ type: "text", text: "advanced s-lens to met" },
		]);
		assert.match(readFileSync(specPath, "utf8"), /status: "met"/);
	});

	it("advances an active slice to abandoned", async () => {
		const cwd = tempCwd();
		const specPath = seedSlice(cwd, "active");
		const tool = loadFactory();
		const result = await tool.execute(
			"a1",
			{ action: "advance", target: "abandoned" },
			undefined,
			undefined,
			parentCtx(cwd),
		);
		assert.deepEqual(result.content, [
			{ type: "text", text: "advanced s-lens to abandoned" },
		]);
		assert.match(readFileSync(specPath, "utf8"), /status: "abandoned"/);
	});

	it("asks for a slice name when two frozen slices could become active", async () => {
		const cwd = tempCwd();
		const first = seedSlice(cwd, "frozen");
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
			{ id: "s-rails", status: "frozen" },
		);
		const tool = loadFactory();
		const result = await tool.execute(
			"a1",
			{ action: "advance", target: "active" },
			undefined,
			undefined,
			parentCtx(cwd),
		);
		assert.deepEqual(result.content, [
			{
				type: "text",
				text: "Use heio_stack. Name the slice: s-lens:active or s-rails:active.",
			},
		]);
		assert.match(readFileSync(first, "utf8"), /status: "frozen"/);
		const named = await tool.execute(
			"a2",
			{ action: "advance", target: "s-lens:active" },
			undefined,
			undefined,
			parentCtx(cwd),
		);
		assert.deepEqual(named.content, [
			{ type: "text", text: "advanced s-lens to active" },
		]);
		assert.match(readFileSync(first, "utf8"), /status: "active"/);
	});

	it("refuses skipping frozen to met", async () => {
		const cwd = tempCwd();
		const specPath = seedSlice(cwd, "frozen");
		const before = readFileSync(specPath, "utf8");
		const tool = loadFactory();
		const result = await tool.execute(
			"a1",
			{ action: "advance", target: "met" },
			undefined,
			undefined,
			parentCtx(cwd),
		);
		assert.deepEqual(result.content, [
			{
				type: "text",
				text: "Use heio_stack. Cannot advance frozen to met.",
			},
		]);
		assert.equal(readFileSync(specPath, "utf8"), before);
	});
});
