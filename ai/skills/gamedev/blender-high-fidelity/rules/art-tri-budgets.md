---
title: Stay in LOD0 triangle guide bands
impact: HIGH
impactDescription: perf + style
tags: [art, budget]
---

## Stay in LOD0 triangle guide bands

Guide bands (cut tertiary first if over):

| Class | LOD0 tris |
| ------- | ----------- |
| Character | 3.5k–8k |
| Enemy pest | 1.5k–4k |
| Tower | 2k–6k |
| Prop | 0.2k–1.2k |
| Home | 4k–12k |

**Incorrect:** 40k prop crate; densifying silhouette with useless interior faces.

**Correct:** Query polycount via MCP after refine; cut trim before silhouette.
