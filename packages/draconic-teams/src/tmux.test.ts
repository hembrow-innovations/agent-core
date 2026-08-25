import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
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

test("buildTmuxSpawnArgs defaults to a detached pane and quotes the cd", () => {
	const built = buildTmuxSpawnArgs(request);
	assert.deepEqual(built.tmux.slice(0, 5), [
		"tmux",
		"split-window",
		"-dP",
		"-F",
		"#{pane_id}",
	]);
	assert.match(built.command, /cd \/work\/demo/);
	assert.match(built.command, /pi --cname researcher/);
	assert.match(built.command, /--project demo/);
	assert.ok(!built.tmux.includes("send-keys"));
	assert.ok(!built.command.includes("--mode rpc"));
	assert.ok(!built.command.includes("send-keys"));
});

test("buildTmuxSpawnArgs opens to the right when member count is even", () => {
	const built = buildTmuxSpawnArgs({ ...request, memberCount: 2 });
	assert.deepEqual(built.tmux.slice(0, 6), [
		"tmux",
		"split-window",
		"-h",
		"-dP",
		"-F",
		"#{pane_id}",
	]);
	assert.ok(!built.tmux.includes("-t"));
});

test("buildTmuxSpawnArgs opens a third column when member count is even and double digit", () => {
	const built = buildTmuxSpawnArgs({ ...request, memberCount: 10 });
	assert.deepEqual(built.tmux, [
		"tmux",
		"split-window",
		"-h",
		"-dP",
		"-F",
		"#{pane_id}",
		"-t",
		"{right}",
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

test("applySpawn starts a missing member and records tmux argv", async () => {
	const teamsDir = mkdtempSync(join(tmpdir(), "draconic-teams-tmux-"));
	createTeam({
		teamsDir,
		name: "demo",
		leadName: "team-lead",
		cwd: "/work/demo",
	});
	const { calls, runner } = recordedRunner((argv) => {
		if (argv[1] === "split-window") return "%12";
		throw new Error(`unexpected ${argv.join(" ")}`);
	});
	const result = await applySpawn({
		teamsDir,
		request,
		env: { TMUX: "/tmp/tmux-1000/default,1,0" },
		runner,
	});
	assert.equal(result.action, "start");
	assert.equal(result.member.kind, "teammate");
	if (result.member.kind !== "teammate") throw new Error("expected teammate");
	assert.equal(result.member.paneId, "%12");
	assert.equal(result.member.status, "spawned");
	assert.equal(calls.length, 1);
	assert.equal(calls[0]?.[0], "tmux");
	assert.equal(calls[0]?.[1], "split-window");
	assert.ok(calls[0]?.includes("-h"));
	assert.ok(!calls[0]?.includes("-t"));
	assert.ok(calls[0]?.includes("#{pane_id}"));
	assert.ok(!calls[0]?.includes("send-keys"));
	assert.ok(!calls.flat().includes("--mode"));
});

test("applySpawn stacks the next odd member under the lead", async () => {
	const teamsDir = mkdtempSync(join(tmpdir(), "draconic-teams-tmux-"));
	createTeam({
		teamsDir,
		name: "demo",
		leadName: "team-lead",
		cwd: "/work/demo",
	});
	const { calls, runner } = recordedRunner((argv) => {
		if (argv[1] === "split-window") return `%${calls.length + 1}`;
		throw new Error(`unexpected ${argv.join(" ")}`);
	});
	await applySpawn({
		teamsDir,
		request,
		env: { TMUX: "/tmp/tmux-1000/default,1,0" },
		runner,
	});
	await applySpawn({
		teamsDir,
		request: { ...request, name: "reviewer" },
		env: { TMUX: "/tmp/tmux-1000/default,1,0" },
		runner,
	});
	assert.ok(calls[0]?.includes("-h"));
	assert.ok(!calls[1]?.includes("-h"));
});

test("applySpawn opens a third column on the tenth member", async () => {
	const teamsDir = mkdtempSync(join(tmpdir(), "draconic-teams-tmux-"));
	createTeam({
		teamsDir,
		name: "demo",
		leadName: "team-lead",
		cwd: "/work/demo",
	});
	for (let i = 1; i <= 8; i++) {
		upsertMember({
			teamsDir,
			team: "demo",
			member: {
				kind: "teammate",
				name: parseMemberName(`seed${i}`, { role: "teammate" }),
				purpose: "seed",
				paneId: `%${i}`,
				status: "spawned",
			},
		});
	}
	const { calls, runner } = recordedRunner((argv) => {
		if (argv[1] === "split-window") return "%10";
		throw new Error(`unexpected ${argv.join(" ")}`);
	});
	await applySpawn({
		teamsDir,
		request,
		env: { TMUX: "/tmp/tmux-1000/default,1,0" },
		runner,
	});
	assert.deepEqual(calls[0]?.slice(0, 8), [
		"tmux",
		"split-window",
		"-h",
		"-dP",
		"-F",
		"#{pane_id}",
		"-t",
		"{right}",
	]);
});

test("applySpawn adopts a live matching pane on the second call", async () => {
	const teamsDir = mkdtempSync(join(tmpdir(), "draconic-teams-tmux-"));
	createTeam({
		teamsDir,
		name: "demo",
		leadName: "team-lead",
		cwd: "/work/demo",
	});
	let panes = 0;
	const { calls, runner } = recordedRunner((argv) => {
		if (argv[1] === "split-window") {
			panes += 1;
			return `%${panes}`;
		}
		if (argv[1] === "display-message") return argv[4] ?? "%1";
		throw new Error(`unexpected ${argv.join(" ")}`);
	});
	const first = await applySpawn({
		teamsDir,
		request,
		env: { TMUX: "/tmp/tmux-1000/default,1,0" },
		runner,
	});
	const second = await applySpawn({
		teamsDir,
		request,
		env: { TMUX: "/tmp/tmux-1000/default,1,0" },
		runner,
	});
	assert.equal(first.action, "start");
	assert.equal(second.action, "adopt");
	assert.equal(second.member.kind, "teammate");
	if (second.member.kind !== "teammate") throw new Error("expected teammate");
	assert.equal(second.member.paneId, "%1");
	assert.equal(panes, 1);
	assert.equal(calls.filter((argv) => argv[1] === "split-window").length, 1);
});

test("applySpawn adopts a live window-mode pane", async () => {
	const teamsDir = mkdtempSync(join(tmpdir(), "draconic-teams-tmux-"));
	createTeam({
		teamsDir,
		name: "demo",
		leadName: "team-lead",
		cwd: "/work/demo",
	});
	const { runner } = recordedRunner((argv) => {
		if (argv[1] === "new-window") return "%3";
		if (argv[1] === "display-message") return argv[4] ?? "%3";
		throw new Error(`unexpected ${argv.join(" ")}`);
	});
	const first = await applySpawn({
		teamsDir,
		request: { ...request, useWindows: true },
		env: { TMUX: "/tmp/tmux-1000/default,1,0" },
		runner,
	});
	const second = await applySpawn({
		teamsDir,
		request: { ...request, useWindows: true },
		env: { TMUX: "/tmp/tmux-1000/default,1,0" },
		runner,
	});
	assert.equal(first.action, "start");
	assert.equal(second.action, "adopt");
	if (second.member.kind !== "teammate") throw new Error("expected teammate");
	assert.equal(second.member.paneId, "%3");
});

test("applySpawn replaces a dead pane id", async () => {
	const teamsDir = mkdtempSync(join(tmpdir(), "draconic-teams-tmux-"));
	createTeam({
		teamsDir,
		name: "demo",
		leadName: "team-lead",
		cwd: "/work/demo",
	});
	const { runner } = recordedRunner((argv) => {
		if (argv[1] === "split-window") return "%9";
		if (argv[1] === "display-message") throw new Error("can't find pane");
		throw new Error(`unexpected ${argv.join(" ")}`);
	});
	const first = await applySpawn({
		teamsDir,
		request,
		env: { TMUX: "/tmp/tmux-1000/default,1,0" },
		runner,
	});
	const second = await applySpawn({
		teamsDir,
		request,
		env: { TMUX: "/tmp/tmux-1000/default,1,0" },
		runner,
	});
	assert.equal(first.action, "start");
	assert.equal(second.action, "replace");
	if (second.member.kind !== "teammate") throw new Error("expected teammate");
	assert.equal(second.member.paneId, "%9");
});
