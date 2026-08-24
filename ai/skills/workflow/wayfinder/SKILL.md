---
name: wayfinder
description: Plan a huge chunk of work as a shared map of decision tickets under .draconic/. The map is a plan. Tickets are issues. Use when one agent session cannot hold the work and the project uses the management and docs skills.
disable-model-invocation: true
---

# Wayfinder on local management

A loose idea is too big for one session, and the way to the destination is not visible yet. Chart that way as a **plan** plus child **issues** under `.draconic/`. Resolve one decision at a time until the route is clear.

This skill plans. It does not build. Each ticket resolves a decision. The map is done when nothing is left to decide. Then hand off. An effort can override this in the plan's Approach. Absent that, produce decisions, not deliverables.

Do not open a GitHub Issue. Do not write the map into `docs/`. Do not invent a folder or a kind under `.draconic/`.

## Store

Load **management** before any write under `.draconic/`. Load **docs** only when a settled decision should survive a clone. Load **domain-modeling** when a term or ADR belongs in the vault.

If `AGENTS.md` or `WORKSPACE.md` already names a tracker (`.scratch/`, GitHub Issues, `docs/planning/`), that file wins. Do not start a second tree.

Per-rule placement, numbers, status, and close-moves live in **management**. Do not restate them.

## Refer by name

Every map and ticket is a note with a `title`. In narration and in Decisions so far, refer to it by that title wrapped around `[[id]]`. Never a bare id.

## The map is a plan

The map is one plan at `.draconic/planning/plans/plan-<N>-<slug>.md`. Tag it `wayfinder`. Status `draft` while charting, `active` while tickets are open, `complete` when the way is clear.

Copy the plan template. Fill it. Then keep these extra sections.

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

The map is an index. A decision lives in its issue. The map gists and links. It does not restate the answer.

Open tickets are not listed on the map. Find them by scanning `.draconic/inbox/issues/` for `wayfinder` tags that `references` this plan.

## Tickets are issues

Each ticket is an issue at `.draconic/inbox/issues/issue-<N>-<slug>.md`. Copy the issue template.

- `tags` include `wayfinder` and one type. `research`, `prototype`, `planning`, or `task`.
- `labels` stays the nature of the work (`feature`, `bug`, `refactor`).
- `references` lists the map id.
- `blocked_by` lists blocking issue ids.
- Put the question in Description. Leave Proposed fix blank. Do not design the solution in the issue.

```markdown
## Description

## Question

<the decision or investigation this ticket resolves>
```

Claim before any work. Set `status: reviewing` and touch `updated_at`. An `open` unblocked issue is unclaimed. `reviewing` is the claim. `closed` is resolved. `wontfix` is out of scope.

A ticket is unblocked when every id in `blocked_by` is `closed` or `wontfix`. The frontier is open, unblocked, unclaimed children of this map. First by number wins.

Create issues first, then wire `blocked_by`. Issues need ids before they can reference each other.

## Ticket types

Every ticket is HITL (worked with the human) or AFK (agent alone). A HITL ticket only resolves through that live exchange. Do not answer the human's side for them.

- **research** (AFK). Load **research**. Write findings on the issue under `## Resolution`. Do not put raw research in `docs/`.
- **prototype** (HITL). Load **prototype**. Link the artifact from the issue. Keep throwaway code out of `docs/` and out of `.draconic/`.
- **planning** (HITL). Load **planning**, or **planning-with-docs** if the human will answer in the file. Default type.
- **task** (HITL or AFK). Manual work that unblocks a decision. Signing up for a service, granting access, moving data so its shape can be seen. This is still an issue, not a management task. It earns its place by unblocking a decision, not by delivering the destination. Load **wizard** when only the human can click the third-party UI.

## Fog of war

Do not chart what you cannot yet see. **Not yet specified** is in-scope fog that is not sharp enough to ticket. **Out of scope** is past the destination. Scope, not sharpness, lands it there.

Ticket when you can state the question precisely, even if it is blocked. Leave it in fog when you cannot phrase it that sharply. Do not pre-slice fog into ticket-sized pieces.

## Invocation

Never resolve more than one ticket per session, except research tickets.

### Chart the map

User invokes with a loose idea.

1. Name the destination. Run **planning** and **domain-modeling**.
2. Map the frontier, breadth-first. If this surfaces no fog, you do not need a map. Stop and ask how they want to proceed.
3. Create the plan. Destination in Objectives. Notes in Approach. Fog in Not yet specified. Decisions so far empty.
4. Create the issues you can specify now. Wire `blocked_by` in a second pass.
5. Fire research tickets in parallel.
6. Stop. Charting hand-resolves nothing.

### Work through the map

User invokes with a plan id or title. A ticket is optional.

1. Load the plan. Not every issue body.
2. If the user named a ticket, use it. Otherwise take the first frontier issue. Claim it.
3. Resolve it. Load the skills Approach names. Zoom related closed issues on demand.
4. Write `## Resolution` on the issue. Set `closed`. Append one gist line to Decisions so far.
5. Add newly surfaced issues. Graduate fog that is now specifiable. If a ticket sits past the destination, set `wontfix`, move it to `closed/`, and add one line to Out of scope. Do not put it in Decisions so far.
6. If the decision invalidates other tickets, update or close them.

Move a terminal issue to `.draconic/closed/` the day it closes. Keep the filename.

## When the way is clear

The map is done when no open wayfinder issues remain and Not yet specified is empty.

Load **docs**. Write the durable outcome as an ADR, spec, architecture note, or guide. Do not copy the plan into `docs/` as a plan.

Then load **management**. Set the plan `complete` and move it to `.draconic/closed/`.

If someone should now build, that is a new plan with tasks. Do not reuse this map as the execution plan.
