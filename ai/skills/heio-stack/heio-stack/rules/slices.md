---
title: Slices
impact: HIGH
tags: [slices]
---

# Slices

A slice is a vertical cut that is usable or learnable on its own. Not a layer (“backend first”). Outcome-shaped. It hangs off a **sprint**, which groups work for a location or a timebox.

A slice you cannot demo or learn from in one sitting is two slices. If a change cannot wait, the slice was too big.

## Shape the slice

Write done in words on `spec.md`. Then immediately write oracles. If you cannot write a `CHECK:` / `EXPECT:`, the done is still mush. Stop and sharpen before tasks.

Name `blocked-by` when this slice must wait on another. Unblocked slices may run in parallel.

Carry enough ADRs, specs, and paths that a stranger does not hunt. That is not a freeze ritual.

Status `shaping` until spec + `EXPECT:` exist. Then `frozen`. Tasks do not exist until `frozen`.

## Activate

Many slices may be `active`. Each frozen or active slice may have `tasks.md`. Promoting a slice to `active` does not require the previous one to be `met`.

A single workflow still does not run two writers on one cwd. Two sessions may hold two unblocked slices.

## Close

`--reverify` → `ALL MET`, status `met`. Then move the slice with its sprint, or leave it until sprint archive.

Or every leftover oracle has `ABANDON:` with a named next artifact (ticket id or “drop from sprint”), status `abandoned`. Abandoned is a handoff back to planning. It is not a green checkbox.
