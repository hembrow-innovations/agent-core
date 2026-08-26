import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { createTeam, parseMemberName, upsertMember } from "./store.ts";
import { applySpawn, buildPiArgv, buildTmuxSpawnArgs } from "./tmux.ts";

const request = {
	team: "demo",
	name: "researcher",
	purpose: "look at AGENTS.md",
	cwd: "/work/demo",
};

test("buildPiArgv includes coms flags, --agent, and never --mode rpc", () => {
	const argv = buildPiArgv(request);
	assert.deepEqual(argv, [
		"pi",
		"--cname",
		"researcher",
		"--purpose",
		"look at AGENTS.md",
		"--project",
		"demo",
		"--name",
		"researcher",
		"--agent",
		"researcher",
	]);
	assert.ok(!argv.includes("--mode"));
	assert.ok(!argv.includes("rpc"));
	assert.ok(!argv.includes("send-keys"));
});

test("buildPiArgv appends an optional model", () => {
	const argv = buildPiArgv({ ...request, model: "grok-4.6" });
	assert.deepEqual(argv.slice(-2), ["--model", "grok-4.6"]);
	assert.ok(!argv.includes("--mode"));
});

test("buildPiArgv uses a distinct --agent when spawn supplies one", () => {
	const argv = buildPiArgv({ ...request, name: "builder-1", agent: "builder" });
	assert.deepEqual(argv, [
		"pi",
		"--cname",
		"builder-1",
		"--purpose",
		"look at AGENTS.md",
		"--project",
		"demo",
		"--name",
		"builder-1",
		"--agent",
		"builder",
	]);
	const omitted = buildPiArgv({ ...request, name: "builder-1" });
	assert.equal(omitted[omitted.indexOf("--agent") + 1], "builder-1");
});

test("buildTmuxSpawnArgs defaults to a detached pane and quotes the cd", () => {
	const built = buildTmuxSpawnArgs(request);
	assert.deepEqual(built.tmux, [
		"tmux",
		"split-window",
		"-dP",
		"-F",
		"#{pane_id}",
	]);
	assert.match(built.command, /cd \/work\/demo/);
	assert.match(built.command, /pi --cname researcher/);
	assert.match(built.command, /--project demo/);
	assert.ok(!built.tmux.includes("-h"));
	assert.ok(!built.tmux.includes("{right}"));
	assert.ok(!built.tmux.includes("send-keys"));
	assert.ok(!built.command.includes("--mode rpc"));
	assert.ok(!built.command.includes("send-keys"));
});

test("buildTmuxSpawnArgs stays a plain split when memberCount is even or double digit", () => {
	assert.deepEqual(buildTmuxSpawnArgs({ ...request, memberCount: 2 }).tmux, [
		"tmux",
		"split-window",
		"-dP",
		"-F",
		"#{pane_id}",
	]);
	assert.deepEqual(buildTmuxSpawnArgs({ ...request, memberCount: 10 }).tmux, [
		"tmux",
		"split-window",
		"-dP",
		"-F",
		"#{pane_id}",
	]);
});

test("buildTmuxSpawnArgs can open a named window instead", () => {
	const built = buildTmuxSpawnArgs({ ...request, useWindows: true });
	assert.deepEqual(built.tmux.slice(0, 7), [
		"tmux",
		"new-window",
		"-dP",
		"-F",
		"#{pane_id}",
		"-n",
		"@pi-team | researcher",
	]);
	assert.match(built.command, /pi --cname researcher/);
	assert.match(built.command, /--project demo/);
	assert.ok(!built.tmux.includes("send-keys"));
});

function recordedRunner(script: (argv: string[]) => string) {
	const calls: string[][] = [];
	return {
		calls,
		runner: {
			run(argv: string[]) {
				calls.push(argv);
				return Promise.resolve(script(argv));
			},
		},
	};
}

function fakeTmux() {
	const panes = new Map<string, { marker?: string }>();
	const calls: string[][] = [];
	let next = 1;
	return {
		calls,
		panes,
		seed(paneId: string, marker?: string) {
			panes.set(paneId, { marker });
		},
		runner: {
			run(argv: string[]) {
				calls.push(argv);
				const cmd = argv[1];
				if (cmd === "split-window" || cmd === "new-window") {
					const id = `%${next}`;
					next += 1;
					panes.set(id, {});
					return Promise.resolve(id);
				}
				if (cmd === "set-option") {
					const targetAt = argv.indexOf("-t");
					const paneId = argv[targetAt + 1];
					const key = argv[targetAt + 2];
					const value = argv[targetAt + 3];
					const pane = paneId ? panes.get(paneId) : undefined;
					if (pane && key === "@pi-member") pane.marker = value;
					return Promise.resolve("");
				}
				if (cmd === "select-layout") return Promise.resolve("");
				if (cmd === "display-message") {
					const targetAt = argv.indexOf("-t");
					const paneId = argv[targetAt + 1];
					const fmt = argv[argv.length - 1] ?? "";
					const pane = paneId ? panes.get(paneId) : undefined;
					if (!pane || !paneId) throw new Error("can't find pane");
					if (fmt.includes("@pi-member")) {
						return Promise.resolve(pane.marker ?? "");
					}
					return Promise.resolve(paneId);
				}
				throw new Error(`unexpected ${argv.join(" ")}`);
			},
		},
	};
}

