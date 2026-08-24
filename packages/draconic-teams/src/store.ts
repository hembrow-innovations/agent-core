import {
	closeSync,
	existsSync,
	mkdirSync,
	openSync,
	readdirSync,
	readFileSync,
	renameSync,
	unlinkSync,
	writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export type TeamName = string & { readonly __brand: "TeamName" };
export type MemberName = string & { readonly __brand: "MemberName" };

export type MemberStatus = "spawned" | "working" | "idle" | "shutdown";

export type LeadMember = {
	kind: "lead";
	name: MemberName;
};

export type TeammateMember = {
	kind: "teammate";
	name: MemberName;
	purpose: string;
	paneId: string;
	status: MemberStatus;
};

export type Member = LeadMember | TeammateMember;

export type Team = {
	name: TeamName;
	leadName: MemberName;
	cwd: string;
	createdAt: string;
	members: Member[];
};

const NAME_PATTERN = /^[A-Za-z0-9_-]+$/;
const MAX_NAME_LENGTH = 64;
const LEAD_RESERVED_NAME = "team-lead";
const MEMBER_STATUSES = new Set<MemberStatus>([
	"spawned",
	"working",
	"idle",
	"shutdown",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

export function defaultTeamsDir(): string {
	return process.env.PI_TEAMS_DIR || join(homedir(), ".pi", "teams");
}

export function parseTeamName(raw: string): TeamName {
	if (!NAME_PATTERN.test(raw) || raw.length > MAX_NAME_LENGTH) {
		throw new Error(`invalid team name: ${raw}`);
	}
	return raw as TeamName;
}

export function parseMemberName(
	raw: string,
	opts: { role: "lead" | "teammate" },
): MemberName {
	if (!NAME_PATTERN.test(raw) || raw.length > MAX_NAME_LENGTH) {
		throw new Error(`invalid member name: ${raw}`);
	}
	if (opts.role === "teammate" && raw === LEAD_RESERVED_NAME) {
		throw new Error("reserved member name: team-lead");
	}
	return raw as MemberName;
}

export function parseOwnerName(raw: string): MemberName {
	try {
		return parseMemberName(raw, { role: "teammate" });
	} catch {
		return parseMemberName(raw, { role: "lead" });
	}
}

function parseMemberStatus(raw: unknown): MemberStatus {
	if (typeof raw !== "string" || !MEMBER_STATUSES.has(raw as MemberStatus)) {
		throw new Error(`invalid member status: ${String(raw)}`);
	}
	return raw as MemberStatus;
}

function parseMember(value: unknown): Member {
	if (!isRecord(value) || typeof value.name !== "string") {
		throw new Error("invalid member");
	}
	if (value.kind === "lead") {
		return { kind: "lead", name: parseMemberName(value.name, { role: "lead" }) };
	}
	if (value.kind === "teammate") {
		if (typeof value.purpose !== "string" || typeof value.paneId !== "string") {
			throw new Error("invalid teammate");
		}
		return {
			kind: "teammate",
			name: parseMemberName(value.name, { role: "teammate" }),
			purpose: value.purpose,
			paneId: value.paneId,
			status: parseMemberStatus(value.status),
		};
	}
	throw new Error("invalid member kind");
}

export function parseTeam(value: unknown): Team {
	if (!isRecord(value)) throw new Error("invalid team");
	if (
		typeof value.name !== "string" ||
		typeof value.leadName !== "string" ||
		typeof value.cwd !== "string" ||
		typeof value.createdAt !== "string" ||
		!Array.isArray(value.members)
	) {
		throw new Error("invalid team");
	}
	return {
		name: parseTeamName(value.name),
		leadName: parseMemberName(value.leadName, { role: "lead" }),
		cwd: value.cwd,
		createdAt: value.createdAt,
		members: value.members.map(parseMember),
	};
}

export function teamDir(teamsDir: string, name: TeamName): string {
	return join(teamsDir, name);
}

export function teamConfigPath(teamsDir: string, name: TeamName): string {
	return join(teamDir(teamsDir, name), "config.json");
}

export function writeTeam(input: { teamsDir: string; team: Team }): void {
	const dir = teamDir(input.teamsDir, input.team.name);
	mkdirSync(dir, { recursive: true });
	const finalPath = teamConfigPath(input.teamsDir, input.team.name);
	const tmp = `${finalPath}.tmp`;
	writeFileSync(tmp, `${JSON.stringify(input.team, null, 2)}\n`);
	renameSync(tmp, finalPath);
}

export function readTeam(input: { teamsDir: string; name: string }): Team {
	const name = parseTeamName(input.name);
	const path = teamConfigPath(input.teamsDir, name);
	if (!existsSync(path)) throw new Error(`team not found: ${name}`);
	let parsed: unknown;
	try {
		parsed = JSON.parse(readFileSync(path, "utf8"));
	} catch {
		throw new Error(`invalid team file: ${name}`);
	}
	return parseTeam(parsed);
}

export function createTeam(input: {
	teamsDir: string;
	name: string;
	leadName: string;
	cwd: string;
	createdAt?: string;
}): Team {
	const team: Team = {
		name: parseTeamName(input.name),
		leadName: parseMemberName(input.leadName, { role: "lead" }),
		cwd: input.cwd,
		createdAt: input.createdAt ?? new Date().toISOString(),
		members: [
			{ kind: "lead", name: parseMemberName(input.leadName, { role: "lead" }) },
		],
	};
	writeTeam({ teamsDir: input.teamsDir, team });
	return team;
}

export function upsertMember(input: {
	teamsDir: string;
	team: string;
	member: Member;
}): Team {
	const team = readTeam({ teamsDir: input.teamsDir, name: input.team });
	const next = team.members.filter(
		(member) => member.name !== input.member.name,
	);
	next.push(input.member);
	const updated = { ...team, members: next };
	writeTeam({ teamsDir: input.teamsDir, team: updated });
	return updated;
}

export function findMember(team: Team, name: string): Member | undefined {
	return team.members.find((member) => member.name === name);
}

export type TaskId = string & { readonly __brand: "TaskId" };
export type TaskStatus = "pending" | "in_progress" | "completed";

export type Task = {
	id: TaskId;
	subject: string;
	description: string;
	status: TaskStatus;
	owner: MemberName | null;
	blockedBy: TaskId[];
};

const TASK_STATUSES = new Set<TaskStatus>([
	"pending",
	"in_progress",
	"completed",
]);

export function parseTaskId(raw: string): TaskId {
	if (!/^[1-9][0-9]*$/.test(raw)) throw new Error(`invalid task id: ${raw}`);
	return raw as TaskId;
}

function parseTaskStatus(raw: unknown): TaskStatus {
	if (typeof raw !== "string" || !TASK_STATUSES.has(raw as TaskStatus)) {
		throw new Error(`invalid task status: ${String(raw)}`);
	}
	return raw as TaskStatus;
}

export function parseTask(value: unknown): Task {
	if (!isRecord(value)) throw new Error("invalid task");
	if (
		typeof value.id !== "string" ||
		typeof value.subject !== "string" ||
		typeof value.description !== "string" ||
		!Array.isArray(value.blockedBy)
	) {
		throw new Error("invalid task");
	}
	let owner: MemberName | null = null;
	if (value.owner !== null && value.owner !== undefined) {
		if (typeof value.owner !== "string") throw new Error("invalid task owner");
		owner = parseOwnerName(value.owner);
	}
	return {
		id: parseTaskId(value.id),
		subject: value.subject,
		description: value.description,
		status: parseTaskStatus(value.status),
		owner,
		blockedBy: value.blockedBy.map((item) => {
			if (typeof item !== "string") throw new Error("invalid blockedBy");
			return parseTaskId(item);
		}),
	};
}

function tasksDir(teamsDir: string, team: TeamName): string {
	return join(teamDir(teamsDir, team), "tasks");
}

function taskPath(teamsDir: string, team: TeamName, id: TaskId): string {
	return join(tasksDir(teamsDir, team), `${id}.json`);
}

function writeTaskFile(path: string, task: Task): void {
	const tmp = `${path}.tmp`;
	writeFileSync(tmp, `${JSON.stringify(task, null, 2)}\n`);
	renameSync(tmp, path);
}

function readTaskFile(path: string): Task {
	let parsed: unknown;
	try {
		parsed = JSON.parse(readFileSync(path, "utf8"));
	} catch {
		throw new Error(`invalid task file: ${path}`);
	}
	return parseTask(parsed);
}

function withTaskLock<T>(path: string, fn: () => T): T {
	const lockPath = `${path}.lock`;
	let fd: number | undefined;
	let lastError: unknown;
	for (let attempt = 0; attempt < 20; attempt++) {
		try {
			fd = openSync(lockPath, "wx");
			lastError = undefined;
			break;
		} catch (err) {
			lastError = err;
			Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10);
		}
	}
	if (fd === undefined) {
		throw new Error(
			`task is locked: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
		);
	}
	try {
		return fn();
	} finally {
		closeSync(fd);
		try {
			unlinkSync(lockPath);
		} catch {
			// already gone
		}
	}
}

function listTaskIds(teamsDir: string, team: TeamName): TaskId[] {
	const dir = tasksDir(teamsDir, team);
	if (!existsSync(dir)) return [];
	const ids: TaskId[] = [];
	for (const file of readdirSync(dir)) {
		if (!file.endsWith(".json") || file.endsWith(".tmp")) continue;
		const stem = file.slice(0, -5);
		try {
			ids.push(parseTaskId(stem));
		} catch {
			continue;
		}
	}
	return ids.sort((a, b) => Number(a) - Number(b));
}

export function createTask(input: {
	teamsDir: string;
	team: string;
	subject: string;
	description: string;
}): Task {
	const team = readTeam({ teamsDir: input.teamsDir, name: input.team });
	const ids = listTaskIds(input.teamsDir, team.name);
	const next = ids.length === 0 ? 1 : Number(ids[ids.length - 1]) + 1;
	const task: Task = {
		id: parseTaskId(String(next)),
		subject: input.subject,
		description: input.description,
		status: "pending",
		owner: null,
		blockedBy: [],
	};
	const dir = tasksDir(input.teamsDir, team.name);
	mkdirSync(dir, { recursive: true });
	writeTaskFile(taskPath(input.teamsDir, team.name, task.id), task);
	return task;
}

export function getTask(input: {
	teamsDir: string;
	team: string;
	id: string;
}): Task {
	const team = readTeam({ teamsDir: input.teamsDir, name: input.team });
	const id = parseTaskId(input.id);
	const path = taskPath(input.teamsDir, team.name, id);
	if (!existsSync(path)) throw new Error(`task not found: ${id}`);
	return readTaskFile(path);
}

export function listTasks(input: { teamsDir: string; team: string }): Task[] {
	const team = readTeam({ teamsDir: input.teamsDir, name: input.team });
	return listTaskIds(input.teamsDir, team.name).map((id) =>
		readTaskFile(taskPath(input.teamsDir, team.name, id)),
	);
}

function incompleteBlockers(
	teamsDir: string,
	team: TeamName,
	task: Task,
): TaskId[] {
	const incomplete: TaskId[] = [];
	for (const blocker of task.blockedBy) {
		const path = taskPath(teamsDir, team, blocker);
		if (!existsSync(path)) {
			incomplete.push(blocker);
			continue;
		}
		const other = readTaskFile(path);
		if (other.status !== "completed") incomplete.push(blocker);
	}
	return incomplete;
}

export function claimTask(input: {
	teamsDir: string;
	team: string;
	id: string;
	owner: string;
}): Task {
	const team = readTeam({ teamsDir: input.teamsDir, name: input.team });
	const id = parseTaskId(input.id);
	const owner = parseOwnerName(input.owner);
	const path = taskPath(input.teamsDir, team.name, id);
	if (!existsSync(path)) throw new Error(`task not found: ${id}`);
	return withTaskLock(path, () => {
		const task = readTaskFile(path);
		if (task.status !== "pending") {
			throw new Error(`task ${id} is not pending`);
		}
		const blocked = incompleteBlockers(input.teamsDir, team.name, task);
		if (blocked.length > 0) {
			throw new Error(`task ${id} is blocked by ${blocked.join(", ")}`);
		}
		const claimed: Task = { ...task, status: "in_progress", owner };
		writeTaskFile(path, claimed);
		return claimed;
	});
}

export function completeTask(input: {
	teamsDir: string;
	team: string;
	id: string;
}): Task {
	const team = readTeam({ teamsDir: input.teamsDir, name: input.team });
	const id = parseTaskId(input.id);
	const path = taskPath(input.teamsDir, team.name, id);
	if (!existsSync(path)) throw new Error(`task not found: ${id}`);
	return withTaskLock(path, () => {
		const task = readTaskFile(path);
		const completed: Task = { ...task, status: "completed" };
		writeTaskFile(path, completed);
		for (const otherId of listTaskIds(input.teamsDir, team.name)) {
			if (otherId === id) continue;
			const otherPath = taskPath(input.teamsDir, team.name, otherId);
			withTaskLock(otherPath, () => {
				const other = readTaskFile(otherPath);
				if (!other.blockedBy.includes(id)) return;
				writeTaskFile(otherPath, {
					...other,
					blockedBy: other.blockedBy.filter((item) => item !== id),
				});
			});
		}
		return completed;
	});
}

function wouldCycle(
	teamsDir: string,
	team: TeamName,
	id: TaskId,
	blocker: TaskId,
): boolean {
	if (id === blocker) return true;
	const seen = new Set<TaskId>();
	const stack: TaskId[] = [blocker];
	while (stack.length > 0) {
		const current = stack.pop();
		if (!current || seen.has(current)) continue;
		if (current === id) return true;
		seen.add(current);
		const path = taskPath(teamsDir, team, current);
		if (!existsSync(path)) continue;
		stack.push(...readTaskFile(path).blockedBy);
	}
	return false;
}

export function addBlockedBy(input: {
	teamsDir: string;
	team: string;
	id: string;
	blocker: string;
}): Task {
	const team = readTeam({ teamsDir: input.teamsDir, name: input.team });
	const id = parseTaskId(input.id);
	const blocker = parseTaskId(input.blocker);
	const path = taskPath(input.teamsDir, team.name, id);
	if (!existsSync(path)) throw new Error(`task not found: ${id}`);
	if (!existsSync(taskPath(input.teamsDir, team.name, blocker))) {
		throw new Error(`task not found: ${blocker}`);
	}
	return withTaskLock(path, () => {
		const task = readTaskFile(path);
		if (task.blockedBy.includes(blocker)) return task;
		if (wouldCycle(input.teamsDir, team.name, id, blocker)) {
			throw new Error(`cycle: ${id} blockedBy ${blocker}`);
		}
		const updated: Task = {
			...task,
			blockedBy: [...task.blockedBy, blocker],
		};
		writeTaskFile(path, updated);
		return updated;
	});
}
