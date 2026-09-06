---
name: tsdoc-reference
description: TSDoc on every TypeScript declaration, plus edges (@see, {@link}, @reference) and @onic graph comments. Use when writing or editing any .ts or .tsx file, writing an @onic comment, or when another skill needs the edge convention.
---

# TSDoc

Every TypeScript declaration in product `.ts` / `.tsx` carries a `/** */` block. Contracts lock behaviour (**behaviour-contracts**); TSDoc states why and points outward. Source points outward only through TSDoc. Three edge kinds:

- **`@see`**: related **symbol / API**
- **`{@link …}`**: **file path** or **https URL**
- **`@reference <kind>: <id>`**: durable **vault** truth under `docs/`

When the project uses onic (`.onic/` or **onic-schema**), graph-worthy comments also take **`@onic`**. That tag feeds the onic graph. It does not replace TSDoc.

Planning documents (`s-*`, `ticket-*`, `tasks-*`, `plans-*`, `#N`) are not product truth, they do not appear in source comments.

Imports remain an automatic structural graph; do not hand-annotate them. `[[wikilinks]]` stay in Markdown notes, never inside TSDoc.

## Coverage

A `/** */` block on:

- **Module**: file-level block at the top of a barrel or a file with a coherent public surface
- **Types**: type alias, interface, enum, enum member
- **Values**: function, class, constructor, method, accessor, property, module-scope `const` / `let` / `var`
- **Members**: every class, interface, and type-literal member, including private
- **Nested named functions** inside another function

Exported and non-exported are the same rule. Skip: imports, re-export lines, generated / vendored files, `it` / `test` / `describe` callbacks, local `const` / `let` that are not functions.

New files ship fully documented. New or edited declarations get a block before the change lands. A declaration you touch that lacks a block is a defect. Do not open a file only to backfill. Do not mass-sweep the repo.

## Body

1. First line = human *why*. Do not restate the identifier or the type.
2. Callables take `@param` for each parameter, `@typeParam` for each type parameter, and `@returns` when the return is not `void`. Constructors omit `@returns`. Getters omit `@param`. Setters omit `@returns`.
3. Edge tags (`@see`, `{@link}`, `@reference`) only when the target exists. A declaration still needs its why-line when it has zero edges.
4. Tags live only in `/** … */` on the declaration that owns the constraint. TSDoc stays out of `//`.
5. Non-TS (SQL/JSON/YAML/shell): nearest TypeScript seam or a vault note. `@onic` may also sit in Python `#` comments when that project uses onic.
6. `@onic` may be a `//` (or `#`) line comment or a block.

On touch: drop work-package ids. No vault home → plain why-clause, no fake `@reference`.

Generated / vendored: do not hand-edit. Commit messages, changelog, and planning may cite work packages. Old ticket cites in git blame are fine.

## `@see` - symbol / API

One related API per line (repeat the tag):

```text
@see SymbolName
@see SymbolName - short note
```

Exported declaration names resolvable in context: functions, types, classes, consts, hooks. Optional short prose after `-` or `:`.

A path, URL, or vault id is not an `@see` target - use `{@link}` or `@reference`. Keep `@see` symbol-only; do not wrap `{@link}` inside `@see`.

## `{@link}` - path or URL

Inline only (`{@link dest}` or `{@link dest | label}`). There is no bare `@link` block tag.

- **Repo-root path**: posix, no leading `/`, from the monorepo root, with extension when it is a file
- **URL**: `https://…` only

A bare symbol is `@see`. A vault stem/id is `@reference`.

## `@reference` - typed vault id

One fact per line:

```text
@reference <kind>: <id>
```

- **`<kind>`**: lowercase token from the list below
- **Colon + single space**: `adr: ADR-0024`, not `adr:ADR-0024`
- **`<id>`**: path-free stable id (stem, ADR code, or promise id)

Kinds (kind + id resolve the home; no `docs/...` inside the tag):

