---
id: "adr-19"
title: "ADR-0019: Hivemind lives in its own repo"
kind: adr
description: "This pack is the AI installer. Hivemind is a separate repo. No frameworks/ tree and no profile frameworks: key."
status: accepted
domain: pack
area: decisions
tags: [installer, profiles]
created_at: "2026-09-03"
updated_at: "2026-09-03"
---

# ADR-0019: Hivemind lives in its own repo

Supersedes ADR-0015 and ADR-0018.

## Context

Hivemind was an optional out-of-session framework in this checkout: source under `frameworks/hivemind/`, profile `frameworks:`, dest copy `.pi/frameworks/hivemind/`, write-if-missing `.hivemind/hivemind.yaml`.

That product now has its own repo so it can move independently. This checkout is the AI installer: project profiles, dest copies, and the libraries those dests load (agents, skills, prompts, first-party extensions).

Keeping a second product tree here mixed installer work with a supervisor that dests no longer get from this pack.

## Decision

This pack does not ship Hivemind.

- No `frameworks/` source tree.
- Profile `frameworks:` is a leftover-key error. Message: `hivemind is not installed from this pack`.
- Install does not write `.pi/frameworks/` or `.hivemind/hivemind.yaml`.
- `profiles/hivemind` stays. It installs this pack into the Hivemind dest. It does not copy the Hivemind program.
- Agents, skills, prompts, and first-party extensions stay here.

## Alternatives considered

Keep a generic `frameworks:` install hook with an empty tree. Dead weight. The only framework was Hivemind.

Keep Hivemind source here and publish from two remotes. The split is a map decision. The source left.

## Consequences

A dest that still runs Hivemind owns that program and its yaml. Reinstall of this pack does not seed or overwrite them.

Installer tests and repo checks no longer assert a frameworks dest.

## Relationships

- Supersedes ADR-0015 and ADR-0018
- Profile YAML: [[schema-profile]]
- Installer: [[spec-installer]]
- Layout: [[architecture-pack-and-packages]]
