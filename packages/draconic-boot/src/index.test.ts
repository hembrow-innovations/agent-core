import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import bootExtension from "./index.ts";

const DEFAULT_BODY = "You are draconic on Pi.";

type Status = [string, string | undefined];

function writeAgent(
	cwd: string,
	name: string,
	body: string,
	extraFrontmatter = "",
) {
	mkdirSync(join(cwd, ".pi", "agents"), { recursive: true });
	const extra = extraFrontmatter ? `\n${extraFrontmatter}` : "";
	writeFileSync(
		join(cwd, ".pi", "agents", `${name}.md`),
		`---\nname: ${name}${extra}\n---\n\n${body}\n`,
	);
}

function writePackAgent(cwd: string, body = DEFAULT_BODY) {
	writeAgent(cwd, "draconic", body);
}

type ToolSource = {
	name: string;
	sourceInfo: { source: string; path?: string };
};

type RegisteredTool = {
	name: string;
	execute: (
		toolCallId: string,
		params: { tools?: unknown },
	) => Promise<{
		content: Array<{ type: string; text: string }>;
		details?: unknown;
		isError?: boolean;
	}>;
};

function destCatalog(): { active: string[]; all: ToolSource[] } {
	return {
		active: [
			"read",
			"bash",
			"draconic_todo",
			"coms_send",
			"team_status",
			"task_list",
			"web_search",
			"fetch_content",
			"subagent",
			"lens_diagnostics",
			"pi_lens_activate_tools",
		],
		all: [
			{ name: "read", sourceInfo: { source: "builtin" } },
			{ name: "bash", sourceInfo: { source: "builtin" } },
			{ name: "draconic_todo", sourceInfo: { source: "extension" } },
			{ name: "coms_send", sourceInfo: { source: "extension" } },
			{ name: "team_status", sourceInfo: { source: "extension" } },
			{ name: "task_list", sourceInfo: { source: "extension" } },
			{
				name: "web_search",
				sourceInfo: {
					source: "extension",
					path: "/npm/pi-web-access/index.ts",
				},
			},
			{
				name: "fetch_content",
				sourceInfo: {
					source: "extension",
					path: "/npm/pi-web-access/index.ts",
				},
			},
			{
				name: "subagent",
				sourceInfo: {
					source: "extension",
					path: "/npm/pi-subagents/index.ts",
				},
			},
			{
				name: "lens_diagnostics",
				sourceInfo: {
					source: "extension",
					path: "/npm/pi-lens/dist/index.js",
				},
			},
			{
				name: "pi_lens_activate_tools",
				sourceInfo: {
					source: "extension",
					path: "/npm/pi-lens/dist/index.js",
				},
			},
		],
	};
}

function loadBoot(
	active = ["read", "bash", "coms_send", "subagent"],
	all: ToolSource[] = [
		{ name: "read", sourceInfo: { source: "builtin" } },
		{ name: "bash", sourceInfo: { source: "builtin" } },
		{ name: "coms_send", sourceInfo: { source: "extension" } },
		{ name: "subagent", sourceInfo: { source: "extension" } },
	],
) {
	const statuses: Status[] = [];
	const notices: string[] = [];
	let live = [...active];
	let catalog = [...all];
	const tools: RegisteredTool[] = [];
	const handlers = new Map<string, (...args: never[]) => unknown>();
	const commands = new Map<
		string,
		(args: string, ctx: { cwd: string; ui: ReturnType<typeof ui> }) => unknown
	>();
	const flags: Record<string, string | undefined> = {};
	bootExtension({
		on(event, handler) {
			handlers.set(event, handler);
		},
		registerCommand(name, options) {
			commands.set(name, options.handler);
		},
		registerFlag() {},
		registerTool(tool: RegisteredTool) {
			tools.push(tool);
			if (!catalog.some((item) => item.name === tool.name)) {
				catalog = [
					...catalog,
					{ name: tool.name, sourceInfo: { source: "extension" } },
				];
			}
			if (!live.includes(tool.name)) {
				live = [...live, tool.name];
			}
		},
		getFlag(name: string) {
			return flags[name];
		},
		getActiveTools() {
			return [...live];
		},
		getAllTools() {
			return catalog;
		},
		setActiveTools(names: string[]) {
			live = [...names];
		},
	} as ExtensionAPI);
	return {
		statuses,
		notices,
		handlers,
		commands,
		flags,
		tools,
		getActive: () => [...live],
		getAll: () => catalog.map((item) => item.name),
	};
}

