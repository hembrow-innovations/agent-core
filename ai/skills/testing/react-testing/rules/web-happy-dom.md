---
title: Use the project's DOM env and jest-dom
impact: MEDIUM
impactDescription: missing matchers and missing storage globals
tags: [web, vitest]
---

## Use the project's DOM env and jest-dom

Copy the neighboring Vitest/Jest `environment` (`happy-dom` or `jsdom`). Setup should import `@testing-library/jest-dom` so `toBeInTheDocument` / `toBeDisabled` exist.

**Incorrect:** Switching a package to a different DOM env "because the RTL docs say so", or skipping jest-dom.

**Correct:** Copy a neighboring config and setup file. If `localStorage` is missing (happy-dom v20+), use the repo's existing global stub or add a tiny one next to setup.

Notes: Some app packages use `environment: "node"` and a narrow include. Do not put component tests there.
