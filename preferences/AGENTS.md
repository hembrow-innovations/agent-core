# Agent preferences

Minimal stub — expand per project after install. Project-specific rules win.

## General

- Prefer matching the target project's existing patterns over inventing new ones.
- Keep changes small and focused.
- Do not commit secrets or credentials.
- Stage explicit paths only. Never `git add .` / `-A` unless the human asks.
- Commit only when the user asks. Never merge branches unless asked.

## Code style

- Match surrounding code style (formatting, naming, imports).
- Prefer clear names over clever abstractions.

## Layout

- Follow the repository's existing directory structure.
- Do not reorganize files unless explicitly asked.

## When pstack is installed

- Non-trivial work: use agent `poteto` or `/poteto-mode`.
- Prove-it-works before done (project verify skill or harness — not compile-only).
- Docs lead code when a `docs/` tree exists.
