---
name: principle-personal-home-shared-bridge
description: "Apply when touching engine_id, schema, sharing, tags, settings, or any plan to put a domain row on a shared engine. Personal engines own records. Shared engines hold Shares only."
disable-model-invocation: true
---

# Personal Home, Shared Bridge

Domain rows live only in a Personal engine. A Shared engine is a bridge of Shares and membership. Projection is a per-member mirror, never a source of truth.

**Why:** Treating any engine as a home for records splits ownership from home and lets a bridge role reach Personal data.

**Pattern:**
- Record `engine_id` must be Personal. Records stay pure. No sharing columns on the row.
- Share `engine_id` must be Shared. The Share is the grant.
- Only the source Personal owner grants, hides fields, or revokes. Shares never beget Shares.
- Bridge Role administers the bridge (settings, membership, invites). It cannot escalate a Share unless Delegation is set, and Delegation never grants re-sharing.
- Edits on a projection write back to the source Personal row when the grant allows. Never copy or move the row into the bridge.
- Dictionary rows (tags, settings that bind to a home) live on Personal engines. Projected chips are snapshots.

**Product language.** User-facing "engine" means a shared bridge. The Personal home is account or my-data language. Do not list a Personal engine as an Engines row.

**Vault:** ADR-0023. Glossary terms Engine, Share, Projection, Delegation, Role.

**The test:** if this row disappeared from the Shared engine, would the owner's data still exist? If no, you put a home on the bridge.
