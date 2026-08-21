---
title: Typed collections at boundaries
impact: MEDIUM
impactDescription: fewer runtime surprises
tags: [interop, types]
---

## Typed collections at boundaries

At GD↔C# boundaries, prefer typed arrays and explicit Godot collection types over untyped `Array`/`Variant` soup.

**Incorrect:** Returning untyped `Array` of mixed nodes and ints across languages.

**Correct:** `Godot.Collections.Array<Node3D>` / packed arrays / custom `Resource` DTOs with clear fields.

Notes: Marshalling still costs—batch data rather than chattiness.

