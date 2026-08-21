---
title: Keep cross-language APIs small
impact: HIGH
impactDescription: stability under refactors
tags: [interop, architecture]
---

## Keep cross-language APIs small

Every method reachable from the other language is a compatibility surface. Expose intent-level operations, not internal helpers.

**Incorrect:** 30 public C# methods called from scattered GDScript via strings.

**Correct:** 3–7 public methods (`start_run`, `apply_damage`, `get_snapshot`) + signals for events.

Notes: Mark internals `private`/`protected`; avoid `public` “just in case.”

