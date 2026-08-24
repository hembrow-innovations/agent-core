---
title: Prototype
impact: HIGH
impactDescription: Shipping the sketch locks the first idea
tags: [build]
---

## Prototype

A throwaway sketch to make a design or behavioral decision cheaply.

**Incorrect:** Build in production source. Add tests and abstractions. Treat the sketch as the Feature.

**Correct:** You own the decision, not the code. Isolated scratch. Speed over polish. Hand the chosen direction to Feature.

1. Scope the decision. No decision means `build-feature`.
2. Gather references when the design space is open.
3. Build throwaway in an isolated scratch dir. Lightest stack that renders the idea.
4. Compare alternatives behind one switcher.
5. Verify by eye or by observing the timing or output.
6. Present variants, tradeoffs, and a recommendation. Say it is throwaway.

Library: `ai/playbooks/prototype.md` (dest: `playbooks/prototype.md`).

Notes: This is the one playbook where smallest-change and the verification bar invert.
