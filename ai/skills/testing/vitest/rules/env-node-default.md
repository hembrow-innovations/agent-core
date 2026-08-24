---
title: Keep node as the default environment
impact: HIGH
impactDescription: happy-dom tax on pure functions
tags: [env]
---

## Keep node as the default environment

Default is `node`. A DOM env costs startup and hides Node-only bugs. Pure functions do not need `window`.

**Incorrect:** `environment: "happy-dom"` at the root because one file renders a button.

**Correct:** Leave the default `node`. Split a `dom` project or stamp `// @vitest-environment happy-dom` on files that touch the DOM.

Notes: `browser` is not an environment. Browser Mode is a project. See `browser-when`.
