import {
  packageRefSource,
  type FirstPartyExtension,
  type ProfilePackage,
} from "./extensions.ts";
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
  extensions: FirstPartyExtension[];
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
  packages: ProfilePackage[];
  settings: Record<string, unknown> | null;
};

const NO_SELECTION_OPTS: SelectionResolveOpts = {
  replace: null,
  add: [],
  remove: [],
};

export function resolvePackages(
  profilePackages: readonly ProfilePackage[],
  cliNames: readonly FirstPartyExtension[],
): ProfilePackage[] {
  const out: ProfilePackage[] = [];
  const seen = new Set<string>();
  const cli: ProfilePackage[] = cliNames.map((name) => ({
    kind: "local",
    name,
  }));
  for (const pkg of [...profilePackages, ...cli]) {
    const key = packageRefSource(pkg);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(pkg);
  }
  return out;
}

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
    packages: resolvePackages(profile.packages, opts.extensions),
    settings: profile.settings,
  };
}
