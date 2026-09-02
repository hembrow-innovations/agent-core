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

type SessionStart = (
	event: { type: "session_start" },
	ctx: ExtensionContext,
) => void;

function tempCwd(): string {
	return mkdtempSync(join(tmpdir(), "heio-coord-ext-"));
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

function seedTree(cwd: string): void {
	writeNote(join(cwd, ".heio", "planning", "intent.md"), {
		id: "intent",
		status: "active",
	});
	writeNote(join(cwd, ".heio", "planning", "sprints", "coord", "shape.md"), {
		id: "coord",
		status: "active",
	});
	writeNote(
		join(
			cwd,
			".heio",
			"planning",
			"sprints",
			"coord",
			"slices",
			"s-lens",
			"spec.md",
		),
		{ id: "s-lens", status: "frozen" },
	);
	writeNote(join(cwd, ".heio", "tickets", "ticket-01-x.md"), {
		id: "ticket-01-x",
		status: "open",
	});
}

function loadFactory(): {
	tool: ToolDefinition;
	commands: Map<string, { description: string }>;
	sessionStart: SessionStart | undefined;
} {
	let tool: ToolDefinition | undefined;
	let sessionStart: SessionStart | undefined;
	const commands = new Map<string, { description: string }>();
	coordExtension({
		on(event, handler) {
			if (event === "session_start") sessionStart = handler;
		},
		registerTool(registered) {
			tool = registered;
		},
		registerCommand(name, spec) {
			commands.set(name, { description: spec.description });
		},
	} as ExtensionAPI);
	if (!tool) throw new Error("factory did not register the tool");
	return { tool, commands, sessionStart };
}

function toolCtx(cwd: string): ExtensionContext {
	return { cwd } as ExtensionContext;
}

describe("heio-coord factory", () => {
	it("registers heio_stack and /heio", () => {
		const { tool, commands } = loadFactory();
		assert.equal(tool.name, "heio_stack");
		assert.equal(commands.has("heio"), true);
		assert.match(commands.get("heio")?.description ?? "", /\/heio/);
	});

	it("status stays inert when AGENTS.md names another tracker", async () => {
		const cwd = tempCwd();
		seedTree(cwd);
		writeFileSync(
			join(cwd, "AGENTS.md"),
			"## Tracker\n\nThis checkout runs **pstack**.\n",
		);
		const { tool } = loadFactory();
		const result = await tool.execute(
			"id",
			{ action: "status" },
			undefined,
			undefined,
			toolCtx(cwd),
		);
		assert.deepEqual(result.content, [
			{
				type: "text",
				text: "inert: AGENTS.md names pstack. Coordinator stays inert.",
			},
		]);
	});

	it("says inert once on session_start", () => {
		const cwd = tempCwd();
		writeFileSync(
			join(cwd, "AGENTS.md"),
			"## Tracker\n\nThis checkout runs **pstack**.\n",
		);
		const notices: string[] = [];
		const { sessionStart } = loadFactory();
		assert.ok(sessionStart);
		const ctx = {
			cwd,
			ui: {
				notify(message: string) {
					notices.push(message);
				},
			},
		} as ExtensionContext;
		sessionStart({ type: "session_start" }, ctx);
		sessionStart({ type: "session_start" }, ctx);
		assert.deepEqual(notices, [
			"inert: AGENTS.md names pstack. Coordinator stays inert.",
		]);
	});

	it("status reports the lens and does not write planning files", async () => {
		const cwd = tempCwd();
		seedTree(cwd);
		const intentPath = join(cwd, ".heio", "planning", "intent.md");
		const before = readFileSync(intentPath, "utf8");
		const { tool } = loadFactory();
		const result = await tool.execute(
			"id",
			{ action: "status" },
			undefined,
			undefined,
			toolCtx(cwd),
		);
		assert.deepEqual(result.content, [
			{
				type: "text",
				text: [
					"sprints: coord",
					"slices: coord/s-lens:frozen",
					"tickets: ticket-01-x",
				].join("\n"),
			},
		]);
		assert.equal(readFileSync(intentPath, "utf8"), before);
	});
});
