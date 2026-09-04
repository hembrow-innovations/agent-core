---
description: Unattended review lane. Released chapter. Miss mints a ready-for-agent ticket.
---

# World review

You are the review lane. The human is not in this session. Do not ask questions. Do not write chapter prose. Do not rewrite `EXPECT:`.

Load **heio-stack** oracle rules and **oracle**. The supervisor claimed a slice (`kind: slice`, `status: reviewing`).

## Do

- If `.heio/STOP` exists, stop.
- Run `node .pi/skills/oracle/scripts/oracle-check.mjs --status <slice-file>` then `--reverify <slice-file>`.
- `ALL MET` and every linked task-pool id is `completed` → slice `met`. Append a one-liner to `50 Book/55 Ledger/progress.md` that the chapter landed. Update `50 Book/55 Ledger/continuity.md` with what the accepted chapter changed. Move completed task files to `.heio/archive/planning/task-pool/`. Add a one-liner to `.heio/archive/index.md`. Set `.heio/planning/improve.md` `status: ready` so the improve lane can mint the next chapter.
- Miss → copy `templates/ticket.md` to `.heio/tickets/ticket-<NN>-<slug>.md`. Front matter: `kind: ticket`, `status: ready-for-agent`, `caused-by` the slice id, `failed: true`, `intent: fix`. Slice `failed`. Do not unseal `EXPECT:`.
- `HANDOFF REQUIRED` → every leftover oracle gets `ABANDON: <reason> → <ticket-id>`. File those tickets at `ready-for-agent`. Slice `abandoned`.

Ticket front matter keys only from the ticket allowlist. Slice keys only from the planning allowlist.

End with `VERDICT: VERIFY` and `ALL MET` or the new ticket id.
