import { existsSync } from "node:fs";
import { delimiter, join } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

const MISSING = "onic is not installed";

function resolveOnicBinary(env: NodeJS.ProcessEnv): string | undefined {
	const path = env.PATH ?? "";
	for (const dir of path.split(delimiter)) {
		if (!dir) continue;
		const candidate = join(dir, "onic");
		if (existsSync(candidate)) return candidate;
	}
	return undefined;
}

export default function (pi: ExtensionAPI) {
	pi.registerTool({
		name: "heio_onic",
		label: "Heio onic",
		description:
			"Query a code neighborhood via onic. Missing binary fails closed with a reason.",
		promptSnippet: "Query a code neighborhood with heio_onic",
		parameters: Type.Object({}),
		async execute() {
			const missing = resolveOnicBinary(process.env) === undefined;
			const text = missing ? MISSING : "onic is installed";
			return {
				content: [{ type: "text" as const, text }],
				details: { error: missing ? MISSING : "" },
			};
		},
	});
}
