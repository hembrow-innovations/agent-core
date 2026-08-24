---
title: Inline third-party deps that must see your mock
impact: HIGH
impactDescription: library still holds the real module
tags: [mock]
---

## Inline third-party deps that must see your mock

External packages are not transformed by default. A `vi.mock` of `foo` will not reach `bar` if `bar` is externalized and imported `foo` itself.

**Incorrect:** Mocking `foo` and expecting `bar`'s internal import to be mocked.

**Correct:** `server.deps.inline: ["bar"]` so `bar` is transformed and sees the mock. Or mock `bar` at its public API.

Notes: Same flag fixes `unknown extension .css` in a DOM env. Inline the whole import chain.