- **`adr`**: `ADR-0024` → `docs/decisions/adr/`
- **`guide`**: stem → `docs/guides/`
- **`standard`**: stem → `docs/standards/`
- **`architecture`**: stem → `docs/architecture/`
- **`overview`**: stem → `docs/overview/`
- **`api`**: stem under `docs/api/`
- **`style`**: stem under `docs/style/`
- **`promise`**: contract promise id (`tasks.crud:comments`)
- **`purpose`**: feature purpose stem when citing purpose only
- **`glossary`**: glossary heading text when the term *is* the rule

Kind is required and singular (`guide`, not `guides`). Vault layout: **docs** skill.

## `@onic` - onic graph comment

Only when the project uses onic. Skip this tag elsewhere. Extra structure is optional; do not spray it on every declaration.

A comment that starts with `@onic` becomes a `comment` node. Fields sit on that line. Body is the next lines of the same comment. Markdown is not scanned for `@onic`.

Line form:

```ts
// @onic kind=why relates=login
// We keep sessions on the server so they can be revoked.
```

Block form (may sit in the same `/** */` as TSDoc tags):

```ts
/**
 * @onic kind=invariant relates=SessionStore,login
 * Sessions expire within 24 hours.
 *
 * @see SessionStore
 */
```

Trailing on the same line as code also counts:

```ts
foo(); // @onic kind=hack
```

Fields:

- **`kind`**: `kind=why` → stored as `props.commentKind`. Node kind stays `comment`. Default `note`. Values the docs use: `note`, `why`, `invariant`, `decision`, `hack`, `todo`, `warning`.
- **`relates`**: `relates=login,SessionStore` → one `relates` edge per name (symbols, not paths).
- **`tags`**: `tags=auth,security` → one `tagged` edge per tag.

`kind=todo` is an onic comment kind, not a work-package id. Still no `ticket-*` / `s-*` in the body.

Related symbols that must appear in the onic graph go on `relates=`. `@see` remains the TSDoc/IDE edge. Do not invent `@onic` inside strings. Parser and walk languages: project `docs/reference/comments.md` when it exists.

## Examples

```ts
/**
 * Fail-closed allowlist for mobile auth redirect URLs (scheme + path).
 * Inbound recovery: {@link apps/mobile/src/lib/deep-link-auth.ts}.
 *
 * @param url - Candidate redirect URL
 * @returns True when the URL is on the allowlist
 *
 * @see MOBILE_SUPABASE_REDIRECT_ALLOWLIST
 * @see mobileAuthRedirectTarget
 * @see isMobilePasswordResetRedirectUrl
 *
 * @reference adr: ADR-0024
 * @reference guide: mobile-deep-links
 */
export function isAllowedMobileAuthRedirectUrl(url: string): boolean {
    /* … */
}
```

```ts
/**
 * Walk skill folders under the pack root.
 *
 * @param skillsRoot - Absolute `ai/skills` path
 * @param visit - Called with each skill directory
 */
function walkSkillDirs(
    skillsRoot: string,
    visit: (dir: string) => void,
): void {
    /* … */
}
```

```ts
/**
 * Completes many tasks; each id runs the single-task path.
 *
 * @param ids - Task ids to complete
 *
 * @see completeTask
 * @see useUncompleteTask
 *
 * @reference adr: ADR-0030
 * @reference promise: tasks.crud:complete
 */
```

```ts
/**
 * Shared feature-settings link table (web re-export).
 *
 * {@link packages/core/settings/shared/featureSettingsLinks.ts}
 */
```

Mix-ups (wrong → right):

- missing `/** */` on a declaration → add the why-line (and callable tags)
- TSDoc only on exports → internals too
- `/** @link path */` → `{@link path}`
- `{@link SymbolName}` → `@see SymbolName`
- `@see path` → `{@link path}`
- `@see vault-stem` or `{@link vault-stem}` → `@reference kind: id`
- `@reference mobile-deep-links` → `@reference guide: mobile-deep-links`
- `@reference adr:ADR-0024` → space after `:`
- `@see {@link path}` → standalone `{@link path}`
- `@reference [[stem]]` → `@reference kind: stem`
- `@onic` on a project without onic → omit it
- `@onic relates=docs/foo.md` → `relates=` is symbols; paths stay `{@link}`
