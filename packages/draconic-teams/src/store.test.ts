import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import {
	mkdirSync,
	mkdtempSync,
	readFileSync,
	readdirSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
	addBlockedBy,
	claimTask,
	completeTask,
	createTask,
	createTeam,
	getTask,
	listTasks,
	parseMemberName,
	parseTeam,
	parseTeamName,
	readTeam,
	setMemberStatus,
	writeTeam,
} from "./store.ts";

function tempDir(): string {
	return mkdtempSync(join(tmpdir(), "draconic-teams-"));
}

test("parseTeamName accepts a short token and rejects illegal names", () => {
	assert.equal(parseTeamName("demo"), "demo");
	assert.equal(parseTeamName("try-teams_1"), "try-teams_1");
	assert.throws(() => parseTeamName(""), /invalid team name/);
	assert.throws(() => parseTeamName("has space"), /invalid team name/);
	assert.throws(() => parseTeamName("bad/name"), /invalid team name/);
	assert.throws(() => parseTeamName("x".repeat(65)), /invalid team name/);
});

test("parseMemberName reserves team-lead for the lead", () => {
	assert.equal(parseMemberName("team-lead", { role: "lead" }), "team-lead");
	assert.equal(
		parseMemberName("researcher", { role: "teammate" }),
		"researcher",
	);
	assert.throws(
		() => parseMemberName("team-lead", { role: "teammate" }),
		/reserved/,
	);
	assert.throws(() => parseMemberName("has space", { role: "lead" }), /invalid/);
});

test("writeTeam then readTeam round-trips and a second write replaces the file", () => {
	const teamsDir = tempDir();
	const team = createTeam({
		teamsDir,
		name: "demo",
		leadName: "team-lead",
		cwd: "/work/demo",
	});
	assert.equal(team.name, "demo");
	assert.equal(team.leadName, "team-lead");
	assert.equal(team.cwd, "/work/demo");
	assert.equal(team.members.length, 1);
	assert.equal(team.members[0]?.kind, "lead");
	assert.equal(team.members[0]?.name, "team-lead");

	const loaded = readTeam({ teamsDir, name: "demo" });
	assert.deepEqual(loaded, team);

	const again = createTeam({
		teamsDir,
		name: "demo",
		leadName: "alice",
		cwd: "/work/other",
	});
	assert.equal(again.leadName, "alice");
	assert.equal(again.cwd, "/work/other");
	assert.deepEqual(readdirSync(join(teamsDir, "demo")), ["config.json"]);
	assert.deepEqual(readTeam({ teamsDir, name: "demo" }), again);
	const raw = readFileSync(join(teamsDir, "demo", "config.json"), "utf8");
	assert.match(raw, /"leadName": "alice"/);
	assert.doesNotMatch(raw, /\/work\/demo/);
});

test("parseTeam rejects a teammate named team-lead and unknown status", () => {
	assert.throws(
		() =>
			parseTeam({
				name: "demo",
				leadName: "team-lead",
				cwd: "/work",
				createdAt: "2026-08-24T00:00:00.000Z",
				members: [
					{ kind: "lead", name: "team-lead" },
					{
						kind: "teammate",
						name: "team-lead",
						purpose: "research",
						paneId: "%1",
						status: "spawned",
					},
				],
			}),
		/reserved/,
	);
	assert.throws(
		() =>
			parseTeam({
				name: "demo",
				leadName: "team-lead",
				cwd: "/work",
				createdAt: "2026-08-24T00:00:00.000Z",
				members: [
					{
						kind: "teammate",
						name: "researcher",
						purpose: "research",
						paneId: "%1",
						status: "running",
					},
				],
			}),
		/invalid member status/,
	);
});

test("writeTeam persists a teammate member through parse", () => {
	const teamsDir = tempDir();
	const created = createTeam({
		teamsDir,
		name: "demo",
		leadName: "team-lead",
		cwd: "/work",
	});
	writeTeam({
		teamsDir,
		team: {
			...created,
			members: [
				...created.members,
				{
					kind: "teammate",
					name: parseMemberName("researcher", { role: "teammate" }),
					purpose: "look at AGENTS.md",
					paneId: "%12",
					status: "spawned",
				},
			],
		},
	});
	const loaded = readTeam({ teamsDir, name: "demo" });
	const teammate = loaded.members.find((member) => member.kind === "teammate");
	assert.deepEqual(teammate, {
		kind: "teammate",
		name: "researcher",
		purpose: "look at AGENTS.md",
		paneId: "%12",
		status: "spawned",
	});
});

