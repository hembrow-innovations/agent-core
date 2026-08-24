import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { bindPeer, type BoundPeer } from "../../draconic-coms/src/protocol.ts";
import { sendComsPrompt } from "./coms-send.ts";

const comsDir = mkdtempSync(join(tmpdir(), "draconic-teams-coms-"));
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
