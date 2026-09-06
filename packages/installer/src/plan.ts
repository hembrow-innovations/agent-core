import {
  listAgentIds,
  listResolvableAgentIds,
} from "./agents.ts";
import {
  listPromptIds,
  listResolvablePromptIds,
} from "./prompts.ts";
import {
  resolveNamedIds,
  type Profile,
  type SelectionResolveOpts,
} from "./profile.ts";
import { loadAllStacks, type StackContents } from "./stacks.ts";

export type InstallRequest = {
  kind: "install";
  target: string;
  profile: string | null;
  with: string[];
  without: string[];
};

export type AvailableIds = {
  agents: string[];
  prompts: string[];
};

export type InstallCatalog = {
  packAgents: string[];
  packPrompts: string[];
  agents: string[];
  prompts: string[];
  stacks: Record<string, StackContents>;
};

export type InstallPlan = {
  skills: string[];
  agentIds: string[];
  overlayAgents: boolean;
  promptIds: string[];
  overlayPrompts: boolean;
};

const NO_SELECTION_OPTS: SelectionResolveOpts = {
  replace: null,
  add: [],
  remove: [],
};

export function catalogFromSource(srcRoot: string): InstallCatalog {
  return {
    packAgents: listAgentIds(srcRoot),
    packPrompts: listPromptIds(srcRoot),
    agents: listResolvableAgentIds(srcRoot),
    prompts: listResolvablePromptIds(srcRoot),
    stacks: loadAllStacks(srcRoot),
  };
}

export function planFromProfile(
  profile: Profile,
  opts: InstallRequest,
  available: AvailableIds | InstallCatalog,
): InstallPlan {
  const catalog = toCatalog(available);
  const fromStacks = mergeStacks(profile.stacks, catalog.stacks);
  const set = new Set([...profile.skills, ...fromStacks.skills]);
  for (const s of opts.with) set.add(s);
  for (const s of opts.without) set.delete(s);
  const agentIds = uniqueIds([
    ...resolveNamedIds(
      profile.agents,
      NO_SELECTION_OPTS,
      profile.agents.kind === "all" ? catalog.packAgents : catalog.agents,
      "agent",
    ),
    ...fromStacks.agents,
  ]);
  const promptIds = uniqueIds([
    ...resolveNamedIds(
      profile.prompts,
      NO_SELECTION_OPTS,
      profile.prompts.kind === "all" ? catalog.packPrompts : catalog.prompts,
      "prompt",
    ),
    ...fromStacks.prompts,
  ]);
  return {
    skills: [...set].sort(),
    agentIds: agentIds.sort(),
    overlayAgents: profile.agents.kind !== "omit" || fromStacks.agents.length > 0,
    promptIds: promptIds.sort(),
    overlayPrompts:
      profile.prompts.kind !== "omit" || fromStacks.prompts.length > 0,
  };
}

function toCatalog(available: AvailableIds | InstallCatalog): InstallCatalog {
  if ("stacks" in available) return available;
  return {
    packAgents: available.agents,
    packPrompts: available.prompts,
    agents: available.agents,
    prompts: available.prompts,
    stacks: {},
  };
}

function mergeStacks(
  names: string[],
  stacks: Record<string, StackContents>,
): StackContents {
  const skills: string[] = [];
  const agents: string[] = [];
  const prompts: string[] = [];
  for (const name of names) {
    const stack = stacks[name];
    if (!stack) throw new Error(`Unknown stack "${name}"`);
    skills.push(...stack.skills);
    agents.push(...stack.agents);
    prompts.push(...stack.prompts);
  }
  return { skills, agents, prompts };
}

function uniqueIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}
