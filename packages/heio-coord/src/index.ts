import { StringEnum } from "@earendil-works/pi-ai";
import type {
	ExtensionAPI,
	ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
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
			"Read-only heio-stack lens. action status reports active sprint, slice, freeze, and open tickets. Same as /heio.",
		promptSnippet: "Read heio-stack status with heio_stack action status",
		promptGuidelines: [
			"Use heio_stack action status instead of opening the planning tree.",
			"This tool does not write intent, roadmap, shape, or tasks.md.",
			"If AGENTS.md or WORKSPACE.md names another tracker, the coordinator stays inert and says so once.",
		],
		parameters: Type.Object({
			action: StringEnum(["status"] as const),
		}),
		async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
			if (params.action !== "status") {
				const text = `Unknown action: ${String(params.action)}`;
				return {
					content: [{ type: "text" as const, text }],
					details: { error: text },
				};
			}
			const text = statusText(ctx.cwd);
			return {
				content: [{ type: "text" as const, text }],
				details: { action: "status" },
			};
		},
	});

	pi.registerCommand("heio", {
		description: "Show heio-stack status (same as heio_stack status /heio)",
		async handler(_args, ctx) {
			notify(ctx, statusText(ctx.cwd));
		},
	});
}
