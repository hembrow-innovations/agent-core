---
name: principals-catalog
description: Review catalog of principle skills selected for life-engine. Not loaded as an agent skill.
disable-model-invocation: true
---

# Principals catalog

A first cut for life-engine (`/Users/jaredhembrow/workbench/life-engine-work-bench/projects/life-engine`). Seventeen leaf skills. Ten copied from the original principle pack. Seven written for this product. Folder name is `principals` because that is what you asked for.

Each leaf is a short `SKILL.md` with `name`, `description`, and `disable-model-invocation: true`. Same shape as `skills/principals/principle-fix-root-causes`.

This file is the review surface. Cut anything that does not change a decision. Add anything I skipped that would.

## How to review

Read the one-line "changes this decision" under each skill. If you cannot picture an agent picking the wrong move without it, delete the skill.

Copied skills stay close to the originals. Only `principle-prove-it-works` has a life-engine note (reset the DB, typecheck is not proof, Maestro after checking the emulator).

New skills point at vault names (ADR-0023, data-flows) instead of copying those docs.

## Take (copied from the original pack)

- **principle-prove-it-works.** Changes "it typechecks" into a run on the real surface from `pnpm db:reset`.
- **principle-fix-root-causes.** Changes a nil-check or "skip Maestro, no simulator" into reproduce-then-fix.
- **principle-encode-lessons-in-structure.** Changes a second reminder in AGENTS.md into a lint, a `forbid-*` promise, or a vault-pack must-read.
- **principle-model-the-domain.** Changes another `if (engineType === ...)` into Engine / Share / Projection as structure.
- **principle-boundary-discipline.** Changes scattered client guards into one boundary. Pair with `principle-rls-is-the-security-boundary` so the boundary is Postgres, not Zod.
- **principle-type-system-discipline.** Changes stringly `engine_id` and optional flags into unrepresentable illegal states.
- **principle-laziness-protocol.** Changes a new layer or signal thread into the smallest diff.
- **principle-subtract-before-you-add.** Changes a bolt-on (`features/*/api`, requirements/design/tasks triad) into delete-then-build.
- **principle-sequence-verifiable-units.** Changes a fat sweep into issue, promise, test, code, each green before the next.
- **principle-build-the-lever.** Changes a hand edit across packages into a script or a skill a reviewer can rerun.

## Add (written for life-engine)

- **principle-intent-ladder-stop.** Changes "just make it work" into stop, issue, or assert. Overrides never-block-on-the-human for product rules.
- **principle-personal-home-shared-bridge.** Changes "put the record on the shared engine" into Personal home, Shared Shares, Projection mirror. Folds source-owned grants and "Personal is not a product object."
- **principle-rls-is-the-security-boundary.** Changes a hidden React field or a client allow-list into SQL policy. Folds privacy-mask-is-not-visibility.
- **principle-react-api-owns-shared-behaviour.** Changes a feature-local `useSupabase().from(...)` or a native twin hook into one react-api hook. Folds one-product-three-skins.
- **principle-occurrences-project-never-materialize.** Changes "add this bill to the calendar" into a projected occurrence with write-back to the owning domain.
- **principle-zod-degrades-never-blanks.** Changes a strict throw on read drift into warn-and-return-raw-rows.
- **principle-contracts-have-two-altitudes.** Changes stitch-as-law or CRUD-in-`ui/contract.md` into behaviour vs presentation promises.

## Skip (on purpose)

- **never-block-on-the-human.** Fights the intent ladder. Product direction is not reversible execution. Use `principle-intent-ladder-stop` instead.
- **experience-first.** "Delight" invents chrome and pixels past purpose out of scope. Craft inside a named promise is already covered by prove-it-works.
- **exhaust-the-design-space.** Prototypes that answer product questions in code skip the ladder.
- **redesign-from-first-principles.** Useful, but it will rewrite a locked promise without editing the line first.
- **outcome-oriented-execution.** Same risk. Converge by editing the promise, not by silent target drift.
- **make-operations-idempotent.** Right for `db:reset` and seeds. Dangerous if it resurrects retired sync or oplog.
- **separate-before-serializing-shared-state.** Worktrees are disabled. Concurrent sessions already have the rule: stage explicit paths, never `git add .`.
- **foundational-thinking.** Overlaps model-the-domain plus subtract-before-you-add.
- **minimize-reader-load.** Good taste, low unique leverage next to laziness-protocol.
- **migrate-callers-then-delete-legacy-apis.** Already how this repo deleted Next, Rust, and `features/*/api`. Add it if that muscle fades.
- **guard-the-context-window.** `vault-pack` already is the local lever.

## Skip (life-engine candidates, folded or too narrow)

- **source-owned-grants.** Folded into personal-home-shared-bridge.
- **privacy-mask-is-not-visibility.** Folded into rls-is-the-security-boundary.
- **personal-engine-is-not-a-product-object.** Folded into personal-home-shared-bridge.
- **one-product-three-skins.** Folded into react-api-owns-shared-behaviour.
- **features-consume-connections.** Real (ADR-0031) but one-feature-narrow. Add if calendar keeps growing a second Connect Google.
- **projection-tags-are-snapshots.** Real (ADR-0032) but one-feature-narrow. The personal-home skill already says dictionary rows stay Personal.

## Do not put here

Standing commands stay in life-engine `AGENTS.md` and `docs/reference/guides/agent-gotchas.md`. pnpm only, stay on `dev`, no worktrees, no `Co-Authored-By`, Australian defaults, UI kit only. Those are rules, not judgment.

Project skills already own the procedure. `behaviour-contracts` and `vault-pack` for the read order. `supabase` and `tanstack-query` for the paved path. These principles should flip a design choice, not restate those skills.

## After you cut

Say which leaves to delete or add. I will not install this into life-engine `.opencode/skills/` until you say so.
