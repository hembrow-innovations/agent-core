---
name: frontend-design
description: Create distinctive, production-grade UI using CVA, Tailwind CSS v4, and the project's theme tokens. Use when building or redesigning components, pages, or layouts. Triggers on CVA variants, semantic color tokens, UI kit primitives, feature web or native presentation.
---

# Frontend design

CVA, Tailwind CSS v4 theme tokens, and package conventions. Discover the repo first. Per-rule detail lives in `rules/<prefix>-*.md`.

## Discover first

1. Find the UI kit packages. Search workspace `package.json` names and imports such as `ui-components-web`, `ui-infra-web`, `ui-components-native`, or a local `components/` kit. Copy what neighboring files import.
2. Open an existing primitive. Copy its folder shape, `cn()` path, and variant file split.
3. Find theme tokens in CSS or a tokens package. Do not invent a second palette.
4. Load **docs** for durable token, typography, and design ADRs. Load **typography** for face load and swap.

If `AGENTS.md` or `WORKSPACE.md` already names a tracker (`.scratch/`, `docs/planning/`, GitHub Issues), that file wins. Working issues and plans go through **management**. Do not put them in `docs/`.

## Stack

- **Styling.** Tailwind CSS v4 plus CVA plus shared theme tokens. Not ad-hoc CSS modules. Not styled-components unless the repo already uses them.
- **Web and desktop UI.** Import from the discovered web UI packages or feature UI for that surface.
- **Mobile UI.** Import from the discovered native UI packages or feature native UI.
- **Typography.** Load the **typography** skill. Do not invent font stacks here.

### Prefer

- **token-*** semantic colors and `-foreground` pairs
- **cva-*** variants in `.variants.ts`, merge with package `cn()`
- **package-*** component folder layout and UI package boundaries

### Apply carefully

- **principle-*** product tone and progressive disclosure. Match domain context before inventing chrome.
- **quality-*** a11y, states, spacing. Raise the bar without over-decorating.

### Do not introduce

- Hardcoded hex/rgb or palette utilities (`bg-blue-500`, `text-[#333]`)
- Inline variant class maps outside CVA
- A second UI kit next to the one the repo already uses
- Decorative motion or complexity that does not serve the task

## When to apply

- Building or redesigning a component, page, or layout
- Adding variants, sizes, or visual states
- Reviewing UI for token, CVA, or package drift

## Rule categories by priority

- **1 CRITICAL** - Tokens (`token-`)
- **2 CRITICAL** - CVA (`cva-`)
- **3 HIGH** - Package boundaries (`package-`)
- **4 MEDIUM** - Design principles (`principle-`)
- **5 MEDIUM** - Quality bar (`quality-`)
- **6 LOW-MEDIUM** - Avoid list (`avoid-`)

## Quick reference

### 1. Tokens (CRITICAL)

- `token-semantic-roles` - Use semantic roles (`primary`, `error`, …), never raw palette
- `token-foreground-pairs` - Pair surface with `-foreground` text token

### 2. CVA (CRITICAL)

- `cva-variants-file` - Put `cva()` in `{Component}.variants.ts`
- `cva-cn-merge` - Merge variants with package-local `cn()` in the component

### 3. Package boundaries (HIGH)

- `package-component-layout` - Folder shape of an existing primitive
- `package-ui-sources` - Only the discovered UI and feature packages own UI

### 4. Design principles (MEDIUM)

- `principle-design-thinking` - Purpose, domain context, calm tone, visibility
- `principle-product` - Calm, clarity, tokens, progressive disclosure, responsive

### 5. Quality bar (MEDIUM)

- `quality-typography-spacing` - Font scale, hierarchy, whitespace
- `quality-states-a11y` - Interaction states, WCAG AA, semantic HTML
- `quality-motion-theme` - Subtle transitions. Dark and light via tokens

### 6. Avoid (LOW-MEDIUM)

- `avoid-hardcoded-colors` - No hex, rgb, or fixed palette classes
- `avoid-inline-variants` - No ad-hoc variant maps outside CVA
- `avoid-max-w-named` - Prefer fractions when the project does
- `avoid-decorative-noise` - No decoration that skips the task

## How to use

```
rules/token-semantic-roles.md
rules/cva-variants-file.md
rules/package-component-layout.md
```

Read only the rules that match the current task. Do not bulk-read `rules/`.

Each rule: why → incorrect → correct → notes.
