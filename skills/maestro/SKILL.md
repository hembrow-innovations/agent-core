---
name: maestro
description: Drive React Native UI tests and flows with Maestro CLI. Use when writing, running, or debugging Maestro flows for mobile apps.
---

# Maestro (React Native)

Thin playbook for Maestro end-to-end flows. Discover project layout at runtime; do not invent paths.

## Prerequisites

```bash
which maestro || echo "Maestro CLI not on PATH — install from https://maestro.mobile.dev"
maestro --version
```

If missing, tell the user how to install and stop until available.

## Discover project conventions

Before writing or changing flows:

1. Find existing Maestro config/flows: `.maestro/`, `maestro/`, `e2e/maestro/`, or `**/*.yaml` that look like Maestro flows (`appId:`, `tapOn:`, `launchApp`).
2. Read `README`, `package.json` scripts, and CI configs for how flows are run.
3. Prefer matching existing naming, folder layout, and `appId` / launch args.

If none exist, propose a default (e.g. `.maestro/`) and confirm with the user before creating files.

## Canonical commands

```bash
# Run a single flow
maestro test path/to/flow.yaml

# Run a folder of flows
maestro test .maestro/

# Interactive studio (when useful for authoring)
maestro studio
```

Use project scripts when present (`npm run e2e`, etc.) instead of inventing new entrypoints.

## Authoring rules

- One user-visible behavior per flow when practical; share setup via Maestro subflows if the project already does.
- Prefer stable selectors the app already exposes (testIDs / accessibility IDs). Add testIDs in app code when selectors are brittle — don't only hack the flow.
- Assert observable UI outcomes, not implementation details.
- Keep waits explicit and justified; prefer Maestro assertions that wait for elements over blind `sleep`.

## Debug loop

1. Reproduce with `maestro test <flow>` (or the project script).
2. Read failure output / screenshots / hierarchy dumps Maestro provides.
3. Minimize: smallest flow that still fails.
4. Fix app or flow; re-run until green.
5. If flaky, harden selectors and synchronization — don't mask with long sleeps.

## Out of scope

Full Maestro manual, device lab setup, and Detox/Appium unless the user asks to migrate.
