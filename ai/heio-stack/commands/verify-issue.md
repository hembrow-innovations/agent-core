---
description: Forensic audit of one planning issue — every claim checked against code/vault; UNKNOWN when unproven. Use when suspicious of an issue, /verify-issue, stress-test issue, is this issue real.
---

Forensic-verify one tracker issue. Read-only. Evidence only — no vibes, no invented files/symbols/behaviour.

`$ARGUMENTS` = issue id / slug / path / wikilink (e.g. `657`, `issues-657`, `issues-657-backend-unavailable…`). Empty = ask once.

## Run

1. Load the **verify-issue** skill (`skill` tool) and follow it end-to-end.
2. Resolve exactly one note under `.draconic/planning/issues/` (include `closed/` if needed).
3. Produce the skill's report structure in chat. Do not edit the note unless the user asks to append.

If the skill and this command disagree, the skill wins.
