---
name: vault-pack
description: Assemble a small vault context pack before coding or planning. Purpose, contracts, ADRs, and the unit file. Use when starting a ready issue or task, AFK step 0, behaviour work, or when the agent needs the right docs without grepping half the vault. Not embeddings. Path pack from area plus token rank when a packer exists.
---

# Vault pack

A context pack is the small set of notes to read before changing product behaviour or implementing a unit. It replaces an open-ended explore dump.

## Discover first

1. Search for a project packer. Look in package scripts, justfile, Makefile, and `scripts/` for names like `vault:pack`, `vault-pack`, or `docs:pack`.
2. If `AGENTS.md` or `WORKSPACE.md` already names a tracker (`.scratch/`, `docs/planning/`, GitHub Issues), that file wins. Do not start a second tree.
3. Otherwise resolve the unit through **management**. The unit is an issue (`.heio/inbox/issues/`) or a task (`.heio/planning/tasks/`).
4. Durable notes live under `docs/`. Load **docs** for purpose, contracts, ADRs, architecture, and guides.

One project's packer is `pnpm vault:pack`. Another is `node scripts/vault-pack.mjs`. Use what you find. Do not invent a new packer script.

## When

- Ready unit start (step 0)
- Behaviour or contract work
- User asks what docs apply to a task
- Before inventing product rules

## Steps

1. Resolve inputs from the unit file or the user message.
   - `area` from frontmatter. Required for a tight pack. If missing, infer from paths in the brief.
   - Optional query. Title plus Agent Brief excerpt.
2. If a packer exists, run it. Pass `--unit` with the unit path you resolved. Or pass `--area` and `--query`. Add `--json` if you need machine output. Read `--help` for that script's flags.
3. If no packer exists, assemble the pack by hand. Do not write a script.
   - Read the unit via **management**.
   - Search **docs** for that area's purpose, contracts, ADRs, and guides.
   - Must-read is purpose, the matching contracts, and any intent or gotchas guide that exists.
   - Related is other area notes and nearby ADRs. Cap it. Do not dump the vault.
4. Read every Must-read path in full. Related is optional skim.
5. Behaviour work. Name contract promise ids from those contracts. Load **behaviour-contracts** if you will edit promises. Empty ladder means stop. Open an issue or assert. Never invent product rules. `principle-intent-ladder-stop` owns that stop if it is installed.
6. Done when the pack is printed and every Must-read file is actually Read. Not when a CLI merely ran.

## Always-on notes

A packer may inject standing guides when they exist. Discover them under `docs/`. Common names are intent-system, behaviour-contracts, and agent-gotchas. Do not treat a hardcoded `docs/reference/guides/...` path as the only law.

## Policy

- Hot corpus is specs, guides, overview, ADRs, and architecture via **docs**, plus open working notes via **management**.
- Skip journal, reports, scribble, and closed notes.
- No vector index. Token rank plus area path pack only.

## Output shape

Print markdown with Query, Area, Must read, Related, Excluded, Next. Prefer that block over a freestyle doc list.
