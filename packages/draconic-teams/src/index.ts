import type {
	ExtensionAPI,
	ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { sendComsPrompt } from "./coms-send.ts";
import {
	addBlockedBy,
	claimTask,
	completeTask,
	createTask,
	createTeam,
	defaultTeamsDir,
	findMember,
	getTask,
	listTasks,
	parseMemberName,
	readStandingContext,
	readTeam,
	recordTaskComplete,
	setMemberStatus,
	type Task,
	type Team,
	upsertMember,
} from "./store.ts";
import { applySpawn, killPane } from "./tmux.ts";

function argvString(name: string): string | undefined {
	const key = `--${name}`;
	const argv = process.argv;
	for (let i = 0; i < argv.length; i++) {
		if (argv[i] !== key) continue;
		const value = argv[i + 1];
		if (typeof value === "string" && value.length > 0 && !value.startsWith("-")) {
			return value;
		}
	}
	return undefined;
}

function takeNamedFlag(input: { args: string[]; name: string }): {
	value?: string;
	rest: string[];
} {
	const key = `--${input.name}`;
	const rest: string[] = [];
	let value: string | undefined;
	for (let i = 0; i < input.args.length; i++) {
		const token = input.args[i];
		if (token !== key) {
			if (token !== undefined) rest.push(token);
			continue;
		}
		const next = input.args[i + 1];
		if (typeof next === "string" && next.length > 0 && !next.startsWith("-")) {
			value = next;
			i += 1;
		}
	}
	return { value, rest };
}

function flagString(pi: ExtensionAPI, name: string): string | undefined {
	const fromFlag = pi.getFlag(name);
	if (typeof fromFlag === "string" && fromFlag.length > 0) return fromFlag;
	return argvString(name);
}

type NotifyType = "info" | "warning" | "error";

function notify(
	ctx: {
		hasUI?: boolean;
		ui: { notify: (message: string, type?: NotifyType) => void };
	},
	message: string,
	type: NotifyType = "info",
): void {
	if (ctx.hasUI === false) return;
	try {
		ctx.ui.notify(message, type);
	} catch {
		// print mode
	}
}

function setTeamStatus(ctx: ExtensionContext, text: string | undefined): void {
	try {
		ctx.ui.setStatus("team", text);
	} catch {
		// print mode
	}
}

function toolText(text: string, details: Record<string, unknown>) {
	return {
		content: [{ type: "text" as const, text }],
		details,
	};
}

function errorText(err: unknown) {
	const message = err instanceof Error ? err.message : String(err);
	return toolText(message, { error: message });
}

function ownerName(raw: string | undefined): string {
	const name = raw || "team-lead";
	try {
		return parseMemberName(name, { role: "teammate" });
	} catch {
		return parseMemberName(name, { role: "lead" });
	}
}

function formatTeam(team: Team): string {
	const lines = team.members.map((member) => {
		if (member.kind === "lead") return `lead ${member.name}`;
		return `${member.name} ${member.status} ${member.paneId} ${member.purpose}`;
	});
	return `team ${team.name}\n${lines.join("\n")}`;
}

function formatTask(task: Task): string {
	const owner = task.owner ?? "-";
	const blocked =
		task.blockedBy.length > 0 ? ` blockedBy ${task.blockedBy.join(",")}` : "";
	return `${task.id} ${task.status} ${owner} ${task.subject}${blocked}`;
}

export default function (pi: ExtensionAPI) {
	const teamsDir = (cwd?: string) => defaultTeamsDir({ cwd });
	let currentTeam: string | undefined;
	let standingContext: string | undefined;

	const requireTeam = (cwd?: string): Team => {
		const name = currentTeam || flagString(pi, "project");
		if (!name) throw new Error("no team. /team create <name> first.");
		try {
			const team = readTeam({ teamsDir: teamsDir(cwd), name });
			currentTeam = team.name;
			return team;
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			if (message.startsWith("team not found:")) {
				throw new Error("no team. /team create <name> first.");
			}
			throw err;
		}
	};

	const loadStatus = (
		cwd?: string,
	): {
		text: string;
		details: Record<string, unknown>;
	} => {
		const project = currentTeam || flagString(pi, "project");
		const cname = ownerName(flagString(pi, "cname"));
		if (!project) {
			const message = "no team. /team create <name> first.";
			return { text: message, details: { error: message } };
		}
		try {
			const team = readTeam({ teamsDir: teamsDir(cwd), name: project });
			currentTeam = team.name;
			return {
				text: formatTeam(team),
				details: { team, members: team.members },
			};
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			if (message.startsWith("team not found:")) {
				return {
					text: `project ${project}, cname ${cname}. no team file yet.`,
					details: { project, cname },
				};
			}
			throw err;
		}
	};

	pi.on("session_start", (_event, ctx) => {
		const project = flagString(pi, "project");
		const cname = flagString(pi, "cname");
		if (project && cname) {
			standingContext = readStandingContext({
				teamsDir: teamsDir(ctx.cwd),
				team: project,
				name: cname,
			});
		}
		if (!project) return;
		try {
			const team = readTeam({ teamsDir: teamsDir(ctx.cwd), name: project });
			currentTeam = team.name;
			setTeamStatus(ctx, `team ${team.name}`);
		} catch {
			// no config yet
		}
	});

	pi.on("before_agent_start", (event) => {
		if (!standingContext) return;
		return {
			systemPrompt: `${event.systemPrompt}\n\n${standingContext}`,
		};
	});

	const writeOwnStatus = (input: {
		status: "working" | "idle";
		cwd?: string;
	}): void => {
		const name = flagString(pi, "cname");
		const project = flagString(pi, "project") || currentTeam;
		if (!name || !project) return;
		try {
			setMemberStatus({
				teamsDir: teamsDir(input.cwd),
				team: project,
				name,
				status: input.status,
			});
		} catch {
			// no team file yet
		}
	};

	pi.on("agent_settled", async (_event, ctx) => {
		const name = flagString(pi, "cname");
		const project = flagString(pi, "project") || currentTeam;
		if (!name || !project) return;
		let team: Team;
		try {
			team = readTeam({ teamsDir: teamsDir(ctx.cwd), name: project });
		} catch {
			return;
		}
		const member = findMember(team, name);
		if (member?.kind !== "teammate") return;
		writeOwnStatus({ status: "idle", cwd: ctx.cwd });
		try {
			await sendComsPrompt({
				project: team.name,
				senderName: name,
				senderCwd: ctx.cwd,
				target: team.leadName,
				prompt: `idle: ${name} settled`,
			});
		} catch {
			// lead may have gone away
		}
	});

	pi.on("message_start", (event, ctx) => {
		const message = event.message;
		if (message.role !== "custom" || message.customType !== "coms-inbound") {
			return;
		}
		writeOwnStatus({ status: "working", cwd: ctx.cwd });
	});

	pi.on("session_shutdown", () => {});

	pi.registerTool({
		name: "team_create",
		label: "Team create",
		description:
			"Create or replace the team roster for this lead session. Team name becomes the coms --project.",
		promptSnippet: "Create the current team roster.",
		parameters: Type.Object({
			name: Type.String({ description: "Team name. Also the coms project." }),
		}),
		async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
			try {
				const team = createTeam({
					teamsDir: teamsDir(ctx.cwd),
					name: params.name,
					leadName: ownerName(flagString(pi, "cname")),
					cwd: ctx.cwd,
				});
				currentTeam = team.name;
				return toolText(formatTeam(team), { team, members: team.members });
			} catch (err) {
				return errorText(err);
			}
		},
	});

	pi.registerTool({
		name: "team_spawn",
		label: "Team spawn",
		description:
			"Reconcile a named teammate pane. A live matching pane is adopted. Requires tmux.",
		promptSnippet: "Spawn or adopt a named teammate pane.",
		parameters: Type.Object({
			name: Type.String({ description: "Teammate name and --cname." }),
			purpose: Type.String({ description: "What this teammate is for." }),
			agent: Type.Optional(
				Type.String({
					description:
						"Dest .pi/agents file. Defaults to the instance name or the last saved agent.",
				}),
			),
			model: Type.Optional(Type.String({ description: "Optional pi --model." })),
			useWindows: Type.Optional(
				Type.Boolean({ description: "Open a tmux window instead of a pane." }),
			),
		}),
		async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
			try {
				const team = requireTeam(ctx.cwd);
				const result = await applySpawn({
					teamsDir: teamsDir(ctx.cwd),
					request: {
						team: team.name,
						name: params.name,
						purpose: params.purpose,
						cwd: team.cwd || ctx.cwd,
						agent: params.agent,
						model: params.model,
						useWindows: params.useWindows,
					},
				});
				const next = readTeam({ teamsDir: teamsDir(ctx.cwd), name: team.name });
				return toolText(`${result.action} ${params.name}\n${formatTeam(next)}`, {
					team: next,
					members: next.members,
					action: result.action,
				});
			} catch (err) {
				return errorText(err);
			}
		},
	});

	pi.registerTool({
		name: "team_status",
		label: "Team status",
		description: "Show the current team roster and pane ids.",
		promptSnippet: "Show the current team roster.",
		parameters: Type.Object({}),
		async execute(_toolCallId, _params, _signal, _onUpdate, ctx) {
			try {
				const status = loadStatus(ctx.cwd);
				return toolText(status.text, status.details);
			} catch (err) {
				return errorText(err);
			}
		},
	});

	pi.registerTool({
		name: "team_shutdown",
		label: "Team shutdown",
		description:
			"Ask a teammate to stop over coms, then kill its pane. A missing pane is a no-op.",
		promptSnippet: "Shut down a named teammate pane.",
		parameters: Type.Object({
			name: Type.String({ description: "Teammate name to shut down." }),
		}),
		async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
			try {
				const result = await shutdownMember({
					teamsDir: teamsDir(ctx.cwd),
					team: requireTeam(ctx.cwd),
					name: params.name,
					senderName: ownerName(flagString(pi, "cname")),
					senderCwd: ctx.cwd,
				});
				return toolText(`${result.action} ${result.name}`, result);
			} catch (err) {
				return errorText(err);
			}
		},
	});

	pi.registerTool({
		name: "task_create",
		label: "Task create",
		description: "Add a pending task on the current team.",
		promptSnippet: "Create a pending team task.",
		parameters: Type.Object({
			subject: Type.String({ description: "Short task subject." }),
			description: Type.String({ description: "What done looks like." }),
			blockedBy: Type.Optional(
				Type.Array(
					Type.String({ description: "Task id that must complete first." }),
				),
			),
		}),
		async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
			try {
				const team = requireTeam(ctx.cwd);
				let task = createTask({
					teamsDir: teamsDir(ctx.cwd),
					team: team.name,
					subject: params.subject,
					description: params.description,
				});
				for (const blocker of params.blockedBy ?? []) {
					task = addBlockedBy({
						teamsDir: teamsDir(ctx.cwd),
						team: team.name,
						id: task.id,
						blocker,
					});
				}
				return toolText(formatTask(task), { task });
			} catch (err) {
				return errorText(err);
			}
		},
	});

	pi.registerTool({
		name: "task_list",
		label: "Task list",
		description: "List tasks on the current team.",
		promptSnippet: "List team tasks.",
		parameters: Type.Object({}),
		async execute(_toolCallId, _params, _signal, _onUpdate, ctx) {
			try {
				const team = requireTeam(ctx.cwd);
				const tasks = listTasks({
					teamsDir: teamsDir(ctx.cwd),
					team: team.name,
				});
				if (tasks.length === 0) return toolText("No tasks.", { tasks });
				return toolText(tasks.map(formatTask).join("\n"), { tasks });
			} catch (err) {
				return errorText(err);
			}
		},
	});

	pi.registerTool({
		name: "task_get",
		label: "Task get",
		description: "Get one team task by id.",
		promptSnippet: "Get a team task by id.",
		parameters: Type.Object({
			id: Type.String({ description: "Decimal task id." }),
		}),
		async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
			try {
				const team = requireTeam(ctx.cwd);
				const task = getTask({
					teamsDir: teamsDir(ctx.cwd),
					team: team.name,
					id: params.id,
				});
				return toolText(formatTask(task), { task });
			} catch (err) {
				return errorText(err);
			}
		},
	});

	pi.registerTool({
		name: "task_claim",
		label: "Task claim",
		description:
			"Claim a pending unblocked task on the current team. Fails if someone else already owns it.",
		promptSnippet: "Claim a pending unblocked team task.",
		promptGuidelines: [
			"Use task_claim when this session should own a pending unblocked task on the current team.",
		],
		parameters: Type.Object({
			id: Type.String({ description: "Decimal task id." }),
		}),
		async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
			try {
				const team = requireTeam(ctx.cwd);
				const task = claimTask({
					teamsDir: teamsDir(ctx.cwd),
					team: team.name,
					id: params.id,
					owner: ownerName(flagString(pi, "cname")),
				});
				return toolText(formatTask(task), { task });
			} catch (err) {
				return errorText(err);
			}
		},
	});

	pi.registerTool({
		name: "task_complete",
		label: "Task complete",
		description:
			"Mark a team task completed and drop this id from other tasks' blockedBy lists.",
		promptSnippet: "Complete a team task.",
		parameters: Type.Object({
			id: Type.String({ description: "Decimal task id." }),
		}),
		async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
			try {
				const team = requireTeam(ctx.cwd);
				const task = completeTask({
					teamsDir: teamsDir(ctx.cwd),
					team: team.name,
					id: params.id,
				});
				recordTaskComplete({
					teamsDir: teamsDir(ctx.cwd),
					team: team.name,
					name: ownerName(flagString(pi, "cname")),
					task,
				});
				return toolText(formatTask(task), { task });
			} catch (err) {
				return errorText(err);
			}
		},
	});

	pi.registerCommand("team", {
		description:
			"Create a team, spawn a named pane, list status, manage tasks, or shut a pane down. Shut a teammate down with /team shutdown <name> before you leave.",
		handler: async (args, ctx) => {
			const text = args.trim();
			const [verb, ...rest] = text.split(/\s+/);
			try {
				if (!verb || verb === "status") {
					const status = loadStatus(ctx.cwd);
					notify(ctx, status.text);
					return;
				}
				if (verb === "create") {
					const name = rest[0] || flagString(pi, "project");
					if (!name) {
						notify(ctx, "usage: /team create <name>", "warning");
						return;
					}
					const team = createTeam({
						teamsDir: teamsDir(ctx.cwd),
						name,
						leadName: ownerName(flagString(pi, "cname")),
						cwd: ctx.cwd,
					});
					currentTeam = team.name;
					notify(ctx, formatTeam(team));
					return;
				}
				if (verb === "spawn") {
					const taken = takeNamedFlag({ args: rest, name: "agent" });
					const name = taken.rest[0];
					const purpose = taken.rest.slice(1).join(" ");
					if (!name || !purpose) {
						notify(
							ctx,
							"usage: /team spawn <name> [--agent <agent>] <purpose...>",
							"warning",
						);
						return;
					}
					if (!process.env.TMUX) {
						notify(
							ctx,
							"TMUX is empty. Run /team from inside a tmux session.",
							"error",
						);
						return;
					}
					const team = requireTeam(ctx.cwd);
					const result = await applySpawn({
						teamsDir: teamsDir(ctx.cwd),
						request: {
							team: team.name,
							name,
							purpose,
							cwd: team.cwd || ctx.cwd,
							agent: taken.value,
						},
					});
					notify(ctx, `${result.action} ${name}`);
					return;
				}
				if (verb === "shutdown") {
					const name = rest[0];
					if (!name) {
						notify(ctx, "usage: /team shutdown <name>", "warning");
						return;
					}
					if (!process.env.TMUX) {
						notify(
							ctx,
							"TMUX is empty. Run /team from inside a tmux session.",
							"error",
						);
						return;
					}
					const result = await shutdownMember({
						teamsDir: teamsDir(ctx.cwd),
						team: requireTeam(ctx.cwd),
						name,
						senderName: ownerName(flagString(pi, "cname")),
						senderCwd: ctx.cwd,
					});
					notify(ctx, `${result.action} ${result.name}`);
					return;
				}
				if (verb === "task") {
					await handleTaskCommand({
						teamsDir: teamsDir(ctx.cwd),
						team: requireTeam(ctx.cwd),
						owner: ownerName(flagString(pi, "cname")),
						args: rest,
						notify: (message, type) => notify(ctx, message, type),
					});
					return;
				}
				notify(ctx, "usage: /team create|spawn|status|task|shutdown", "warning");
			} catch (err) {
				notify(ctx, err instanceof Error ? err.message : String(err), "error");
			}
		},
	});
}

