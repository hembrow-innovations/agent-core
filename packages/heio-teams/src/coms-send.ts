import { randomBytes } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { createConnection } from "node:net";
import { homedir } from "node:os";
import { join } from "node:path";

export function defaultComsDir(): string {
	return process.env.PI_COMS_DIR || join(homedir(), ".pi", "coms");
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function newId(): string {
	return randomBytes(6).toString("hex");
}

type RegistryEntry = {
	name: string;
	endpoint: string;
};

function readEntry(path: string): RegistryEntry | undefined {
	try {
		const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
		if (!isRecord(parsed)) return undefined;
		if (typeof parsed.name !== "string" || typeof parsed.endpoint !== "string") {
			return undefined;
		}
		return { name: parsed.name, endpoint: parsed.endpoint };
	} catch {
		return undefined;
	}
}

function findPeer(
	comsDir: string,
	project: string,
	name: string,
): RegistryEntry | undefined {
	const dir = join(comsDir, "projects", project, "agents");
	if (!existsSync(dir)) return undefined;
	for (const file of readdirSync(dir)) {
		if (!file.endsWith(".json")) continue;
		const entry = readEntry(join(dir, file));
		if (entry?.name === name) return entry;
	}
	return undefined;
}

type SendReply =
	| { type: "ack"; msg_id: string }
	| { type: "nack"; msg_id: string; error: string };

function parseSendReply(value: unknown): SendReply | undefined {
	if (!isRecord(value) || typeof value.msg_id !== "string") return undefined;
	if (value.type === "ack") return { type: "ack", msg_id: value.msg_id };
	if (value.type === "nack") {
		return {
			type: "nack",
			msg_id: value.msg_id,
			error: typeof value.error === "string" ? value.error : "nack",
		};
	}
	return undefined;
}

const ACK_TIMEOUT_MS = 250;

function sendLine(endpoint: string, payload: unknown): Promise<void> {
	return new Promise((resolve, reject) => {
		const sock = createConnection({ path: endpoint });
		let settled = false;
		const finish = (err?: Error) => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			try {
				sock.destroy();
			} catch {
				// drop
			}
			if (err) reject(err);
			else resolve();
		};
		const timer = setTimeout(
			() => finish(new Error("coms: ack timeout")),
			ACK_TIMEOUT_MS,
		);
		sock.once("error", (err) => finish(err));
		sock.once("close", () => finish(new Error("connection closed before ack")));
		sock.once("connect", () => {
			try {
				sock.write(`${JSON.stringify(payload)}\n`);
			} catch (err) {
				finish(err instanceof Error ? err : new Error(String(err)));
				return;
			}
			let buf = "";
			sock.on("data", (chunk: Buffer) => {
				buf += chunk.toString("utf8");
				const nl = buf.indexOf("\n");
				if (nl < 0) return;
				let parsed: unknown;
				try {
					parsed = JSON.parse(buf.slice(0, nl));
				} catch {
					finish(new Error("coms: malformed reply"));
					return;
				}
				const reply = parseSendReply(parsed);
				if (!reply) {
					finish(new Error("coms: malformed reply"));
					return;
				}
				if (reply.type === "nack") {
					finish(new Error(reply.error));
					return;
				}
				finish();
			});
		});
	});
}

export async function sendComsPrompt(input: {
	comsDir?: string;
	project: string;
	senderName: string;
	senderCwd: string;
	target: string;
	prompt: string;
}): Promise<{ msg_id: string }> {
	const comsDir = input.comsDir ?? defaultComsDir();
	const target = findPeer(comsDir, input.project, input.target);
	if (!target) {
		throw new Error(`coms: no live agent matching "${input.target}"`);
	}
	const msg_id = newId();
	await sendLine(target.endpoint, {
		type: "prompt",
		msg_id,
		sender_session: `teams-${msg_id}`,
		sender_endpoint: `teams-${msg_id}`,
		sender_name: input.senderName,
		sender_cwd: input.senderCwd,
		hops: 0,
		timestamp: new Date().toISOString(),
		prompt: input.prompt,
	});
	return { msg_id };
}
