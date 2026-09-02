---
title: Pool statuses
impact: HIGH
tags: [pool]
---

# Pool statuses

`.heio/pool/` files use these statuses, in order:

`draft` → `ready` → `claimed` → `implemented` → `completed`

Anyone may draft. Planning or triage marks `ready`. A builder skill claims and stops at `implemented` unless the invoked prompt is through-to-complete.