function seedTeamDir() {
	const teamsDir = mkdtempSync(join(tmpdir(), "draconic-teams-tmux-"));
	createTeam({
		teamsDir,
		name: "demo",
		leadName: "team-lead",
		cwd: "/work/demo",
	});
	return teamsDir;
}

test("applySpawn throws when TMUX is empty", async () => {
	const teamsDir = mkdtempSync(join(tmpdir(), "draconic-teams-tmux-"));
	createTeam({
		teamsDir,
		name: "demo",
		leadName: "team-lead",
		cwd: "/work/demo",
	});
	await assert.rejects(
		() =>
			applySpawn({
				teamsDir,
				request,
				env: {},
				runner: {
					run: async () => "%1",
				},
			}),
		/TMUX/,
	);
});

test("applySpawn starts a missing member, marks it, and tiles the window", async () => {
	const teamsDir = seedTeamDir();
	const tmux = fakeTmux();
	const result = await applySpawn({
		teamsDir,
		request,
		env: { TMUX: "/tmp/tmux-1000/default,1,0" },
		runner: tmux.runner,
	});
	assert.equal(result.action, "start");
	assert.equal(result.member.kind, "teammate");
	if (result.member.kind !== "teammate") throw new Error("expected teammate");
	assert.equal(result.member.paneId, "%1");
	assert.equal(result.member.status, "spawned");
	assert.deepEqual(
		tmux.calls.filter((argv) => argv[1] === "split-window")[0]?.slice(0, 5),
		["tmux", "split-window", "-dP", "-F", "#{pane_id}"],
	);
	assert.deepEqual(
		tmux.calls.find((argv) => argv[1] === "set-option"),
		["tmux", "set-option", "-p", "-t", "%1", "@pi-member", "demo/researcher"],
	);
	assert.deepEqual(
		tmux.calls.find((argv) => argv[1] === "select-layout"),
		["tmux", "select-layout", "tiled"],
	);
	assert.ok(!tmux.calls.flat().includes("-h"));
	assert.ok(!tmux.calls.flat().includes("{right}"));
	assert.ok(!tmux.calls.flat().includes("send-keys"));
});

test("applySpawn does not tile a new-window spawn", async () => {
	const teamsDir = seedTeamDir();
	const tmux = fakeTmux();
	const result = await applySpawn({
		teamsDir,
		request: { ...request, useWindows: true },
		env: { TMUX: "/tmp/tmux-1000/default,1,0" },
		runner: tmux.runner,
	});
	assert.equal(result.action, "start");
	assert.equal(tmux.calls.filter((argv) => argv[1] === "new-window").length, 1);
	assert.equal(
		tmux.calls.filter((argv) => argv[1] === "select-layout").length,
		0,
	);
	assert.deepEqual(
		tmux.calls.find((argv) => argv[1] === "set-option"),
		["tmux", "set-option", "-p", "-t", "%1", "@pi-member", "demo/researcher"],
	);
});

test("applySpawn adopts when the pane marker matches and does not retile", async () => {
	const teamsDir = seedTeamDir();
	const tmux = fakeTmux();
	const first = await applySpawn({
		teamsDir,
		request,
		env: { TMUX: "/tmp/tmux-1000/default,1,0" },
		runner: tmux.runner,
	});
	const tilesAfterStart = tmux.calls.filter(
		(argv) => argv[1] === "select-layout",
	).length;
	const second = await applySpawn({
		teamsDir,
		request,
		env: { TMUX: "/tmp/tmux-1000/default,1,0" },
		runner: tmux.runner,
	});
	assert.equal(first.action, "start");
	assert.equal(second.action, "adopt");
	if (second.member.kind !== "teammate") throw new Error("expected teammate");
	assert.equal(second.member.paneId, "%1");
	assert.equal(
		tmux.calls.filter((argv) => argv[1] === "split-window").length,
		1,
	);
	assert.equal(
		tmux.calls.filter((argv) => argv[1] === "select-layout").length,
		tilesAfterStart,
	);
});

test("applySpawn replaces when the pane marker does not match", async () => {
	const teamsDir = seedTeamDir();
	upsertMember({
		teamsDir,
		team: "demo",
		member: {
			kind: "teammate",
			name: parseMemberName("researcher", { role: "teammate" }),
			purpose: "look at AGENTS.md",
			paneId: "%7",
			status: "spawned",
		},
	});
	const tmux = fakeTmux();
	tmux.seed("%7", "demo/other");
	const result = await applySpawn({
		teamsDir,
		request,
		env: { TMUX: "/tmp/tmux-1000/default,1,0" },
		runner: tmux.runner,
	});
	assert.equal(result.action, "replace");
	if (result.member.kind !== "teammate") throw new Error("expected teammate");
	assert.equal(result.member.paneId, "%1");
	assert.deepEqual(
		tmux.calls.find((argv) => argv[1] === "select-layout"),
		["tmux", "select-layout", "tiled"],
	);
});

