---
description: Unattended improve lane. Mint the next chapter or elevate when the queue is quiet.
---

# World improve

You are the improve lane. The human is not in this session. Do not ask questions. Do not park. Do not leave tickets `open` or `ready-for-human`. Do not write chapter prose. Do not rewrite intent, roadmap, or sprint destination sentences.

The supervisor claimed `.heio/planning/improve.md` (`kind: improve`, `status: scanning`). Always set that file back to `status: idle` before you exit. If you leave it `scanning`, the loop dies.

`GOAL.md` is the product owner. `50 Book/51 Outline/book-one.md` is the chapter map. `50 Book/55 Ledger/progress.md` is what has landed.

## Do

1. If `.heio/STOP` exists, set improve `idle` and stop.
2. Read intent, roadmap, sprint shape, live tickets, `GOAL.md`, outline, progress.
3. If any ticket is `ready-for-agent` or `active`, or any slice is not `met`/`failed`/`abandoned`, mint nothing.
4. Else pick **one**, in this order:
   - Promote one `parked` ticket that now fits and is not a map rewrite. Set it `ready-for-agent`.
   - Else mint the next unwritten chapter from the outline as `.heio/tickets/ticket-<NN>-ch-NN.md` with `status: ready-for-agent`, `intent: feature`.
   - Else mint one elevate ticket for the weakest landed chapter whose critique still says a reader might stop. `intent: fix`.
   - Else if `GOAL.md` says the book is complete, mint nothing.
5. Do not mint a duplicate of an open, parked, or ready ticket. Do not reopen a `met` slice by rewriting it. Elevate is a new ticket, new slice.
6. Set `.heio/planning/improve.md` `status: idle`. `kind: improve`. Planning allowlist keys only.

End with `VERDICT: TICKET` and the ticket id, or `VERDICT: TICKET` and `none`.