test("setMemberStatus writes idle and working, and leaves shutdown alone", () => {
	const teamsDir = tempDir();
	const created = createTeam({
		teamsDir,
		name: "demo",
		leadName: "team-lead",
		cwd: "/work",
	});
	writeTeam({
		teamsDir,
		team: {
			...created,
			members: [
				...created.members,
				{
					kind: "teammate",
					name: parseMemberName("researcher", { role: "teammate" }),
					purpose: "look at AGENTS.md",
					paneId: "%12",
					status: "spawned",
				},
			],
		},
	});

	setMemberStatus({
		teamsDir,
		team: "demo",
		name: "researcher",
		status: "working",
	});
	assert.equal(
		readTeam({ teamsDir, name: "demo" }).members.find(
			(member) => member.kind === "teammate",
		)?.status,
		"working",
	);

	setMemberStatus({
		teamsDir,
		team: "demo",
		name: "researcher",
		status: "idle",
	});
	assert.equal(
		readTeam({ teamsDir, name: "demo" }).members.find(
			(member) => member.kind === "teammate",
		)?.status,
		"idle",
	);

	setMemberStatus({
		teamsDir,
		team: "demo",
		name: "researcher",
		status: "shutdown",
	});
	setMemberStatus({
		teamsDir,
		team: "demo",
		name: "researcher",
		status: "working",
	});
	assert.equal(
		readTeam({ teamsDir, name: "demo" }).members.find(
			(member) => member.kind === "teammate",
		)?.status,
		"shutdown",
	);
});

function seedTeam(teamsDir: string) {
	return createTeam({
		teamsDir,
		name: "demo",
		leadName: "team-lead",
		cwd: "/work",
	});
}

test("createTask assigns decimal ids starting at 1 and get/list round-trip", () => {
	const teamsDir = tempDir();
	seedTeam(teamsDir);
	const first = createTask({
		teamsDir,
		team: "demo",
		subject: "read AGENTS.md",
		description: "summarize the pack",
	});
	const second = createTask({
		teamsDir,
		team: "demo",
		subject: "write note",
		description: "after the read",
	});
	assert.equal(first.id, "1");
	assert.equal(first.status, "pending");
	assert.equal(first.owner, null);
	assert.deepEqual(first.blockedBy, []);
	assert.equal(second.id, "2");
	assert.deepEqual(
		listTasks({ teamsDir, team: "demo" }).map((task) => task.id),
		["1", "2"],
	);
	assert.deepEqual(getTask({ teamsDir, team: "demo", id: "1" }), first);
});

test("claim is compare-and-set: first owner wins, second claim throws", () => {
	const teamsDir = tempDir();
	seedTeam(teamsDir);
	createTask({
		teamsDir,
		team: "demo",
		subject: "read AGENTS.md",
		description: "summarize",
	});
	const claimed = claimTask({
		teamsDir,
		team: "demo",
		id: "1",
		owner: "researcher",
	});
	assert.equal(claimed.status, "in_progress");
	assert.equal(claimed.owner, "researcher");
	assert.throws(
		() =>
			claimTask({
				teamsDir,
				team: "demo",
				id: "1",
				owner: "coder",
			}),
		/not pending/,
	);
	assert.equal(getTask({ teamsDir, team: "demo", id: "1" }).owner, "researcher");
});

test("the reserved lead name can claim a pending task", () => {
	const teamsDir = tempDir();
	seedTeam(teamsDir);
	createTask({
		teamsDir,
		team: "demo",
		subject: "read AGENTS.md",
		description: "summarize",
	});
	const claimed = claimTask({
		teamsDir,
		team: "demo",
		id: "1",
		owner: "team-lead",
	});
	assert.equal(claimed.owner, "team-lead");
	assert.equal(claimed.status, "in_progress");
});

test("complete task 1 that blocks 2, then 2 can be claimed", () => {
	const teamsDir = tempDir();
	seedTeam(teamsDir);
	createTask({
		teamsDir,
		team: "demo",
		subject: "blocker",
		description: "first",
	});
	createTask({
		teamsDir,
		team: "demo",
		subject: "dependent",
		description: "second",
	});
	addBlockedBy({
		teamsDir,
		team: "demo",
		id: "2",
		blocker: "1",
	});
	assert.throws(
		() =>
			claimTask({
				teamsDir,
				team: "demo",
				id: "2",
				owner: "researcher",
			}),
		/blocked/,
	);
	claimTask({
		teamsDir,
		team: "demo",
		id: "1",
		owner: "researcher",
	});
	completeTask({ teamsDir, team: "demo", id: "1" });
	assert.deepEqual(getTask({ teamsDir, team: "demo", id: "2" }).blockedBy, []);
	const claimed = claimTask({
		teamsDir,
		team: "demo",
		id: "2",
		owner: "researcher",
	});
	assert.equal(claimed.status, "in_progress");
});

