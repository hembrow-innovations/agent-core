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

function writeDefaultAgent(cwd: string, body = DEFAULT_BODY) {
	writeAgent(cwd, "draconic", body);
}

function loadBoot(
	active = ["read", "bash", "coms_send", "subagent"],
	all = [
		{ name: "read", sourceInfo: { source: "builtin" } },
		{ name: "bash", sourceInfo: { source: "builtin" } },
		{ name: "coms_send", sourceInfo: { source: "extension" } },
		{ name: "subagent", sourceInfo: { source: "extension" } },
	],
) {
	const statuses: Status[] = [];
	const notices: string[] = [];
	let live = [...active];
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
		getFlag(name: string) {
			return flags[name];
		},
		getActiveTools() {
			return [...live];
		},
		getAllTools() {
			return all;
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
		getActive: () => [...live],
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

test("session_start paints the default agent name", async () => {
	const cwd = mkdtempSync(join(tmpdir(), "boot-chip-"));
	writeDefaultAgent(cwd);
	const { statuses, handlers } = loadBoot();
	const sessionStart = handlers.get("session_start");
	assert.equal(typeof sessionStart, "function");
	await sessionStart?.({} as never, { cwd, ui: ui(statuses) } as never);
	assert.deepEqual(statuses, [["agent", "draconic"]]);
});

test("before_agent_start appends the default body", async () => {
	const cwd = mkdtempSync(join(tmpdir(), "boot-append-"));
	writeDefaultAgent(cwd);
	const { statuses, handlers } = loadBoot();
	const before = handlers.get("before_agent_start");
	assert.equal(typeof before, "function");
	const result = await before?.(
		{ systemPrompt: "base" } as never,
		{ cwd, ui: ui(statuses) } as never,
	);
	assert.deepEqual(result, {
		systemPrompt: `base\n\n${DEFAULT_BODY}`,
	});
	assert.deepEqual(statuses, [["agent", "draconic"]]);
});

test("boot writes no dest flag file", async () => {
	const cwd = mkdtempSync(join(tmpdir(), "boot-nopersist-"));
	writeDefaultAgent(cwd);
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
	writeDefaultAgent(cwd);
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

test("/agent default returns the default file", async () => {
	const cwd = mkdtempSync(join(tmpdir(), "boot-default-"));
	writeDefaultAgent(cwd);
	writeAgent(cwd, "researcher", "Find evidence.");
	const { statuses, notices, handlers, commands } = loadBoot();
	const ctx = { cwd, ui: ui(statuses, notices) };
	await commands.get("agent")?.("researcher", ctx);
	await commands.get("agent")?.("default", ctx);
	const result = await handlers.get("before_agent_start")?.(
		{ systemPrompt: "base" } as never,
		ctx as never,
	);
	assert.deepEqual(result, { systemPrompt: `base\n\n${DEFAULT_BODY}` });
	assert.deepEqual(statuses.at(-1), ["agent", "draconic"]);
});

test("unknown /agent name keeps the current file", async () => {
	const cwd = mkdtempSync(join(tmpdir(), "boot-unknown-"));
	writeDefaultAgent(cwd);
	const { statuses, notices, handlers, commands } = loadBoot();
	const ctx = { cwd, ui: ui(statuses, notices) };
	await commands.get("agent")?.("missing", ctx);
	const result = await handlers.get("before_agent_start")?.(
		{ systemPrompt: "base" } as never,
		ctx as never,
	);
	assert.deepEqual(result, { systemPrompt: `base\n\n${DEFAULT_BODY}` });
	assert.match(notices.join("\n"), /unknown agent: missing/);
});

test("/agent writes no dest settings or flag file", async () => {
	const cwd = mkdtempSync(join(tmpdir(), "boot-switch-disk-"));
	writeDefaultAgent(cwd);
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
	writeDefaultAgent(cwd);
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
	writeDefaultAgent(cwd);
	writeAgent(cwd, "reader", "Read only.", "tools: [read]");
	const boot = loadBoot();
	const ctx = { cwd, ui: ui(boot.statuses, boot.notices) };
	await boot.commands.get("agent")?.("reader", ctx);
	assert.deepEqual(boot.getActive().sort(), ["coms_send", "read", "subagent"]);
});

test("unknown tool names do not throw", async () => {
	const cwd = mkdtempSync(join(tmpdir(), "boot-tools-unknown-"));
	writeDefaultAgent(cwd);
	writeAgent(cwd, "reader", "Read only.", "tools: [read, not-a-tool]");
	const boot = loadBoot();
	await boot.commands.get("agent")?.("reader", {
		cwd,
		ui: ui(boot.statuses, boot.notices),
	});
	assert.deepEqual(boot.getActive().sort(), ["coms_send", "read", "subagent"]);
});

test("empty valid tools list leaves the live set", async () => {
	const cwd = mkdtempSync(join(tmpdir(), "boot-tools-empty-"));
	writeDefaultAgent(cwd);
	writeAgent(cwd, "empty", "No tools.", "tools: [not-a-tool]");
	const boot = loadBoot();
	await boot.commands.get("agent")?.("empty", {
		cwd,
		ui: ui(boot.statuses, boot.notices),
	});
	assert.deepEqual(boot.getActive().sort(), [
		"bash",
		"coms_send",
		"read",
		"subagent",
	]);
});

test("return-to-default restores the tools snapshot", async () => {
	const cwd = mkdtempSync(join(tmpdir(), "boot-tools-restore-"));
	writeDefaultAgent(cwd);
	writeAgent(cwd, "reader", "Read only.", "tools: [read]");
	const boot = loadBoot();
	const ctx = { cwd, ui: ui(boot.statuses, boot.notices) };
	await boot.commands.get("agent")?.("reader", ctx);
	await boot.commands.get("agent")?.("default", ctx);
	assert.deepEqual(boot.getActive().sort(), [
		"bash",
		"coms_send",
		"read",
		"subagent",
	]);
});
