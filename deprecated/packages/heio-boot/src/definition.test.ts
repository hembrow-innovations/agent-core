import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
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
name: heio
---

You are heio on Pi.
`);
	assert.equal(def.name, "heio");
	assert.equal(def.body, "You are heio on Pi.");
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

test("every non-empty pack agent parses", () => {
	const root = join(REPO, "ai", "agents");
	const stems = readdirSync(root, { withFileTypes: true })
		.filter((ent) => ent.isDirectory())
		.map((ent) => ent.name)
		.filter((name) => !name.startsWith("heio-"))
		.filter((name) => !name.endsWith("-mcp") && name !== "littlepaw-builder")
		.sort();
	const parsed: string[] = [];
	for (const stem of stems) {
		const file = join(root, stem, `${stem}.md`);
		if (!existsSync(file)) continue;
		const text = readFileSync(file, "utf8");
		if (!text.trim()) continue;
		const def = parseAgentDefinition(text);
		assert.equal(def.name, stem);
		assert.doesNotMatch(def.body, /Skill|Task/);
		assert.equal(def.tools, undefined);
		parsed.push(stem);
	}
	assert.deepEqual(parsed, [
		"afk-orchestrator",
		"architect",
		"coder",
		"debugger",
		"designer",
		"devops",
		"documenter",
		"growth",
		"lead",
		"orchestrator",
		"planner",
		"product",
		"researcher",
		"reviewer",
		"spec",
		"tester",
	]);
});

test("lead carries its recipes and has no dest file hops", () => {
	const text = readFileSync(
		join(REPO, "ai", "agents", "lead", "lead.md"),
		"utf8",
	);
	const def = parseAgentDefinition(text);
	assert.equal(def.name, "lead");
	assert.equal(def.skills, undefined);
	assert.match(def.body, /team-lead/);
	assert.match(def.body, /team_spawn/);
	assert.match(def.body, /## Feature/);
	assert.match(def.body, /## Bug fix/);
	assert.match(def.body, /## Investigation/);
	assert.match(def.body, /## Refactoring/);
	assert.doesNotMatch(def.body, /\.pi\/playbooks\//);
	assert.doesNotMatch(def.body, /\.pi\/skills\//);
});

test("orchestrator carries its recipes and has no dest file hops", () => {
	const text = readFileSync(
		join(REPO, "ai", "agents", "orchestrator", "orchestrator.md"),
		"utf8",
	);
	const def = parseAgentDefinition(text);
	assert.equal(def.name, "orchestrator");
	assert.equal(def.skills, undefined);
	assert.match(def.body, /team-lead/);
	assert.match(def.body, /team_spawn/);
	assert.match(def.body, /## Shape/);
	assert.match(def.body, /## Sequence/);
	assert.match(def.body, /## Build/);
	assert.match(def.body, /## Gate/);
	assert.doesNotMatch(def.body, /\.pi\/playbooks\//);
	assert.doesNotMatch(def.body, /\.pi\/skills\//);
});

test("plan roster agents carry teammate recipes and have no dest file hops", () => {
	for (const stem of ["architect", "planner", "coder", "reviewer"]) {
		const text = readFileSync(
			join(REPO, "ai", "agents", stem, `${stem}.md`),
			"utf8",
		);
		const def = parseAgentDefinition(text);
		assert.equal(def.name, stem);
		assert.match(def.body, /## Seat/);
		assert.match(def.body, /## Claim/);
		assert.match(def.body, /## Craft/);
		assert.doesNotMatch(def.body, /Skill|Task/);
		assert.doesNotMatch(def.body, /\.pi\/playbooks\//);
		assert.doesNotMatch(def.body, /\.pi\/skills\//);
	}
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
