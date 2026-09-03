---
title: Visual dev
impact: HIGH
impactDescription: Shipping from code inspection leaves the screen unseen
tags: [build]
---

## Visual dev

Production UI that has to look right. Stitch mockup, implement in the kit, capture on the matching surface, hillclimb defects.

**Incorrect:** Declare done from unit green or code inspection. Paste Stitch HTML into product source. Drive a device with playwright-cli or the web with Maestro. Skip the look.

**Correct:** You own the pixels. Fresh capture is the test. Stitch pull is the baseline. See, critique, patch, recapture.

1. Discover stack, kit, neighbor files, and surface driver.
2. Lock the baseline. Stitch first when the look is open. `edit` over regenerate.
3. Implement in the discovered kit. Match the pull.
4. Capture every named viewport and state. Numeric signals with the PNGs.
5. Critique with answers that cite a PNG.
6. One defect per iteration. Keep or revert from the new capture.
7. Stop when Broken is clean and leftovers are named.

Library: `ai/playbooks/visual-dev.md` (dest: `playbooks/visual-dev.md`).

Notes: A throwaway sketch is `build-prototype`. Stack and behavior in a React tree is `build-react-app`. Pixel-exact image-diff is `fix-visual-parity`. One numeric metric is `run-hillclimb`.