test("applySpawn replaces a shutdown row even when the pane id is live", async () => {
	const teamsDir = seedTeamDir();
	upsertMember({
		teamsDir,
		team: "demo",
		member: {
			kind: "teammate",
			name: parseMemberName("researcher", { role: "teammate" }),
			purpose: "look at AGENTS.md",
			paneId: "%7",
			status: "shutdown",
		},
	});
	const tmux = fakeTmux();
	tmux.seed("%7", "demo/researcher");
	const result = await applySpawn({
		teamsDir,
		request,
		env: { TMUX: "/tmp/tmux-1000/default,1,0" },
		runner: tmux.runner,
	});
	assert.equal(result.action, "replace");
	if (result.member.kind !== "teammate") throw new Error("expected teammate");
	assert.equal(result.member.paneId, "%1");
	assert.equal(
		tmux.calls.filter((argv) => argv[1] === "split-window").length,
		1,
	);
});

test("applySpawn replaces a dead pane id and tiles the replacement", async () => {
	const teamsDir = seedTeamDir();
	const tmux = fakeTmux();
	const first = await applySpawn({
		teamsDir,
		request,
		env: { TMUX: "/tmp/tmux-1000/default,1,0" },
		runner: tmux.runner,
	});
	tmux.panes.delete("%1");
	const second = await applySpawn({
		teamsDir,
		request,
		env: { TMUX: "/tmp/tmux-1000/default,1,0" },
		runner: tmux.runner,
	});
	assert.equal(first.action, "start");
	assert.equal(second.action, "replace");
	if (second.member.kind !== "teammate") throw new Error("expected teammate");
	assert.equal(second.member.paneId, "%2");
	assert.equal(
		tmux.calls.filter((argv) => argv[1] === "select-layout").length,
		2,
	);
});

test("applySpawn writes the member record before starting the pane", async () => {
	const teamsDir = mkdtempSync(join(tmpdir(), "draconic-teams-tmux-"));
	createTeam({
		teamsDir,
		name: "demo",
		leadName: "team-lead",
		cwd: "/work/demo",
	});
	await assert.rejects(
		() =>
			applySpawn({
				teamsDir,
				request,
				env: { TMUX: "/tmp/tmux-1000/default,1,0" },
				runner: {
					run() {
						return Promise.reject(new Error("tmux down"));
					},
				},
			}),
		/tmux down/,
	);
	const identityPath = join(
		teamsDir,
		"demo",
		"roster",
		"researcher",
		"identity.md",
	);
	assert.equal(existsSync(identityPath), true);
	assert.match(readFileSync(identityPath, "utf8"), /look at AGENTS.md/);
	assert.equal(
		readFileSync(
			join(teamsDir, "demo", "roster", "researcher", "log.tsv"),
			"utf8",
		),
		"ts\tkind\ttask\tsummary\n",
	);
});

test("applySpawn persists agent on identity and reuses it when omitted", async () => {
	const teamsDir = mkdtempSync(join(tmpdir(), "draconic-teams-tmux-"));
	createTeam({
		teamsDir,
		name: "demo",
		leadName: "team-lead",
		cwd: "/work/demo",
	});
	const { calls, runner } = recordedRunner((argv) => {
		if (argv[1] === "split-window") return "%4";
		if (argv[1] === "display-message") throw new Error("can't find pane");
		if (argv[1] === "set-option" || argv[1] === "select-layout") return "";
		throw new Error(`unexpected ${argv.join(" ")}`);
	});
	await applySpawn({
		teamsDir,
		request: { ...request, name: "builder-1", agent: "builder" },
		env: { TMUX: "/tmp/tmux-1000/default,1,0" },
		runner,
	});
	const identityPath = join(
		teamsDir,
		"demo",
		"roster",
		"builder-1",
		"identity.md",
	);
	assert.match(readFileSync(identityPath, "utf8"), /- \*\*agent\*\*: builder/);
	const reused = await applySpawn({
		teamsDir,
		request: { ...request, name: "builder-1" },
		env: { TMUX: "/tmp/tmux-1000/default,1,0" },
		runner,
	});
	assert.equal(reused.action, "replace");
	assert.match(readFileSync(identityPath, "utf8"), /- \*\*agent\*\*: builder/);
	const command = calls
		.filter((argv) => argv[1] === "split-window")
		.at(-1)
		?.at(-1);
	assert.match(String(command), /--agent builder(?:\s|$)/);
	assert.match(String(command), /--cname builder-1/);
});