export type ShutdownResult = {
	action: "requested" | "killed" | "absent";
	name: string;
};

async function shutdownMember(input: {
	teamsDir: string;
	team: Team;
	name: string;
	senderName: string;
	senderCwd: string;
}): Promise<ShutdownResult> {
	const member = findMember(input.team, input.name);
	if (!member || member.kind !== "teammate") {
		return { action: "absent", name: input.name };
	}
	try {
		await sendComsPrompt({
			project: input.team.name,
			senderName: input.senderName,
			senderCwd: input.senderCwd,
			target: input.name,
			prompt: "Please stop. The lead is shutting this pane down.",
		});
	} catch {
		// teammate may already be gone
	}
	await new Promise((resolve) => setTimeout(resolve, 400));
	const killed = await killPane({ paneId: member.paneId });
	upsertMember({
		teamsDir: input.teamsDir,
		team: input.team.name,
		member: { ...member, status: "shutdown" },
	});
	return { action: killed, name: input.name };
}

async function handleTaskCommand(input: {
	teamsDir: string;
	team: Team;
	owner: string;
	args: string[];
	notify: (message: string, type?: "info" | "warning" | "error") => void;
}): Promise<void> {
	const [verb, ...rest] = input.args;
	if (!verb || verb === "list") {
		const tasks = listTasks({ teamsDir: input.teamsDir, team: input.team.name });
		input.notify(
			tasks.length === 0 ? "No tasks." : tasks.map(formatTask).join("\n"),
		);
		return;
	}
	if (verb === "create") {
		const subject = rest.join(" ");
		if (!subject) {
			input.notify("usage: /team task create <subject>", "warning");
			return;
		}
		const task = createTask({
			teamsDir: input.teamsDir,
			team: input.team.name,
			subject,
			description: subject,
		});
		input.notify(formatTask(task));
		return;
	}
	if (verb === "get" || verb === "claim" || verb === "complete") {
		const id = rest[0];
		if (!id) {
			input.notify(`usage: /team task ${verb} <id>`, "warning");
			return;
		}
		if (verb === "get") {
			input.notify(
				formatTask(
					getTask({ teamsDir: input.teamsDir, team: input.team.name, id }),
				),
			);
			return;
		}
		if (verb === "claim") {
			input.notify(
				formatTask(
					claimTask({
						teamsDir: input.teamsDir,
						team: input.team.name,
						id,
						owner: input.owner,
					}),
				),
			);
			return;
		}
		const completed = completeTask({
			teamsDir: input.teamsDir,
			team: input.team.name,
			id,
		});
		recordTaskComplete({
			teamsDir: input.teamsDir,
			team: input.team.name,
			name: input.owner,
			task: completed,
		});
		input.notify(formatTask(completed));
		return;
	}
	input.notify("usage: /team task create|list|get|claim|complete", "warning");
}
