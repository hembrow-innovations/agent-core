---
title: Occurrences Project, Never Materialize
impact: MEDIUM
impactDescription: Calendar becomes a second system of record
tags: [product, calendar]
---

## Occurrences Project, Never Materialize

**Incorrect:** Insert a Task or finance row to put this bill on the calendar.
**Correct:** Emit a projected occurrence. Write-back goes to the owning domain.

The calendar timeline is a read-model. Cross-domain items project into it. They do not become calendar-owned copies.

**Why:** Materialising a bill or a task as a second row makes calendar a second system of record. Completing the agenda item then drifts from the owning domain.

**Pattern:**
- Emit occurrences. Do not insert a Task, a finance row, or a reminder-as-event to "put it on the calendar."
- Write-back (complete, snooze, reschedule) goes to the owning domain.
- A reminder is not an Occurrence.
- Series expansion stays a projection (ADR-0017). Do not persist every future instance as a row unless a locked promise already says so.

**Vault:** calendar purpose, glossary Occurrence and Reminder, ADR-0013, ADR-0017.

**The test:** if calendar were deleted, would the source row still be the one the user edits? If no, you materialised.
