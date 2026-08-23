---
title: Inbox to close
impact: HIGH
tags: [lifecycle]
---

# Inbox to close

Work moves through files. Status records where it sits. `closed/` is where live folders stay empty.

```text
inbox dump ──► issue ──► plan + tasks ──► execute ──► close
                 │                           │
                 └──────── wontfix ──────────┘
```

1. Dump the thought in `.draconic/inbox/` if you do not have a ticket yet.
2. Open an issue when it is a real problem or opportunity. Capture what is wrong. Do not design the solution there.
3. Promote the issue (`status: promoted`) when you are ready to plan. Create the plan. Split work into tasks. Wikilink each task from the plan.
4. Execute against the tasks. Keep the plan `active` while any child is open.
5. Close the unit. Set the terminal status. `mv` the file to `.draconic/closed/`. Keep the filename.

Terminal statuses:

- issue: `closed` or `wontfix`
- plan: `complete` or `closed`
- task: `complete`

Move a file the day it becomes terminal. Do not leave completed notes in `inbox/` or `planning/`.

Do not move journals or reports. They already live in `logs/`.

A parent plan stays `active` until every listed task is terminal. Then close the plan and move it.

When you close a plan that produced durable knowledge, write that knowledge into `docs/` first. See `docs-boundary`.
