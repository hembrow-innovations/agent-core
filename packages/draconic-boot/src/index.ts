import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type {
  ExtensionAPI,
  ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { parseAgentDefinition, type AgentDefinition } from "./definition.ts";

function agentFile(cwd: string, name: string): string {
  return join(cwd, ".pi", "agents", `${name}.md`);
}

function loadAgent(cwd: string, name: string): AgentDefinition | undefined {
  const path = agentFile(cwd, name);
  if (!existsSync(path)) return undefined;
  try {
    return parseAgentDefinition(readFileSync(path, "utf8"));
  } catch {
    return undefined;
  }
}

function flagString(pi: ExtensionAPI, name: string): string | undefined {
  const value = pi.getFlag(name);
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function paint(ctx: Pick<ExtensionContext, "ui">, name: string): void {
  try {
    ctx.ui.setStatus("agent", name);
  } catch {
    // print mode
  }
}

function notify(ctx: Pick<ExtensionContext, "ui">, message: string): void {
  try {
    ctx.ui.notify(message, "info");
  } catch {
    // print mode
  }
}

function bindActiveTools(
  pi: Pick<ExtensionAPI, "getActiveTools" | "getAllTools" | "setActiveTools">,
  definition: AgentDefinition | undefined,
  snapshot: string[] | null,
): string[] | null {
  if (!definition || definition.tools === undefined) {
    if (snapshot) pi.setActiveTools(snapshot);
    return snapshot;
  }
  const nextSnapshot = snapshot ?? pi.getActiveTools();
  const all = pi.getAllTools();
  const active = new Set(pi.getActiveTools());
  const builtin = new Set(
    all
      .filter((tool) => tool.sourceInfo.source === "builtin")
      .map((tool) => tool.name),
  );
  const valid = definition.tools.filter((name) => builtin.has(name));
  if (valid.length === 0) return nextSnapshot;
  const extensions = all
    .filter(
      (tool) => tool.sourceInfo.source !== "builtin" && active.has(tool.name),
    )
    .map((tool) => tool.name);
  pi.setActiveTools([...new Set([...valid, ...extensions])]);
  return nextSnapshot;
}

export default function (pi: ExtensionAPI) {
  pi.registerFlag("agent", {
    description: "Dest .pi/agents stem for this process",
    type: "string",
    default: undefined,
  });

  let selected: string | null = null;
  let toolsSnapshot: string[] | null = null;

  function currentStem(): string | null {
    return selected;
  }

  function loadCurrent(cwd: string): AgentDefinition | undefined {
    const stem = currentStem();
    return stem ? loadAgent(cwd, stem) : undefined;
  }

  function applyDefinition(
    ctx: ExtensionContext,
    def: AgentDefinition | undefined,
  ): void {
    toolsSnapshot = bindActiveTools(pi, def, toolsSnapshot);
    paint(ctx, def?.name ?? "off");
  }

  function selectNone(ctx: ExtensionContext): void {
    selected = null;
    applyDefinition(ctx, undefined);
    notify(ctx, "agent off");
  }

  pi.on("session_start", (_event, ctx) => {
    const flagged = flagString(pi, "agent");
    if (flagged && loadAgent(ctx.cwd, flagged)) selected = flagged;
    applyDefinition(ctx, loadCurrent(ctx.cwd));
  });

  pi.on("before_agent_start", (event, ctx) => {
    const def = loadCurrent(ctx.cwd);
    applyDefinition(ctx, def);
    if (!def) return;
    return {
      systemPrompt: `${event.systemPrompt}\n\n${def.body}`,
    };
  });

  pi.registerCommand("agent", {
    description:
      "Select a dest .pi/agents file for this process. off clears it",
    async handler(args, ctx) {
      const raw = args.trim();
      if (raw === "" || raw === "default" || raw === "off") {
        selectNone(ctx);
        return;
      }
      const def = loadAgent(ctx.cwd, raw);
      if (!def) {
        notify(ctx, `unknown agent: ${raw}`);
        return;
      }
      selected = raw;
      applyDefinition(ctx, def);
      notify(ctx, `agent ${def.name}`);
    },
  });
}
