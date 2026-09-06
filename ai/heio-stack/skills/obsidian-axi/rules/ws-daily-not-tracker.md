---
title: Daily notes are not the tracker
impact: MEDIUM
impactDescription: journal days live in .heio, not the vault daily note
tags: [ws, daily, heio]
---

## Daily notes are not the tracker

Some vaults have daily notes. This checkout's journal, issues, plans, tasks, and tickets live under `.heio/` via **heio-stack**. A vault daily note is not that tracker.

**Incorrect:** `obsidian-axi daily append --content "- [ ] ship it"` as a heio task.

**Correct:** Load **heio-stack** for working items. Use this CLI on `docs/` notes only.

Notes: The filesystem CLI may not even expose `daily`. If a dest vault uses daily notes as personal journal, still keep project work in `.heio/`.
