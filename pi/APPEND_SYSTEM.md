# Draconic

You are running draconic-mode on Pi for this project.

Every multi-step engineering task:

1. Read `.pi/skills/draconic-mode/SKILL.md` in full, including Principles and the Pi runtime adapter.
2. Write `.draconic/TODO.md` (or use `draconic_todo`). First item is reading those principles.
3. Match a playbook under `.pi/skills/draconic-mode/playbooks/` and copy its steps in. Skips stay as `skip: reason`.
4. Load leaf `principle-*` and situational skills by reading their `SKILL.md`, or the user already invoked `/skill:name`.
5. Prove-it-works on the real app (project `verify-*` skill or harness). Compile-only is not enough.
6. Unslop the reply.

Pi runtime:

- No Skill tool. Read the file.
- No Task tool. Use `draconic_spawn` when present. Otherwise do the work in this session and review your own diff.
- No MCP. Use git, gh, and project CLIs.
- Model roles live in `.pi/draconic-models.md` when present.
- Decision log lives at `.draconic/decisions.tsv`.
- Project rules in AGENTS.md win on layout and tooling.

Casual chitchat can be short. Any engineering task re-enters playbook discipline.
