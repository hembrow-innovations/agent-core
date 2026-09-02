import assert from "node:assert/strict";
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	writeFileSync,
} from "node:fs";
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

function tempCwd(): string {
	return mkdtempSync(join(tmpdir(), "heio-coord-ticket-"));
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
	return {
		cwd,
		sessionManager: { getSessionId: () => sessionA },
	} as ExtensionContext;
}

describe("heio-coord ticket", () => {
	it("creates a ticket from the template and does not promote", async () => {
		const cwd = tempCwd();
		const tasksPath = join(
			cwd,
			".heio",
			"planning",
			"sprints",
			"coord",
			"slices",
			"s-rails",
			"tasks.md",
		);
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
			{ id: "s-rails", status: "active" },
		);
		mkdirSync(dirname(tasksPath), { recursive: true });
		const tasksBefore =
			"# Tasks: s-rails\n\n- [ ] T1: x\n  fits: O1\n  done: y\n";
		writeFileSync(tasksPath, tasksBefore, "utf8");
		const tool = loadFactory();
		const result = await tool.execute(
			"t1",
			{ action: "ticket", target: "login-flash" },
			undefined,
			undefined,
			toolCtx(cwd),
		);
		const ticketPath = join(cwd, ".heio", "tickets", "ticket-01-login-flash.md");
		const body = readFileSync(ticketPath, "utf8");
		assert.match(body, /id: "ticket-01-login-flash"/);
		assert.match(body, /kind: ticket/);
		assert.match(body, /status: open/);
		assert.doesNotMatch(body, /status: promoted/);
		assert.match(body, /## Signal/);
		assert.match(body, /## Fit/);
		assert.equal(readFileSync(tasksPath, "utf8"), tasksBefore);
		assert.equal(existsSync(join(cwd, ".heio", "TODO.md")), false);
		assert.equal(existsSync(join(cwd, ".heio", "sessions")), false);
		assert.deepEqual(result.content, [
			{ type: "text", text: "wrote ticket-01-login-flash" },
		]);
	});
});
