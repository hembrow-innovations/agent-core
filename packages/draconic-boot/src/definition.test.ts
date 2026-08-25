import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { AgentDefinitionError, parseAgentDefinition } from "./definition.ts";

const REPO = fileURLToPath(new URL("../../..", import.meta.url));

test("valid fixture parses to name, body, and optional lists", () => {
	const def = parseAgentDefinition(`---
name: researcher
skills: tdd, unslop
tools: [read, bash]
model: grok-4.6
---

Find evidence. Hand citations back.
`);
	assert.equal(def.name, "researcher");
	assert.equal(def.body, "Find evidence. Hand citations back.");
	assert.deepEqual(def.skills, ["tdd", "unslop"]);
	assert.deepEqual(def.tools, ["read", "bash"]);
	assert.equal(def.model, "grok-4.6");
});

test("omitted optional keys stay undefined", () => {
	const def = parseAgentDefinition(`---
name: draconic
---

You are draconic on Pi.
`);
	assert.equal(def.name, "draconic");
	assert.equal(def.body, "You are draconic on Pi.");
	assert.equal(def.skills, undefined);
	assert.equal(def.tools, undefined);
	assert.equal(def.model, undefined);
});

test("empty body throws", () => {
	assert.throws(
		() =>
			parseAgentDefinition(`---
name: empty
---
`),
		(err) => err instanceof AgentDefinitionError && err.code === "empty_body",
	);
});

test("pack file parses and omits Skill or Task wording", () => {
	const text = readFileSync(
		join(REPO, "ai", "agents", "draconic", "draconic.md"),
		"utf8",
	);
	const def = parseAgentDefinition(text);
	assert.equal(def.name, "draconic");
	assert.match(def.body, /You are draconic on Pi/);
	assert.doesNotMatch(def.body, /Skill|Task/);
	assert.equal(def.tools, undefined);
});

test("every non-empty pack agent parses", () => {
	const root = join(REPO, "ai", "agents");
	const stems = readdirSync(root, { withFileTypes: true })
		.filter((ent) => ent.isDirectory())
		.map((ent) => ent.name)
		.sort();
	const parsed: string[] = [];
	for (const stem of stems) {
		const text = readFileSync(join(root, stem, `${stem}.md`), "utf8");
		if (!text.trim()) continue;
		const def = parseAgentDefinition(text);
		assert.equal(def.name, stem);
		assert.doesNotMatch(def.body, /Skill|Task/);
		assert.equal(def.tools, undefined);
		parsed.push(stem);
	}
	assert.deepEqual(
		parsed.filter((name) => name !== "draconic"),
		[
			"architect",
			"coder",
			"debugger",
			"devops",
			"documenter",
			"planner",
			"researcher",
			"reviewer",
			"spec",
			"tester",
		],
	);
});

test("unknown keys throw", () => {
	assert.throws(
		() =>
			parseAgentDefinition(`---
name: researcher
cname: researcher
---

body
`),
		(err) =>
			err instanceof AgentDefinitionError &&
			err.code === "unknown_keys" &&
			Array.isArray(err.keys) &&
			err.keys.includes("cname"),
	);
});
