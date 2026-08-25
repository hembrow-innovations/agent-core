import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import comsExtension from "../../draconic-coms/src/index.ts";
import teamsExtension from "./index.ts";
import { getTask, listTasks, readTeam } from "./store.ts";

type Tool = {
	name: string;
	description: string;
	promptGuidelines?: string[];
	execute: (
		toolCallId: string,
		params: Record<string, unknown>,
		signal?: unknown,
		onUpdate?: unknown,
		ctx?: { cwd: string },
	) => Promise<{
		content: Array<{ type: string; text: string }>;
		details: unknown;
	}>;
};

type Command = {
	name: string;
	handler: (
		args: string,
		ctx: { cwd: string; ui: { notify: (m: string) => void } },
	) => Promise<void>;
};

function collectFlags(factory: (pi: ExtensionAPI) => void): string[] {
	const names: string[] = [];
	factory({
		registerFlag(name: string) {
			names.push(name);
		},
		registerTool() {},
		registerCommand() {},
		on() {},
		getFlag() {
			return undefined;
		},
		sendMessage() {},
	} as unknown as ExtensionAPI);
	return names;
}

function loadExtension(opts?: { flags?: Record<string, string> }) {
	const tools: Tool[] = [];
	const commands: Command[] = [];
	const events: string[] = [];
	const flags = opts?.flags ?? {};
	const statuses: Array<[string, string | undefined]> = [];
	teamsExtension({
		registerFlag() {},
		registerTool(tool: Tool) {
			tools.push(tool);
		},
		registerCommand(name: string, spec: { handler: Command["handler"] }) {
			commands.push({ name, handler: spec.handler });
		},
		on(event: string) {
			events.push(event);
		},
		getFlag(name: string) {
			return flags[name];
		},
	} as unknown as ExtensionAPI);
	return { tools, commands, events, statuses };
}

function tool(tools: Tool[], name: string): Tool {
	const found = tools.find((item) => item.name === name);
	if (!found) throw new Error(`missing tool ${name}`);
	return found;
}

test("factory registers /team and the team plus task tools", () => {
	const { tools, commands, events } = loadExtension();
	assert.deepEqual(tools.map((item) => item.name).sort(), [
		"task_claim",
		"task_complete",
		"task_create",
		"task_get",
		"task_list",
		"team_create",
		"team_shutdown",
		"team_spawn",
		"team_status",
	]);
	assert.equal(commands[0]?.name, "team");
	assert.ok(events.includes("session_start"));
	assert.ok(events.includes("agent_settled"));
	assert.ok(events.includes("session_shutdown"));
	assert.match(
		tool(tools, "task_claim").promptGuidelines?.join(" ") ?? "",
		/task_claim/,
	);
});

test("teams does not re-register coms identity flags", () => {
	const coms = collectFlags(comsExtension);
	const teams = collectFlags(teamsExtension);
	assert.deepEqual(
		teams.filter((name) => coms.includes(name)),
		[],
	);
});

test("team_status reads --project and --cname from argv", async () => {
	const teamsDir = mkdtempSync(join(tmpdir(), "draconic-teams-argv-"));
	const prevDir = process.env.PI_TEAMS_DIR;
	const prevArgv = process.argv;
	process.env.PI_TEAMS_DIR = teamsDir;
	process.argv = [...prevArgv, "--project", "demo", "--cname", "alice"];
	try {
		const { tools } = loadExtension();
		const status = await tool(tools, "team_status").execute(
			"1",
			{},
			undefined,
			undefined,
			{ cwd: "/work" },
		);
		assert.equal(
			status.content[0]?.text,
			"project demo, cname alice. no team file yet.",
		);
	} finally {
		process.argv = prevArgv;
		if (prevDir === undefined) delete process.env.PI_TEAMS_DIR;
		else process.env.PI_TEAMS_DIR = prevDir;
	}
});

