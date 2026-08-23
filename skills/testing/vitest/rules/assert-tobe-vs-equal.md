---
title: Use toBe for identity, toEqual for values
impact: MEDIUM
impactDescription: object assertion fails for the wrong reason
tags: [assert]
---

## Use toBe for identity, toEqual for values

`toBe` is `Object.is`. Two equal objects are not `toBe`. Primitives and the same reference are.

**Incorrect:** `expect({ id: 1 }).toBe({ id: 1 })`

**Correct:** `expect(sum(1, 2)).toBe(3)` and `expect(user).toEqual({ id: 1, name: "Ada" })`. Prefer `toMatchObject` when extras are allowed.

Notes: `toStrictEqual` also checks `undefined` keys. Use it when that is the bug.
