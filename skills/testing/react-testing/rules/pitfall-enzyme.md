---
title: Do not introduce Enzyme
impact: CRITICAL
impactDescription: Enzyme is unmaintained and couples to internals
tags: [pitfall, render]
---

## Do not introduce Enzyme

Enzyme is not in these stacks. Do not add it, do not use `shallow`, do not inspect `wrapper.state()`.

**Incorrect:**
```ts
import { shallow } from "enzyme";
expect(shallow(<Button />).state("busy")).toBe(false);
```

**Correct:** `render` from Testing Library (web) or RNTL (native). Assert visible behavior.

Notes: `@testing-library/react-hooks` is also gone — use RTL `renderHook`.
