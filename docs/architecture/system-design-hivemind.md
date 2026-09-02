---
id: "system-design-hivemind"
title: "Hivemind system design"
kind: system-design
description: "Out-of-session predicate machine: config, scan, claim, spawn, quarantine. Lanes are yaml. Core has no heio-stack nouns."
status: draft
domain: hivemind
area: architecture
tags: [hivemind]
created_at: "2026-09-01"
updated_at: "2026-09-02"
---

# Hivemind system design

## Overview

Hivemind is an out-of-session **predicate machine**. It watches typed markdown in a dest project, reads **YAML front matter only**, matches **lanes** from project-root `hivemind.yaml`, and starts **short-lived** child processes. It does not understand intent prose, product code, or “what the app should be.” Quality is gates on disk.

It is not coord, not a Pi extension, not tmux team-lead, not the AFK orchestrator. Those are in-session bosses. Hivemind is a watcher plus a spawner. Every **agent** life is one planning, build, or review **unit**. Endless operation is `watch` + backoff + optional user-written Mint, not one process that keeps planning.

Source: `frameworks/hivemind/`. Dest program: `.pi/frameworks/hivemind/`. Decisions: [[0015-hivemind-is-a-framework]], [[0016-profiles-are-directories]]. Behaviour: [[spec-hivemind]]. Config: [[schema-hivemind]]. Job: [[purpose-hivemind]].

## Components

### CLI

Bin name `hivemind`. Commands `watch` and `once`. Flags `--until-quiet` and `--until-target <path>` on `watch`. v1 entry is `node --experimental-strip-types .pi/frameworks/hivemind/src/cli.ts`. Not a Pi `/` command. Host units (launchd, systemd, cron) wrap `watch` or `once`; they are not shipped.

### Config loader

Reads project-root `hivemind.yaml`. Fail-closed on missing file, parse error, or unknown keys. No merge with a default pack. No `hivemind.local.yaml`. No vault.

The heio-stack **template** lives at `profiles/<name>/hivemind.yaml` and is copied once at install. After that the dest file is the contract.

### Journal

A small `record` interface. Implementation writes one human line to stderr and, if `history` is set, appends a TSV row. Callers pass events (`scan`, `quarantine`, `skip`, `claim`, `spawn`, `exit`). The journal never sees interpolated argv or env values.

### Scanner

Watches the paths in config. On event or tick: list files in typed folders, parse front matter, validate the folder’s schema.

Discovery is explicit globs and typed folders. Not “AI finds files.”

### Quarantine

Faulty notes move to the configured quarantine folder. Supervisor writes only `origin-location`, `quarantined-at`, `fault`. Folder type is enough for a later user lane. Engine does not mint a ticket and does not spawn a Doctor.

### Matcher

For each lane in file order: files whose front matter satisfies `trigger` and `need`. Skip files with a live `claimed-by` whose process is still running. Skip when overlapping `exclusive`/`scope` with a live child.

Starvation: if Build’s `when` is false, backoff. Do not spawn Plan because Build is idle.

### Claim

Before spawn, CAS the file: read `status`, if it still matches `trigger.status`, write `claim-status` and `claimed-by: <run-id>`. Race → skip that file. This is the third supervisor write (with quarantine keys). It is consuming a predicate, not planning.

### Spawner

Interpolate `{{agent}}`, `{{prompt}}`, `{{cwd}}`, `{{exclusive}}`, `{{lane}}`, `{{env.NAME}}`. Tokenize. `exec` argv. No `/bin/sh -c`. No `$VAR`. Unmatched quotes or leftover `{{` → do not spawn.

There is no adapter module. A lane’s `cmd` is the adapter. Pi, Claude Code, OpenCode, or any binary on `PATH` is a template string. v1 dogfoods Pi by writing a Pi `cmd` in the template, not by importing Pi.

Env values come from `process.env` only. Missing or empty `{{env.NAME}}` → do not spawn. Never log the value. direnv, launchd, and CI fill the environment.

### Backoff and concurrency

At most `concurrency` live children. Non-overlapping declared exclusive sets. When `when` is false, sleep `backoff`. `watch` waits on the next fs event. Children are never reused for a second unit.

