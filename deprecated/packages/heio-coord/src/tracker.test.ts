import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { namedTracker } from "./tracker.ts";

function tempCwd(): string {
	return mkdtempSync(join(tmpdir(), "heio-coord-tracker-"));
}

describe("namedTracker", () => {
	it("reads heio-stack from the AGENTS.md Tracker section", () => {
		const cwd = tempCwd();
		writeFileSync(
			join(cwd, "AGENTS.md"),
			[
				"# Pack",
				"",
				"## Tracker",
				"",
				"This checkout runs **heio-stack**.",
				"",
			].join("\n"),
		);
		assert.deepEqual(namedTracker(cwd), {
			file: "AGENTS.md",
			name: "heio-stack",
		});
	});

	it("reads another tracker from WORKSPACE.md when AGENTS.md is silent", () => {
		const cwd = tempCwd();
		writeFileSync(
			join(cwd, "WORKSPACE.md"),
			["## Tracker", "", "This checkout runs **pstack**.", ""].join("\n"),
		);
		assert.deepEqual(namedTracker(cwd), {
			file: "WORKSPACE.md",
			name: "pstack",
		});
	});

	it("returns null when neither file names a tracker", () => {
		const cwd = tempCwd();
		writeFileSync(join(cwd, "AGENTS.md"), "# Pack\n");
		assert.equal(namedTracker(cwd), null);
	});
});
