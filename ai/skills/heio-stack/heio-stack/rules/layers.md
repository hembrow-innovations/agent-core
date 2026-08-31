---
title: Three layers of plan
impact: CRITICAL
tags: [layers]
---

# Three layers of plan

## Intent (sticky)

Why this project exists, success looks like X, we will not do Y. One page at `.heio/planning/intent.md`. Change rarely, and only on purpose. Human or a **heio-wayfinder** pass writes it. A builder in a workflow loop leaves destination sentences untouched.

## Map (semi-sticky)

Roadmap of **locations**, optional `locations/<slug>.md` files, plus sprint groupings. `.heio/planning/roadmap.md`, `.heio/planning/locations/`, `.heio/planning/sprints/<id>/shape.md`. Add a location bullet without rewriting siblings. Grow a sub-map when a location needs depth. A general agent the human is talking to may edit this layer. A builder in a workflow loop may not rewrite location destination sentences.

## Work (fluid)

Tasks and incoming tickets. This layer is supposed to churn. Rigidity comes from writing tasks too early and treating that list as the plan. Frozen or active slices may have `tasks.md`. Tickets stay in `.heio/tickets/` until triage promotes one.

Intent destination sentences: builder passes read, never edit. The map is editable outside a workflow.