test("a leftover lock file does not brick a later claim", () => {
	const teamsDir = tempDir();
	seedTeam(teamsDir);
	createTask({
		teamsDir,
		team: "demo",
		subject: "read AGENTS.md",
		description: "summarize",
	});
	const lockPath = join(teamsDir, "demo", "tasks", "1.json.lock");
	writeFileSync(lockPath, "");
	const claimed = claimTask({
		teamsDir,
		team: "demo",
		id: "1",
		owner: "researcher",
	});
	assert.equal(claimed.status, "in_progress");
	assert.equal(claimed.owner, "researcher");
});

test("a leftover board lock with a dead pid does not brick a later claim", () => {
	const teamsDir = tempDir();
	seedTeam(teamsDir);
	createTask({
		teamsDir,
		team: "demo",
		subject: "read AGENTS.md",
		description: "summarize",
	});
	writeFileSync(join(teamsDir, "demo", "tasks", ".lock"), "999999\n");
	const claimed = claimTask({
		teamsDir,
		team: "demo",
		id: "1",
		owner: "researcher",
	});
	assert.equal(claimed.status, "in_progress");
});

test("two concurrent createTask calls keep distinct ids and both writes", async () => {
	const teamsDir = tempDir();
	seedTeam(teamsDir);
	const storePath = fileURLToPath(new URL("./store.ts", import.meta.url));
	const run = (subject: string) =>
		new Promise<string>((resolve, reject) => {
			const child = spawn(process.execPath, [
				"--experimental-strip-types",
				"--input-type=module",
				"-e",
				`import { createTask } from ${JSON.stringify(storePath)};
const task = createTask({
  teamsDir: ${JSON.stringify(teamsDir)},
  team: "demo",
  subject: ${JSON.stringify(subject)},
  description: "x",
});
process.stdout.write(task.id);
`,
			]);
			let out = "";
			let err = "";
			child.stdout.on("data", (chunk: Buffer) => {
				out += chunk.toString("utf8");
			});
			child.stderr.on("data", (chunk: Buffer) => {
				err += chunk.toString("utf8");
			});
			child.on("error", reject);
			child.on("close", (code) => {
				if (code === 0) resolve(out);
				else reject(new Error(err || `exit ${code ?? "null"}`));
			});
		});
	const [first, second] = await Promise.all([run("one"), run("two")]);
	assert.notEqual(first, second);
	const tasks = listTasks({ teamsDir, team: "demo" });
	assert.equal(tasks.length, 2);
	assert.deepEqual(tasks.map((task) => task.id).sort(), [first, second].sort());
});

test("completeTask fails clean if a dependent cannot be rewritten", () => {
	const teamsDir = tempDir();
	seedTeam(teamsDir);
	createTask({
		teamsDir,
		team: "demo",
		subject: "blocker",
		description: "first",
	});
	createTask({
		teamsDir,
		team: "demo",
		subject: "dependent",
		description: "second",
	});
	addBlockedBy({
		teamsDir,
		team: "demo",
		id: "2",
		blocker: "1",
	});
	const dependentPath = join(teamsDir, "demo", "tasks", "2.json");
	rmSync(dependentPath);
	mkdirSync(dependentPath);
	assert.throws(() => completeTask({ teamsDir, team: "demo", id: "1" }));
	assert.notEqual(
		getTask({ teamsDir, team: "demo", id: "1" }).status,
		"completed",
	);
});

test("addBlockedBy rejects a cycle", () => {
	const teamsDir = tempDir();
	seedTeam(teamsDir);
	createTask({
		teamsDir,
		team: "demo",
		subject: "one",
		description: "a",
	});
	createTask({
		teamsDir,
		team: "demo",
		subject: "two",
		description: "b",
	});
	addBlockedBy({
		teamsDir,
		team: "demo",
		id: "2",
		blocker: "1",
	});
	assert.throws(
		() =>
			addBlockedBy({
				teamsDir,
				team: "demo",
				id: "1",
				blocker: "2",
			}),
		/cycle/,
	);
});
