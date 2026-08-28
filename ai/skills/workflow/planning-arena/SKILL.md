---
name: planning-arena
description: Planning arena. A three-persona panel on each planning round. Use when the user wants a planning arena, an idea run through planning with architect/product/engineer votes, persona answers then a judge selects, or /planning-arena.
---

# Planning arena

Run **planning**. The counterpart is a **panel**, not the user. Each frontier is one **round**. The session directory is the notebook.

Do not build. Do not spawn tmux teammates. Do not write the interview into `docs/`.

## Panel

Default personas:

- **architect** — types, signatures, module boundaries
- **product** — customer, wedge, scope to cut
- **coder** — cost, testability, reversibility

`subagent({ action: "list" })` first. Use a dest agent only when that name is executable. Otherwise `oracle` with `context: "fresh"` and the persona in the task.

Load **pi-subagents** before any spawn. **round-orchestrator** may spawn; it is a delegated fanout child. Panelists and **judge** do not spawn.

## Store

Load **management** before any write under `.heio/`. Load **docs** only when a settled outcome should survive a clone. Load **domain-modeling** when a term or ADR belongs in the vault.

If `AGENTS.md` or `WORKSPACE.md` already names a tracker, that file wins. Do not start a second tree.

Session: `.heio/planning/arena/<arena-name>/`
Rounds: `.heio/planning/arena/<arena-name>/rounds/round-<N>/`

`<arena-name>` is a kebab-case slug. A name the user gives wins.

## Workflow

1. If the idea is empty, ask once.
2. Search `.heio/planning/arena/` and `closed/` for an existing session on this topic. Update that session if you find one.
3. Otherwise pick `.heio/planning/arena/<arena-name>/` as the session.
4. Ask the whole **frontier** the way **planning** does. Create `rounds/round-<N>/`. Spawn one **round-orchestrator** for the round. Wait for it to return before the next frontier.
5. After the round returns, append the next frontier. Repeat until the frontier is empty.
6. Stop. Wait for the user to confirm a shared understanding.

The session directory is the notebook. Do not write rounds into a plan file while the interview is live.

Done when every round directory has the questions file, one answer file per panelist, selected answers on the questions file, and the frontier is empty.

## Round

Read `references/round-contracts.md` before spawning **round-orchestrator**.

If that name is not executable with write and `subagent`, the parent runs these steps itself.

1. Create `round-<N>-questions.md`.
2. Spawn panel members as subagents.
3. Panel members write `round-<N>-questions-<panel_member_name>.md`.
4. Spawn **judge**. Judge appends the best answer for each question onto the questions file.
5. Return the questions file path and each selected answer.

Done when that round directory matches the contracts and **round-orchestrator** has returned.

If spawn is missing, write the questions file, three answer files, and the selected blocks yourself and mark `skip: no spawn runtime` on the round. Do not invent child transcripts.

## When you are done

Promote first. Then close.

Load **docs**. Write the durable outcome as an ADR, spec, architecture note, or guide. Do not copy this session into `docs/` as a plan.

If work should be executed next, stay on **management**. Copy the plan template to `.heio/planning/plans/plan-<N>-<slug>.md` from the selected answers. Status `ready`. Split tasks. Follow lifecycle-flow.

If this was decide-only, move the session to `.heio/closed/<arena-name>/`.

If the tree will not fit in one session, stop and load **wayfinder**.
