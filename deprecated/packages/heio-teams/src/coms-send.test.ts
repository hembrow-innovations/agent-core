import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { bindPeer, type BoundPeer } from "../../heio-coms/src/protocol.ts";
import { sendComsPrompt } from "./coms-send.ts";

const comsDir = mkdtempSync(join(tmpdir(), "heio-teams-coms-"));
const peers: BoundPeer[] = [];

after(async () => {
	for (const peer of peers) await peer.shutdown();
});

test("sendComsPrompt delivers a prompt a live peer can fulfill", async () => {
	const lead = await bindPeer({
		comsDir,
		name: "team-lead",
		purpose: "lead",
		project: "demo",
		cwd: "/work",
	});
	peers.push(lead);
	const researcher = await bindPeer({
		comsDir,
		name: "researcher",
		purpose: "research",
		project: "demo",
		cwd: "/work",
	});
	peers.push(researcher);

	const sent = await sendComsPrompt({
		comsDir,
		project: "demo",
		senderName: "team-lead",
		senderCwd: "/work",
		target: "researcher",
		prompt: "Please stop. The lead is shutting this pane down.",
	});
	assert.ok(sent.msg_id.length > 0);

	const inbound = researcher.lastUnfulfilledInbound();
	assert.ok(inbound);
	assert.equal(
		inbound.prompt,
		"Please stop. The lead is shutting this pane down.",
	);
	assert.equal(inbound.sender_name, "team-lead");
	assert.ok(inbound.sender_endpoint.length > 0);
});

function writePeerCard(dir: string, name: string, endpoint: string): void {
	const agents = join(dir, "projects", "demo", "agents");
	mkdirSync(agents, { recursive: true });
	writeFileSync(
		join(agents, `${name}.json`),
		`${JSON.stringify({ name, endpoint })}\n`,
	);
}

test("sendComsPrompt does not report a silent endpoint as sent", async () => {
	const dir = mkdtempSync(join(tmpdir(), "heio-teams-coms-dead-"));
	const endpoint = join(dir, "silent.sock");
	const sockets: Array<{ destroy(): void }> = [];
	const server = createServer((socket) => {
		sockets.push(socket);
	});
	await new Promise<void>((resolve, reject) => {
		server.once("error", reject);
		server.listen(endpoint, () => resolve());
	});
	try {
		writePeerCard(dir, "ghost", endpoint);
		await assert.rejects(
			() =>
				sendComsPrompt({
					comsDir: dir,
					project: "demo",
					senderName: "team-lead",
					senderCwd: "/work",
					target: "ghost",
					prompt: "idle: researcher settled",
				}),
			/ack timeout|closed before ack|nack/i,
		);
	} finally {
		for (const socket of sockets) socket.destroy();
		await new Promise<void>((resolve, reject) => {
			server.close((err) => (err ? reject(err) : resolve()));
		});
	}
});

test("sendComsPrompt fails on a missing endpoint", async () => {
	const dir = mkdtempSync(join(tmpdir(), "heio-teams-coms-miss-"));
	writePeerCard(dir, "ghost", join(dir, "missing.sock"));
	await assert.rejects(
		() =>
			sendComsPrompt({
				comsDir: dir,
				project: "demo",
				senderName: "team-lead",
				senderCwd: "/work",
				target: "ghost",
				prompt: "idle: researcher settled",
			}),
		/ENOENT|ECONNREFUSED|ack timeout|closed before ack/i,
	);
});

test("sendComsPrompt fails when the peer nacks", async () => {
	const dir = mkdtempSync(join(tmpdir(), "heio-teams-coms-nack-"));
	const endpoint = join(dir, "nack.sock");
	const sockets: Array<{ destroy(): void }> = [];
	const server = createServer((socket) => {
		sockets.push(socket);
		socket.write(
			`${JSON.stringify({ type: "nack", msg_id: "x", error: "busy" })}\n`,
		);
	});
	await new Promise<void>((resolve, reject) => {
		server.once("error", reject);
		server.listen(endpoint, () => resolve());
	});
	try {
		writePeerCard(dir, "ghost", endpoint);
		await assert.rejects(
			() =>
				sendComsPrompt({
					comsDir: dir,
					project: "demo",
					senderName: "team-lead",
					senderCwd: "/work",
					target: "ghost",
					prompt: "idle: researcher settled",
				}),
			/busy/,
		);
	} finally {
		for (const socket of sockets) socket.destroy();
		await new Promise<void>((resolve, reject) => {
			server.close((err) => (err ? reject(err) : resolve()));
		});
	}
});
