---
name: principle-zod-degrades-never-blanks
description: "Apply when tightening queryValidated, reacting to schema drift, or wanting to throw in dev 'so we notice'. On read-schema failure, warn and return the raw rows in every build."
disable-model-invocation: true
---

# Zod Degrades, Never Blanks

On a read-schema failure, warn and return the raw rows. Do this in every build, including production.

**Why:** A strict throw turns a join-shape drift into an empty list. The user sees a blank household. The bug is quieter and worse.

**Pattern:**
- `queryValidated` degrades. It does not throw.
- Catch drift with fixtures, pgTAP, and Maestro or Playwright, not by blanking the list.
- Do not reintroduce a dev-only throw "so we notice." Notice with tests.
- Zod is shape sanity. RLS is the security boundary. See `principle-rls-is-the-security-boundary`.

**Vault:** ADR-0027, data-flows.

**The test:** if a new column appears on a joined row, does the list still render? If no, you made Zod a gate.
