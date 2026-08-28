---
title: Kind to template to destination
impact: HIGH
tags: [template]
---

# Kind to template to destination

Copy the template. Do not invent a new skeleton.

| Kind | Template | Destination | Filename |
| --- | --- | --- | --- |
| inbox dump | none | `.heio/inbox/` | `{slug}.md` or `{YYYY-MM-DD}-{slug}.md` |
| issue | `templates/issue.md` | `.heio/inbox/issues/` | `issue-<N>-<slug>.md` |
| plan | `templates/plan.md` | `.heio/planning/plans/` | `plan-<N>-<slug>.md` |
| task | `templates/task.md` | `.heio/planning/tasks/` | `task-<N>-<slug>.md` |
| journal | `templates/journal_day.md` | `.heio/logs/journal/{YYYY}/{MM}/` | `YYYY-MM-DD.md` |
| report | `templates/report.md` | `.heio/logs/reports/` | `YYYY-MM-DD-report-<slug>.md` |

Shared fields: `templates/required-fields.md`.

One journal file per calendar day. Append a theme if more work lands later that day. Skip empty days.

A report is a one-off deep dive. Day-to-day narrative stays in the journal.
