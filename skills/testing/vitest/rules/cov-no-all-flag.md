---
title: Do not set coverage.all or coverage.extensions
impact: MEDIUM
impactDescription: removed options
tags: [coverage, v4]
---

## Do not set coverage.all or coverage.extensions

Those keys do nothing now and confuse a later reader into thinking uncovered files are included.

**Incorrect:** `coverage: { all: true, extensions: ["ts"] }`

**Correct:** `coverage.include` with a source glob. V8 remapping is AST-based; `ignoreEmptyLines` and `experimentalAstAwareRemapping` are gone.

Notes: `coverage.ignoreClassMethods` now works on V8 too. Provider `@vitest/coverage-v8` is enough for most suites.
