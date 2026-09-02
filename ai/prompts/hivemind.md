---
description: Build Hivemind from the sealed docs design
argument-hint: "[unit]"
---

# Hivemind build

You own **landing** the sealed Hivemind design in this checkout. You do not reopen it. You do not invent a smarter supervisor.

The design is already confirmed. Authority is `docs/`, not this chat. If a unit argument is present, do only that unit. Otherwise run the units in order until the done predicate holds or you must stop. Use subagents for unit work. Load **unpark** before spawn.

$ARGUMENTS

## Authority (read first, this order)

1. [[purpose-hivemind]] — `docs/specs/hivemind/purpose-hivemind.md`
2. [[0015-hivemind-is-a-framework]] — `docs/decisions/adr/0015-hivemind-is-a-framework.md`
3. [[0016-profiles-are-directories]] — `docs/decisions/adr/0016-profiles-are-directories.md`
4. [[spec-hivemind]] — `docs/specs/hivemind/spec-hivemind.md`
5. [[schema-hivemind]] — `docs/api/schema/schema-hivemind.md`
6. [[system-design-hivemind]] — `docs/architecture/system-design-hivemind.md`
7. [[schema-profile]] and [[spec-installer]] — installer contract already updated
8. Location `.heio/planning/locations/hivemind.md`

Do not treat `ai/agents/orchestrator`, `ai/agents/afk-orchestrator`, or `ai/playbooks/orchestrate.md` as the product. Those are the in-session bosses Hivemind is not.

## Standing orders

Copy into every worker brief.

1. Supervisor reads **YAML front matter keys only**. No body parse.
2. Supervisor writes only: quarantine `origin-location`, `quarantined-at`, `fault`; claim `status` (to `claim-status`) and `claimed-by`.
3. `cmd` is a template. Interpolate `{{name}}` and `{{env.NAME}}`, tokenize, `exec` argv. **No shell.**
4. Missing or empty `{{env.NAME}}` → do not spawn. Never log the value.
5. No overlay merge. Dest `hivemind.yaml` is the full contract. Template is write-if-missing.
6. No built-in Doctor, Mint, adapter module, exclusive path audit, worktree-as-core, vault, or secrets file.
7. No unseal. No lane that writes intent.
8. Plan does not invent work. Ticket status comes from lane config (`ready-for-agent` vs `ready-for-human` in the template).
9. Language: **TypeScript**. Scripts in this repo: **js/mjs only**. Markdown: **no tables**.
10. Load **tdd** and **typescript-best-practices** for every `.ts` change. Red before green. Tests at public seams (`cli`, `loadConfig`, `scan`, `claim`, `spawn`).
11. Product code for the engine lives in `frameworks/hivemind/`, not `packages/`.
12. After a source skill/prompt/profile change, reinstall only when dest `.pi/` must prove install: `pnpm exec agentic-core install . --profile agentic-core`.
13. Verify: `pnpm test` and `pnpm run typecheck`. Also the package under test (`packages/installer`, later `frameworks/hivemind`).
14. One writer per cwd. Independent units may use worktrees. Do not share a dirty tree.
15. If docs and this prompt disagree, **docs win**. If the unit needs a product choice not in docs, **stop** and ticket it. Do not guess.

## Done predicate

All of these are true:

- `profiles/<name>/profile.yaml` exists for every shipped profile. Flat `profiles/<name>.yaml` is gone. `loadProfile` / `listProfiles` / installer tests pass.
- Profile key `frameworks:` copies `frameworks/<name>/` to `.pi/frameworks/<name>/` (`package.json` + non-test `src/`). Not a settings `packages` entry. Reinstall overwrites that tree.
- First install copies `profiles/<name>/hivemind.yaml` to dest project-root `hivemind.yaml` only if missing. Reinstall does not overwrite it.
- `frameworks/hivemind` is a runnable CLI: `watch` and `once`; flags `--until-quiet`, `--until-target <path>`.
- Missing dest `hivemind.yaml` → non-zero, no spawn.
- Unknown yaml keys → non-zero.
- Faulty front matter → moved to configured quarantine with only the three keys.
- CAS claim: two `once` processes cannot both take the same matching file.
- `ready-for-human` does not match a lane triggered on `ready-for-agent`.
- `cmd` with metacharacters in an interpolated path does not invoke a shell.
- Unset `{{env.SECRET}}` does not spawn.
- `profiles/agentic-core/hivemind.yaml` is a full heio-stack template (sealed + ready, Plan/Tasker/Build/Review, Mint disabled or omitted). `agentic-core` lists `frameworks: [hivemind]`.
- `pnpm test` and `pnpm run typecheck` pass.

## Map

Location `hivemind` already exists. Open sprint `hivemind` under `.heio/planning/sprints/hivemind/` if missing. Each unit below is a slice `s-<id>`. Freeze `spec.md` + `oracles.md` from the docs (design is already confirmed — do not interview). Do not write `tasks.md` until the slice is frozen. Execute with **tdd**. Do not mark a builder-shaped session `met`.

## Units (order is the graph)

Skip a unit only when its acceptance already holds on disk. Do not start a later unit while an earlier one is red.

### 1. `profile-dirs`

