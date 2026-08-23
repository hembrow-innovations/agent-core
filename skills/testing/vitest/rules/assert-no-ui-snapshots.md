---
title: Do not snapshot UI
impact: HIGH
impactDescription: noise diffs, no behavior signal
tags: [assert, snapshot]
---

## Do not snapshot UI

Markup snapshots break on class and copy churn. They do not say what the user can do.

**Incorrect:** `expect(container.innerHTML).toMatchSnapshot()` after `render(<Page />)`.

**Correct:** Assert visible text, role, or a returned value. Snapshot a stable serialized fixture (a parsed AST, a SQL string) only when the oracle is that string.

Notes: `react-testing` bans snapshots for components. Custom element snapshots now print shadow roots in v4.