function ui(statuses: Status[], notices: string[] = []) {
	return {
		setStatus(key: string, text: string | undefined) {
			statuses.push([key, text]);
		},
		notify(message: string) {
			notices.push(message);
		},
	};
}

test("session_start paints off when no agent is selected", async () => {
	const cwd = mkdtempSync(join(tmpdir(), "boot-chip-"));
	writePackAgent(cwd);
	const { statuses, handlers } = loadBoot();
	const sessionStart = handlers.get("session_start");
	assert.equal(typeof sessionStart, "function");
	await sessionStart?.({} as never, { cwd, ui: ui(statuses) } as never);
	assert.deepEqual(statuses, [["agent", "off"]]);
});

test("before_agent_start does not append when no agent is selected", async () => {
	const cwd = mkdtempSync(join(tmpdir(), "boot-append-"));
	writePackAgent(cwd);
	const { statuses, handlers } = loadBoot();
	const before = handlers.get("before_agent_start");
	assert.equal(typeof before, "function");
	const result = await before?.(
		{ systemPrompt: "base" } as never,
		{ cwd, ui: ui(statuses) } as never,
	);
	assert.equal(result, undefined);
	assert.deepEqual(statuses, [["agent", "off"]]);
});

test("boot writes no dest flag file", async () => {
	const cwd = mkdtempSync(join(tmpdir(), "boot-nopersist-"));
	writePackAgent(cwd);
	const beforeFiles = readdirSync(join(cwd, ".pi"), { recursive: true }).sort();
	const { statuses, handlers } = loadBoot();
	await handlers.get("session_start")?.(
		{} as never,
		{ cwd, ui: ui(statuses) } as never,
	);
	await handlers.get("before_agent_start")?.(
		{ systemPrompt: "base" } as never,
		{ cwd, ui: ui(statuses) } as never,
	);
	assert.deepEqual(
		readdirSync(join(cwd, ".pi"), { recursive: true }).sort(),
		beforeFiles,
	);
});

test("/agent other appends that file on the next turn", async () => {
	const cwd = mkdtempSync(join(tmpdir(), "boot-switch-"));
	writePackAgent(cwd);
	writeAgent(cwd, "researcher", "Find evidence.");
	const { statuses, notices, handlers, commands } = loadBoot();
	const agent = commands.get("agent");
	assert.equal(typeof agent, "function");
	await agent?.("researcher", { cwd, ui: ui(statuses, notices) });
	const result = await handlers.get("before_agent_start")?.(
		{ systemPrompt: "base" } as never,
		{ cwd, ui: ui(statuses, notices) } as never,
	);
	assert.deepEqual(result, { systemPrompt: "base\n\nFind evidence." });
	assert.deepEqual(statuses.at(-1), ["agent", "researcher"]);
});

test("/agent default clears the agent", async () => {
	const cwd = mkdtempSync(join(tmpdir(), "boot-default-"));
	writePackAgent(cwd);
	writeAgent(cwd, "researcher", "Find evidence.");
	const { statuses, notices, handlers, commands } = loadBoot();
	const ctx = { cwd, ui: ui(statuses, notices) };
	await commands.get("agent")?.("researcher", ctx);
	await commands.get("agent")?.("default", ctx);
	const result = await handlers.get("before_agent_start")?.(
		{ systemPrompt: "base" } as never,
		ctx as never,
	);
	assert.equal(result, undefined);
	assert.deepEqual(statuses.at(-1), ["agent", "off"]);
	assert.match(notices.join("\n"), /agent off/);
});

