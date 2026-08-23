---
name: principle-rls-is-the-security-boundary
description: "Apply when hiding fields, writing access control, filtering lists, or skipping a render 'so they cannot see it'. Postgres RLS is the security boundary. UI hiding and client Zod are not."
disable-model-invocation: true
---

# RLS Is the Security Boundary

Security lives in Postgres RLS. Every surface talks to Supabase directly. There is no app server to hide behind.

**Why:** A client filter, a hidden React field, or a Zod parse is not privacy. Another surface, a crafted request, or a stale cache will walk around it.

**Pattern:**
- New access rules go in SQL policy. Reuse `owns_record_engine`, `has_share_access`, and membership helpers. Do not write a one-off join in a feature.
- Field-level visibility lives on the Share and is enforced by RLS.
- Privacy mask is a device-local shoulder-surf toggle. It is not household visibility.
- Client Zod is shape sanity. It is not a security boundary. See `principle-zod-degrades-never-blanks`.
- Do not invent client-side allow-lists as a substitute for policy.

**The test:** if the UI vanished, would PostgREST still refuse the row? If no, the rule is in the wrong layer.
