---
id: "adr-16"
title: "ADR-0016: profiles are directories"
kind: adr
description: "Each profile is profiles/<name>/profile.yaml. Optional hivemind.yaml in that directory is the write-if-missing dest template."
status: accepted
domain: pack
area: decisions
tags: [installer, profiles, hivemind]
created_at: "2026-09-01"
updated_at: "2026-09-01"
---

# ADR-0016: profiles are directories

## Context

Profiles are flat `profiles/<name>.yaml`. Allowed keys are `skills`, `agents`, `prompts`, `packages`, `settings`. Hivemind needs a committed **full** lane file, not an overlay merge onto a shipped pack. That template has to live next to the profile that opts into the framework, and dest must own the copy after first install.

Deep-merging dest `hivemind.yaml` with a default pack hides triggers the user thought they overrode. Full-replace (ignore the pack when any yaml exists) forces every project to duplicate the whole file with no template on first install.

## Decision

A profile is a directory. The name is the folder stem.

- Load `profiles/<name>/profile.yaml`. Flat `profiles/<name>.yaml` is not a profile.
- Optional `profiles/<name>/hivemind.yaml` is the template for dest project-root `hivemind.yaml`.
- On profile install, if the profile lists `hivemind` and dest has no project-root `hivemind.yaml`, copy the template once. Reinstall never overwrites it.
- The dest file is the only runtime contract. No overlay merge with anything under `.pi/frameworks/hivemind/`.
- The user writes the full yaml. The profile file is an offer, not a live parent.

## Alternatives considered

Keep flat profile yaml and store the template only under `frameworks/hivemind/`. Then the profile that opts in has no sibling template; first-install copy needs a second lookup.

Deep-merge dest yaml onto a shipped pack. Half-overridden lanes. Hidden defaults.

Always overwrite dest `hivemind.yaml` from the profile. Dest cannot keep local lane edits across reinstall.

Never copy to dest. Every project hand-copies. Dogfood and first install suffer.

## Consequences

Every existing `profiles/*.yaml` moves to `profiles/<name>/profile.yaml`. `loadProfile` and `listProfiles` change. [[schema-profile]] and [[spec-installer]] follow.

A profile without Hivemind is still a directory (possibly only `profile.yaml`).

Dest lane config is not installer-owned after the first write.

## Relationships

- [[0015-hivemind-is-a-framework]]
- [[schema-profile]]
- [[spec-installer]]
- [[schema-hivemind]]
- [[purpose-hivemind]]
- [[architecture-pack-and-packages]]
- [[glossary]]
