import { resolve } from "node:path";
import { StringEnum } from "@earendil-works/pi-ai";
import {
	type ExtensionAPI,
	withFileMutationQueue,
} from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import {
	isProtectedTodoPath,
	listSessionChecklists,
	parseSessionId,
	type SessionId,
	sessionTodoPath,
	writeSessionChecklist,
} from "./store.ts";

function toolPath(input: unknown): string | undefined {
	if (!input || typeof input !== "object" || !("path" in input)) {
		return undefined;
	}
	const path = input.path;
	return typeof path === "string" ? path : undefined;
}

export default function (pi: ExtensionAPI) {
	pi.on("tool_call", (event, ctx) => {
		if (event.toolName !== "write" && event.toolName !== "edit") return;
		const path = toolPath(event.input);
		if (!path) return;
		if (!isProtectedTodoPath(ctx.cwd, path)) return;
		return {
			block: true,
			reason: "Use draconic_todo. That path is a session checklist.",
		};
	});

	pi.registerTool({
		name: "draconic_todo",
		label: "Draconic todo",
		description:
			"Write or list this session's draconic checklist. First item on a multi-step task must be reading draconic-mode principles. Keep skipped items as `- [ ] skip: reason`.",
		promptSnippet: "Write or list this session's draconic checklist",
		promptGuidelines: [
			"Use draconic_todo to write the session checklist. Do not write or edit `.draconic/TODO.md` or `.draconic/sessions/*/TODO.md` with write or edit.",
			"Call draconic_todo with action list to see other sessions' checklists. Shared work units live under `.draconic/inbox` and `.draconic/planning`.",
		],
		parameters: Type.Object({
			action: StringEnum(["write", "list"] as const),
			markdown: Type.Optional(
				Type.String({ description: "Full checklist markdown (for write)." }),
			),
		}),
		async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
			switch (params.action) {
				case "write": {
					const markdown = params.markdown;
					if (!markdown) {
						const text = "markdown is required for action write";
						return {
							content: [{ type: "text" as const, text }],
							details: { error: text },
						};
					}
					let sessionId: SessionId;
					try {
						sessionId = parseSessionId(ctx.sessionManager.getSessionId());
					} catch (error) {
						const message =
							error instanceof Error ? error.message : "invalid session id";
						return {
							content: [{ type: "text" as const, text: message }],
							details: { error: message },
						};
					}
					const sessionPath = resolve(sessionTodoPath(ctx.cwd, sessionId));
					return withFileMutationQueue(sessionPath, async () => {
						const written = writeSessionChecklist({
							cwd: ctx.cwd,
							sessionId,
							markdown,
						});
						return {
							content: [
								{
									type: "text" as const,
									text: `Wrote ${written.sessionPath}`,
								},
							],
							details: written,
						};
					});
				}
				case "list": {
					const items = listSessionChecklists(ctx.cwd);
					const text =
						items.length === 0
							? "No session checklists."
							: items
									.map((item) => `- **${item.sessionId}**: ${item.path} (${item.title})`)
									.join("\n");
					return {
						content: [{ type: "text" as const, text }],
						details: { items },
					};
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
}
