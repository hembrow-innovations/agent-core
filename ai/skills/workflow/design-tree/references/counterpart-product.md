# Product peer

The counterpart is a **product** peer, not the user. The plan file is the notebook. Chat is only the ping.

Load **management** before any write under `.heio/`.

## Seats

- **Planner** owns the tree, the rounds, and **to-issues** when the frontier is empty.
- **Product** answers every round from `GOAL.md`, committed `docs/`, and the current tree. `GOAL.md` is the product owner.

Planner messages product each round with `coms_send`, then `coms_await`. Product replies and stays ready.

## Notebook

Search `.heio/planning/plans/` and `closed/` for an existing draft on this topic. Update that file if you find one.

Otherwise copy the management plan template to `.heio/planning/plans/plan-<N>-<slug>.md`. Status `draft`. Tags include `design-tree`. Keep the template headings. Append `## Rounds`. Never rewrite an earlier round.

## Round

Ask the whole frontier. Write the round into the plan. Then `coms_send` product the plan path and the new question ids.

Product reads `GOAL.md` first. For each question, write the decision under that round in the plan. If `GOAL.md` and `docs/` are silent, pick the smallest reversible default, say so in one line, and continue. Then reply.

Planner records answers that landed only in chat, appends the next frontier, and repeats.

When the frontier is empty, product writes `Confirmed.` under the last round. Then return to Persist on the parent skill.

## Defaults

Product direction comes from `GOAL.md`. Irreversible work (force-push, deploy, customer messages, deleting production data) still stops. Park nothing for a human unless `.heio/STOP` exists.
