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

function tempCwd(): string {
	return mkdtempSync(join(tmpdir(), "heio-coord-oracle-"));
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

function seedSlice(cwd: string): void {
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
		"s-lens",
	);
	writeNote(join(sliceDir, "spec.md"), { id: "s-lens", status: "frozen" });
	writeFileSync(
		join(sliceDir, "oracles.md"),
		[
			"# Oracles: lens",
			"",
			"- [ ] O1: does the thing",
			"  CHECK: node -e \"console.log('oracle passed')\"",
			"  EXPECT: oracle passed",
			"  EVIDENCE: pending",
			"",
		].join("\n"),
		"utf8",
	);
}

function plantChecker(cwd: string): void {
	const dest = join(
		cwd,
		".pi",
		"skills",
		"oracle",
		"scripts",
		"oracle-check.mjs",
	);
	mkdirSync(dirname(dest), { recursive: true });
	writeFileSync(
		dest,
		'process.stdout.write(`checker:${process.argv.slice(2).join(" ")}\\n`);\n',
		"utf8",
	);
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

describe("heio-coord oracle", () => {
	it("returns --status checker output for the slice ledger", async () => {
		const cwd = tempCwd();
		seedSlice(cwd);
		plantChecker(cwd);
		const tool = loadFactory();
		const result = await tool.execute(
			"o1",
			{ action: "oracle", target: "status" },
			undefined,
			undefined,
			toolCtx(cwd),
		);
		assert.deepEqual(result.content, [
			{
				type: "text",
				text:
					"checker:--status .heio/planning/sprints/coord/slices/s-lens/oracles.md\n",
			},
		]);
	});

	it("returns --reverify checker output for the slice ledger", async () => {
		const cwd = tempCwd();
		seedSlice(cwd);
		plantChecker(cwd);
		const tool = loadFactory();
		const result = await tool.execute(
			"o1",
			{ action: "oracle", target: "reverify" },
			undefined,
			undefined,
			toolCtx(cwd),
		);
		assert.deepEqual(result.content, [
			{
				type: "text",
				text:
					"checker:--reverify .heio/planning/sprints/coord/slices/s-lens/oracles.md\n",
			},
		]);
	});
});
