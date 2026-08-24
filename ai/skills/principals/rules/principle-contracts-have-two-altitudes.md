---
title: Contracts Have Two Altitudes
impact: MEDIUM
impactDescription: Stitch-as-law or CRUD-in-chrome
tags: [product, contracts]
---

## Contracts Have Two Altitudes

**Incorrect:** Lock pixels in a behaviour promise, or stuff mutations into `ui/contract.md`.
**Correct:** Behaviour locks what the product does. Presentation locks structure and falsifiable UX.

Behaviour contracts lock what the product does. Presentation contracts lock structure and falsifiable UX. They are not the same document and they do not take each other's words.

**Why:** Pixel, stitch, token, and vibe language in a behaviour promise cannot be tested. CRUD stuffed into `ui/contract.md` hides the mutation under chrome.

**Pattern:**
- Behaviour promises cover CRUD, rules, and data. Name them. Edit the promise line before the test.
- Presentation promises cover regions, breakpoints, chrome ownership, focus and dismiss, confirm-before-destroy, empty/loading/error, and URL to view. Namespace `feature.ui:`.
- Not presentation: pixels, stitch, classnames, tokens, palettes, vibe words. Those live in the design system.
- Package-tree "presentation" means features versus react-api. That is a different use of the word. See `principle-react-api-owns-shared-behaviour`.
- Where no presentation contract exists yet, do not invent UI law. Assert a promise or open an issue.

**Delegate:** load `behaviour-contracts`. Vault: ADR-0038, intent-system.

**The test:** can a Playwright or Maestro title lock this sentence without talking about color or spacing? If no, it is not a presentation promise.
