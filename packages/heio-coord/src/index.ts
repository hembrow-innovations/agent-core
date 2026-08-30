import { StringEnum } from "@earendil-works/pi-ai";
import type {
	ExtensionAPI,
	ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { withFileMutationQueue } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { claimTask, releaseTask } from "./claim.ts";
import { blockIllegalWrite } from "./enforce.ts";
import { createTicket } from "./ticket.ts";
import { formatStackStatus, readStackStatus } from "./status.ts";
import { inertReason, isForeignTracker, namedTracker } from "./tracker.ts";

function statusText(cwd: string): string {
	const named = namedTracker(cwd);
	if (isForeignTracker(named)) {
		return `inert: ${inertReason(named)}`;
	}
	return formatStackStatus(readStackStatus(cwd));
}

function notify(ctx: Pick<ExtensionContext, "ui">, text: string): void {
	try {
		ctx.ui.notify(text, "info");
	} catch {
		// print mode
	}
}

export default function (pi: ExtensionAPI) {
	let announcedInert = false;

	pi.on("tool_call", (event, ctx) => {
		return blockIllegalWrite(event, ctx);
	});

	pi.on("session_start", (_event, ctx) => {
		const named = namedTracker(ctx.cwd);
		if (!isForeignTracker(named) || announcedInert) return;
		announcedInert = true;
		notify(ctx, `inert: ${inertReason(named)}`);
	});

	pi.registerTool({
		name: "heio_stack",
		label: "Heio stack",
		description:
			"Heio-stack lens and rails. action status reports active sprint, slice, freeze, and open tickets. claim and release bind a slice task or ticket to this session. Same as /heio for status.",
		promptSnippet: "Read heio-stack status with heio_stack action status",
		promptGuidelines: [
			"Use heio_stack action status instead of opening the planning tree.",
			"Use heio_stack claim and release for slice tasks and tickets.",
			"This tool does not write intent, roadmap, or sprint shape.md.",
			"If AGENTS.md or WORKSPACE.md names another tracker, the coordinator stays inert and says so once.",
		],
		parameters: Type.Object({
			action: StringEnum(["status", "claim", "release", "ticket"] as const),
			target: Type.Optional(
				Type.String({
					description: "Slice task id or ticket id for claim/release.",
				}),
			),
		}),
		async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
			switch (params.action) {
				case "status": {
					const text = statusText(ctx.cwd);
					return {
						content: [{ type: "text" as const, text }],
						details: { action: "status" },
					};
				}
				case "claim": {
					const named = namedTracker(ctx.cwd);
					if (isForeignTracker(named)) {
						const text = `inert: ${inertReason(named)}`;
						return {
							content: [{ type: "text" as const, text }],
							details: { action: "claim", error: text },
						};
					}
					const target = params.target;
					if (!target) {
						const text = "target is required for action claim";
						return {
							content: [{ type: "text" as const, text }],
							details: { action: "claim", error: text },
						};
					}
					const sessionId = ctx.sessionManager.getSessionId();
					const tasksPath = `${ctx.cwd}/.heio/planning`;
					return withFileMutationQueue(tasksPath, async () => {
						const result = claimTask({
							cwd: ctx.cwd,
							sessionId,
							target,
						});
						return {
							content: [{ type: "text" as const, text: result.text }],
							details: { action: "claim", ok: result.ok },
						};
					});
				}
				case "release": {
					const named = namedTracker(ctx.cwd);
					if (isForeignTracker(named)) {
						const text = `inert: ${inertReason(named)}`;
						return {
							content: [{ type: "text" as const, text }],
							details: { action: "release", error: text },
						};
					}
					const target = params.target;
					if (!target) {
						const text = "target is required for action release";
						return {
							content: [{ type: "text" as const, text }],
							details: { action: "release", error: text },
						};
					}
					const sessionId = ctx.sessionManager.getSessionId();
					const tasksPath = `${ctx.cwd}/.heio/planning`;
					return withFileMutationQueue(tasksPath, async () => {
						const result = releaseTask({
							cwd: ctx.cwd,
							sessionId,
							target,
						});
						return {
							content: [{ type: "text" as const, text: result.text }],
							details: { action: "release", ok: result.ok },
						};
					});
				}
				case "ticket": {
					const named = namedTracker(ctx.cwd);
					if (isForeignTracker(named)) {
						const text = `inert: ${inertReason(named)}`;
						return {
							content: [{ type: "text" as const, text }],
							details: { action: "ticket", error: text },
						};
					}
					const target = params.target;
					if (!target) {
						const text = "target is required for action ticket";
						return {
							content: [{ type: "text" as const, text }],
							details: { action: "ticket", error: text },
						};
					}
					const ticketsPath = `${ctx.cwd}/.heio/tickets`;
					return withFileMutationQueue(ticketsPath, async () => {
						const result = createTicket({ cwd: ctx.cwd, slug: target });
						return {
							content: [{ type: "text" as const, text: result.text }],
							details: { action: "ticket", ok: result.ok },
						};
					});
				}
				default: {
					const _exhaustive: never = params.action;
					const text = `Unknown action: ${String(_exhaustive)}`;
					return {
						content: [{ type: "text" as const, text }],
						details: { error: text },
					};
				}
			}
		},
	});

	pi.registerCommand("heio", {
		description: "Show heio-stack status (same as heio_stack status /heio)",
		async handler(_args, ctx) {
			notify(ctx, statusText(ctx.cwd));
		},
	});
}
