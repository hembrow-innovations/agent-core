---
title: Poll the condition, do not sleep
impact: HIGH
impactDescription: sleeps are slow flakes
tags: [async, flake]
---

## Poll the condition, do not sleep

`setTimeout` is not an assertion. `expect.poll` retries the matcher until it passes or times out.

**Incorrect:** `await new Promise((r) => setTimeout(r, 500)); expect(el.textContent).toBe("ready");`

**Correct:** `await expect.poll(() => el.textContent).toBe("ready");`

Notes: DOM Testing Library `findBy` is still the right wait for RTL. See `react-testing`. Default poll timeout is 1000ms.
