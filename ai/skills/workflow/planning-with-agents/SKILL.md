---
name: planning-with-agents
description: Two-agent planning interview with no human in the rounds. Use when a team lead runs AFK planning, LOOP.md, or wants planner and product to settle a design tree between themselves.
---

# Planning with agents

Run **planning-with-docs**. The counterpart is a **product** peer, not the user. The plan file is the notebook. Chat is only the ping.

Do not build. Do not wait for a human. Do not write the interview into `docs/`.

## Seats

- **Planner** owns the tree, the rounds, and **to-issues** when the frontier is empty.
- **Product** answers every round from `GOAL.md`, committed `docs/`, and the current tree. `GOAL.md` is the product owner.

Planner messages product each round with `coms_send`, then `coms_await`. Product replies and stays ready. The lead does not sit in the middle of a round.

## Store

Load **management** before any write under `.heio/`. Load **docs** only when a settled outcome should survive a clone. Load **domain-modeling** when a term or ADR belongs in the vault.

If `AGENTS.md` or `WORKSPACE.md` already names a tracker, that file wins. Do not start a second tree.

## Workflow

1. Search `.heio/planning/plans/` and `closed/` for an existing draft on this topic. Update that file if you find one.
2. Otherwise copy the plan template from **management** to `.heio/planning/plans/plan-<N>-<slug>.md`. Status `draft`. Tags include `planning-with-agents`.
3. Keep the template headings. Add `## Rounds` after them. Append each round. Do not rewrite earlier rounds.
4. Ask the whole frontier in one round. Number each question. Give a recommended answer. Write that round into the plan, then `coms_send` product the plan path and the new question ids.
5. Product reads `GOAL.md` first. For each question, write the decision under that round in the plan. If `GOAL.md` and `docs/` are silent, pick the smallest reversible default, say so in one line, and continue. Then reply.
6. Planner records those answers if product wrote them only in chat, appends the next frontier, and repeats.
7. When the frontier is empty, product writes `Confirmed.` under the last round. Planner then runs **to-issues**. Prefer AFK slices. A slice that used to wait for a human is a product default in the plan, then an AFK slice.

Done when the plan file has every round plus a confirmation, and the issue or task notes exist.

## Defaults

Product direction in this run comes from `GOAL.md`, not from a waiting human. Irreversible work (force-push, deploy, customer messages, deleting production data) still stops. Everything else proceeds.

Park nothing for a human unless `.heio/STOP` exists.

## After the interview

Promote first. Then close.

Load **docs**. Write the durable outcome as an ADR, spec, architecture note, or guide. Do not copy this plan into `docs/` as a plan.

Stay on **management**. Set the plan `ready`. Split tasks. Follow lifecycle-flow.

If this was decide-only, set the plan `complete` and move it to `.heio/closed/`.
