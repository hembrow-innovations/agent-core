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

export function defaultTeamsDir(input?: { cwd?: string }): string {
	if (process.env.PI_TEAMS_DIR) return process.env.PI_TEAMS_DIR;
	return join(input?.cwd ?? process.cwd(), ".heio", "teams");
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

export function setMemberStatus(input: {
	teamsDir: string;
	team: string;
	name: string;
	status: MemberStatus;
}): Team {
	const team = readTeam({ teamsDir: input.teamsDir, name: input.team });
	const member = findMember(team, input.name);
	if (!member || member.kind !== "teammate") return team;
	if (member.status === "shutdown") return team;
	if (member.status === input.status) return team;
	return upsertMember({
		teamsDir: input.teamsDir,
		team: team.name,
		member: { ...member, status: input.status },
	});
}

export type MemberIdentity = {
	name: MemberName;
	purpose: string;
	agent?: string;
	model?: string;
	notes?: string;
};

const LOG_HEADER = "ts\tkind\ttask\tsummary";

export function memberRecordDir(input: {
	teamsDir: string;
	team: string;
	name: string;
}): string {
	const team = parseTeamName(input.team);
	const name = parseOwnerName(input.name);
	return join(teamDir(input.teamsDir, team), "roster", name);
}

function emptyToUndefined(value: string | undefined): string | undefined {
	if (value === undefined || value.length === 0) return undefined;
	return value;
}

export function parseIdentity(raw: string): MemberIdentity {
	const fields = new Map<string, string>();
	const noteLines: string[] = [];
	let inNotes = false;
	for (const line of raw.split(/\r?\n/)) {
		if (inNotes) {
			noteLines.push(line);
			continue;
		}
		if (/^##\s+Notes\s*$/.test(line)) {
			inNotes = true;
			continue;
		}
		const match = /^- \*\*([^*]+)\*\*:\s*(.*)$/.exec(line);
		if (!match || match[1] === undefined || match[2] === undefined) continue;
		fields.set(match[1].trim(), match[2].trim());
	}
	const nameRaw = fields.get("name");
	const purpose = fields.get("purpose");
	if (!nameRaw || purpose === undefined) {
		throw new Error("invalid identity");
	}
	const notes = noteLines.join("\n").trim();
	const identity: MemberIdentity = {
		name: parseOwnerName(nameRaw),
		purpose,
	};
	const agent = emptyToUndefined(fields.get("agent"));
	const model = emptyToUndefined(fields.get("model"));
	if (agent) identity.agent = agent;
	if (model) identity.model = model;
	if (notes.length > 0) identity.notes = notes;
	return identity;
}

export function formatIdentity(identity: MemberIdentity): string {
	const lines = [
		`# ${identity.name}`,
		"",
		`- **name**: ${identity.name}`,
		`- **purpose**: ${identity.purpose}`,
	];
	if (identity.agent) lines.push(`- **agent**: ${identity.agent}`);
	if (identity.model) lines.push(`- **model**: ${identity.model}`);
	lines.push("", "## Notes", "");
	if (identity.notes) lines.push(identity.notes, "");
	return lines.join("\n");
}

export function writeMemberRecord(input: {
	teamsDir: string;
	team: string;
	name: string;
	purpose: string;
	agent?: string;
	model?: string;
}): MemberIdentity {
	const dir = memberRecordDir(input);
	mkdirSync(dir, { recursive: true });
	const identityPath = join(dir, "identity.md");
	let notes: string | undefined;
	if (existsSync(identityPath)) {
		try {
			notes = parseIdentity(readFileSync(identityPath, "utf8")).notes;
		} catch {
			notes = undefined;
		}
	}
	const identity: MemberIdentity = {
		name: parseOwnerName(input.name),
		purpose: input.purpose,
	};
	if (input.agent) identity.agent = input.agent;
	if (input.model) identity.model = input.model;
	if (notes) identity.notes = notes;
	writeFileSync(identityPath, `${formatIdentity(identity)}\n`);
	const logPath = join(dir, "log.tsv");
	if (!existsSync(logPath)) {
		writeFileSync(logPath, `${LOG_HEADER}\n`);
	}
	return identity;
}

export function readMemberRecord(input: {
	teamsDir: string;
	team: string;
	name: string;
}):
	| {
			identity?: MemberIdentity;
			handoff?: string;
			log?: string;
	  }
	| undefined {
	const dir = memberRecordDir(input);
	if (!existsSync(dir)) return undefined;
	const result: {
		identity?: MemberIdentity;
		handoff?: string;
		log?: string;
	} = {};
	const identityPath = join(dir, "identity.md");
	if (existsSync(identityPath)) {
		try {
			result.identity = parseIdentity(readFileSync(identityPath, "utf8"));
		} catch {
			// missing identity on first spawn is fine
		}
	}
	const handoffPath = join(dir, "handoff.md");
	if (existsSync(handoffPath)) {
		const handoff = readFileSync(handoffPath, "utf8");
		if (handoff.trim().length > 0) result.handoff = handoff;
	}
	const logPath = join(dir, "log.tsv");
	if (existsSync(logPath)) result.log = readFileSync(logPath, "utf8");
	return result;
}

export function readStandingContext(input: {
	teamsDir: string;
	team: string;
	name: string;
}): string | undefined {
	const record = readMemberRecord(input);
	if (!record) return undefined;
	const parts: string[] = [];
	const identityPath = join(memberRecordDir(input), "identity.md");
	if (existsSync(identityPath)) {
		const identity = readFileSync(identityPath, "utf8").trim();
		if (identity.length > 0) parts.push(identity);
	}
	if (record.handoff) parts.push(record.handoff.trim());
	if (parts.length === 0) return undefined;
	return parts.join("\n\n");
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

function oneLineCell(text: string): string {
	return text.replace(/[\t\r\n]+/g, " ").trim();
}

function needsNoteBlob(text: string): boolean {
	return /[\t\r\n]/.test(text);
}

function noteStamp(now: string): string {
	return now.replace(/[:.]/g, "-");
}

function formatHandoff(input: {
	finished: string;
	stillTrue: string;
	next?: string;
}): string {
	const lines = [
		"# Handoff",
		"",
		`- **finished**: ${input.finished}`,
		`- **still true**: ${input.stillTrue}`,
	];
	if (input.next) lines.push(`- **next**: ${input.next}`);
	lines.push("");
	return lines.join("\n");
}

export function recordTaskComplete(input: {
	teamsDir: string;
	team: string;
	name: string;
	task: Task;
	now?: string;
}): void {
	const team = readTeam({ teamsDir: input.teamsDir, name: input.team });
	const member = findMember(team, input.name);
	if (!member || member.kind !== "teammate") return;
	const now = input.now ?? new Date().toISOString();
	const prior = readMemberRecord({
		teamsDir: input.teamsDir,
		team: team.name,
		name: member.name,
	});
	const identity =
		prior?.identity ??
		writeMemberRecord({
			teamsDir: input.teamsDir,
			team: team.name,
			name: member.name,
			purpose: member.purpose,
		});
	const dir = memberRecordDir({
		teamsDir: input.teamsDir,
		team: team.name,
		name: member.name,
	});
	mkdirSync(dir, { recursive: true });
	const summary = oneLineCell(input.task.subject);
	const logPath = join(dir, "log.tsv");
	const existingLog = existsSync(logPath)
		? readFileSync(logPath, "utf8")
		: `${LOG_HEADER}\n`;
	const headered = existingLog.startsWith(LOG_HEADER)
		? existingLog
		: `${LOG_HEADER}\n${existingLog}`;
	const withNl = headered.endsWith("\n") ? headered : `${headered}\n`;
	writeFileSync(
		logPath,
		`${withNl}${now}\tcompleted\t${input.task.id}\t${summary}\n`,
	);
	writeFileSync(
		join(dir, "handoff.md"),
		`${formatHandoff({
			finished: `${input.task.id} ${summary}`,
			stillTrue: identity.purpose,
		})}\n`,
	);
	if (needsNoteBlob(input.task.description)) {
		const notesDir = join(dir, "notes");
		mkdirSync(notesDir, { recursive: true });
		writeFileSync(
			join(notesDir, `${noteStamp(now)}-${input.task.id}.md`),
			`# Task ${input.task.id}\n\n${input.task.description}\n`,
		);
	}
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

function boardLockPath(teamsDir: string, team: TeamName): string {
	return join(tasksDir(teamsDir, team), ".lock");
}

function isProcessAlive(pid: number): boolean {
	try {
		process.kill(pid, 0);
		return true;
	} catch (err) {
		return !(isRecord(err) && err.code === "ESRCH");
	}
}

function recoverStaleLock(lockPath: string): void {
	if (!existsSync(lockPath)) return;
	let raw = "";
	try {
		raw = readFileSync(lockPath, "utf8").trim();
	} catch {
		try {
			unlinkSync(lockPath);
		} catch {
			// already gone
		}
		return;
	}
	const pid = Number(raw);
	if (!Number.isInteger(pid) || pid <= 0 || !isProcessAlive(pid)) {
		try {
			unlinkSync(lockPath);
		} catch {
			// already gone
		}
	}
}

function withBoardLock<T>(input: {
	teamsDir: string;
	team: TeamName;
	fn: () => T;
}): T {
	const dir = tasksDir(input.teamsDir, input.team);
	mkdirSync(dir, { recursive: true });
	const lockPath = boardLockPath(input.teamsDir, input.team);
	let fd: number | undefined;
	let lastError: unknown;
	for (let attempt = 0; attempt < 20; attempt++) {
		recoverStaleLock(lockPath);
		try {
			fd = openSync(lockPath, "wx");
			writeFileSync(fd, `${process.pid}\n`);
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
		return input.fn();
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
		} catch {}
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
	return withBoardLock({
		teamsDir: input.teamsDir,
		team: team.name,
		fn: () => {
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
			writeTaskFile(taskPath(input.teamsDir, team.name, task.id), task);
			return task;
		},
	});
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
	return withBoardLock({
		teamsDir: input.teamsDir,
		team: team.name,
		fn: () => {
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
		},
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
	return withBoardLock({
		teamsDir: input.teamsDir,
		team: team.name,
		fn: () => {
			const task = readTaskFile(path);
			const dependents: Array<{ path: string; task: Task }> = [];
			for (const otherId of listTaskIds(input.teamsDir, team.name)) {
				if (otherId === id) continue;
				const otherPath = taskPath(input.teamsDir, team.name, otherId);
				const other = readTaskFile(otherPath);
				if (!other.blockedBy.includes(id)) continue;
				dependents.push({
					path: otherPath,
					task: {
						...other,
						blockedBy: other.blockedBy.filter((item) => item !== id),
					},
				});
			}
			const completed: Task = { ...task, status: "completed" };
			for (const dependent of dependents) {
				writeTaskFile(dependent.path, dependent.task);
			}
			writeTaskFile(path, completed);
			return completed;
		},
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
	return withBoardLock({
		teamsDir: input.teamsDir,
		team: team.name,
		fn: () => {
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
		},
	});
}
