import type {
	ExtensionAPI,
	ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import {
	type BoundPeer,
	bindPeer,
	defaultComsDir,
	defaultTimeoutMs,
	newId,
} from "./draconic-coms-protocol.js";

function flagString(pi: ExtensionAPI, name: string): string | undefined {
	const value = pi.getFlag(name);
	return typeof value === "string" && value.length > 0 ? value : undefined;
}

function notify(
	ctx: ExtensionContext,
	message: string,
	type: "info" | "warning" | "error",
): void {
	if (!ctx.hasUI) return;
	try {
		ctx.ui.notify(message, type);
	} catch {
		// print mode
	}
}

function setComsStatus(ctx: ExtensionContext, text: string | undefined): void {
	try {
		ctx.ui.setStatus("coms", text);
	} catch {
		// print mode
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function lastAssistantText(branch: readonly unknown[]): string {
	let text = "";
	for (const entry of branch) {
		if (
			!isRecord(entry) ||
			entry.type !== "message" ||
			!isRecord(entry.message)
		)
			continue;
		if (entry.message.role !== "assistant") continue;
		const content = entry.message.content;
		if (typeof content === "string") {
			text = content;
			continue;
		}
		if (!Array.isArray(content)) continue;
		text = content
			.filter(
				(block): block is { type: "text"; text: string } =>
					isRecord(block) &&
					block.type === "text" &&
					typeof block.text === "string",
			)
			.map((block) => block.text)
			.join("\n");
	}
	return text;
}

function toolText(text: string, details: Record<string, unknown>) {
	return {
		content: [{ type: "text" as const, text }],
		details,
	};
}

export default function (pi: ExtensionAPI) {
	pi.registerFlag("cname", {
		description:
			"Coms agent name. Distinct from pi --name, which the harness owns.",
		type: "string",
		default: undefined,
	});
	pi.registerFlag("purpose", {
		description: "What this living session is for",
		type: "string",
		default: undefined,
	});
	pi.registerFlag("project", {
		description: "Project namespace for peer discovery",
		type: "string",
		default: "default",
	});

	let peer: BoundPeer | undefined;

	pi.on("session_start", async (_event, ctx) => {
		const sessionId = newId();
		const desired = flagString(pi, "cname") || `agent-${sessionId.slice(-6)}`;
		const project = flagString(pi, "project") || "default";
		try {
			peer = await bindPeer({
				comsDir: defaultComsDir(),
				name: desired,
				purpose: flagString(pi, "purpose") ?? "",
				project,
				model: ctx.model?.id ?? "unknown",
				cwd: ctx.cwd,
				sessionId,
				onPrompt: (env) => {
					pi.sendMessage(
						{
							customType: "coms-inbound",
							content: `[from ${env.sender_name}]\n\n${env.prompt}`,
							display: true,
						},
						{ deliverAs: "followUp", triggerTurn: true },
					);
				},
			});
		} catch (err) {
			notify(
				ctx,
				`coms: bind failed. ${err instanceof Error ? err.message : String(err)}`,
				"error",
			);
			return;
		}
		setComsStatus(ctx, `${peer.name}@${project}`);
	});

	pi.registerTool({
		name: "coms_list",
		label: "Coms list",
		description:
			"List live peer Pi sessions on this machine (name, model, purpose, cwd, alive). Use for talking to another already-running session. Do not use for swarm, arena, or orchestrate. Those stay subagents.",
		promptSnippet: "List live peer Pi sessions on this machine.",
		parameters: Type.Object({}),
		async execute() {
			if (!peer) return toolText("coms not initialised", { ok: false });
			const peers = await peer.list();
			if (peers.length === 0)
				return toolText("No peer agents found.", { peers });
			const lines = peers.map((item) => {
				const live = item.alive ? "alive" : "dead";
				const purpose = item.purpose ? ` ${item.purpose}` : "";
				return `${item.name} ${item.model} ${live} ${item.cwd}${purpose}`;
			});
			return toolText(`${peers.length} peer(s):\n${lines.join("\n")}`, {
				peers,
			});
		},
	});

	pi.registerTool({
		name: "coms_send",
		label: "Coms send",
		description:
			"Send a prompt to a live peer by name. Returns msg_id after the receiver acks. Poll with coms_get or block with coms_await. Do not use for swarm, arena, or orchestrate.",
		promptSnippet: "Send a prompt to a live peer Pi session by name.",
		parameters: Type.Object({
			target: Type.String({ description: "Peer name from coms_list." }),
			prompt: Type.String({ description: "The prompt to send." }),
		}),
		async execute(_toolCallId, params) {
			if (!peer) return toolText("coms not initialised", { ok: false });
			try {
				const sent = await peer.send({
					target: params.target,
					prompt: params.prompt,
				});
				return toolText(
					`coms_send to ${params.target}\nmsg_id ${sent.msg_id}`,
					{
						msg_id: sent.msg_id,
						target: params.target,
					},
				);
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				return toolText(`coms_send failed: ${message}`, {
					ok: false,
					error: message,
				});
			}
		},
	});

	pi.registerTool({
		name: "coms_get",
		label: "Coms get",
		description:
			"Non-blocking poll of a coms_send reply. Returns pending, complete, or error.",
		promptSnippet: "Poll a peer reply by msg_id without blocking.",
		parameters: Type.Object({
			msg_id: Type.String({ description: "msg_id returned by coms_send." }),
		}),
		async execute(_toolCallId, params) {
			if (!peer) return toolText("coms not initialised", { ok: false });
			const got = peer.get(params.msg_id);
			if (got.status === "pending") {
				return toolText("coms_get: pending", { status: "pending" });
			}
			if (got.status === "error") {
				return toolText(`coms_get: error. ${got.error}`, {
					status: "error",
					error: got.error,
				});
			}
			return toolText(`coms_get: complete\n${got.response}`, {
				status: "complete",
				response: got.response,
			});
		},
	});

	pi.registerTool({
		name: "coms_await",
		label: "Coms await",
		description:
			"Block until a coms_send reply lands or the timeout fires. Default 30 minutes (PI_COMS_TIMEOUT_MS).",
		promptSnippet: "Wait for a peer reply by msg_id.",
		parameters: Type.Object({
			msg_id: Type.String({ description: "msg_id returned by coms_send." }),
			timeout_ms: Type.Optional(
				Type.Number({ description: "Override timeout in milliseconds." }),
			),
		}),
		async execute(_toolCallId, params) {
			if (!peer) return toolText("coms not initialised", { ok: false });
			const timeoutMs =
				typeof params.timeout_ms === "number" && params.timeout_ms > 0
					? params.timeout_ms
					: defaultTimeoutMs();
			try {
				const text = await peer.awaitReply(params.msg_id, timeoutMs);
				return toolText(text, { response: text });
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				return toolText(`coms_await: error. ${message}`, { error: message });
			}
		},
	});

	pi.on("agent_end", async (_event, ctx) => {
		const inbound = peer?.lastUnfulfilledInbound();
		if (!peer || !inbound) return;
		const text = lastAssistantText(ctx.sessionManager.getBranch());
		try {
			await peer.fulfillInbound({ msgId: inbound.msg_id, response: text });
		} catch {
			// sender may have gone away
		}
	});

	pi.on("session_shutdown", async () => {
		if (!peer) return;
		await peer.shutdown();
		peer = undefined;
	});
}
