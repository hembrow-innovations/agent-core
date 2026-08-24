---
title: Do not use environmentMatchGlobs or poolMatchGlobs
impact: HIGH
impactDescription: removed in Vitest 4
tags: [config, v4]
---

## Do not use environmentMatchGlobs or poolMatchGlobs

Those globs were a second routing language. Projects are the one map now.

**Incorrect:** `environmentMatchGlobs: [["**/*.tsx", "happy-dom"]]`

**Correct:** A `dom` project with `include` and `environment: "happy-dom"`, plus a `node` project for the rest.

Notes: Per-file override is still `// @vitest-environment happy-dom`. See `env-file-comment`.
