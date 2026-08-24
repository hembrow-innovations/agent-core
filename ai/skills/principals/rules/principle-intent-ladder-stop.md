---
title: Intent Ladder Stop
impact: CRITICAL
impactDescription: Stops invented product rules
tags: [stop, product, contracts]
---

## Intent Ladder Stop

**Incorrect:** Just make it work under a locked promise, or invent the missing rule.
**Correct:** Stop. Open an issue or assert a promise. Execution of a named promise proceeds.

If purpose and contracts do not answer the question, stop. Open an issue or assert a promise. Do not invent product rules.

**Why:** Prose that is not locked will drift. A plausible "just make it work" change is how agents invent a second product.

**Pattern:**
- Read purpose first. Out of scope is a hard fence.
- Name the contract promise ids the change must keep or edit.
- Empty ladder or a non-empty Open product questions section means stop.
- Changing behaviour means editing a promise line first, then the test, then the code.
- Do not "fix it so it just works" under an existing locked promise.

**This overrides never-block-on-the-human for product direction.** Execution of a named promise proceeds. Inventing the promise does not.

**Delegate:** load `behaviour-contracts` and `vault-pack` for the read order and the promise format. Do not restate them here.

**The test:** can you point at a promise id? If not, you are freestyling.