## Interfaces

- **Install**: profile `frameworks: [hivemind]` → dest `.pi/frameworks/hivemind/` plus write-if-missing `hivemind.yaml`. See [[spec-installer]] and [[schema-profile]].
- **Run**: `hivemind watch|once` from a trusted project cwd.
- **Config**: [[schema-hivemind]].
- **File contract**: folder type + front-matter keys + presence/absence of artifacts (spec + EXPECT before tasks). Bodies are for agents.

## Data model

Entities the **engine** knows:

- **Typed folder**: path + schema name + required keys.
- **Note**: path + front-matter map. Body ignored.
- **Lane**: id, cmd template, trigger, need, exclusive, backoff, claim-status.
- **Run**: run-id, lane, claimed path, child pid, exclusive set.
- **Fault**: machine code on a quarantined note.
- **History row**: timestamp, action, lane, path, run-id, detail. Optional file.

Entities the **heio-stack template** names (not core):

- Ticket, slice, spec, oracles/EXPECT, tasks, intent, roadmap, archive.
- **Sealed**: rule that spec + EXPECT are immutable.
- Slice status `ready` (schedulable), then `active` / `released` / `failed`.
- Ticket status `ready-for-agent` / `ready-for-human` (and claim-status `active`).
- Lineage keys on Review-minted tickets: `caused-by`, `failed`, `intent: fix|extend`.

Supervisor write allowlist:

- Quarantine move: `origin-location`, `quarantined-at`, `fault`
- Claim: `status` (to `claim-status`), `claimed-by`

No other keys. No markdown body.

## Interactions

### Walk-away loop

Human (or CI) starts `hivemind watch` in a dest that lists Hivemind. Open tickets at `ready-for-agent` match Plan. Plan CAS-claims one, runs, writes sealed spec + EXPECT, dies. Tasker matches sealed-without-tasks, writes `tasks.md`, dies. Build matches ready/active with unchecked tasks, dies after one unit. Review matches released/unverified; on miss writes a new ticket at `mint-status` (default `ready-for-human`) and marks the slice `failed` without unsealing. Queue quiet → sleep. Human promotes `ready-for-human` when they want the loop to consume a miss.

### Human-gated project

Mint off. Tickets start at `ready-for-human` or stay there. Human flips to `ready-for-agent` or runs `once` when they want a unit. Empty matching set → Plan does not spawn.

### Format fault

Illegal front matter → move to quarantine with three keys → stop that chain. User fixes the file or adds their own Doctor lane later.

## Error handling

- Config missing/illegal: process exits non-zero. No spawn.
- Note fault: quarantine, continue scan.
- CAS race: skip file.
- Child non-zero: supervisor does not parse why. It does not unseal. It does not mint. The agent (or a Review lane) owns status on the claimed note.
- Missing `{{env.NAME}}`: skip spawn of that lane this tick.
- Overlapping exclusive with a live run: skip until the other child exits.

Retries are backoff + another short life, not a long-lived planner.

## Trade-offs

Optimises for a stupid, auditable supervisor and portable lane files. Sacrifices a built-in adapter API, default-pack overlay, exclusive write sandbox, and auto-repair of bad front matter.

Rejected:

- Core as a Pi wrapper (agnostic would be a comment).
- Shell `-c` after interpolation (injection).
- Overlay merge (hidden defaults).
- Quarantine + mint (Plan as janitor; Doctor/Mint/Review all writing tickets).
- Intent as judge (false-done).
- Unsealing failed slices (freeze theater, under the old name).
- Exclusive git audit in v1 (left to skills/harness; overlap-at-spawn remains).
- Directory dest `frameworks/` at project root (breaks dest-is-`.pi` for the program).

Naming: **sealed** is the permanence rule; **ready** is the schedulable slice status. “Freeze” sounded like blocked.

v1 honesty on ownership: the engine will not audit that a child stayed inside `exclusive`. Skills and the harness must. The scheduler still refuses overlapping live sets.

## See also

- [[glossary]]
- [[architecture-pack-and-packages]]
- [[0013-heio-stack-location-map]]
