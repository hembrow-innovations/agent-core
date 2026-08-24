---
title: Prefer happy-dom for DOM units
impact: HIGH
impactDescription: jsdom is slower and rarely needed
tags: [env, dom]
---

## Prefer happy-dom for DOM units

happy-dom is the fast DOM stand-in. jsdom wins only when you need an API happy-dom lacks.

**Incorrect:** Installing jsdom for every `render` test by habit.

**Correct:** `environment: "happy-dom"` on the DOM project. Switch one file to jsdom only when a missing API forces it.

Notes: Install `happy-dom` yourself. `--dom` on the CLI is the same env. CSS import errors mean `server.deps.inline` the whole chain.
