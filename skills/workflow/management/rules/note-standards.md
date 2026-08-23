---
title: Frontmatter, status, and titles
impact: CRITICAL
tags: [note]
---

# Frontmatter, status, and titles

Every managed note has YAML frontmatter, then one h1. The h1 string must match `title`.

Shared fields are in `templates/required-fields.md`. Kind-specific fields are on the template.

## Status is a state machine

Status is the only lifecycle field. Priority, severity, and flavor ride on `tags` or the optional fields the template names.

| Kind | Status |
|---|---|
| issue | `open` / `reviewing` / `promoted` / `closed` / `wontfix` |
| plan | `draft` / `ready` / `active` / `complete` / `closed` |
| task | `hold` / `ready` / `active` / `needs-review` / `complete` |
| journal | none |
| report | none |
| inbox dump | none |

Do not invent a sixth status. Park work with a tag, not a new state.

`labels` is the nature of the ticket (`feature`, `bug`, `refactor`). The key is `labels`, not `type`. `severity` is impact. Bugs usually carry it. Feature requests usually do not.

## Links

Link notes with `[[id]]`. The `id` is the filename stem (`issue-1-login-flash`, `plan-2-auth`, `task-4-session-cookie`). Do not use relative `.md` paths.

A plan lists child tasks in its body and may repeat them in optional `tasks:` frontmatter. A task points at its plan with optional `plan:`.

## Dates

`created_at` and `updated_at` are ISO-8601. Touch `updated_at` on every edit. Journal `title` and `date` are the calendar day `YYYY-MM-DD`. Journal `id` is always `journal-YYYY-MM-DD`.
