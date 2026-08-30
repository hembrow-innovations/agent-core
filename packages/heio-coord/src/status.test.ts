import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { formatStackStatus, readStackStatus } from "./status.ts";

function tempCwd(): string {
	return mkdtempSync(join(tmpdir(), "heio-coord-status-"));
}

function writeNote(path: string, fields: Record<string, string>): void {
	mkdirSync(dirname(path), { recursive: true });
	const lines = ["---"];
	for (const [key, value] of Object.entries(fields)) {
		lines.push(`${key}: "${value}"`);
	}
	lines.push("---", "", `# ${fields.title ?? fields.id ?? "note"}`, "");
	writeFileSync(path, `${lines.join("\n")}\n`, "utf8");
}

function seedTree(cwd: string): void {
	writeNote(join(cwd, ".heio", "planning", "intent.md"), {
		id: "intent",
		status: "active",
		title: "Intent",
	});
	writeNote(join(cwd, ".heio", "planning", "roadmap.md"), {
		id: "roadmap",
		status: "active",
		title: "Roadmap",
	});
	writeNote(join(cwd, ".heio", "planning", "sprints", "coord", "shape.md"), {
		id: "coord",
		status: "active",
		title: "coord",
	});
	writeNote(join(cwd, ".heio", "planning", "sprints", "loop", "shape.md"), {
		id: "loop",
		status: "closed",
		title: "loop",
	});
	writeNote(
		join(
			cwd,
			".heio",
			"planning",
			"sprints",
			"coord",
			"slices",
			"s-lens",
			"spec.md",
		),
		{
			id: "s-lens",
			status: "frozen",
			title: "lens",
		},
	);
	writeNote(join(cwd, ".heio", "tickets", "ticket-01-x.md"), {
		id: "ticket-01-x",
		status: "open",
		title: "x",
	});
	writeNote(join(cwd, ".heio", "tickets", "ticket-02-y.md"), {
		id: "ticket-02-y",
		status: "parked",
		title: "y",
	});
}

describe("readStackStatus", () => {
	it("reports active sprint, current slice freeze, and open tickets", () => {
		const cwd = tempCwd();
		seedTree(cwd);
		assert.deepEqual(readStackStatus(cwd), {
			sprintId: "coord",
			sliceId: "s-lens",
			freeze: "frozen",
			tickets: ["ticket-01-x"],
		});
	});

	it("prefers an active slice over a frozen sibling", () => {
		const cwd = tempCwd();
		seedTree(cwd);
		writeNote(
			join(
				cwd,
				".heio",
				"planning",
				"sprints",
				"coord",
				"slices",
				"s-rails",
				"spec.md",
			),
			{
				id: "s-rails",
				status: "active",
				title: "rails",
			},
		);
		assert.deepEqual(readStackStatus(cwd), {
			sprintId: "coord",
			sliceId: "s-rails",
			freeze: "active",
			tickets: ["ticket-01-x"],
		});
	});

	it("does not write planning files", () => {
		const cwd = tempCwd();
		seedTree(cwd);
		const intentPath = join(cwd, ".heio", "planning", "intent.md");
		const before = readFileSync(intentPath, "utf8");
		readStackStatus(cwd);
		assert.equal(readFileSync(intentPath, "utf8"), before);
	});
});

describe("formatStackStatus", () => {
	it("renders a one-screen lens", () => {
		assert.equal(
			formatStackStatus({
				sprintId: "coord",
				sliceId: "s-lens",
				freeze: "frozen",
				tickets: ["ticket-01-x"],
			}),
			[
				"sprint: coord",
				"slice: s-lens",
				"freeze: frozen",
				"tickets: ticket-01-x",
			].join("\n"),
		);
	});
});
