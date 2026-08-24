---
title: Do not mix MSW and mock-client
impact: HIGH
impactDescription: mixed styles hide unhandled requests
tags: [mock, msw]
---

## Do not mix MSW and mock-client

A domain should use one network style. Discover which one neighboring tests in that folder already use.

- **Mock-client:** stub `useClient` / query helpers. No HTTP server.
- **MSW:** `setupServer` from `msw/node`, handlers next to the tests, `onUnhandledRequest: "error"` or `"warn"`.

**Incorrect:** Adding `server.use(http.get(...))` to a hook test that already mocks the query helper.

**Correct:** Stay inside the domain's style. New domains copy the repo default (mock-client if both exist and docs do not say otherwise).

Notes: Feature UI never needs MSW if hooks are mocked. Do not introduce MSW to native Jest unless the package already has it.
