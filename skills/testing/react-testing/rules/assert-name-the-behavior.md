---
title: Test names are specifications
impact: MEDIUM
impactDescription: how-names rot and miss contract locks
tags: [assert, contracts]
---

## Test names are specifications

Name what the user can do or what the UI must show. If the repo locks titles to a contract file, update that file in the same change.

**Incorrect:** `it("calls useTasks and maps items", …)` or `it("works", …)`.

**Correct:** `test("renders the seed tasks")`, `test("shows the skeleton while loading")`, `test("hides Board view")`.

Notes: Search for a behaviour-contract or similar doc before renaming a locked test.
