---
title: Maestro runs on a release build
impact: HIGH
impactDescription: debug inputText hangs
tags: [e2e, maestro, native]
---

## Maestro runs on a release build

Drive device flows with Maestro YAML. Prefer a release APK / IPA. Debug builds make `inputText` hit DEADLINE. `hideKeyboard` often sends back.

**Incorrect:** `maestro test` against a Metro debug bin, then adding long waits to paper over hangs.

**Correct:** Use the repo's mobile E2E script if it exists. Otherwise `maestro test path/to/flow.yaml` against a release build. Put flows where the repo already keeps them (`.maestro/`, `e2e/mobile/`, …). Share login via `runFlow` / partials if those exist.

Notes: Device boot details are the **maestro** skill. Discover `appId` and seed users from existing flows. Unit tests stay on Jest.
