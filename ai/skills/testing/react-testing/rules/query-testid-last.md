---
title: testID is a last resort
impact: HIGH
impactDescription: testIDs skip a11y and leak implementation
tags: [query, native, web]
---

## testID is a last resort

Add `testID` / `data-testid` only when there is no accessible name and text is unstable (skeletons, icon-only, colliding labels).

**Incorrect:** Every button and row tagged `testID="tasks-save"` while the button already says Save.

**Correct:** Role/text first. testID for a loading skeleton, an icon-only control, or a Maestro flow that cannot disambiguate colliding copy.

Notes: Device flows often hit collisions ("Tasks" tab vs card). Prefer index or testID there, not in unit tests that can use text.
