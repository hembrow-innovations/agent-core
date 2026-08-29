# Wayfinder

The tree will not fit in one sitting. Chart it as a **plan** plus child **issues** under `.heio/`. Resolve one decision at a time until the route is clear.

Load **management** before any write under `.heio/`. Load **docs** only when a settled decision should survive a clone. Placement, numbers, status, and close-moves live in **management**.

This branch plans. Each ticket resolves a decision. The map is done when nothing is left to decide.

## Refer by name

Every map and ticket is a note with a `title`. In narration and in Decisions so far, refer to it by that title wrapped around `[[id]]`.

## The map is a plan

One plan at `.heio/planning/plans/plan-<N>-<slug>.md`. Tag it `wayfinder`. Status `draft` while charting, `active` while tickets are open, `complete` when the way is clear.

Copy the plan template. Then keep these extra sections.

```markdown
## Objectives

<the destination. one or two lines. every session orients here before choosing a ticket.>

## Phases

This plan is a decision map. Do not list execution tasks here.

## Approach

<domain. skills every session should load. standing preferences for this effort.>

## Acceptance

- The way to the destination is clear. No open wayfinder issues remain on this plan.

## Definition of done

- [ ] Way is clear
- [ ] Durable outcome written to `docs/` if it should survive a clone

## Decisions so far

- [[issue-N-slug|title]]. <one-line gist of the answer>

## Not yet specified

<in-scope fog you cannot ticket yet>

## Out of scope

<work ruled beyond this destination>
```

The map is an index. A decision lives in its issue. The map gists and links.

Open tickets are not listed on the map. Find them by scanning `.heio/inbox/issues/` for `wayfinder` tags that `references` this plan.

## Tickets are issues

Each ticket is an issue at `.heio/inbox/issues/issue-<N>-<slug>.md`. Copy the issue template.

- `tags` include `wayfinder` and one type. `research`, `prototype`, `planning`, or `task`.
- `labels` stays the nature of the work (`feature`, `bug`, `refactor`).
- `references` lists the map id.
- `blocked_by` lists blocking issue ids.
- Put the question in Description. Leave Proposed fix blank.

```markdown
## Description

## Question

<the decision or investigation this ticket resolves>
```

Claim before any work. Set `status: reviewing` and touch `updated_at`. An `open` unblocked issue is unclaimed. `reviewing` is the claim. `closed` is resolved. `wontfix` is out of scope.

A ticket is unblocked when every id in `blocked_by` is `closed` or `wontfix`. The frontier is open, unblocked, unclaimed children of this map. First by number wins.

Create issues first, then wire `blocked_by`.

## Ticket types

Every ticket is HITL (worked with the human) or AFK (agent alone). A HITL ticket only resolves through that live exchange.

- **research** (AFK). Load **research**. Write findings on the issue under `## Resolution`.
- **prototype** (HITL). Load **prototype**. Link the artifact from the issue.
- **planning** (HITL). Return to the parent skill. Default type.
- **task** (HITL or AFK). Manual work that unblocks a decision. Signing up for a service, granting access, moving data so its shape can be seen. This is still an issue, not a management task.

## Fog of war

Do not chart what you cannot yet see. **Not yet specified** is in-scope fog that is not sharp enough to ticket. **Out of scope** is past the destination.

Ticket when you can state the question precisely, even if it is blocked. Leave it in fog when you cannot phrase it that sharply.

## Chart the map

1. Name the destination. Run the parent skill's frontier once, and **domain-modeling**.
2. Map the frontier, breadth-first. If this surfaces no fog, you do not need a map. Stop and ask how they want to proceed.
3. Create the plan. Destination in Objectives. Notes in Approach. Fog in Not yet specified. Decisions so far empty.
4. Create the issues you can specify now. Wire `blocked_by` in a second pass.
5. Fire research tickets in parallel.
6. Stop. Charting hand-resolves nothing.

## Work through the map

Never resolve more than one ticket per session, except research tickets.

1. Load the plan. Not every issue body.
2. If the user named a ticket, use it. Otherwise take the first frontier issue. Claim it.
3. Resolve it. Load the skills Approach names.
4. Write `## Resolution` on the issue. Set `closed`. Append one gist line to Decisions so far.
5. Add newly surfaced issues. Graduate fog that is now specifiable. If a ticket sits past the destination, set `wontfix`, move it to `closed/`, and add one line to Out of scope.
6. If the decision invalidates other tickets, update or close them.

Move a terminal issue to `.heio/closed/` the day it closes. Keep the filename.

## When the way is clear

The map is done when no open wayfinder issues remain and Not yet specified is empty.

Return to Persist on the parent skill. If someone should now build, that is a new plan with tasks. Do not reuse this map as the execution plan.