- **Goal**: [[0016-profiles-are-directories]] is true in code.
- **Write**: `packages/installer/src/profile.ts` and tests; `tests/profile/`; move every `profiles/*.yaml` to `profiles/<name>/profile.yaml`; `profiles/README.md`.
- **Do not write**: `frameworks/`, dest `hivemind.yaml` logic (unit 2).
- **Accept**: `listProfiles` sees directory stems. `loadProfile(root, "agentic-core")` reads `profiles/agentic-core/profile.yaml`. Flat leftover `profiles/foo.yaml` is not a profile. Existing profile tests green.

### 2. `frameworks-install`

- **Goal**: [[0015-hivemind-is-a-framework]] install half.
- **Write**: installer `frameworks` on `Profile`; dest write `.pi/frameworks/<name>/`; write-if-missing project-root `hivemind.yaml`; installer tests.
- **Need**: unit 1.
- **Do not write**: the Hivemind engine (a stub `package.json` + empty `src` is allowed only if unit 3 is the same session and tests still pin behaviour).
- **Accept**: profile with `frameworks: [hivemind]` copies the tree. Settings `packages` unchanged by that list. Second install does not overwrite an edited dest `hivemind.yaml`. Missing framework name fails at plan time.

### 3. `cli-once-config`

- **Goal**: engine exists; config fail-closed.
- **Write**: `frameworks/hivemind/package.json`, `src/cli.ts` (and modules it needs), package tests. Commands `once` and help. `watch` may stub with “not this unit” only if unit 6 is next; prefer real `once` now.
- **Need**: unit 2 (or land 2+3 together if the copy has nothing to copy until this tree exists — still two test files).
- **Accept**: `once` with no `hivemind.yaml` exits non-zero, no child. Unknown keys exit non-zero. Empty `lanes: []` exits zero and spawns nothing.

### 4. `parse-quarantine`

- **Goal**: typed folders, fail-closed schema, quarantine move.
- **Write**: parser, folder schema, quarantine writer. Tests with temp dirs.
- **Need**: unit 3.
- **Accept**: parse error / unknown key / missing required key moves the file to the configured quarantine path with only `origin-location`, `quarantined-at`, `fault`. Scan continues. No `status` / `blocked-by` / `caused-by` / body written by the supervisor.

### 5. `match-claim-spawn`

- **Goal**: trigger/need, CAS, interpolate, exec argv, concurrency, exclusive overlap skip.
- **Write**: matcher, claim, interpolator, tokenizer, spawner. Tests: fake `cmd` that is `/bin/echo` or a small fixture binary, never `sh -c`.
- **Need**: unit 4.
- **Accept**: lane `trigger.status: ready-for-agent` ignores `ready-for-human`. CAS: second `once` loses the race. `{{env.MISSING}}` skips spawn. Interpolated spaces stay one argv. Overlapping live `exclusive`/`scope` → skip. Child is one unit; supervisor does not loop tickets inside the child.

### 6. `watch`

- **Goal**: resident loop + flags.
- **Write**: `watch`, backoff, `--until-quiet`, `--until-target`.
- **Need**: unit 5.
- **Accept**: `watch --until-quiet` on an empty match set exits after one quiet scan. `--until-target PATH` exits when PATH exists. Backoff does not busy-spin. Killing the process stops spawn.

### 7. `heio-stack-template`

- **Goal**: user-owned template, not a runtime pack overlay.
- **Write**: `profiles/agentic-core/hivemind.yaml` (full file). `frameworks: [hivemind]` on that profile. Optionally other profiles omit it.
- **Need**: units 2 and 3 so install has something to copy.
- **Accept**: template names `.heio/` folders, quarantine, sealed/ready language, Plan/Tasker/Build/Review lanes, Mint omitted or `disable`. `claim-status` set. Review `mint-status: ready-for-human`. `cmd` uses `{{agent}}` / `{{prompt}}` double braces. Reinstall does not eat a dest edit.

### 8. `verify-install`

- **Goal**: this checkout dogfoods.
- **Write**: repo checks under `tests/checks/` if layout now needs them (profile dirs, frameworks dest). No extra product features.
- **Need**: 1–7.
- **Accept**: `pnpm exec agentic-core install . --profile agentic-core` writes `.pi/frameworks/hivemind/` and does not overwrite an existing root `hivemind.yaml`. `pnpm test` and `pnpm run typecheck` pass. `hivemind once` in this dest with empty matching tickets exits zero.

## Spawn

Load **unpark** with `subagent` and `subagent_wait` before any child.

Then spawn unit implementation with `subagent`. `async: true`. `context: "fresh"`. One `workflowScript`. Sequential `runs.run` per unit because later units need earlier ones green. `worktree: true` only when that unit is independent and isolated. Copy standing orders into every worker brief. Parent does not write product code while spawn is live. If unpark reports the tools are not registered, do the unit in the parent and mark `skip: no spawn runtime`.

## Loop

For each unit:

1. Read the matching docs headings. Write slice `EXPECT:` lines you can falsify.
2. Spawn a worker for TDD at the seam. One red test, then enough code. Parent does not implement while spawn is live.
3. Run the unit’s tests, then `pnpm test` and `pnpm run typecheck` before calling the unit done.
4. Do not start the next unit red.
5. Recurring mistakes → fix the code or a test, not a new supervisor personality.

## Report

After each unit and at stop: unit id, paths written, commands run, pass/fail, what is still open. If you stop mid-graph, name the next unit id.

End with `VERDICT: TASK | TICKET | ESCALATE | VERIFY`.
