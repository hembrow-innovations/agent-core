---
title: One behavior per test
impact: MEDIUM
impactDescription: first failure hides the rest
tags: [assert]
---

## One behavior per test

A 40-line test that creates, updates, and deletes tells you one thing failed, not which behavior.

**Incorrect:** One `test("crud")` that asserts four HTTP verbs.

**Correct:** `test("creates a user")`, `test("rejects a duplicate email")`. `expect.soft` only when several checks are one behavior.

Notes: See `assert-soft-poll` for the soft case.
