# Principals catalog (reference only)

Prefer `rules/` plus the `SKILL.md` router. This file is the review surface and the skip rationale. It is not auto-injected on skill load.

Twenty-eight rules. Twenty-one general. Seven written for life-engine (`Personal` / `Share` / `react-api` / vault promises). Product rules stay in the pack so one install covers both. The router says when they apply.

## How to review

Read the one-line "changes this decision" under each rule. If you cannot picture an agent picking the wrong move without it, delete the rule.

## General

- **principle-prove-it-works.** Changes "it typechecks" into a run on the real surface.
- **principle-fix-root-causes.** Changes a nil-check or skipped repro into reproduce-then-fix.
- **principle-encode-lessons-in-structure.** Changes a second reminder into a lint, a banned API, or an unrepresentable state.
- **principle-model-the-domain.** Changes another `if (kind === ...)` into a structure.
- **principle-boundary-discipline.** Changes scattered client guards into one boundary.
- **principle-type-system-discipline.** Changes stringly ids and optional flags into unrepresentable illegal states.
- **principle-laziness-protocol.** Changes a new layer or signal thread into the smallest diff.
- **principle-subtract-before-you-add.** Changes a bolt-on into delete-then-build.
- **principle-sequence-verifiable-units.** Changes a fat sweep into issue, promise, test, code, each green before the next.
- **principle-build-the-lever.** Changes a hand edit across packages into a script or a skill a reviewer can rerun.
- **principle-never-block-on-the-human.** Changes "should I do X?" on reversible work into do X, then present.
- **principle-experience-first.** Changes implementation convenience into the user-facing shape.
- **principle-exhaust-the-design-space.** Changes the first idea into 2-3 prototypes.
- **principle-redesign-from-first-principles.** Changes a bolt-on flag into a day-one redesign, delivered incrementally.
- **principle-outcome-oriented-execution.** Changes throwaway compatibility into converge-on-target.
- **principle-make-operations-idempotent.** Changes "assume a clean start" into a second run that converges.
- **principle-separate-before-serializing-shared-state.** Changes a lock-by-convention into owned files, then a structural lock only if one writer is real.
- **principle-foundational-thinking.** Changes logic-first into data-shape-first.
- **principle-minimize-reader-load.** Changes a one-caller wrapper into an inline.
- **principle-migrate-callers-then-delete-legacy-apis.** Changes a dual internal API into one wave.
- **principle-guard-the-context-window.** Changes a bulk dump into a subagent summary.

## Product (life-engine names)

- **principle-intent-ladder-stop.** Changes "just make it work" into stop, issue, or assert. Overrides never-block-on-the-human for product rules.
- **principle-personal-home-shared-bridge.** Changes "put the record on the shared engine" into Personal home, Shared Shares, Projection mirror.
- **principle-rls-is-the-security-boundary.** Changes a hidden React field or a client allow-list into SQL policy.
- **principle-react-api-owns-shared-behaviour.** Changes a feature-local `useSupabase().from(...)` or a native twin hook into one react-api hook.
- **principle-occurrences-project-never-materialize.** Changes "add this bill to the calendar" into a projected occurrence with write-back to the owning domain.
- **principle-zod-degrades-never-blanks.** Changes a strict throw on read drift into warn-and-return-raw-rows.
- **principle-contracts-have-two-altitudes.** Changes stitch-as-law or CRUD-in-`ui/contract.md` into behaviour vs presentation promises.

## Conflicts

- Intent ladder overrides never-block for product direction. Execution of a named promise still proceeds.
- Outcome-oriented execution and redesign-from-first-principles must not rewrite a locked promise. Edit the promise line first.
- Idempotent operations are right for `db:reset` and seeds. Dangerous if they resurrect retired sync.
- Experience-first "delight" must not invent chrome past a named promise.

## Do not put here

Standing commands stay in the dest `AGENTS.md`. pnpm only, branch names, worktree policy, commit trailer rules. Those are rules, not judgment.

Project skills own procedure. `behaviour-contracts` and `vault-pack` for the read order. `supabase` and `tanstack-query` for the paved path. These principles flip a design choice. They do not restate those skills.
