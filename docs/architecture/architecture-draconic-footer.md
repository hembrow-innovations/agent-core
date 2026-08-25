---
id: "architecture-draconic-footer"
title: "One-line TUI footer"
kind: architecture
description: "draconic-footer paints one dim status line in TUI mode."
domain: pack
area: architecture
tags: [architecture, footer]
created_at: "2026-08-26"
updated_at: "2026-08-26"
---

# One-line TUI footer

## Overview

`@agentic-core/draconic-footer` replaces the TUI footer with one dim line. The layout lives in `formatFooterLine`. Edit that function to change the line.

The package is a first-party extension. Dest receives a vendor copy. See [[architecture-pack-and-packages]].

## Context

Pi's default footer is a separate widget. This pack wants cwd, team chip, tokens, cost, autocompact, model, and effort on one line the human can scan.

Print mode does not get a footer. The hook returns before `setFooter` when `ctx.mode !== "tui"`.

## Design

### Hook

The factory listens for `session_start`. It calls `ctx.ui.setFooter`. The renderer reads live usage, team status, cost, autocompact, model, and thinking level, then clips the line to the terminal width.

```ts
// packages/draconic-footer/src/index.ts session_start
if (ctx.mode !== "tui") return;
ctx.ui.setFooter((_tui, theme, footerData) => ({
  invalidate() {},
  render(width: number): string[] {
    const usage = ctx.getContextUsage();
    const line = formatFooterLine({
      cwd: formatCwdFromRoot(ctx.cwd),
      teamStatus: footerData.getExtensionStatuses().get("team"),
      tokens: usage?.tokens ?? null,
      contextWindow: usage?.contextWindow ?? ctx.model?.contextWindow ?? 0,
      cost: assistantCost(ctx),
      autoCompact: autoCompactEnabled(ctx.cwd),
      model: ctx.model?.id ?? "no-model",
      effort: ctx.thinkingLevel,
    });
```

### Cwd

`formatCwdFromRoot` walks up until it finds `.git` as a file or directory. At the repo root it prints the root folder name. Under the root it prints `root/rel` with `/` separators. With no git root it prints the last folder name.

### Line

`formatFooterLine` joins present parts with spaces:

- cwd
- trimmed `teamStatus`, if any
- `tokens/contextWindow`, with unknown tokens as `?`
- `$` cost to three decimals
- `(auto)` when `autoCompact` is true, before the model
- model
- effort, if any

```ts
// packages/draconic-footer/src/format.ts formatFooterLine
const parts = [
  fields.cwd,
  fields.teamStatus?.trim() || undefined,
  `${tokens}/${formatTokens(fields.contextWindow)}`,
  `$${fields.cost.toFixed(3)}`,
  fields.autoCompact ? "(auto)" : undefined,
  fields.model,
  fields.effort,
].filter((part): part is string => Boolean(part && part.length > 0));
```

`formatTokens` prints the raw count under 1000, then `k` or `M`.

### Autocompact and cost

`autoCompactEnabled` reads `compaction.enabled` from project settings first, then from `getAgentDir()/settings.json`. Project path is `join(cwd, CONFIG_DIR_NAME, "settings.json")`. A missing or unreadable file falls through. If neither file sets a boolean, the default is `true`.

`assistantCost` sums `usage.cost.total` on assistant messages in the current session.

## Trade-offs

One line is easy to scan and easy to change. It drops Pi's multi-widget footer. Width clip is a hard cut, not wrapping.

Autocompact defaults on. A dest that never wrote `compaction.enabled` still shows `(auto)`.

## Consequences

Install vendors this package with the other first-party extensions. Team text on the line is whatever the teams extension stored under status key `team`. Footer does not own team state.

Terms live in [[glossary]].
