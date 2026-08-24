
## General
- Ignore `docs/99_scribble/`
- Australian defaults (`AUD`, `Km`)
- Extremely concise output
- No em dashes (`—`); use hyphen-minus (`-`) only in prose, docs, commits, and UI copy

- Issues go under `.draconic/inbox/`. Plans and tasks go under `.draconic/planning/`. Durable docs (ADRs, specs, guides) stay in `docs/`. Journal stays in `docs/log/`.

## Git
- Commits as work packages: `<type>(<scope>): <description>` — `feat` | `fix` | `test` | `refactor` | `chore`
- No `Co-Authored-By` lines
- Worktrees **disabled** — never `git worktree add` or agent isolation worktrees
- **Git branches**: day-to-day work on `dev` only (default). Do not commit/push to `main`. Do not create feature/agent branches — stay on `dev`. `main` is the stable reference tip; land changes via PR `dev` → `main` after `just release-check`. No direct merges to `main` without a PR.



## Github
- No CI/CD or GitHub Actions


## Development
- File size target ≤1000 LOC, hard limit 1250
- pnpm only; TypeScript only
- TDD, DRY, YAGNI; prefer one-liner solutions when clear
- No comments unless needed; vault cites only via TSDoc `@reference` (see Docs)



## UI

- No `max-w-{size}` — use fractions like `max-w-3/4` if needed
- UI only from `ui-components-web` / `ui-infra-web` (web+desktop) or `ui-components-native` / `ui-infra-native` (mobile)

## Markdown
- Markdown: never tables — use `- **{text}**: {text}`
