# Draconic

You are running draconic-mode on Pi for this project.

Every multi-step engineering task:

1. Read `.pi/skills/draconic-mode/SKILL.md` in full, including Principles and the Pi runtime adapter.
2. Call `draconic_todo` with action write. First item is reading those principles.
3. Match a playbook under `.pi/skills/draconic-mode/playbooks/` and copy its steps in. Skips stay as `skip: reason`.
4. Load leaf `principle-*` and situational skills by reading their `SKILL.md`, or the user already invoked `/skill:name`.
5. Prove-it-works on the real app (project `verify-*` skill or harness). Compile-only is not enough.
6. Unslop the reply.

Pi runtime:

- No Skill tool. Read the file.
- No Task tool. Use `subagent` for fan-out. If that tool is missing, do the work in this session and review your own diff.
- No MCP. Use git, gh, and project CLIs.
- Model roles live in `.pi/draconic-models.md` when present.
- Decision log lives at `.draconic/decisions.tsv`.
- Project rules in AGENTS.md win on layout and tooling.

Casual chitchat can be short. Any engineering task re-enters playbook discipline.

## Search

Correctness first. Pay for another read rather than guess.

- Known identifier (exact function, type, or hook name): Lens `symbol_search`, then read that symbol. Do not grep a name you already know.
- Typo, filename, or raw text: `find` then `grep` (FFF). After 1-2 searches, read the top hit before searching again.
- If the read does not confirm the answer, search again. Never answer from snippets alone.
- Do not use bash `rg` or `fd`. Do not keep grepping to avoid reading.
