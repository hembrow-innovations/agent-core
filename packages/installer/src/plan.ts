import {
  resolveNamedIds,
  type Profile,
  type SelectionResolveOpts,
} from "./profile.ts";

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

export function planFromProfile(
  profile: Profile,
  opts: InstallRequest,
  available: AvailableIds,
): InstallPlan {
  const set = new Set(profile.skills);
  for (const s of opts.with) set.add(s);
  for (const s of opts.without) set.delete(s);
  return {
    skills: [...set].sort(),
    agentIds: resolveNamedIds(
      profile.agents,
      NO_SELECTION_OPTS,
      available.agents,
      "agent",
    ),
    overlayAgents: profile.agents.kind !== "omit",
    promptIds: resolveNamedIds(
      profile.prompts,
      NO_SELECTION_OPTS,
      available.prompts,
      "prompt",
    ),
    overlayPrompts: profile.prompts.kind !== "omit",
  };
}