test("team_create then team_status persist a roster under PI_TEAMS_DIR", async () => {
	const teamsDir = mkdtempSync(join(tmpdir(), "draconic-teams-ext-"));
	const prev = process.env.PI_TEAMS_DIR;
	process.env.PI_TEAMS_DIR = teamsDir;
	try {
		const { tools } = loadExtension({ flags: { cname: "alice" } });
		const created = await tool(tools, "team_create").execute(
			"1",
			{ name: "demo" },
			undefined,
			undefined,
			{ cwd: "/work/demo" },
		);
		assert.match(created.content[0]?.text ?? "", /demo/);
		const status = await tool(tools, "team_status").execute(
			"2",
			{},
			undefined,
			undefined,
			{ cwd: "/work/demo" },
		);
		const details = status.details as {
			team: { name: string; leadName: string };
		};
		assert.equal(details.team.name, "demo");
		assert.equal(details.team.leadName, "alice");
		assert.equal(readTeam({ teamsDir, name: "demo" }).leadName, "alice");
	} finally {
		if (prev === undefined) delete process.env.PI_TEAMS_DIR;
		else process.env.PI_TEAMS_DIR = prev;
	}
});

test("team_spawn without TMUX returns a readable error and does not start a pane", async () => {
	const teamsDir = mkdtempSync(join(tmpdir(), "draconic-teams-ext-"));
	const prevTeams = process.env.PI_TEAMS_DIR;
	const prevTmux = process.env.TMUX;
	process.env.PI_TEAMS_DIR = teamsDir;
	delete process.env.TMUX;
	try {
		const { tools } = loadExtension({
			flags: { project: "demo", cname: "alice" },
		});
		await tool(tools, "team_create").execute(
			"1",
			{ name: "demo" },
			undefined,
			undefined,
			{ cwd: "/work/demo" },
		);
		const spawned = await tool(tools, "team_spawn").execute(
			"2",
			{ name: "researcher", purpose: "look at AGENTS.md" },
			undefined,
			undefined,
			{ cwd: "/work/demo" },
		);
		assert.match(spawned.content[0]?.text ?? "", /TMUX/);
		assert.equal(readTeam({ teamsDir, name: "demo" }).members.length, 1);
	} finally {
		if (prevTeams === undefined) delete process.env.PI_TEAMS_DIR;
		else process.env.PI_TEAMS_DIR = prevTeams;
		if (prevTmux === undefined) delete process.env.TMUX;
		else process.env.TMUX = prevTmux;
	}
});

test("task tools create, block, claim, complete, and refuse a second claim", async () => {
	const teamsDir = mkdtempSync(join(tmpdir(), "draconic-teams-ext-"));
	const prev = process.env.PI_TEAMS_DIR;
	process.env.PI_TEAMS_DIR = teamsDir;
	try {
		const { tools } = loadExtension({
			flags: { project: "demo", cname: "researcher" },
		});
		await tool(tools, "team_create").execute(
			"1",
			{ name: "demo" },
			undefined,
			undefined,
			{ cwd: "/work/demo" },
		);
		await tool(tools, "task_create").execute(
			"2",
			{ subject: "read", description: "first" },
			undefined,
			undefined,
			{ cwd: "/work" },
		);
		await tool(tools, "task_create").execute(
			"3",
			{ subject: "write", description: "second", blockedBy: ["1"] },
			undefined,
			undefined,
			{ cwd: "/work" },
		);
		const claimed = await tool(tools, "task_claim").execute(
			"4",
			{ id: "1" },
			undefined,
			undefined,
			{ cwd: "/work" },
		);
		assert.equal(
			(claimed.details as { task: { owner: string } }).task.owner,
			"researcher",
		);
		const second = await tool(tools, "task_claim").execute(
			"5",
			{ id: "1" },
			undefined,
			undefined,
			{ cwd: "/work" },
		);
		assert.match(second.content[0]?.text ?? "", /not pending/);
		assert.equal(
			(second.details as { error?: string }).error?.includes("not pending"),
			true,
		);
		await tool(tools, "task_complete").execute(
			"6",
			{ id: "1" },
			undefined,
			undefined,
			{ cwd: "/work" },
		);
		const next = await tool(tools, "task_claim").execute(
			"7",
			{ id: "2" },
			undefined,
			undefined,
			{ cwd: "/work" },
		);
		assert.equal((next.details as { task: { id: string } }).task.id, "2");
		assert.equal(
			getTask({ teamsDir, team: "demo", id: "1" }).status,
			"completed",
		);
		assert.equal(listTasks({ teamsDir, team: "demo" }).length, 2);
	} finally {
		if (prev === undefined) delete process.env.PI_TEAMS_DIR;
		else process.env.PI_TEAMS_DIR = prev;
	}
});

