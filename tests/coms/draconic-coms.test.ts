import assert from "node:assert/strict";
import { existsSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { after, test } from "node:test";
import protocolFactory, {
  bindPeer,
  writeRegistryAtomic,
  type BoundPeer,
  type RegistryEntry,
} from "../../pi/extensions/draconic-coms-protocol.ts";

const comsDir = mkdtempSync("/tmp/draconic-coms-");
const peers: BoundPeer[] = [];

after(async () => {
  for (const peer of peers) await peer.shutdown();
});

async function start(name: string, extra?: { purpose?: string; cwd?: string; model?: string }) {
  const peer = await bindPeer({
    comsDir,
    name,
    purpose: extra?.purpose ?? `${name} work`,
    model: extra?.model ?? `${name}-model`,
    cwd: extra?.cwd ?? `/${name}`,
  });
  peers.push(peer);
  return peer;
}

test("protocol module exports a factory so Pi will load the sibling file", () => {
  assert.equal(typeof protocolFactory, "function");
  assert.equal(protocolFactory(), undefined);
});

test("two in-process peers talk over the unix socket protocol", async () => {
  const planner = await start("planner", { purpose: "Plans the work" });
  const coder = await start("coder", { purpose: "Writes the code", cwd: "/coder" });

  const listed = await planner.list();
  assert.equal(listed.length, 1);
  assert.equal(listed[0]?.name, "coder");
  assert.equal(listed[0]?.model, "coder-model");
  assert.equal(listed[0]?.purpose, "Writes the code");
  assert.equal(listed[0]?.cwd, "/coder");
  assert.equal(listed[0]?.alive, true);

  const sent = await planner.send({ target: "coder", prompt: "what is 2+2?" });
  assert.equal(typeof sent.msg_id, "string");
  assert.ok(sent.msg_id.length > 0);
  assert.equal(planner.get(sent.msg_id).status, "pending");

  const inbound = coder.lastUnfulfilledInbound();
  assert.ok(inbound);
  assert.equal(inbound.prompt, "what is 2+2?");
  await coder.fulfillInbound({ msgId: inbound.msg_id, response: "4" });

  const done = planner.get(sent.msg_id);
  assert.equal(done.status, "complete");
  if (done.status !== "complete") throw new Error("expected complete");
  assert.equal(done.response, "4");
  assert.equal(await planner.awaitReply(sent.msg_id), "4");

  await assert.rejects(
    () => planner.send({ target: "coder", prompt: "too far", hops: 5 }),
    /hops exceeded/,
  );

  const ghost: RegistryEntry = {
    session_id: "dead-session",
    name: "ghost",
    purpose: "gone",
    model: "none",
    pid: 999_999_999,
    endpoint: join(comsDir, "sockets", "dead-session.sock"),
    cwd: "/ghost",
    started_at: new Date().toISOString(),
  };
  writeRegistryAtomic({ comsDir, project: "default", entry: ghost });
  assert.equal(existsSync(join(comsDir, "projects", "default", "agents", "ghost.json")), true);
  const afterPrune = await planner.list();
  assert.equal(afterPrune.some((peer) => peer.name === "ghost"), false);
  assert.equal(existsSync(join(comsDir, "projects", "default", "agents", "ghost.json")), false);

  const plannerB = await start("planner");
  assert.equal(planner.name, "planner");
  assert.equal(plannerB.name, "planner2");
  assert.notEqual(planner.registryPath, plannerB.registryPath);
  assert.equal(existsSync(planner.registryPath), true);
  assert.equal(existsSync(plannerB.registryPath), true);
});
