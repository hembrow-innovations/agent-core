---
title: Use Browser Mode only when the DOM stand-in lies
impact: MEDIUM
impactDescription: browser tax on unit work
tags: [browser]
---

## Use Browser Mode only when the DOM stand-in lies

Browser Mode is a real browser. It is for layout, ARIA, and visual bugs happy-dom cannot see. It is not the default unit runner.

**Incorrect:** Enabling `browser.enabled` for a `sum` test.

**Correct:** A separate project with Browser Mode for component tests that need a real engine. Units stay on `node` or happy-dom.

Notes: `browser` is not `environment: "browser"`. Init with `vitest init browser` if the repo is starting fresh.