test("unknown /agent name keeps the current file", async () => {
	const cwd = mkdtempSync(join(tmpdir(), "boot-unknown-"));
	writePackAgent(cwd);
	writeAgent(cwd, "researcher", "Find evidence.");
	const { statuses, notices, handlers, commands } = loadBoot();
	const ctx = { cwd, ui: ui(statuses, notices) };
	await commands.get("agent")?.("researcher", ctx);
	await commands.get("agent")?.("missing", ctx);
	const result = await handlers.get("before_agent_start")?.(
		{ systemPrompt: "base" } as never,
		ctx as never,
	);
	assert.deepEqual(result, { systemPrompt: "base\n\nFind evidence." });
	assert.match(notices.join("\n"), /unknown agent: missing/);
});

test("/agent writes no dest settings or flag file", async () => {
	const cwd = mkdtempSync(join(tmpdir(), "boot-switch-disk-"));
	writePackAgent(cwd);
	writeAgent(cwd, "researcher", "Find evidence.");
	const beforeFiles = readdirSync(join(cwd, ".pi"), { recursive: true }).sort();
	const { statuses, notices, commands } = loadBoot();
	await commands.get("agent")?.("researcher", {
		cwd,
		ui: ui(statuses, notices),
	});
	assert.deepEqual(
		readdirSync(join(cwd, ".pi"), { recursive: true }).sort(),
		beforeFiles,
	);
});

test("--agent flag selects that file for this process", async () => {
	const cwd = mkdtempSync(join(tmpdir(), "boot-flag-"));
	writePackAgent(cwd);
	writeAgent(cwd, "researcher", "Find evidence.");
	const boot = loadBoot();
	boot.flags.agent = "researcher";
	await boot.handlers.get("session_start")?.(
		{} as never,
		{ cwd, ui: ui(boot.statuses, boot.notices) } as never,
	);
	const result = await boot.handlers.get("before_agent_start")?.(
		{ systemPrompt: "base" } as never,
		{ cwd, ui: ui(boot.statuses, boot.notices) } as never,
	);
	assert.deepEqual(result, { systemPrompt: "base\n\nFind evidence." });
	assert.deepEqual(boot.statuses.at(-1), ["agent", "researcher"]);
});

test("tools allowlist keeps coms and subagent", async () => {
	const cwd = mkdtempSync(join(tmpdir(), "boot-tools-keep-"));
	writePackAgent(cwd);
	writeAgent(cwd, "reader", "Read only.", "tools: [read]");
	const boot = loadBoot();
	const ctx = { cwd, ui: ui(boot.statuses, boot.notices) };
	await boot.commands.get("agent")?.("reader", ctx);
	assert.deepEqual(boot.getActive().sort(), [
		"coms_send",
		"dest_activate_tools",
		"read",
		"subagent",
	]);
});

test("unknown tool names do not throw", async () => {
	const cwd = mkdtempSync(join(tmpdir(), "boot-tools-unknown-"));
	writePackAgent(cwd);
	writeAgent(cwd, "reader", "Read only.", "tools: [read, not-a-tool]");
	const boot = loadBoot();
	await boot.commands.get("agent")?.("reader", {
		cwd,
		ui: ui(boot.statuses, boot.notices),
	});
	assert.deepEqual(boot.getActive().sort(), [
		"coms_send",
		"dest_activate_tools",
		"read",
		"subagent",
	]);
});

test("empty valid tools list leaves the live set", async () => {
	const cwd = mkdtempSync(join(tmpdir(), "boot-tools-empty-"));
	writePackAgent(cwd);
	writeAgent(cwd, "empty", "No tools.", "tools: [not-a-tool]");
	const boot = loadBoot();
	await boot.commands.get("agent")?.("empty", {
		cwd,
		ui: ui(boot.statuses, boot.notices),
	});
	assert.deepEqual(boot.getActive().sort(), [
		"bash",
		"coms_send",
		"dest_activate_tools",
		"read",
		"subagent",
	]);
});

