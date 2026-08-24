---
title: Visual parity
impact: HIGH
impactDescription: Editing the baseline makes the claim fake
tags: [fix]
---

## Visual parity

Pixel-exact UI equivalence. Matching two implementations or migrating a styling system.

**Incorrect:** Judge by eye. Edit the harness or the baseline so the diff passes. Restructure the component to hide a delta.

**Correct:** You own pixel-exact equivalence. The baseline is the spec. Image diff is the test.

1. Establish the baseline first. No baseline, no parity claim.
2. Hold the anti-shortcut clauses. A wrong-looking baseline is a stop, not an edit.
3. One component at a time. Shared primitives first.
4. Image-diff on the matching surface. Nonzero is a fail.
5. Opening a PR per component or per safe batch.

Library: `ai/playbooks/visual-parity.md` (dest: `playbooks/visual-parity.md`).
