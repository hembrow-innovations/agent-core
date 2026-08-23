import assert from "node:assert/strict";
import { test } from "node:test";
import bootExtension from "./index.ts";

test("registers a session_start handler that sets status draconic / draconic", async () => {
	const statuses: Array<[string, string | undefined]> = [];
	let sessionStart:
		| ((
				event: unknown,
				ctx: { ui: { setStatus: (key: string, text: string | undefined) => void } },
		  ) => unknown)
		| undefined;

	bootExtension({
		on(event, handler) {
			if (event === "session_start") {
				sessionStart = handler;
			}
		},
	});

	assert.equal(typeof bootExtension, "function");
	assert.equal(typeof sessionStart, "function");
	if (!sessionStart) {
		throw new Error("factory did not register session_start");
	}

	await sessionStart(
		{},
		{
			ui: {
				setStatus(key, text) {
					statuses.push([key, text]);
				},
			},
		},
	);

	assert.deepEqual(statuses, [["draconic", "draconic"]]);
});
