---
name: planning-with-docs
description: File-backed planning interview for projects that use management and docs. Write rounds into a draft plan under .heio/planning/plans/. Never put the interview in docs/. Use to plan or stress-test thinking when the user will answer in a file.
---

# Planning rounds on a draft plan

Run **planning**. Write the rounds into a working plan, not into chat and not into `docs/`.

## Store

Load **management** before any write under `.heio/`. Load **docs** only when a settled outcome should survive a clone.

If `AGENTS.md` or `WORKSPACE.md` already names a tracker, that file wins. Do not start a second tree.

## Workflow

1. Search `.heio/planning/plans/` and `closed/` for an existing draft on this topic. Update that file if you find one.
2. Otherwise copy the plan template from the **management** skill to `.heio/planning/plans/plan-<N>-<slug>.md`. Status `draft`. Tags may include `planning-with-docs`.
3. Keep the template headings. Add a `## Rounds` section after them. Append each round there. Do not rewrite earlier rounds.
4. When the user answers, record the answers under that round. Then append the next frontier.
5. Repeat until the frontier is empty and the user confirms a shared understanding.

The plan is the notebook. Objectives hold the destination. Approach holds standing notes. Phases stay empty until this skill hands off. Do not add execution tasks while the interview is live.

## When you are done

Promote first. Then close.

Load **docs**. Write the durable outcome as an ADR, spec, architecture note, or guide. Do not copy this plan into `docs/` as a plan.

If work should be executed next, stay on **management**. Set the plan `ready`, split tasks, and follow lifecycle-flow.

If this was decide-only, set the plan `complete` and move it to `.heio/closed/`.

If the tree will not fit in one plan file, stop and load **wayfinder**.
