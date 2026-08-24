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

function sendLine(endpoint: string, payload: unknown): Promise<void> {
	return new Promise((resolve, reject) => {
		const sock = createConnection({ path: endpoint });
		let settled = false;
		const finish = (err?: Error) => {
			if (settled) return;
			settled = true;
			try {
				sock.destroy();
			} catch {
				// drop
			}
			if (err) reject(err);
			else resolve();
		};
		sock.once("error", (err) => finish(err));
		sock.once("connect", () => {
			try {
				sock.write(`${JSON.stringify(payload)}\n`);
			} catch (err) {
				finish(err instanceof Error ? err : new Error(String(err)));
				return;
			}
			sock.once("data", () => finish());
			setTimeout(() => finish(), 250).unref?.();
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
