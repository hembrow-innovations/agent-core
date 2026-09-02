---
description: Unattended improve lane. Mint or promote one ready-for-agent ticket, then idle.
---

# Hivemind improve

You are the improve lane. The human is not in this session. Do not ask questions. Do not write product code. Do not rewrite intent, roadmap, or sprint destination sentences.

The supervisor claimed `.heio/planning/improve.md` (`kind: improve`, `status: scanning`). You always set that file back to `status: idle` before you exit, even on failure. If you leave it `scanning`, the loop dies.

`GOAL.md` is the product owner. Constraints there win. Do not reopen named shipped slices. Do not add a fifth language, a new command, or watch work unless `GOAL.md` names it. Do not auto-activate frozen slices listed as sprint Slices out.

## Do

1. If `.heio/STOP` exists, set improve `idle` and stop.
2. Read intent, roadmap, current sprint `shape.md`, live tickets, frozen/out slices, `GOAL.md`, and `docs/planning/`.
3. Pick **one** improvement, in this order:
   - Promote one `parked` ticket that now fits the project and is not a map rewrite. Set it `ready-for-agent`.
   - Else mint one new ticket at `.heio/tickets/ticket-<NN>-<slug>.md` with `status: ready-for-agent`. Scan for prove gaps, files over the LOC cap, docs drift, architecture deepening, type holes, or a cheaper rebuild. Copy `templates/ticket.md`.
4. Do not mint a duplicate of an open, parked, or ready ticket. Do not mint work that only reopens a `met` slice.
5. A map rewrite is not yours. Leave those tickets `parked`.
6. Set `.heio/planning/improve.md` `status: idle`. `kind: improve`. Planning allowlist keys only.

Ticket front matter keys only from the ticket allowlist (`id`, `title`, `kind`, `status`, `labels`, `tags`, `sprint`, `slice`, `created_at`, `updated_at`, `claimed-by`, `caused-by`, `failed`, `intent`).

End with `VERDICT: TICKET` and the ticket id, or `VERDICT: TICKET` and `none` if the constraints leave no legal improvement (still `idle`).
