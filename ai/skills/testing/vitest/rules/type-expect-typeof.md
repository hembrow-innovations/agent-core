---
title: Assert types with expectTypeOf
impact: MEDIUM
impactDescription: tsc in a unit test, or no type test at all
tags: [types]
---

## Assert types with expectTypeOf

Vitest can typecheck test files. `expectTypeOf` and `assertType` fail the typecheck run, not the unit run.

**Incorrect:** A runtime `expect(typeof x).toBe("string")` when the bug is a generic.

**Correct:**
```ts
import { expectTypeOf, test } from "vitest";
test("parse returns User", () => {
  expectTypeOf(parse).returns.toEqualTypeOf<User>();
});
```

Notes: Enable with `typecheck.enabled` or `vitest --typecheck`. This is not a substitute for `tsc -p tsconfig.json`.