test("return-to-off restores the tools snapshot", async () => {
	const cwd = mkdtempSync(join(tmpdir(), "boot-tools-restore-"));
	writePackAgent(cwd);
	writeAgent(cwd, "reader", "Read only.", "tools: [read]");
	const boot = loadBoot();
	const ctx = { cwd, ui: ui(boot.statuses, boot.notices) };
	await boot.commands.get("agent")?.("reader", ctx);
	await boot.commands.get("agent")?.("default", ctx);
	assert.deepEqual(boot.getActive().sort(), [
		"bash",
		"coms_send",
		"dest_activate_tools",
		"read",
		"subagent",
	]);
});

test("session_start parks third-party tools and keeps first-party tools active", async () => {
	const cwd = mkdtempSync(join(tmpdir(), "boot-park-"));
	writePackAgent(cwd);
	const catalog = destCatalog();
	const boot = loadBoot(catalog.active, catalog.all);
	await boot.handlers.get("session_start")?.(
		{} as never,
		{ cwd, ui: ui(boot.statuses, boot.notices) } as never,
	);
	assert.deepEqual(boot.getActive().sort(), [
		"bash",
		"coms_send",
		"dest_activate_tools",
		"draconic_todo",
		"pi_lens_activate_tools",
		"read",
		"task_list",
		"team_status",
	]);
	assert.equal(boot.getAll().includes("web_search"), true);
	assert.equal(boot.getAll().includes("fetch_content"), true);
	assert.equal(boot.getAll().includes("subagent"), true);
	assert.equal(boot.getAll().includes("lens_diagnostics"), true);
	assert.equal(boot.getAll().includes("dest_activate_tools"), true);
});

test("dest loader stays registered and active after session_start", async () => {
	const cwd = mkdtempSync(join(tmpdir(), "boot-dest-loader-"));
	writePackAgent(cwd);
	const catalog = destCatalog();
	const boot = loadBoot(catalog.active, catalog.all);
	assert.equal(
		boot.tools.some((tool) => tool.name === "dest_activate_tools"),
		true,
	);
	await boot.handlers.get("session_start")?.(
		{} as never,
		{ cwd, ui: ui(boot.statuses, boot.notices) } as never,
	);
	assert.equal(boot.getAll().includes("dest_activate_tools"), true);
	assert.equal(boot.getActive().includes("dest_activate_tools"), true);
});

test("dest loader activates a named parked tool", async () => {
	const cwd = mkdtempSync(join(tmpdir(), "boot-dest-activate-"));
	writePackAgent(cwd);
	const catalog = destCatalog();
	const boot = loadBoot(catalog.active, catalog.all);
	const ctx = { cwd, ui: ui(boot.statuses, boot.notices) };
	await boot.handlers.get("session_start")?.({} as never, ctx as never);
	const loader = boot.tools.find((tool) => tool.name === "dest_activate_tools");
	assert.equal(typeof loader?.execute, "function");
	await loader?.execute("call-1", { tools: ["web_search", "missing_tool"] });
	assert.equal(boot.getActive().includes("web_search"), true);
	assert.equal(boot.getActive().includes("fetch_content"), false);
	assert.equal(boot.getActive().includes("subagent"), false);
	assert.equal(boot.getActive().includes("lens_diagnostics"), false);
	assert.equal(boot.getActive().includes("dest_activate_tools"), true);
	assert.equal(boot.getAll().includes("fetch_content"), true);
});

