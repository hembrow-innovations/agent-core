---
id: "spec-hivemind"
title: "Hivemind spec"
kind: spec
description: "Behaviour of the out-of-session predicate machine: watch, match, claim, spawn, quarantine."
status: draft
domain: hivemind
area: hivemind
tags: [spec]
created_at: "2026-09-01"
updated_at: "2026-09-01"
---

# Hivemind spec

## Goal

Define how Hivemind runs outside a session: which files it understands, when it spawns, what it may write, and when it must stop.

## Requirements

Hivemind is a TypeScript CLI installed to `.pi/frameworks/hivemind/` ([[0015-hivemind-is-a-framework]]).

Commands:

- **`watch`**: resident predicate loop. Scan, spawn up to `concurrency`, wait on fs events or backoff. Flags `--until-quiet` (exit when a scan finds nothing to spawn and no children live) and `--until-target <path>` (exit when that path exists).
- **`once`**: one scan, spawn what matches under concurrency, wait for those children, exit.

Runtime config is project-root `hivemind.yaml` ([[schema-hivemind]]). Absent file is fatal. The engine does not overlay a shipped pack.

The supervisor reads **YAML front matter keys only**. It does not parse intent, spec prose, oracles bodies, or product code.

Per-folder schema is fail-closed. A typed file with parse error, unknown keys, illegal enum, or missing required key is a **fault**.

On fault the supervisor **moves** the file to the configured quarantine folder (heio-stack template: `.heio/quarantine/`) and writes only:

- **`origin-location`**: project-relative path it came from
- **`quarantined-at`**: ISO timestamp
- **`fault`**: machine code (`missing-key:id`, `illegal-enum:status`, `parse-error`, …)

No body. No `status`. No `blocked-by`. No `caused-by`. That chain stops. No mint. No built-in Doctor.

A lane `trigger` matches front matter on files in configured folders. Plan-like lanes match a **configured status** (template: ticket `ready-for-agent`). A ticket at `ready-for-human` does not match that trigger.

Before spawn the supervisor **CAS**s the candidate: if `status` still equals the trigger status, write `claim-status` and `claimed-by: <run-id>`. If the file changed, skip. Supervisor write allowlist for claim is those two keys only.

`cmd` interpolates `{{…}}` and `{{env.NAME}}`, tokenizes, `exec`s argv. No shell. Missing env or leftover `{{` → do not spawn.

An agent process **dies when its unit ends**. The supervisor does not walk the backlog inside one child.

Two live children whose declared `exclusive`/`scope` sets overlap are not spawned together. v1 does not audit writes after exit.

## Non-goals

- In-session orchestration (Pi `/` command, tmux team-lead, AFK orchestrator)
- Supervisor understanding of markdown bodies
- Built-in Doctor, Mint, visual QA, E2E, skill-fixer
- Typed harness adapters
- Overlay merge
- Exclusive path audit, required worktrees, OS sandbox
- Secrets files or vaults
- Unsealing sealed spec + EXPECT
- Lanes that write intent or location destination sentences
- Inventing work when no matching ticket exists

## Behaviour

### Install

Profile lists `frameworks: [hivemind]`. Install copies `frameworks/hivemind/package.json` and non-test `src/` to `.pi/frameworks/hivemind/`. Reinstall overwrites that tree. Not a `packages` entry. See [[spec-installer]].

If the profile has `hivemind.yaml` and dest project-root `hivemind.yaml` is missing, copy once. Reinstall does not overwrite.

### Scan

Watch configured paths. Parse front matter. Validate schema. Fault → quarantine and continue the rest of the scan.

Walk `blocked-by` / `caused-by` only as **id strings** for skip/need predicates. Do not interpret prose.

Match lanes whose `trigger` is true and `need` holds. Order is file order in `lanes`. Spawn at most `concurrency` live children.

If a lane has no match, apply `backoff`. Do not spawn another lane “because this one is idle.”

### Claim and spawn

Generate `run-id`. CAS claim. Interpolate. `exec`. Wait. Child exit does not by itself flip further status; the **agent** writes remaining keys it owns. Supervisor does not read the body to decide success.

`watch` then sleeps until an fs event or backoff. `once` waits for the children from this scan and exits.

### Heio-stack template (not core)

The profile template may describe this loop. Core does not hardcode the nouns.

- Inherit live `.heio/` map. Add `.heio/quarantine/`.
- **Sealed**: spec + EXPECT are immutable once written. Miss → new ticket, no unseal.
- Slice status **`ready`** means schedulable (replaces `frozen` in this template). Then `active` / `released` / `failed`. Failed stays sealed.
- Tickets include `ready-for-agent` and `ready-for-human`.
- Plan: one matching ticket per life. No match → exit. Does not invent work. Does not write `tasks.md`, product code, or intent.
- Tasker: writes `tasks.md` once from a sealed spec. Separate life from Plan.
- Build: next unchecked task on a ready/active slice. Does not write intent, EXPECT, or other slices.
- Review: released work or quiet queue. Miss → new file under `.heio/tickets/` with `caused-by`, `failed`, `intent: fix|extend`. `mint-status` default `ready-for-human`. Old slice sealed + `failed`. Does not write product code or EXPECT.
- Mint: omitted or `disable`d unless the user writes it.
- Doctor: not shipped. User may add a lane on `quarantine/`.
- Intent: human only. EXPECT is the only product-vs-docs judge. Named doc paths in sealed oracles can fail a slice; unnamed docs cannot.

### Quality

- No Build without sealed spec + EXPECT (`need` on the Build lane).
- No “done” without Review + oracle reverify if the user configured that lane.
- Fixes are new tickets with lineage.
- Front matter rot is quarantine, not inference.

## Acceptance

- Missing project-root `hivemind.yaml` exits non-zero without spawn
- Unknown yaml keys exit non-zero
- `once` with no matching files exits zero and spawns nothing
- A ticket at `ready-for-human` does not start a lane triggered on `ready-for-agent`
- Two `once` processes cannot both CAS-claim the same file
- Faulty front matter lands in quarantine with only `origin-location`, `quarantined-at`, `fault`
- `{{env.SECRET}}` with unset SECRET does not spawn and does not print the name’s value as a secret dump
- `cmd` with metacharacters in an interpolated path does not invoke a shell
- Reinstall of the framework tree does not change dest `hivemind.yaml`
- Supervisor does not write `caused-by` or intent files

## Open questions

- (none)
