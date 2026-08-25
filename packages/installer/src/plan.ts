import {
  FIRST_PARTY_EXTENSIONS,
  isFirstPartyExtension,
  type FirstPartyExtension,
} from "./extensions.ts";
import { resolvePlaybookIds } from "./playbooks.ts";
import type { Profile } from "./profile.ts";

export type InstallRequest = {
  kind: "install";
  target: string;
  profile: string | null;
  with: string[];
  without: string[];
  playbooks: string[] | null;
  withPlaybooks: string[];
  withoutPlaybooks: string[];
  extensions: FirstPartyExtension[];
};

export type InstallPlan = {
  skills: string[];
  playbookIds: string[];
  overlayPlaybooks: boolean;
  extensions: FirstPartyExtension[];
};

export function resolveExtensions(
  profileNames: string[],
  cliNames: readonly FirstPartyExtension[],
): FirstPartyExtension[] {
  const out: FirstPartyExtension[] = [];
  const seen = new Set<FirstPartyExtension>();
  for (const name of [...profileNames, ...cliNames]) {
    if (!isFirstPartyExtension(name)) {
      throw new Error(
        `Unknown extension: ${name}. Choose: ${FIRST_PARTY_EXTENSIONS.join(", ")}`,
      );
    }
    if (seen.has(name)) continue;
    seen.add(name);
    out.push(name);
  }
  return out;
}

export function planFromProfile(
  profile: Profile,
  opts: InstallRequest,
  available: string[],
): InstallPlan {
  const set = new Set(profile.skills);
  for (const s of opts.with) set.add(s);
  for (const s of opts.without) set.delete(s);
  return {
    skills: [...set].sort(),
    playbookIds: resolvePlaybookIds(profile, opts, available),
    overlayPlaybooks:
      profile.playbooks.kind !== "omit" ||
      opts.playbooks != null ||
      opts.withPlaybooks.length > 0,
    extensions: resolveExtensions(profile.extensions, opts.extensions),
  };
}