test("tools allowlist after park keeps first-party tools and dest loader", async () => {
	const cwd = mkdtempSync(join(tmpdir(), "boot-park-allowlist-"));
	writePackAgent(cwd);
	writeAgent(cwd, "reader", "Read only.", "tools: [read]");
	const catalog = destCatalog();
	const boot = loadBoot(catalog.active, catalog.all);
	const ctx = { cwd, ui: ui(boot.statuses, boot.notices) };
	await boot.handlers.get("session_start")?.({} as never, ctx as never);
	await boot.commands.get("agent")?.("reader", ctx);
	assert.deepEqual(boot.getActive().sort(), [
		"coms_send",
		"dest_activate_tools",
		"draconic_todo",
		"pi_lens_activate_tools",
		"read",
		"task_list",
		"team_status",
	]);
	assert.equal(boot.getActive().includes("web_search"), false);
	assert.equal(boot.getActive().includes("subagent"), false);
	assert.equal(boot.getAll().includes("subagent"), true);
});

test("bindActiveTools after dest activate keeps that tool parked others off", async () => {
	const cwd = mkdtempSync(join(tmpdir(), "boot-park-bind-"));
	writePackAgent(cwd);
	writeAgent(cwd, "reader", "Read only.", "tools: [read]");
	const catalog = destCatalog();
	const boot = loadBoot(catalog.active, catalog.all);
	const ctx = { cwd, ui: ui(boot.statuses, boot.notices) };
	await boot.handlers.get("session_start")?.({} as never, ctx as never);
	const loader = boot.tools.find((tool) => tool.name === "dest_activate_tools");
	await loader?.execute("call-1", { tools: ["web_search"] });
	await boot.handlers.get("before_agent_start")?.(
		{ systemPrompt: "base" } as never,
		ctx as never,
	);
	await boot.commands.get("agent")?.("reader", ctx);
	assert.equal(boot.getActive().includes("web_search"), true);
	assert.equal(boot.getActive().includes("fetch_content"), false);
	assert.equal(boot.getActive().includes("subagent"), false);
	assert.equal(boot.getActive().includes("lens_diagnostics"), false);
	assert.equal(boot.getActive().includes("dest_activate_tools"), true);
	assert.equal(boot.getActive().includes("coms_send"), true);
});

test("return-to-off after park does not restore parked tools", async () => {
	const cwd = mkdtempSync(join(tmpdir(), "boot-park-restore-"));
	writePackAgent(cwd);
	writeAgent(cwd, "reader", "Read only.", "tools: [read]");
	const catalog = destCatalog();
	const boot = loadBoot(catalog.active, catalog.all);
	const ctx = { cwd, ui: ui(boot.statuses, boot.notices) };
	await boot.handlers.get("session_start")?.({} as never, ctx as never);
	await boot.commands.get("agent")?.("reader", ctx);
	await boot.commands.get("agent")?.("default", ctx);
	assert.equal(boot.getActive().includes("subagent"), false);
	assert.equal(boot.getActive().includes("web_search"), false);
	assert.equal(boot.getActive().includes("dest_activate_tools"), true);
	assert.equal(boot.getActive().includes("coms_send"), true);
	assert.equal(boot.getAll().includes("subagent"), true);
});

test("session_start parks renamed third-party tools by sourceInfo path", async () => {
	const cwd = mkdtempSync(join(tmpdir(), "boot-park-path-"));
	writePackAgent(cwd);
	const boot = loadBoot(
		["read", "coms_send", "custom_web_search", "subagent_wait"],
		[
			{ name: "read", sourceInfo: { source: "builtin" } },
			{ name: "coms_send", sourceInfo: { source: "extension" } },
			{
				name: "custom_web_search",
				sourceInfo: {
					source: "extension",
					path: "/npm/pi-web-access/index.ts",
				},
			},
			{ name: "subagent_wait", sourceInfo: { source: "extension" } },
		],
	);
	await boot.handlers.get("session_start")?.(
		{} as never,
		{ cwd, ui: ui(boot.statuses, boot.notices) } as never,
	);
	assert.equal(boot.getActive().includes("custom_web_search"), false);
	assert.equal(boot.getActive().includes("subagent_wait"), false);
	assert.equal(boot.getActive().includes("coms_send"), true);
	assert.equal(boot.getAll().includes("custom_web_search"), true);
	assert.equal(boot.getAll().includes("subagent_wait"), true);
});