test("team_status binds --project without team_create in this process", async () => {
	const teamsDir = mkdtempSync(join(tmpdir(), "draconic-teams-ext-"));
	const prev = process.env.PI_TEAMS_DIR;
	process.env.PI_TEAMS_DIR = teamsDir;
	try {
		const lead = loadExtension({ flags: { cname: "team-lead" } });
		await tool(lead.tools, "team_create").execute(
			"1",
			{ name: "demo" },
			undefined,
			undefined,
			{ cwd: "/work" },
		);
		await tool(lead.tools, "task_create").execute(
			"2",
			{ subject: "read", description: "first" },
			undefined,
			undefined,
			{ cwd: "/work" },
		);
		const teammate = loadExtension({
			flags: { project: "demo", cname: "researcher" },
		});
		const status = await tool(teammate.tools, "team_status").execute(
			"3",
			{},
			undefined,
			undefined,
			{ cwd: "/work" },
		);
		assert.equal(
			(status.details as { team?: { name: string } }).team?.name,
			"demo",
		);
		const claimed = await tool(teammate.tools, "task_claim").execute(
			"4",
			{ id: "1" },
			undefined,
			undefined,
			{ cwd: "/work" },
		);
		assert.equal((claimed.details as { error?: string }).error, undefined);
		assert.equal(
			(claimed.details as { task: { owner: string } }).task.owner,
			"researcher",
		);
	} finally {
		if (prev === undefined) delete process.env.PI_TEAMS_DIR;
		else process.env.PI_TEAMS_DIR = prev;
	}
});

test("team_status with --project and no team file reports the flags", async () => {
	const teamsDir = mkdtempSync(join(tmpdir(), "draconic-teams-ext-"));
	const prev = process.env.PI_TEAMS_DIR;
	process.env.PI_TEAMS_DIR = teamsDir;
	try {
		const { tools } = loadExtension({
			flags: { project: "demo", cname: "alice" },
		});
		const status = await tool(tools, "team_status").execute(
			"1",
			{},
			undefined,
			undefined,
			{ cwd: "/work" },
		);
		assert.equal(
			status.content[0]?.text,
			"project demo, cname alice. no team file yet.",
		);
	} finally {
		if (prev === undefined) delete process.env.PI_TEAMS_DIR;
		else process.env.PI_TEAMS_DIR = prev;
	}
});

test("team_status without flags stays leadless", async () => {
	const { tools } = loadExtension();
	const status = await tool(tools, "team_status").execute(
		"1",
		{},
		undefined,
		undefined,
		{ cwd: "/work" },
	);
	assert.equal(status.content[0]?.text, "no team. /team create <name> first.");
});

test("coms default project without a team file reports the flags", async () => {
	const teamsDir = mkdtempSync(join(tmpdir(), "draconic-teams-ext-"));
	const prev = process.env.PI_TEAMS_DIR;
	process.env.PI_TEAMS_DIR = teamsDir;
	try {
		const { tools } = loadExtension({ flags: { project: "default" } });
		const status = await tool(tools, "team_status").execute(
			"1",
			{},
			undefined,
			undefined,
			{ cwd: "/work" },
		);
		assert.equal(
			status.content[0]?.text,
			"project default, cname team-lead. no team file yet.",
		);
	} finally {
		if (prev === undefined) delete process.env.PI_TEAMS_DIR;
		else process.env.PI_TEAMS_DIR = prev;
	}
});

test("team_status follows live --project after factory load", async () => {
	const teamsDir = mkdtempSync(join(tmpdir(), "draconic-teams-ext-"));
	const prev = process.env.PI_TEAMS_DIR;
	process.env.PI_TEAMS_DIR = teamsDir;
	try {
		const lead = loadExtension({ flags: { cname: "team-lead" } });
		await tool(lead.tools, "team_create").execute(
			"1",
			{ name: "default" },
			undefined,
			undefined,
			{ cwd: "/work" },
		);
		await tool(lead.tools, "team_create").execute(
			"2",
			{ name: "demo" },
			undefined,
			undefined,
			{ cwd: "/work" },
		);
		const flags: Record<string, string> = {
			project: "default",
			cname: "researcher",
		};
		const late = loadExtension({ flags });
		flags.project = "demo";
		const status = await tool(late.tools, "team_status").execute(
			"3",
			{},
			undefined,
			undefined,
			{ cwd: "/work" },
		);
		assert.equal(
			(status.details as { team?: { name: string } }).team?.name,
			"demo",
		);
	} finally {
		if (prev === undefined) delete process.env.PI_TEAMS_DIR;
		else process.env.PI_TEAMS_DIR = prev;
	}
});
