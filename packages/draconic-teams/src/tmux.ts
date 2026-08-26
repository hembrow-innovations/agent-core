import { spawn } from "node:child_process";
import {
	findMember,
	parseMemberName,
	readMemberRecord,
	readTeam,
	type TeammateMember,
	upsertMember,
	writeMemberRecord,
} from "./store.ts";

export type SpawnRequest = {
	team: string;
	name: string;
	purpose: string;
	cwd: string;
	agent?: string;
	model?: string;
	useWindows?: boolean;
	memberCount?: number;
};

export type TmuxRunner = {
	run: (argv: string[]) => Promise<string>;
};

export type ApplyResult = {
	action: "start" | "adopt" | "replace";
	member: TeammateMember;
};

export type SpawnArgv = {
	tmux: string[];
	command: string;
};

export function shellQuote(value: string): string {
	if (/^[A-Za-z0-9_./:@%+-]+$/.test(value)) return value;
	return `'${value.replace(/'/g, `'\\''`)}'`;
}

export function buildPiArgv(request: SpawnRequest): string[] {
	const argv = [
		"pi",
		"--cname",
		request.name,
		"--purpose",
		request.purpose,
		"--project",
		request.team,
		"--name",
		request.name,
		"--agent",
		request.agent ?? request.name,
	];
	if (request.model) argv.push("--model", request.model);
	return argv;
}

export function buildTmuxSpawnArgs(request: SpawnRequest): SpawnArgv {
	const pi = buildPiArgv(request);
	const command = `cd ${shellQuote(request.cwd)} && ${pi.map(shellQuote).join(" ")}`;
	if (request.useWindows) {
		return {
			tmux: [
				"tmux",
				"new-window",
				"-dP",
				"-F",
				"#{pane_id}",
				"-n",
				`@pi-team | ${request.name}`,
			],
			command,
		};
	}
	return {
		tmux: ["tmux", "split-window", "-dP", "-F", "#{pane_id}"],
		command,
	};
}

export function defaultTmuxRunner(): TmuxRunner {
	return {
		run(argv) {
			return new Promise((resolve, reject) => {
				const child = spawn(argv[0] ?? "tmux", argv.slice(1), {
					stdio: ["ignore", "pipe", "pipe"],
				});
				let stdout = "";
				let stderr = "";
				child.stdout.on("data", (chunk: Buffer) => {
					stdout += chunk.toString("utf8");
				});
				child.stderr.on("data", (chunk: Buffer) => {
					stderr += chunk.toString("utf8");
				});
				child.on("error", reject);
				child.on("close", (code) => {
					if (code === 0) {
						resolve(stdout.trim());
						return;
					}
					reject(new Error(stderr.trim() || `tmux exited ${code ?? "null"}`));
				});
			});
		},
	};
}

async function paneExists(
	runner: TmuxRunner,
	paneId: string,
): Promise<boolean> {
	try {
		const shown = await runner.run([
			"tmux",
			"display-message",
			"-p",
			"-t",
			paneId,
			"#{pane_id}",
		]);
		return shown.trim() === paneId;
	} catch {
		return false;
	}
}

async function paneBelongsToMember(input: {
	runner: TmuxRunner;
	paneId: string;
	team: string;
	name: string;
}): Promise<boolean> {
	if (!(await paneExists(input.runner, input.paneId))) return false;
	try {
		const marker = await input.runner.run([
			"tmux",
			"display-message",
			"-p",
			"-t",
			input.paneId,
			"#{@pi-member}",
		]);
		return marker.trim() === `${input.team}/${input.name}`;
	} catch {
		return false;
	}
}

async function startPane(
	input: {
		teamsDir: string;
		request: SpawnRequest;
		runner: TmuxRunner;
	},
	action: "start" | "replace",
): Promise<ApplyResult> {
	const built = buildTmuxSpawnArgs(input.request);
	const paneId = await input.runner.run([...built.tmux, built.command]);
	if (!paneId) throw new Error("tmux spawn returned an empty pane id");
	await input.runner.run([
		"tmux",
		"set-option",
		"-p",
		"-t",
		paneId,
		"@pi-member",
		`${input.request.team}/${input.request.name}`,
	]);
	if (!input.request.useWindows) {
		await input.runner.run(["tmux", "select-layout", "tiled"]);
	}
	const member: TeammateMember = {
		kind: "teammate",
		name: parseMemberName(input.request.name, { role: "teammate" }),
		purpose: input.request.purpose,
		paneId,
		status: "spawned",
	};
	upsertMember({
		teamsDir: input.teamsDir,
		team: input.request.team,
		member,
	});
	return { action, member };
}

export async function applySpawn(input: {
	teamsDir: string;
	request: SpawnRequest;
	env?: NodeJS.ProcessEnv;
	runner?: TmuxRunner;
}): Promise<ApplyResult> {
	const env = input.env ?? process.env;
	if (!env.TMUX) {
		throw new Error("TMUX is empty. Run /team from inside a tmux session.");
	}
	const runner = input.runner ?? defaultTmuxRunner();
	const team = readTeam({ teamsDir: input.teamsDir, name: input.request.team });
	const existing = findMember(team, input.request.name);
	if (existing?.kind === "lead") {
		throw new Error(`cannot spawn the lead as a teammate: ${existing.name}`);
	}
	const prior = readMemberRecord({
		teamsDir: input.teamsDir,
		team: input.request.team,
		name: input.request.name,
	});
	const agent =
		input.request.agent ?? prior?.identity?.agent ?? input.request.name;
	writeMemberRecord({
		teamsDir: input.teamsDir,
		team: input.request.team,
		name: input.request.name,
		purpose: input.request.purpose,
		agent,
		model: input.request.model ?? prior?.identity?.model,
	});
	const request = { ...input.request, agent };
	if (existing?.kind === "teammate") {
		const canAdopt =
			existing.status !== "shutdown" &&
			(await paneBelongsToMember({
				runner,
				paneId: existing.paneId,
				team: input.request.team,
				name: input.request.name,
			}));
		if (canAdopt) {
			return { action: "adopt", member: existing };
		}
		return startPane(
			{
				...input,
				runner,
				request,
			},
			"replace",
		);
	}
	return startPane(
		{
			...input,
			runner,
			request,
		},
		"start",
	);
}

export async function killPane(input: {
	paneId: string;
	env?: NodeJS.ProcessEnv;
	runner?: TmuxRunner;
}): Promise<"killed" | "absent"> {
	const env = input.env ?? process.env;
	if (!env.TMUX)
		throw new Error("TMUX is empty. Run /team from inside a tmux session.");
	const runner = input.runner ?? defaultTmuxRunner();
	if (!(await paneExists(runner, input.paneId))) return "absent";
	try {
		await runner.run(["tmux", "kill-pane", "-t", input.paneId]);
		return "killed";
	} catch {
		return "absent";
	}
}
