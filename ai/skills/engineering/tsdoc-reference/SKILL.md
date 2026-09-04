---
name: tsdoc-reference
description: TSDoc edges (@see, {@link}, @reference) and @onic graph comments. Use when writing or editing TSDoc on a TypeScript export, writing an @onic comment, or when another skill needs the edge convention.
---

# TSDoc edges

TypeScript product source points outward only through **TSDoc** on owning exports. Three edge kinds:

- **`@see`** - related **symbol / API**
- **`{@link …}`** - **file path** or **https URL**
- **`@reference <kind>: <id>`** - durable **vault** truth under `docs/`

When the dest uses onic (`.onic/` or **onic-schema**), graph-worthy comments also take **`@onic`**. That tag feeds the onic graph. It does not replace TSDoc.

Prefer a locked contract promise + test (**behaviour-contracts**) over any comment. Most exports need zero tags. Only intentional seams and non-obvious law.

Planning documents (`s-*`, `ticket-*`, `tasks-*`, `plans-*`, `#N`) are not product truth, they do not appear in source comments.

Imports remain an automatic structural graph; do not hand-annotate them. `[[wikilinks]]` stay in Markdown notes, never inside TSDoc.

## Placement

1. TSDoc tags only in `/** … */` on the **exported** module, type, const, or function that owns the constraint.
2. Summary line = human *why*. Tags = *where* / *related API*.
3. Non-TS (SQL/JSON/YAML/shell): nearest TypeScript seam or a vault note. `@onic` may also sit in Python `#` comments when that dest uses onic.
4. `@onic` may be a `//` (or `#`) line comment or a block. TSDoc tags stay out of `//`.

On touch: drop work-package ids; add a tag only when the target exists. No mass sweep. No vault home → plain why-clause, no fake `@reference`.

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

- **Repo-root path** - posix, no leading `/`, from the monorepo root, with extension when it is a file
- **URL** - `https://…` only

A bare symbol is `@see`. A vault stem/id is `@reference`.

## `@reference` - typed vault id

One fact per line:

```text
@reference <kind>: <id>
```

- **`<kind>`** - lowercase token from the list below
- **Colon + single space** - `adr: ADR-0024`, not `adr:ADR-0024`
- **`<id>`** - path-free stable id (stem, ADR code, or promise id)

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

Only when the dest uses onic. Skip this tag elsewhere. Extra structure is optional; do not spray it on every export.

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

Related symbols that must appear in the onic graph go on `relates=`. `@see` remains the TSDoc/IDE edge. Do not invent `@onic` inside strings. Parser and walk languages: dest `docs/reference/comments.md` when it exists.

## Examples

```ts
/**
 * Fail-closed allowlist for mobile auth redirect URLs (scheme + path).
 * Inbound recovery: {@link apps/mobile/src/lib/deep-link-auth.ts}.
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
 * Completes many tasks; each id runs the single-task path.
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

- `/** @link path */` → `{@link path}`
- `{@link SymbolName}` → `@see SymbolName`
- `@see path` → `{@link path}`
- `@see vault-stem` or `{@link vault-stem}` → `@reference kind: id`
- `@reference mobile-deep-links` → `@reference guide: mobile-deep-links`
- `@reference adr:ADR-0024` → space after `:`
- `@see {@link path}` → standalone `{@link path}`
- `@reference [[stem]]` → `@reference kind: stem`
- `@onic` on a dest without onic → omit it
- `@onic relates=docs/foo.md` → `relates=` is symbols; paths stay `{@link}`
